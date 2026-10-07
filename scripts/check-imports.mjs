// Static check for public/: every ES module parses, and every named import
// resolves to a real export.
//
// A vanilla-JS app has no build step and no typechecker, so nothing otherwise
// catches a renamed export or a deleted module until a screen blanks out in
// the browser. This is the cheapest substitute for a compiler.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "public";
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".js")) files.push(p);
  }
})(ROOT);

const problems = [];

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (err) {
    problems.push(`${file}: syntax error\n${err.stderr?.toString().trim()}`);
    continue;
  }

  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const names = m[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    const target = resolve(dirname(file), m[2]);
    if (!existsSync(target)) {
      problems.push(`${file}: imports '${m[2]}', which does not exist`);
      continue;
    }
    const targetSrc = readFileSync(target, "utf8");
    for (const name of names) {
      const exported =
        new RegExp(`export\\s+(async\\s+)?(function|const|let|var|class)\\s+${name}\\b`).test(targetSrc) ||
        new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(targetSrc);
      if (!exported) problems.push(`${file}: imports '${name}' from '${m[2]}', which does not export it`);
    }
  }
}

if (problems.length) {
  console.error(`check-imports: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`check-imports: ${files.length} modules OK`);
