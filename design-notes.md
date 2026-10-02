# MindRep — Design Notes (Calm/Premium Redesign)

Short reference for the visual redesign pass. Principles below are drawn from the established,
publicly-documented design conventions of Apple's product pages, ChatGPT, and Calm — not a
literal copy of any screen or copy, and not live scraping. Where research and the locked brand
tokens would ever conflict, **the tokens win** (this only applies to color; spacing, type, and
motion below are unconstrained by the brief).

## 1. Whitespace & spacing rhythm

All three references share an 8px-based spacing scale, with generous outer margins and few
distinct spacing values (roughly 4/8/16/24/32/48/64px, not an arbitrary continuum). Density is
low: one primary action or one idea per screen region, lots of breathing room between sections
rather than dense grids of information. Applied here as `--space-1..8` tokens in `style.css`,
replacing today's ad hoc per-rule padding/margin values.

## 2. Color: sparing, one accent

None of these apps color things "because it's fun" — color is a signal, not decoration. Nearly
everything is neutral (white/black/gray); a single accent hue appears only on primary buttons,
active/selected states, links, and small brand marks (an icon, a progress ring). Status colors
(error, success) are used narrowly and only where they carry real information. Applied here:
`--accent` (#3E6FC4) is the only chromatic color allowed on interactive chrome; `--coral` stays
only for genuine error/incorrect states; everything else in the current multi-hue "gold/purple/
orange" system collapses to ink/gray.

## 3. Type scale & hierarchy

A small, disciplined scale — typically 4–6 sizes total, 2 weights doing most of the work (one
heavy weight for headlines, one regular/medium for body). Headlines are short, high-contrast
against body copy (both in size and weight, not just size), and body text favors longer
line-height for readability over tight display-style leading. Applied here: **Poppins 800** for
all headline/display roles, **Inter** (400/500/600) for body/UI text — down from the current
mix of Outfit (multiple weights), Inter, and Barlow Condensed.

## 4. Motion pacing

Motion is subtle and fast-in/slow-settle, never bouncy or elastic. Standard easing is a plain
ease-out curve (no overshoot), used for short UI feedback (100–250ms) and slightly longer state
transitions (300–450ms); nothing loops or pulses unless it's communicating an active/loading
state, and even then it's a gentle opacity or scale shift, not a glow or a spring. This directly
replaces the current system's signature bounce (`cubic-bezier(0.34,1.56,0.64,1)` with
`scale(0.95)` press-states used throughout) with a single calm `--ease` token and shorter,
smaller transforms.

## Net effect

Fewer colors, fewer type sizes, more space, slower/quieter motion. The goal is for MindRep to
read as considered and trustworthy rather than gamified — while keeping the same information
and interactions users already rely on.

---

# Audio & Video Lessons: Listening Experience

Research pass (2026-09-30, time-boxed) on how Calm, Headspace, Insight Timer, Audible and
Spotify design audio sessions. These are principles, not copied screens. Where a principle
conflicts with the design tokens above, the tokens win.

## Findings

1. **The now-playing view is one idea per screen.** Calm's player shows the session title, time,
   play/pause and one progress mark on an otherwise empty field. Headspace's rebuilt player is
   similar. The content fills the space, and secondary settings (speed, sound mix) move into a
   quiet secondary row or drawer instead of competing with play/pause.
2. **Progress is ambient, not a timeline.** Calm uses a circle that fills as the session plays,
   which tells you how far along you are without asking you to read a scrubber. Audible and
   Spotify keep a precise scrubber for long content you seek through. A lesson needs both: the
   ring as the calm signal, and a thin scrubber underneath for going back to a line.
3. **Sessions never start or stop abruptly.** Guided-audio production practice is a short
   fade-in (about 2–5s on the music bed), a longer fade-out so the listener isn't "dropped," and
   pausing that eases down rather than cutting. The fade-out also marks the transition to the
   next step.
4. **Ambient sits well under the voice and belongs to the listener.** The usual mix guidance is
   about −18 to −24 dB below narration, with slow, simple beds (pads, rain, room tone). Calm and
   Insight Timer both let listeners change or mute the background independently. So the
   ambient bed gets its own volume, defaults low, and can go to zero.
5. **Nothing plays until the listener asks.** None of these apps autoplay a session on entry.
   Pressing play is the listener choosing to start, and that is part of the ritual.
6. **Skip by a spoken sentence, not a chapter.** Audible uses ±30s and podcasts use ±15s. Short
   lessons suit ±15s, which is about one sentence back. A speed control (1×, 1.25×, 1.5×) is
   standard for spoken word, and time-stretching keeps the pitch natural.
7. **Accessibility is part of the player.** Headspace's engineering team rebuilt its player
   after blind and low-vision members found it hard to use. Every control needs a spoken label,
   the scrubber must be a real slider, and position should be announced as time rather than a
   percentage. Motion and fades respect *Reduce Motion*.
8. **The session travels with you and ends softly.** Audible and Spotify resume where you left
   off, keep playing with the screen locked, and expose lock-screen controls. Meditation apps
   end on a quiet completion screen, not a celebration. The confetti belongs to the quiz, not the
   listening.

## How this applies to MindRep

- **Player layout:** a large ring made from the logo's three concentric rings, with play/pause
  in the center. The outer ring is the progress arc. Under it are the elapsed and remaining
  time, a thin scrubber, and one row with −15s, speed and +15s. The ambient volume sits in a
  quiet row below that, shown only when the lesson has an ambient bed. The read-along text
  follows underneath.
- **Motion:** only `--ease` and the `--duration-*` tokens, with no bounce. Under
  `prefers-reduced-motion` the ring moves in steps, with no transitions.
- **Audio fades:** a 1.2s fade-in on play, a 0.4s fade-out on pause, and an ambient fade-out of
  about 4s when the narration ends. Narration files should have a short fade and 1–2s of silence
  baked in at both ends, because iOS Safari doesn't allow volume to be changed from code (see
  the README).
- **Completion:** a light vibration where supported, the ring settling at full, and a calm
  "Listening complete" line. There's no confetti or sound. The lesson itself (and its
  XP) completes after the quiz, as before.

Sources: [Headspace Engineering — A more accessible audio player](https://medium.com/headspace-engineering/a-more-accessible-audio-player-b9cafc388ff8),
[Design Critique: Calm (Pratt IxD)](https://ixd.prattsi.org/2018/01/design-critique-calm-ios-app/),
[Best Background Music for Guided Meditation Recordings](https://meditationmusiclibrary.com/blogs/wednesday-wisdom-blog/best-background-music-for-guided-meditation-recordings),
[How to Layer Music Under a Guided Meditation](https://melobleep.com/blog/how-to-layer-music-under-a-guided-meditation-without-drowning-out-your-voice).
The Audible, Spotify and Insight Timer points come from those apps' publicly known behavior;
no pages from those apps were fetched in this pass.
