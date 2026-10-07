# Stack comparison: FastAPI vs Node/Fastify

Benchmarked 2026-10-07. Question asked: *is there a real reason to use FastAPI here, or
should the backend be ported to Node/Fastify?*

Stated drivers were **one language for students** and **maintenance/ecosystem** —
explicitly not performance. Performance was measured anyway, to take it off the table.

**Recommendation: stay on FastAPI.** Fastify is genuinely faster, but the margin is
irrelevant at this app's scale, about half of it is a fixable mistake in our own
middleware rather than anything about Python, and porting makes the *maintenance*
driver measurably worse rather than better.

---

## 1. Performance

### Method

Four arms, same machine, same Postgres, same seeded athlete (15.6 KB progress
document), single process each — matching `Procfile`, which runs one uvicorn worker.

| Arm | What |
|---|---|
| **A** | FastAPI exactly as deployed |
| **B** | Fastify spike: same schema, same `base64url(sha256(token))` sessions, same three queries, same Argon2, same security headers and origin check |
| **C** | Arm A + the three session/state lookups collapsed into one joined query |
| **D** | Arm A's routes with the four middlewares rewritten as native ASGI instead of `BaseHTTPMiddleware` |

**Fairness was verified before timing anything.** Arms A, B and D return
byte-identical JSON for the same authenticated `GET /api/state` (15,215 bytes), all
return 401 unauthenticated, all return 403 on a cross-site `PUT`, and A and D emit
identical security headers. Arm B's login cookie carries `HttpOnly; SameSite=Lax`.
Argon2 parameters are necessarily identical (`m=65536,t=3,p=4`) because arm B verifies
the hashes Python wrote.

`autocannon`, 20 connections, 3 rounds of 6s after a warmup (5 rounds for the hot path).

### Results

Throughput, median of rounds:

| Workload | A (deployed) | B (Fastify) | C (1 query) | D (ASGI mw) |
|---|---:|---:|---:|---:|
| `GET /api/state` authed — **the real hot path** | 463 | **1,714** | 579 | 815 |
| `PUT /api/state` (15.7 KB body) | 232 | **1,390** | — | 468 |
| `GET /` static `index.html` | 1,344 | **13,172** | — | 2,228 |
| `GET /api/health` (does `SELECT 1`) | 1,016 | 6,471 | — | 2,053 |

Latency on the hot path: A p50 38ms / p99 107ms · B p50 9ms / p99 17ms ·
D p50 23ms / p99 44ms.

Login (Argon2-bound, measured as serial latency since the endpoint is rate-limited):
A 48.5ms · B 26.1ms · D 45.2ms median.

Memory after load is a wash: 16 MB (A, D), 20 MB (B).

### What the numbers actually say

**I expected the framework not to matter and was wrong.** The prediction going in was
that three sequential Postgres round-trips plus Argon2 would dominate, leaving the two
stacks within noise. They don't: Fastify is **3.7× faster** on the hot path as things
stand.

**But most of that gap is ours, not Python's.** A bare FastAPI route with no middleware
serves **14,712 req/s** on this machine — faster than the Fastify spike. Adding our
middleware stack costs 80% of it:

| | req/s |
|---|---:|
| Bare FastAPI route | 14,712 |
| \+ `SecurityHeadersMiddleware` only | 7,357 |
| \+ all four middlewares | 3,009 |

The cause is Starlette's `BaseHTTPMiddleware`, which wraps every request in an anyio
task group and a streaming response. Fastify's hooks are plain function calls. Rewriting
our four middlewares against the raw ASGI interface (arm D) recovers **1.76×** with
byte-identical behaviour, and collapsing the three queries into one (arm C) adds
**1.25×**. Together they would close roughly half the remaining gap, for about a day of
work instead of weeks.

**And the gap doesn't matter here anyway.** The slowest arm sustains 463 req/s on the
heaviest endpoint — about 40 million requests a day. MindRep has 25 beta athletes, each
making a handful of requests per session. The static-file gap is the largest and the
least important: static assets belong on a CDN in production, not on either app server.

### Caveats

The load generator shared an 8-core box with the servers, local Postgres is not
Railway's, and macOS is not a Linux container. Absolute numbers don't transfer. The
relative comparison on one box is fair. Round-to-round spread was under 10% except
arm C (27%) and arm B's health check, which varied between 6,471 and 9,873 across
sessions.

---

## 2. Maintenance and ecosystem

This is where the decision actually turns, and it runs against porting.

