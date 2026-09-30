# MindRep

Youth mental-performance microlearning for athletes ages 10–18. Vanilla JS
frontend, FastAPI backend, Postgres, deployed on Railway.

## Running it locally

```bash
uv sync
cp .env.example .env

# Throwaway Postgres on 5433, to avoid clashing with any local install
docker run -d --name mindrep-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mindrep \
  -p 5433:5432 postgres:17-alpine

uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000 — register an account, and the app walks you into
onboarding.

```bash
uv run pytest        # 22 tests, no database server needed
```

## Layout

```
app/          FastAPI backend
  main.py     app factory, middleware, static mount
  models.py   user_state: per-athlete profile + progress JSONB
  routers/    health, state
  auth/       accounts, sessions, password reset
public/       the app itself — served at /
  app.js      router + boot
  screens/    one module per screen (auth, home, lesson, practice, …)
  utils/      storage (synced), api, gamification, illustrations
  data/       lesson content
migrations/   alembic
```

## How progress is stored

`public/utils/storage.js` keeps the same **synchronous** API it always had —
`getProgress()`, `saveProgress()`, `getUser()` — because roughly 60 call sites
across the screens read it inside render functions that can't await anything.

Underneath, it is now server-backed:

- `hydrate()` runs once at boot and loads the athlete's state into memory
- reads come from that in-memory cache, synchronously
- writes update the cache synchronously, then schedule a debounced `PUT
  /api/state` (800ms, flushed on tab hide via `keepalive`)

Progress is one JSON document per athlete, so adding a field to a lesson
activity needs no migration.

**Trade-off:** last-write-wins. Two devices editing simultaneously means the
later write wins. Acceptable for one athlete's own progress.

**If you add state:** put it in the `progress` object via `saveProgress()`.
Writing straight to `localStorage` means it stays on one device. The reminder
preferences in `app.js` do that deliberately — they're per-device by nature.

## Accounts

Email and password, with reset. Sessions are an httpOnly cookie backed by a
database row, so signing out or resetting a password revokes every device
immediately. Athletes who used the localStorage-only version keep their
progress: on first login it's uploaded if the account is empty.

⚠️ **Password reset does not send email yet.** `RESEND_API_KEY` on the deployed
service is the placeholder `re_PLACEHOLDER_REPLACE_ME`. The endpoint still
answers 202 and logs the failure (deliberately — see below), but no mail goes
out. Set a real key, and note that Resend delivers to arbitrary inboxes only
from a **verified domain**: the default `onboarding@resend.dev` sender reaches
only the Resend account owner's own address.

`/forgot-password` always returns 202, whether or not the account exists and
whether or not delivery succeeds. Anything else would let anyone probe which
email addresses have accounts.

## Lesson audio & video

Every media field is optional. A lesson without them looks and behaves exactly
as it did before.

```js
// public/data/lessons.js, on a lesson object
audioUrl:   "audio/lessons/1.1-why-your-mind-matters.mp3", // narration
ambientUrl: "audio/ambient/soft-pad.mp3",                   // quiet looping bed
video: {
  embedUrl:    "https://www.youtube.com/watch?v=…",  // or a vimeo.com link
  title:       "What neutral looks like",
  caption:     "",                                   // optional line under it
  // Only if not using an embed:
  src:         "https://…/clip.mp4",
  captionsUrl: "https://…/clip.en.vtt"
},
watchFurther: [{ youtubeId: "…", title: "…", channel: "…" }]
```

- **`audioUrl`**: turns on the listening view (`screens/lessonPlayer.js`,
  engine in `utils/lessonAudio.js`). It covers the hook and lesson sections,
  and the activity, quiz and tie-in follow it. Resume positions sync in
  `progress.lessonAudio`.
- **`ambientUrl`**: an optional loop under the voice with its own volume
  control (default 25%). It fades in on play and out when the narration ends.
- **`video`**: shows above the lesson text. YouTube links are embedded from
  `youtube-nocookie.com` with captions on. Vimeo works too. Embeds are
  preferred over hosting files.
- **`watchFurther`**: link-out cards credited to Trevor Moawad and the channel
  that published each video. Link only: never download, rehost, or generate
  synthetic audio or video of him.

**Narration files.** Use MP3, mono, 64–96 kbps, loudness around −16 LUFS. Put
lesson files in `public/audio/lessons/` and ambient beds in
`public/audio/ambient/`. Bake a ~1s fade and 1–2s of silence into both ends of
each narration file. The player fades in code too, but **iOS Safari doesn't
allow volume changes from code**, so on iPhone the file's own fades are the
only ones. Mix ambient beds about 18–24 dB under the voice, and make them loop
without a seam.

**Hosting elsewhere.** Audio on another domain (a CDN bucket) needs that
origin in `CSP_MEDIA_SRC_EXTRA`. Video hosts other than YouTube and Vimeo need
`CSP_FRAME_SRC_EXTRA` (see `app/config.py`).

**Platform notes.**
- Narration keeps playing with the screen locked, and lock-screen controls
  (play/pause, ±15s, scrubbing) work on iOS Safari 15+ and Android Chrome.
- On iOS the ambient bed runs through Web Audio, so it can pause while the
  phone is locked. The voice continues.
- The completion haptic is a single short pulse where the Vibration API
  exists, which is Android only.

## Deploying

Live at **https://mindrep-production-ad66.up.railway.app**

```bash
railway up      # from the repo root, once linked
```

The start command lives in `Procfile`: migrations run, then uvicorn starts.
Required variables are already set on the service; to recreate the project
elsewhere:

```bash
railway init && railway add --database postgres && railway add --service mindrep
railway domain
railway variables --set ENVIRONMENT=production \
  --set SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')" \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  --set RESEND_API_KEY=re_xxx --set EMAIL_FROM=noreply@yourdomain.com \
  --set PUBLIC_BASE_URL=https://<your-app>.up.railway.app \
  --set ALLOWED_HOSTS=<your-app>.up.railway.app \
  --set CSP_ALLOW_INLINE_STYLES=true \
  --set CSP_STYLE_SRC_EXTRA=https://fonts.googleapis.com \
  --set CSP_FONT_SRC_EXTRA=https://fonts.gstatic.com
railway up
```

Migrations run on every deploy before the server starts. The app refuses to
boot in production with missing or placeholder secrets, so a misconfigured
deploy fails loudly and the previous version keeps serving.

The three CSP variables are required: the app uses inline `style` attributes
and Google Fonts. Without them the deployed app renders unstyled.

See `ROADMAP.md` for what's built and what's next.
