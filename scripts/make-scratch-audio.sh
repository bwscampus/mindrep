#!/usr/bin/env bash
# Make a robot-voice scratch track from a narration script, for testing the
# player before the real recording exists. macOS only (uses `say` and
# `afconvert`). Scratch files must never reach main: tests/test_media.py
# fails on them when RELEASE_CHECK=1.
#
#   scripts/make-scratch-audio.sh 1.1-why-your-mind-matters [voice]
#
# Reads  content/narration/<slug>.md
# Writes public/audio/lessons/<slug>.scratch.m4a
set -euo pipefail

slug="${1:?usage: $0 <lesson-slug> [voice]}"
voice="${2:-Samantha}"
root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/content/narration/$slug.md"
out="$root/public/audio/lessons/$slug.scratch.m4a"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Spoken text is the "> " quote lines inside "## Part" sections; `[pause Ns]`
# marks become real silence, and each line gets a short breath after it.
awk '
  /^## Part/            { inpart = 1; next }
  /^## /                { inpart = 0 }
  !inpart               { next }
  /Paste into ElevenLabs/ { next }
  /^> ./                { sub(/^> /, ""); print $0 " [[slnc 600]]"; next }
  /\[pause [0-9.]+s\]/  { match($0, /[0-9.]+/); printf "[[slnc %d]]\n", substr($0, RSTART, RLENGTH) * 1000 }
' "$src" > "$tmp/script.txt"

[ -s "$tmp/script.txt" ] || { echo "No spoken lines found in $src" >&2; exit 1; }

say -v "$voice" -r 150 -o "$tmp/voice.aiff" -f "$tmp/script.txt"
afconvert -f m4af -d aac -b 64000 -c 1 "$tmp/voice.aiff" "$out"
echo "Wrote $out ($(afinfo "$out" | awk '/estimated duration/ {printf "%.0fs", $3}'))"
