// Boots the server and asserts the things the Production Standard requires of
// every response, so a regression fails CI rather than production.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, ["server.js"], {
  env: { ...process.env, PORT: String(PORT), ENVIRONMENT: "development" },
  stdio: "inherit",
});

const failures = [];
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ok   ${name}`);
  else { console.log(`  FAIL ${name} ${detail}`); failures.push(name); }
};

try {
  for (let i = 0; i < 60; i++) {
    try { await fetch(`${BASE}/api/health`); break; } catch { await sleep(250); }
  }

  const health = await fetch(`${BASE}/api/health`);
  check("API-9  health returns 200", health.status === 200);
  check("API-9  health leaks no environment or version",
    JSON.stringify(await health.json()) === '{"status":"ok"}');

  const index = await fetch(`${BASE}/`);
  const h = index.headers;
  check("        index.html served", index.status === 200);
  check("API-4  Content-Security-Policy present", !!h.get("content-security-policy"));
  check("API-4  script-src stays strict",
    (h.get("content-security-policy") ?? "").includes("script-src 'self'"));
  check("API-4  X-Frame-Options: DENY", h.get("x-frame-options") === "DENY");
  check("API-4  nosniff", h.get("x-content-type-options") === "nosniff");
  check("API-4  Referrer-Policy", !!h.get("referrer-policy"));
  check("API-8  request id on the response", !!h.get("x-request-id"));
  check("API-4  framework header hidden", !h.get("x-powered-by"));

  const missing = await fetch(`${BASE}/utils/does-not-exist.js`);
  check("        unknown path 404s", missing.status === 404);
} finally {
  server.kill();
}

if (failures.length) { console.error(`\nsmoke: ${failures.length} failure(s)`); process.exit(1); }
console.log("\nsmoke: all checks passed");
