# Security gaps: MindRep

Audit date: 2026-10-05. Fixes on branch `security/production-standard`.
Rule IDs refer to the class [Production Standard](../.claude/skills/production-standard/references/standard.md).

**Status key:** **Fixed** = fixed on this branch · **Open** = student task · **Owner** = a
setting or decision for the teacher/school, not code.

## Summary

The backend was already strong: ORM-only queries (no SQL injection), Argon2 password hashing,
revocable httpOnly cookie sessions, strict CSP and security headers, CORS off by default,
docs hidden in production, no stack traces to clients, and per-user data scoping with a test
proving it. The real gaps were around **minors' data and consent**, **account self-service**,
**unescaped user text in the frontend**, and **no CI**.

## Findings

| # | Rule | Sev | Where | Finding | Status |
|---|------|-----|-------|---------|--------|
| 1 | PRIV-1, PRIV-2, PRIV-3 | High | `public/privacy.html` | Users are 10–18 and the app stores names, journal text, self-ratings and coach chat, but there was no privacy policy or parental-consent flow. Under-13 users trigger US COPPA. | **Owner**: the school must supply the policy text and decide the under-13 approach. A DRAFT placeholder page and an "Under 13? Ask a parent" notice on signup were added. |
| 2 | AUTH-6 | High | `app/auth/account.py` | No way for a user to delete their account and data. | **Fixed**: `DELETE /api/users/me` (password required, FK cascade) plus a Delete Account panel on the Profile tab. |
| 3 | FE-1 | Medium (High once coaches/parents can view athlete data) | `public/utils/escape.js` | User text (`user.name`, coach chat, tracker answers, toolbox entries, waitlist email) went into `innerHTML` unescaped. | **Fixed**: shared `escapeHtml` applied at every site. |
| 4 | FE-2, FE-3 | Medium | `public/utils/admin.js` | The demo-mode passphrase was hard-coded in client JS in a public repo. | **Fixed**: demo mode is now gated on the server's `is_superuser` flag. The old passphrase is public, so treat it as burned. |
| 5 | AUTH-5 | Medium | `app/auth/users.py` (`UserManager.update`) | `PATCH /api/users/me` changed email or password with only the session cookie, and other sessions stayed alive. | **Fixed**: `current_password` is required; a password change signs out all other sessions. |
| 6 | AUTH-3 | Medium (hardening) | `app/rate_limit.py` | The limiter keyed on the first `X-Forwarded-For` entry. Railway staff say the edge strips client-supplied XFF, so this was probably **not** exploitable on Railway, but `X-Real-IP` is the documented contract. | **Fixed**: keys on `X-Real-IP`. |
| 7 | AUTH-3 | Medium | `app/rate_limit.py` | The bucket table never shrank (memory growth), and `PATCH`/`DELETE /users/me` (password oracles) were unlimited. | **Fixed**: bounded LRU (10k buckets); account-change routes limited to 10/hour. |
| 8 | API-2 | Medium | `app/routers/state.py` | `PUT /api/state` accepted any size of JSON. | **Fixed**: 256 KB cap (`MAX_STATE_BYTES`). |
| 9 | OPS-1, OPS-2 | Medium | `.github/workflows/ci.yml` | No CI, so tests never ran before deploy. | **Fixed**: pytest, Postgres migrations, `alembic check`, `pip-audit`, Dependabot. The first audit found pyjwt PYSEC-2026-4141, bumped to 2.15.1. |
| 10 | API-10 | Medium | `README.md:74`, `app/config.py` (`startup_warnings`) | Production `RESEND_API_KEY` is the placeholder, so password reset sends nothing. | **Owner**: set a real Resend key and verify a sending domain. The app now logs a startup warning. After that, promote the check to a boot failure. |
| 11 | DB-5 | Medium | Railway | No backups configured or documented. | **Owner**: enable Railway Postgres backups and rehearse one restore. |
| 12 | FE-3 | Medium | `public/screens/modules.js:54`, `public/data/lessons.js` | Paid-module locks, XP and badges are client-side only (see ROADMAP.md). Fine for a free beta; blocks charging money. | **Open** |
| 13 | OPS-6 | Medium | n/a | No error tracking or uptime alerts. | **Open**: Sentry free tier plus an uptime monitor on `/api/health`. |
| 14 | API-9 | Low | `app/routers/health.py` | The health check didn't touch the DB and exposed environment and version. | **Fixed**: `SELECT 1`, 503 on failure, `{"status"}` only. |
| 15 | API-8 | Low | `app/logging.py`, `app/email/resend_client.py` | A client `X-Request-ID` was logged unchecked (log forging), and recipient emails were logged. | **Fixed** |
| 16 | FE-7 | Low | `public/utils/session.js` | Sign-out left progress in localStorage on shared devices, which the next account could "migrate". | **Fixed**: sign-out and delete clear `mindrep_*` keys. |
| 17 | FE-4 | Low | `public/index.html:5` | `maximum-scale=1.0` blocked pinch-zoom. | **Fixed** |
| 18 | FE-4 | Low | `public/style.css:75-76`, `public/screens/auth.js:60` | `outline: none` with no `:focus-visible` replacement; inputs use placeholders instead of `<label>`. | **Open** |
| 19 | FE-5 | Low | `public/screens/*.js` | About 490 inline `style=` attributes, which force `'unsafe-inline'` in the style CSP. Several color tokens are aliases of the same value. | **Open**: move to classes in `style.css`. |
| 20 | AUTH-2 | Low | fastapi-users `is_verified` | Emails are never verified, so anyone can sign up with someone else's address. | **Open** |
| 21 | API-6 | Low | `/api/auth/login` | Login CSRF is possible (form-encoded POST with SameSite=Lax), so a site could sign a victim into the attacker's account. | **Open**: check `Origin` on login. |
| 22 | DB-6 | Low | Railway | The app and migrations share the Postgres superuser. | **Open** (recommended) |
| 23 | DB-4 | Low | `app/db.py:19` | No explicit TLS. Fine on Railway's private network; confirm `DATABASE_URL` uses `*.railway.internal`. | **Owner**: confirm |
| 24 | n/a | Low | `access_tokens` table | Expired session rows are never cleaned up. | **Open** |
| 25 | OPS-3, OPS-4 | n/a | GitHub settings | Secret scanning, push protection, and branch protection requiring CI. | **Owner** |
| 26 | OPS-1 | n/a | Railway settings | Turn on "Wait for CI" so a red build never deploys. | **Owner** |

## How to grant demo mode

```sql
UPDATE users SET is_superuser = true WHERE email = 'founder@example.com';
```
Users can't set this flag on themselves (`PATCH /users/me` ignores it).
