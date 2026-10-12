"""Turn a narration script into a finished lesson audio file with ElevenLabs.

    uv run scripts/narrate.py voices                      # list your account's voices
    uv run scripts/narrate.py audition <voice_id> ...     # Part 1 of 1.1 in each voice, labeled A, B, C
    uv run scripts/narrate.py make 1.1 --dry-run          # show segments and character cost, spend nothing
    uv run scripts/narrate.py make 1.1                    # generate missing segments and build the file
    uv run scripts/narrate.py make 1.1 --redo 3,5         # one new take of segments 3 and 5, then rebuild
    uv run scripts/narrate.py make 1.1 --pick 3=1         # use take 1 of segment 3, then rebuild
    uv run scripts/narrate.py make all                    # every lesson
    uv run scripts/narrate.py listen 1.1 [segment] [--take N]

Reads  content/narration/<slug>.md and content/narration/voice.json
Writes public/audio/lessons/<slug>.m4a

Spoken text is the "> " quote lines inside "## Part" sections, the same rule
as scripts/make-scratch-audio.sh. Each `[pause Ns]` mark ends a segment, and
each segment is one API call, so a bad line can be redone on its own. Takes
are cached in content/narration/takes/ (gitignored) under a hash of their
text: re-running costs nothing, and editing a line only regenerates that
segment.

Assembly is done here instead of in an editor: real silence for each pause,
1.5s of silence at both ends, a 1s fade-in and a 2s fade-out baked in (iOS
can't fade narration in code, see public/utils/lessonAudio.js), and leveling
to about -16 LUFS. macOS `afconvert` encodes the result as mono AAC.

Needs ELEVENLABS_API_KEY in .env or the environment.
"""

import argparse
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import wave
from array import array
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "content" / "narration"
TAKES = NARRATION / "takes"
VOICE_FILE = NARRATION / "voice.json"
OUT_DIR = ROOT / "public" / "audio" / "lessons"
API = "https://api.elevenlabs.io/v1"

RATE = 24000  # pcm_24000: 16-bit signed little-endian mono
BREATH_S = 0.6  # gap after a segment with no [pause] mark
EDGE_SILENCE_S = 1.5
FADE_IN_S = 1.0
FADE_OUT_S = 2.0
TARGET_DBFS = -16.0  # RMS of speech frames; close to -16 LUFS for mono voice
PEAK_CEILING_DBFS = -1.0
AAC_BITRATE = 64000  # afconvert's ceiling for 24 kHz mono AAC; plenty for voice

PAUSE = re.compile(r"\[pause ([0-9.]+)s\]")


# --- script parsing ---------------------------------------------------------

def find_scripts(which):
    """'all', '1.1', or a full slug -> list of script paths."""
    scripts = sorted(p for p in NARRATION.glob("[0-9]*.md"))
    if which == "all":
        return scripts
    found = [p for p in scripts if p.stem == which or p.stem.startswith(which + "-")]
    if not found:
        sys.exit(f"No narration script matches {which!r}. Try one of: "
                 + ", ".join(p.stem.split("-")[0] for p in scripts))
    return found


def parse_script(path):
    """List of (text, pause_after_seconds) for the spoken segments."""
    segments, lines, in_part = [], [], False

    def close(pause):
        if lines:
            segments.append(("\n".join(lines), pause))
            lines.clear()
        elif segments and pause > segments[-1][1]:
            segments[-1] = (segments[-1][0], pause)

    for raw in path.read_text().splitlines():
        if raw.startswith("## Part"):
            close(BREATH_S)
            in_part = True
            continue
        if raw.startswith("## ") or raw.startswith("### "):
            close(BREATH_S)
            in_part = False
            continue
        if not in_part or "Paste into ElevenLabs" in raw:
            continue
        if raw.startswith("> ") and raw[2:].strip():
            lines.append(raw[2:].strip())
        elif m := PAUSE.search(raw):
            close(float(m.group(1)))
    close(BREATH_S)
    if not segments:
        sys.exit(f"No spoken lines found in {path}")
    return segments


