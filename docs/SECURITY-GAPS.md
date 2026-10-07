# Security gaps: MindRep

Audit scope reset **2026-10-07**, after the app was rolled back to the student's
`localStorage`-only design and the FastAPI backend was replaced by a Node static
server. Rule IDs refer to the class Production Standard, which lives in the
`production-standard` skill (`~/.claude/skills/production-standard/references/standard.md`)
— one copy, so it can't drift.

**Status key:** **Fixed** · **Open** = student or assistant task · **Owner** = a setting
or decision for the teacher/school, not code · **N/A** = the rule has no surface in this
architecture.

## What this app is now

Vanilla JS in `public/`, served by `server.js`. **No database, no accounts, no user
input ever reaches a server.** That removes most of the attack surface a web app
normally has — and with it, most of the rules. What remains is the frontend (FE-*),
the response headers and config (API-*), privacy (PRIV-*), and repo hygiene (OPS-*).

The data is still sensitive — minors' journals, coach chat, self-ratings — but it now
lives only in the athlete's own browser, so the exposure is a shared or stolen device,
not a leaked database or backup.

## Current findings

| # | Rule | Sev | Where | Finding | Status |
|---|------|-----|-------|---------|--------|
| 1 | PRIV-1, PRIV-2 | High | `public/privacy.html` | Users are 10–18 and the app stores names, journal text, self-ratings and coach chat. The privacy page is a **DRAFT placeholder**, and under-13 users trigger US COPPA. Data staying on-device reduces but does not remove the obligation. | **Owner**: the school supplies the policy text and decides the under-13 approach. |
| 2 | FE-3 | Medium | `public/screens/modules.js`, `public/data/lessons.js` | Module locks are client-side only, and all lesson content ships to every browser. Fine for a free beta; blocks charging money. | **Open** (student): needs a server to be real. |
| 3 | FE-5 | Medium | `public/screens/*.js` | ~490 inline `style=` attributes, which force `'unsafe-inline'` in the style CSP. | **Open**: move to classes in `style.css`; then tighten `style-src`. |
| 4 | FE-4 | Low | `public/style.css`, `public/screens/*.js` | `outline: none` with no `:focus-visible` replacement; inputs use placeholders instead of `<label>`. | **Open** |
| 5 | OPS-6 | Medium | n/a | No error tracking or uptime monitoring. | **Open**: an uptime monitor on `/api/health` is the cheap half. |
| 6 | OPS-3, OPS-4 | n/a | GitHub settings | Secret scanning, push protection, and branch protection requiring CI. | **Owner** |
| 7 | OPS-1 | n/a | Railway settings | Turn on "Wait for CI" so a red build never deploys. | **Owner** |
| 8 | FE-7 | Low | `public/utils/storage.js` | All progress stays in `localStorage` with no way to clear it from the UI. On a shared device the next person sees the previous athlete's journal. | **Open** (student): a "Reset my data" control. Was previously covered by sign-out; that went away with accounts. |

## Satisfied by the current build

| Rule | How | Proved by |
|---|---|---|
| FE-1 | `escapeHtml` applied at every site where athlete text reaches `innerHTML` | manual XSS probe: a name of `<img src=x onerror=…>` renders as text and does not execute |
| FE-2 | No secrets in client code; the demo-mode passphrase was removed, not hidden | `git grep` for credential patterns |
| API-3 | 500s return a request id, never a stack trace | `server.js` error handler |
| API-4 | CSP (strict `script-src`), HSTS in prod, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, no framework header | `npm run smoke` asserts each one |
| API-8 | Client `X-Request-ID` validated against `^[A-Za-z0-9-]{1,64}$` before use | `server.js` |
| API-9 | `/api/health` returns `{"status":"ok"}` and nothing else | `npm run smoke` |
| API-10 | Production refuses to boot on `ALLOWED_HOSTS=*` or an `http://` base URL | verified by running it |
| LIC-1 | PolyForm Noncommercial 1.0.0, and `package.json` agrees | `LICENSE.md` |
| OPS-1, OPS-2 | CI runs import check, smoke test and `npm audit`; lockfile committed; Dependabot grouped weekly | `.github/` |

## Not applicable to this architecture

`DB-1`…`DB-9` (no database), `AUTH-1`…`AUTH-8` (no accounts, no sessions, no
passwords), `API-1` (no object IDs), `API-2` (no request bodies), `API-5` (no CORS —
same origin), `API-6` (no state-changing routes), `API-7` (no uploads), `OPS-5` (no
database or secrets to separate per environment).

These become live again the moment a feature needs a server. Anything in that direction
should be specced first — see `ROADMAP.md`.

## History

**2026-10-05 audit and hardening.** A full audit against the then-current FastAPI
backend found 29 items; the fixes that still apply are in the satisfied table above.
The backend-specific work — hashed session tokens (DB-8), a least-privilege Postgres
role (DB-6), credential-endpoint rate limiting (AUTH-3), password-gated account changes
and self-service deletion (AUTH-5/6), the cross-site write block (API-6) — went away
with the backend on 2026-10-07. It is preserved in git history, and in
`~/.claude/skills/production-standard/assets/templates/fastapi/`, if accounts are ever
rebuilt.

**2026-10-07 rollback.** The app returned to the student's `localStorage` design;
accounts, server-side sync and the FastAPI backend were removed as assistant-written
feature work. Two consequences worth recording:

- **Finding #28 (minors' journals unencrypted in Postgres, raised to High under DB-9 on
  2026-10-07) is resolved by removal.** There is no database. The same data now sits in
  `localStorage`, which is why FE-7 above replaces it.
- **Demo mode was deleted, not fixed.** It was the student's feature, gated behind a
  passphrase committed to a public repo (FE-2), and the server-side gate that replaced
  it died with the backend. Deleting a student feature is a deviation from "features
  belong to the student", taken because the alternative was restoring a burned secret.
  It should be re-specced with server enforcement when the paid tier is built.
