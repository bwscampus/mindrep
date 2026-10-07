# MindRep

Youth mental-performance microlearning for athletes ages 10–18.

The app is **vanilla HTML/CSS/JS with no build step**, written by the student
([@iamjlee11-maker](https://github.com/iamjlee11-maker)), and it lives entirely in
`public/`. It keeps all of its state — profile, XP, streaks, badges, journal entries,
coach chat — in the browser's `localStorage`.

`server.js` exists only to serve that app safely. It is deployment and hardening, not
features: security headers, a host allowlist, a health check, and a config gate that
refuses to boot a misconfigured production deploy. There is no database, no accounts,
and no API beyond `/api/health`.

**Features are specced and built by the student, in `public/`.** See `ROADMAP.md`.

## Running it

```bash
npm install
npm run dev          # http://localhost:8000
```

```bash
npm test             # module/import check + server smoke test
npm audit            # dependency check (also runs in CI)
```

You can also open `public/index.html` directly from the filesystem for quick frontend
work — the app needs no server. You just won't get the security headers.

## Layout

```
public/              the app — the student's code
  index.html
  app.js             router and navigation shell
  screens/           one module per screen
  utils/             storage (localStorage), gamification, illustrations, escape
  data/              lesson content
  privacy.html       privacy policy (DRAFT — needs real text, see below)
server.js            static server + security headers
scripts/             CI checks (import graph, smoke test)
docs/                SECURITY-GAPS.md, STACK-COMPARISON.md
```

## What the server does, and why

| Concern | Rule | How |
|---|---|---|
| Security headers on every response | API-4 | CSP, HSTS (prod), `X-Frame-Options: DENY`, nosniff, Referrer-Policy |
| Misconfigured production can't boot | API-10 | refuses to start on `ALLOWED_HOSTS=*` or an `http://` base URL |
| Host allowlist | API-4 | rejects requests with an unexpected `Host` header in production |
| Generic errors | API-3 | 500s return a request id, never a stack trace |
| Request correlation | API-8 | validated `X-Request-ID` on every response |
| Liveness | API-9 | `/api/health`, no version or environment detail |

Rule IDs refer to the class Production Standard (`production-standard` skill).

The one CSP compromise: `style-src` needs `'unsafe-inline'` because the screens use
inline `style=` attributes. `script-src` stays strict — the app has no inline handlers
and no `eval`, which is what actually stops XSS.

## Adding a feature

1. Write it in `public/`. No build step, no framework, no npm for frontend code.
2. Anything a user typed goes through `escapeHtml` from `public/utils/escape.js`
   before it reaches `innerHTML`. That rule has a test; please keep it true.
3. Run `npm test` before committing.

If a feature needs a server — accounts, cross-device sync, payments, a real AI coach —
that is a bigger change than this repo currently supports. Spec it first; see
`ROADMAP.md` Phase 3 and `docs/STACK-COMPARISON.md`.

## Deploying

Railway, from the `Procfile` (`web: node server.js`). Set in service variables:

```
ENVIRONMENT=production
PUBLIC_BASE_URL=https://<your-app>.up.railway.app
ALLOWED_HOSTS=<your-app>.up.railway.app
```

The app refuses to boot in production if those are missing or wrong, so a bad deploy
fails loudly and the previous version keeps serving.

## Known gaps

`docs/SECURITY-GAPS.md`. The one that needs a person rather than code: **`privacy.html`
is a draft placeholder.** Users are 10–18, which brings COPPA into scope, and the real
policy text and the under-13 approach are a decision for the school.