def text_hash(text, voice):
    key = json.dumps([text, voice["voice_id"], voice["model_id"], voice["voice_settings"]])
    return hashlib.sha1(key.encode()).hexdigest()[:8]


# --- ElevenLabs -------------------------------------------------------------

def api_key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    env = ROOT / ".env"
    if not key and env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                key = line.split("=", 1)[1].strip().strip("'\"")
    if not key:
        sys.exit("Add ELEVENLABS_API_KEY=... to .env first (see content/narration/README.md).")
    return key


def client():
    return httpx.Client(base_url=API, headers={"xi-api-key": api_key()}, timeout=120)


def load_voice(require_id=True):
    voice = json.loads(VOICE_FILE.read_text())
    if require_id and not voice.get("voice_id"):
        sys.exit(f"Set voice_id in {VOICE_FILE.relative_to(ROOT)} first "
                 "(run `voices`, then `audition`).")
    return voice


def synthesize(http, voice, text, previous_text="", next_text=""):
    """One take of `text` as raw PCM bytes."""
    body = {"text": text, "model_id": voice["model_id"], "voice_settings": voice["voice_settings"]}
    if voice.get("stitch", True):
        body |= {k: v for k, v in (("previous_text", previous_text), ("next_text", next_text)) if v}
    r = http.post(f"/text-to-speech/{voice['voice_id']}",
                  params={"output_format": f"pcm_{RATE}"}, json=body)
    if r.status_code >= 400:
        sys.exit(f"ElevenLabs said {r.status_code}: {r.text[:500]}")
    return r.content


# --- takes ------------------------------------------------------------------

class Lesson:
    def __init__(self, path, voice):
        self.slug = path.stem
        self.voice = voice
        self.segments = parse_script(path)
        self.dir = TAKES / self.slug
        self.picks_file = self.dir / "picks.json"

    def hash(self, i):
        return text_hash(self.segments[i][0], self.voice)

    def takes(self, i):
        """Existing take files for segment i (0-based), oldest first."""
        return sorted(self.dir.glob(f"seg{i + 1:02d}-{self.hash(i)}-take*.pcm"),
                      key=lambda p: int(p.stem.rsplit("take", 1)[1]))

    def picks(self):
        return json.loads(self.picks_file.read_text()) if self.picks_file.exists() else {}

    def chosen(self, i):
        takes = self.takes(i)
        pick = self.picks().get(self.hash(i))
        named = [t for t in takes if t.stem.endswith(f"take{pick}")]
        return named[0] if named else takes[-1]

    def pick(self, i, n):
        if not any(t.stem.endswith(f"take{n}") for t in self.takes(i)):
            sys.exit(f"Segment {i + 1} has no take {n}.")
        picks = self.picks() | {self.hash(i): n}
        self.picks_file.write_text(json.dumps(picks, indent=2) + "\n")

    def new_take(self, http, i):
        self.dir.mkdir(parents=True, exist_ok=True)
        n = len(self.takes(i)) + 1
        text = self.segments[i][0]
        prev = self.segments[i - 1][0] if i > 0 else ""
        nxt = self.segments[i + 1][0] if i + 1 < len(self.segments) else ""
        print(f"  segment {i + 1:2d}  take {n}  ({len(text)} chars)", flush=True)
        path = self.dir / f"seg{i + 1:02d}-{self.hash(i)}-take{n}.pcm"
        path.write_bytes(synthesize(http, self.voice, text, prev, nxt))
        return path


# --- assembly ---------------------------------------------------------------

def read_pcm(path):
    return read_pcm_bytes(path.read_bytes())


def read_pcm_bytes(data):
    samples = array("h")
    samples.frombytes(data)
    return samples