Measured by installing what a real port would need — `fastify`, its cookie/static/
formbody/helmet/rate-limit plugins, `postgres`, `@node-rs/argon2`, `zod`, `better-auth`,
`resend`, `drizzle-orm`, plus `drizzle-kit`, `vitest`, `typescript`, `tsx` and
`@types/node`:

| | FastAPI (today) | Node port |
|---|---:|---:|
| Direct dependencies | 14 | 17 |
| Total packages in tree | **57** | **332** |
| Production-only tree | 46 | 201 |
| Install size | 80 MB | 194 MB |
| Known vulnerabilities today | **0** | **10** (2 critical, 2 high) |
| Packages running install scripts | 0 | 2 (`esbuild`) |
| Peer conflicts before it would install | n/a | 2 |

The Node tree would not install at all until `drizzle-kit` and `drizzle-orm` were
hand-pinned to satisfy `better-auth`'s peer ranges. A fresh `npm audit` then reports
critical findings in `tinypool` and `vitest` and high findings in `vite` and
`@fastify/static` — the last being a path-traversal issue in the very plugin that
would serve `public/`. `uvx pip-audit` on the current stack reports *No known
vulnerabilities found*.

Dependabot has opened 17 dependency PRs on this repo since launch against 57 packages.
Against 332, that volume rises rather than falls.

---

## 3. One language for students

The strongest argument for porting, and weaker than it looks.

`public/` is vanilla JS with **no build step, no npm, no bundler, and no types**. A
student working on the frontend never meets the JavaScript *ecosystem* — only the
language. So porting the backend would not unify one toolchain; it would introduce
npm, a migration tool, a validation library, a test runner and probably TypeScript
to a project that currently has none of them on the frontend side.

What a student actually has to learn to touch the backend is roughly the same either
way, because it isn't syntax:

| Concept | FastAPI today | After a port |
|---|---|---|
| Schema migrations | Alembic | drizzle-kit |
| ORM / query layer | SQLAlchemy | Drizzle |
| Request validation | Pydantic | Zod |
| Auth and sessions | fastapi-users | better-auth |
| Async model | `async`/`await` | `async`/`await` |
| Tests | pytest | vitest |
| Package management | uv | npm |

The language changes; the concept count doesn't. The honest version of the teaching
argument is "students write Python *and* JavaScript", which is a real cost — but one
paid in syntax, not in architecture, and arguably a feature in a class setting.

---

## 4. What a port would cost

- **1,521 lines** of backend Python and **1,046 lines** of tests to rewrite.
- **`fastapi-users` has no drop-in equivalent.** It currently provides the auth routers,
  reset-token generation, the `UserManager` hooks and the session strategy.
  `better-auth` is the live option (Lucia is archived), but it's a different model —
  a redesign, not a translation. This is the single largest item.
- **Three Alembic migrations**, including `0003`'s in-place session-token hash backfill,
  would need equivalents that don't sign anyone out.
- **Hand ports with no library**: `app/db_roles.py` (least-privilege role provisioning),
  `app/rate_limit.py` (bounded LRU keyed on `X-Real-IP`), `app/security.py`
  (CSP/headers/origin check).
- **Re-verification of the backend half of the 29 findings** in `SECURITY-GAPS.md` —
  the hardening is three weeks old and none of it carries over automatically.
- CI changes: `pip-audit` → `npm audit`, `alembic check` → `drizzle-kit check`.

One thing that *would* be easy: `@node-rs/argon2` verified hashes written by Python's
`pwdlib` without modification, so a port would not force a password reset.

---

## 5. Recommendation

**Stay on FastAPI.** Nothing measured here supports a port:

- Performance isn't the driver, and at 25 users the difference is unobservable.
- Maintenance — a stated driver — gets *worse*: 57 packages become 332, and a clean
  audit becomes 10 known vulnerabilities including two critical.
- The single-language benefit is partly illusory, because the frontend has no JS
  toolchain to unify with.
- The port lands precisely when the backend is most hardened and therefore most
  expensive to re-verify.

**If performance ever does matter**, do this first, in order, for roughly a day of work
and no change of language:

1. Rewrite the four middlewares as native ASGI (`BaseHTTPMiddleware` is the single
   biggest cost on every request) — ~1.76×.
2. Collapse the session/user/state lookups into one joined query — a further ~1.25×.
3. Put static assets behind a CDN, which removes the largest gap entirely.

Both code changes touch auth and API routes, so per `CLAUDE.md` each needs a
`production-standard` run with a clean Critical/High list before it ships.

**Revisit Node only if** the teaching argument becomes decisive on its own terms. If it
does, port while a project is young, not after it has been audited — and note that the
cheapest version of that experiment is to start the *next* student project on Fastify
and compare the two in practice, rather than rewriting this one.
