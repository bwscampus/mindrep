# MindRep

FastAPI + Postgres backend (`app/`), vanilla-JS frontend (`public/`), deployed on Railway.
Users are athletes aged 10–18, so treat all profile, journal, and chat data as sensitive.

## Production Standard

This repo follows the class Production Standard (rule IDs like AUTH-3, FE-1, OPS-1).

- **Before finishing any change touching auth, the database, API routes, HTML rendering, or
  deploy/CI config, run the global `production-standard` skill**, and the global `database-security` skill for
  database, migration, or Railway DB changes.
  Do not call work done while a Critical or High finding is open.
- Known gaps and their status live in `docs/SECURITY-GAPS.md`. Update it when you fix or find one.
- Anything a user typed goes into HTML through `escapeHtml` from `public/utils/escape.js`.
- Run `uv run pytest` before committing; CI runs the same plus Postgres migrations and `pip-audit`.