def silence(seconds):
    return array("h", bytes(2 * int(seconds * RATE)))


def dbfs(x):
    return 20 * math.log10(max(x, 1e-9) / 32768)


def speech_rms(samples):
    """RMS over 100ms frames louder than -50 dBFS, so pauses don't drag it down."""
    frame, total, count = RATE // 10, 0.0, 0
    for start in range(0, len(samples) - frame, frame):
        ms = sum(s * s for s in samples[start:start + frame]) / frame
        if dbfs(math.sqrt(ms)) > -50:
            total, count = total + ms, count + 1
    return math.sqrt(total / count) if count else 0.0


def assemble(parts):
    """parts: list of (pcm samples, pause after). Returns finished samples."""
    out = silence(EDGE_SILENCE_S)
    voice_start = len(out)
    for i, (samples, pause) in enumerate(parts):
        out.extend(samples)
        if i + 1 < len(parts):
            out.extend(silence(pause))
    voice_end = len(out)

    rms = speech_rms(out)
    peak = max(abs(s) for s in out) or 1
    gain = min(10 ** ((TARGET_DBFS - dbfs(rms)) / 20),
               10 ** ((PEAK_CEILING_DBFS - dbfs(peak)) / 20))

    fade_in, fade_out = int(FADE_IN_S * RATE), int(FADE_OUT_S * RATE)
    for j in range(voice_start, voice_end):
        g = gain
        if j - voice_start < fade_in:
            g *= (j - voice_start) / fade_in
        if voice_end - j < fade_out:
            g *= (voice_end - j) / fade_out
        out[j] = max(-32768, min(32767, round(out[j] * g)))
    out.extend(silence(EDGE_SILENCE_S))
    return out, dbfs(rms * gain)


def encode(samples, dest):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "voice.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(samples.tobytes())
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", str(AAC_BITRATE),
                        "-c", "1", str(wav), str(dest)], check=True)


def play(samples):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "clip.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(samples.tobytes())
        subprocess.run(["afplay", str(wav)], check=True)


# --- commands ---------------------------------------------------------------

def cmd_voices(_):
    with client() as http:
        r = http.get("/voices")
        if r.status_code >= 400:
            sys.exit(f"ElevenLabs said {r.status_code}: {r.text[:500]}")
    for v in sorted(r.json()["voices"], key=lambda v: v["name"]):
        labels = ", ".join(str(x) for x in (v.get("labels") or {}).values())
        print(f"{v['voice_id']}  {v['name']:<24} {labels}")


def cmd_audition(args):
    voice = load_voice(require_id=False)
    lesson = Lesson(find_scripts(args.lesson)[0], voice | {"voice_id": "-"})
    part1 = []
    for text, pause in lesson.segments:
        part1.append((text, pause))
        if pause >= 3:  # Part 1 ends on the long pause before the lesson turns
            break
    chars = sum(len(t) for t, _ in part1)
    print(f"{len(args.voice_ids)} voices x {chars} chars = {len(args.voice_ids) * chars} chars")
    out_dir = TAKES / "audition"
    out_dir.mkdir(parents=True, exist_ok=True)
    key = []
    with client() as http:
        for label, voice_id in zip("ABCDEFGH", args.voice_ids):
            v = voice | {"voice_id": voice_id}
            print(f"Voice {label}")
            clips = []
            for i, (text, pause) in enumerate(part1):
                prev = part1[i - 1][0] if i else ""
                nxt = part1[i + 1][0] if i + 1 < len(part1) else ""
                clips.append((read_pcm_bytes(synthesize(http, v, text, prev, nxt)), pause))
            samples, _ = assemble(clips)
            encode(samples, out_dir / f"voice-{label}.m4a")
            key.append(f"{label}  {voice_id}")
    (out_dir / "key.txt").write_text("\n".join(key) + "\n")
    print(f"Wrote {out_dir.relative_to(ROOT)}/voice-*.m4a. Play them for peers without "
          "naming the voice; the answer key is in key.txt.")


