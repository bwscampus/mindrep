# MindRep

Vanilla HTML/CSS/JS app in `public/`, written by the student, with **no build step and
no framework**. All state lives in the browser's `localStorage`. `server.js` is a Node
static server that exists only to serve it safely — no database, no accounts, no API
beyond `/api/health`.

Users are athletes aged 10–18, so treat all profile, journal, and chat data as
sensitive.

## Division of labour

**Features belong to the student**, specced and implemented in `public/`. Teacher and
assistant edits are limited to **security hardening and deployment**. If a change adds
or alters a user-facing capability, stop and leave it for the student — note it in
`ROADMAP.md` instead.

The reverse is also true: don't quietly drop a student feature to make a security
finding go away. Say what the tradeoff is and let them decide.

## Production Standard

This repo follows the class Production Standard (rule IDs like AUTH-3, FE-1, OPS-1).

- **Before finishing any change touching the server, HTML rendering of user data, or
  deploy/CI config, run the `production-standard` skill.** It is a personal skill
  (`~/.claude/skills/production-standard/`), not a copy in this repo — one copy, so the
  rules can't drift. Do not call work done while a Critical or High finding is open.
- Known gaps and their status live in `docs/SECURITY-GAPS.md`. Update it when you fix
  or find one.
- There is no database today, so the `database-security` skill doesn't apply. If a
  feature ever brings one back, load it for anything touching schema, migrations,
  roles, tokens, PII or encryption.
- Anything a user typed goes into HTML through `escapeHtml` from
  `public/utils/escape.js`.
- Run `npm test` before committing (module/import check plus a server smoke test that
  asserts the API-4 headers). CI runs the same plus `npm audit`.

## Things that are deliberately absent

Don't "restore" these without a decision — each was removed on purpose:

- **Accounts, login, server-side progress sync.** Rolled back 2026-10-07: that was
  assistant-written feature work, and features are the student's to spec. The app is
  `localStorage`-only, as originally written.
- **Demo mode** (`utils/admin.js`). The passphrase shipped in this public repo, so it
  is burned (FE-2). Needs server-side enforcement to be real.
- **The FastAPI backend.** Replaced by `server.js`; the repo is one language again.
  See `docs/STACK-COMPARISON.md`.
