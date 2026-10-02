# Lesson narration

Spoken scripts for every built lesson (Modules 1–3). Each script covers the lesson's Hook
and Lesson screens, in the same order as the on-screen text, because that text is shown as
read-along under the player. The activity, quiz and tie-in stay interactive after the audio.

## Status

| Lesson | Script | MP3 filename (in `public/audio/lessons/`) | Take chosen | Edited | Uploaded | `audioUrl` on |
|---|---|---|---|---|---|---|
| 1.1 Why Your Mind Matters | [✓](1.1-why-your-mind-matters.md) | `1.1-why-your-mind-matters.mp3` | ☐ | ☐ | ☐ | ☐ |
| 1.2 Neutral Thinking | [✓](1.2-neutral-thinking.md) | `1.2-neutral-thinking.mp3` | ☐ | ☐ | ☐ | ☐ |
| 1.3 The Reset Button | [✓](1.3-the-reset-button.md) | `1.3-the-reset-button.mp3` | ☐ | ☐ | ☐ | ☐ |
| 2.1 No Excuses, No Limits | [✓](2.1-no-excuses-no-limits.md) | `2.1-no-excuses-no-limits.mp3` | ☐ | ☐ | ☐ | ☐ |
| 2.2 Effort Over Talent | [✓](2.2-effort-over-talent.md) | `2.2-effort-over-talent.mp3` | ☐ | ☐ | ☐ | ☐ |
| 2.3 Own Your Role | [✓](2.3-own-your-role.md) | `2.3-own-your-role.mp3` | ☐ | ☐ | ☐ | ☐ |
| 3.1 Your Circle of Control | [✓](3.1-your-circle-of-control.md) | `3.1-your-circle-of-control.mp3` | ☐ | ☐ | ☐ | ☐ |
| 3.2 Let Go of the Scoreboard | [✓](3.2-let-go-of-the-scoreboard.md) | `3.2-let-go-of-the-scoreboard.mp3` | ☐ | ☐ | ☐ | ☐ |
| 3.3 The 90-Second Rule | [✓](3.3-the-90-second-rule.md) | `3.3-the-90-second-rule.mp3` | ☐ | ☐ | ☐ | ☐ |

## Recording workflow

1. **Pick the voice once, for all nine.** Generate Part 1 of lesson 1.1 in 2–3 candidate
   voices, and have a couple of peers pick without knowing which is which. Choose warm,
   unhurried and human over "perfect". Use the same voice for every lesson so the course
   feels like one coach.
2. **Starting settings in ElevenLabs** (adjust by ear, not by the numbers):
   - Stability 25–45%. Lower is more expressive, and above ~50% flattens emotion.
   - Similarity 70–85%.
   - Style low or off. Let the writing carry the emotion.
3. **Generate one Part at a time.** Paste only the text inside the `> Paste into ElevenLabs`
   quote blocks, not the *italic* cues or the `[pause]` marks. Make 4–6 takes per Part and
   keep the best.
4. **Assemble in Audacity** (free):
   - Put the chosen takes in order.
   - Insert real silence at each `[pause Ns]` mark (Generate → Silence). The voice's own
     gaps are usually too short.
   - Add a 1s fade-in, a 2s fade-out and about 1.5s of silence at both ends. On iPhone, the
     app can't fade the volume, so these baked-in fades are the only ones.
   - Normalize loudness to about −16 LUFS (Effect → Loudness Normalization).
5. **Export** as MP3, mono, 64–96 kbps, using the exact filename from the table above.
6. **Listen once on a phone, with headphones,** before uploading.

## Ambient beds (optional)

A soft pad or nature sound under the voice, like Calm-style apps use.

- Mix it about 18–24 dB under the voice. Listeners can turn it down further, or off.
- It must loop seamlessly: no fade at the loop point, and matching start and end.
- 30–90 seconds is plenty, since it loops.
- Only use audio you have the rights to (your own recording, or a clearly licensed library).
- Save it to `public/audio/ambient/` and add `ambientUrl: "audio/ambient/<file>.mp3",` to the
  lesson.

## Turning a lesson's audio on

1. Put the MP3 in `public/audio/lessons/` with the filename from the table.
2. In `public/data/lessons.js`, find the lesson and uncomment its line:
   ```js
   // audioUrl: "audio/lessons/1.2-neutral-thinking.mp3",
   ```
3. Open the lesson. The first screen now shows **Listen to lesson**.
4. Commit and push, then tick the row above.

A lesson whose file is missing still opens. The player shows "Audio couldn't load" and the
read-along text works, but don't turn a lesson on before its file is in.

## Writing rules used in these scripts

- Second person, like talking to one athlete before a game.
- Short lines mixed with longer ones, with the emotional weight at the end of the sentence.
  Fragments are fine.
- Commas slow the voice, an ellipsis (…) adds hesitation and an em dash (—) adds a sharp
  break. Numbers are spelled out so they're read the same way every time.
- Only claims that are on the lesson screen. If a script needs a fact changed, change the
  lesson text too, so the audio and the read-along agree.