def cmd_make(args):
    voice = load_voice(require_id=not args.dry_run)
    if args.dry_run and not voice.get("voice_id"):
        voice = voice | {"voice_id": "-"}
    paths = find_scripts(args.lesson)
    redo = {int(n) - 1 for n in args.redo.split(",")} if args.redo else set()
    picks = dict(p.split("=") for p in args.pick) if args.pick else {}
    if (redo or picks) and len(paths) > 1:
        sys.exit("--redo and --pick work on one lesson at a time.")

    total = 0
    http = None
    try:
        for path in paths:
            lesson = Lesson(path, voice)
            print(f"{lesson.slug}: {len(lesson.segments)} segments")
            todo = [i for i in range(len(lesson.segments))
                    if i in redo or not lesson.takes(i)]
            chars = sum(len(lesson.segments[i][0]) for i in todo)
            total += chars
            if args.dry_run:
                for i, (text, pause) in enumerate(lesson.segments):
                    mark = "*" if i in todo else " "
                    first = text.splitlines()[0]
                    print(f" {mark}{i + 1:2d}  {len(text):4d} chars  then {pause}s  {first[:60]}")
                continue
            if todo and http is None:
                http = client()
            for i in todo:
                lesson.new_take(http, i)
            for seg, n in picks.items():
                lesson.pick(int(seg) - 1, int(n))
            parts = [(read_pcm(lesson.chosen(i)), pause)
                     for i, (_, pause) in enumerate(lesson.segments)]
            samples, level = assemble(parts)
            dest = OUT_DIR / f"{lesson.slug}.m4a"
            encode(samples, dest)
            print(f"  wrote {os.path.relpath(dest, ROOT)}  {len(samples) / RATE:.0f}s  "
                  f"speech at {level:.1f} dBFS  ({chars} chars spent)")
    finally:
        if http:
            http.close()
    if args.dry_run:
        print(f"Would spend {total} characters (* = segments to generate).")


def cmd_listen(args):
    voice = load_voice()
    lesson = Lesson(find_scripts(args.lesson)[0], voice)
    if args.segment is None:
        subprocess.run(["afplay", str(OUT_DIR / f"{lesson.slug}.m4a")], check=True)
        return
    i = args.segment - 1
    takes = lesson.takes(i)
    if not takes:
        sys.exit(f"Segment {args.segment} has no takes yet.")
    take = next((t for t in takes if t.stem.endswith(f"take{args.take}")), None) \
        if args.take else lesson.chosen(i)
    if take is None:
        sys.exit(f"Segment {args.segment} has no take {args.take}.")
    print(f"{take.name} of {len(takes)}:\n{lesson.segments[i][0]}")
    play(read_pcm(take))


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("voices", help="list your ElevenLabs voices").set_defaults(fn=cmd_voices)

    p = sub.add_parser("audition", help="render Part 1 in several voices for a blind pick")
    p.add_argument("voice_ids", nargs="+")
    p.add_argument("--lesson", default="1.1")
    p.set_defaults(fn=cmd_audition)

    p = sub.add_parser("make", help="generate missing segments and build the lesson file")
    p.add_argument("lesson", help="'all', a lesson number like 1.2, or a full slug")
    p.add_argument("--redo", help="segment numbers to re-take, e.g. 3,5")
    p.add_argument("--pick", nargs="*", help="SEGMENT=TAKE, e.g. 3=1")
    p.add_argument("--dry-run", action="store_true", help="show segments and cost only")
    p.set_defaults(fn=cmd_make)

    p = sub.add_parser("listen", help="play a lesson, or one segment's take")
    p.add_argument("lesson")
    p.add_argument("segment", nargs="?", type=int)
    p.add_argument("--take", type=int)
    p.set_defaults(fn=cmd_listen)

    args = parser.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
