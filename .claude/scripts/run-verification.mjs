// Role: run the executable verification ladder (verification.md section A) and summarize the result.
// Inputs: <root>
//   Commands: npm install, npm run typecheck, npm run lint, npm run build, npm test (only if test/ exists),
//   then the smoke checks "node dist/cli.js --help" and "node dist/cli.js --version" (no org needed).
//   Stops at the first failing command.
// Outputs: stdout = command / status / duration table, then the first error lines of the failure.
// Exit codes: 0 all green, 1 a command failed, 4 invalid argument.
// Not covered: smoke of real sf operations, which needs an authenticated org (out of scope).
// Command replaced: /sf-node-run-tests, step 1 (interpreting a failure stays with the model).
// Example: node .claude/scripts/run-verification.mjs C:\projects\sf-export

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
if (!root || !existsSync(join(root, "package.json"))) {
  console.error("Usage: run-verification.mjs <root> (package.json required)");
  process.exit(4);
}

const steps = [
  { label: "npm install", cmd: "npm", argv: ["install"] },
  { label: "npm run typecheck", cmd: "npm", argv: ["run", "typecheck"] },
  { label: "npm run lint", cmd: "npm", argv: ["run", "lint"] },
  { label: "npm run build", cmd: "npm", argv: ["run", "build"] },
];
if (existsSync(join(root, "test"))) steps.push({ label: "npm test", cmd: "npm", argv: ["test"] });
steps.push(
  { label: "node dist/cli.js --help", cmd: "node", argv: ["dist/cli.js", "--help"] },
  { label: "node dist/cli.js --version", cmd: "node", argv: ["dist/cli.js", "--version"] },
);

const rows = [];
let failure = null;
for (const s of steps) {
  if (failure) {
    rows.push([s.label, "not run", "-"]);
    continue;
  }
  const t0 = Date.now();
  const opts = { cwd: root, encoding: "utf8", timeout: 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 };
  // Windows: npm is a .cmd file, hence the single command line passed to the shell (node runs directly).
  const r =
    process.platform === "win32" && s.cmd === "npm"
      ? spawnSync(["npm", ...s.argv].join(" "), { ...opts, shell: true })
      : spawnSync(s.cmd, s.argv, opts);
  const secs = ((Date.now() - t0) / 1000).toFixed(1) + " s";
  if (r.status === 0) rows.push([s.label, "OK", secs]);
  else {
    rows.push([s.label, `FAILED (code ${r.status ?? r.signal ?? "?"})`, secs]);
    failure = { label: s.label, output: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim() };
  }
}

console.log("| Command | Status | Duration |\n|---|---|---|");
for (const r of rows) console.log(`| ${r.join(" | ")} |`);
if (failure) {
  const errs = failure.output.split(/\r?\n/).filter((l) => /error|failed|ERR!/i.test(l)).slice(0, 15);
  console.log(`\nFirst errors from "${failure.label}":`);
  console.log((errs.length ? errs : failure.output.split(/\r?\n/).slice(-15)).join("\n"));
  process.exit(1);
}
