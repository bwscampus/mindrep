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

## Deploying

Live at **https://mindrep.up.railway.app**

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
  --set ALLOWED_HOSTS=<your-app>.up.railway.app,healthcheck.railway.app \
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

### Database roles

Migrations run as the database owner; the app is meant to run as
`app_rw_login`, a role that can read and write the app's tables but cannot
change the schema, create roles, or bypass row-level security. After every
migration, `python -m app.db_roles` (in the start command) creates or updates
that role. It only creates the login role, and (re)sets its password, when
`APP_DB_PASSWORD` is set.

> **Not yet applied in production.** Production still connects as `postgres`.
> To switch over, after this code is deployed:

1. Add a **sealed** variable on the `mindrep` service:
   `APP_DB_PASSWORD=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')`.
2. Point migrations at the owner and the app at the restricted role:
   ```bash
   railway variables \
     --set 'MIGRATION_DATABASE_URL=${{Postgres.DATABASE_URL}}' \
     --set 'DATABASE_URL=postgresql://app_rw_login:${{APP_DB_PASSWORD}}@${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}'
   ```
3. The redeploy runs migrations as the owner, creates `app_rw_login`, and
   starts the app as it. Check `/api/health` returns 200, sign in, and change
   something (e.g. complete a lesson) to exercise a write.

**Rollback:** set `DATABASE_URL` back to `${{Postgres.DATABASE_URL}}` and
redeploy. The role can stay; it's harmless unused.

To rotate the password, change `APP_DB_PASSWORD` and redeploy.
`tests/test_postgres.py` checks the grants against a real Postgres (CI runs it).

See `ROADMAP.md` for what's built and what's next.
