// server.js — serves the MindRep app (public/) over HTTPS with the security
// headers the Production Standard requires.
//
// Scope on purpose: this is deployment and hardening only. The app itself is
// the student's vanilla-JS code in public/, and it keeps all of its state in
// the browser's localStorage. There is no database, no accounts and no API
// beyond a health check. Features belong in public/, specced and built by the
// student; this file exists so those features can be served safely.

import Fastify from "fastify";
import helmet from "@fastify/helmet";
import fstatic from "@fastify/static";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, "public");

const ENVIRONMENT = process.env.ENVIRONMENT ?? "development";
const IS_PRODUCTION = ENVIRONMENT === "production";
const PORT = Number(process.env.PORT ?? 8000);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`;
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? "*")
  .split(",").map((h) => h.trim()).filter(Boolean);

// --- API-10: validate production config at boot, not on first request -------
// A deploy that refuses to start leaves the previous version serving. One that
// starts misconfigured takes the site down later, with no obvious cause.
function validateConfig() {
  if (!IS_PRODUCTION) return;
  const problems = [];
  if (ALLOWED_HOSTS.length === 0 || ALLOWED_HOSTS.includes("*")) {
    problems.push("ALLOWED_HOSTS must name your real host(s), not '*'");
  }
  if (!PUBLIC_BASE_URL.startsWith("https://")) {
    problems.push("PUBLIC_BASE_URL must be https:// in production");
  }
  if (problems.length) {
    console.error("Refusing to start in production:\n  - " + problems.join("\n  - "));
    process.exit(1);
  }
}
validateConfig();

const app = Fastify({ logger: false, trustProxy: true });

// --- API-4: security headers on every response ------------------------------
// script-src stays strict: the app has no inline handlers and no eval.
// style-src needs 'unsafe-inline' because the screens use inline style
// attributes (Production Standard FE-5 tracks moving those into style.css),
// and Google Fonts needs its two hosts.
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  // helmet defaults frameguard to SAMEORIGIN; API-4 wants DENY.
  xFrameOptions: { action: "deny" },
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
});

// --- Host allowlist ---------------------------------------------------------
app.addHook("onRequest", async (req, reply) => {
  if (!IS_PRODUCTION || ALLOWED_HOSTS.includes("*")) return;
  const host = (req.headers.host ?? "").split(":")[0];
  if (!ALLOWED_HOSTS.includes(host)) {
    return reply.code(400).send({ detail: "Invalid host header." });
  }
});

// --- API-8: a request id on every response, for correlating logs ------------
app.addHook("onRequest", async (req, reply) => {
  const supplied = req.headers["x-request-id"];
  req.requestId =
    typeof supplied === "string" && /^[A-Za-z0-9-]{1,64}$/.test(supplied)
      ? supplied
      : randomUUID().slice(0, 12);
  reply.header("x-request-id", req.requestId);
});

// --- API-3: generic errors; details stay in the logs ------------------------
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
  if (status >= 500) console.error(`[${req.requestId}]`, err);
  reply.code(status).send(
    status >= 500
      ? { detail: "Internal server error", request_id: req.requestId }
      : { detail: err.message }
  );
});

// --- API-9: liveness. Nothing about versions or environment -----------------
// There is no database to ping; if this process answers, it can serve the app.
app.get("/api/health", async () => ({ status: "ok" }));

// Cache policy, set before the static plugin so it applies to its responses.
//
// `no-cache` means "revalidate before using", not "don't cache": the browser
// still stores the file and still gets a cheap 304 when nothing changed.
// It is explicit because the previous deployment served these files with an
// ETag but NO Cache-Control, which lets a browser apply *heuristic* freshness
// and stop asking altogether. Returning visitors then ran months-old
// JavaScript against a new server — which is exactly how this app started
// showing its own "Can't reach MindRep" screen to people who had used it
// before.
//
// The app has no build step, so there are no content-hashed filenames to lean
// on instead. Until there are, revalidation is what keeps a deploy honest.
app.addHook("onSend", async (req, reply) => {
  if (req.url.startsWith("/api/")) return;
  const path = req.url.split("?")[0];
  const mutable = path === "/" || /\.(html|js|css|json)$/.test(path);
  reply.header("Cache-Control", mutable ? "no-cache" : "public, max-age=3600");
});

// Static last, so it cannot shadow a route added above it.
await app.register(fstatic, { root: PUBLIC_DIR, index: ["index.html"] });

await app.listen({ host: "0.0.0.0", port: PORT });
console.log(`MindRep serving ${PUBLIC_DIR} on :${PORT} (${ENVIRONMENT})`);
