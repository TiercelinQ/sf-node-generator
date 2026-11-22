// Role: static integrity checks of verification.md section B by pattern search, instead of model reading.
// Inputs: <root> (root of the generated Salesforce CLI tool)
// Outputs: stdout = one "[point] file:line: message" line per finding, then a total; "OK" if none.
//   Points: 3 spawn outside src/sf/runner.ts, process.exit outside src/cli.ts, commander outside the CLI boundary,
//   @clack/prompts outside src/prompts/ · 4 TODO, console.log · sf-cli shell:true · config dotenv ·
//   12 versions (package.json vs changelog) · 13 .gitignore.
// Exit codes: 0 no finding, 1 at least one finding, 4 invalid argument.
// Documented exceptions stay to be judged by the model.
// Command replaced: /sf-node-p5-development, /sf-node-add-feature, /sf-node-fix-issue, section B.
// Example: node .claude/scripts/static-checks.mjs C:\projects\sf-export

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("Usage: static-checks.mjs <root>");
  process.exit(4);
}

const findings = [];
const add = (point, file, line, msg) => findings.push(`[${point}] ${file}${line ? ":" + line : ""}: ${msg}`);
const rel = (f) => relative(root, f).split("\\").join("/");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (["node_modules", "dist", ".git"].includes(e)) continue;
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const files = walk(join(root, "src")).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f));
const rules = [
  { point: "4", re: /\/\/\s*TODO/, msg: "// TODO is forbidden" },
  { point: "4", re: /\bconsole\.log\s*\(/, msg: "console.log is forbidden, use src/logger.ts" },
  {
    point: "3",
    re: /from\s+["'](node:)?child_process["']|from\s+["']cross-spawn["']|require\(\s*["'](node:)?child_process["']\s*\)/,
    msg: "process spawn outside src/sf/runner.ts",
    only: (f) => rel(f) !== "src/sf/runner.ts",
  },
  { point: "sf-cli", re: /shell\s*:\s*true/, msg: "shell: true is forbidden" },
  { point: "3", re: /\bprocess\.exit\s*\(/, msg: "process.exit outside src/cli.ts", only: (f) => rel(f) !== "src/cli.ts" },
  {
    point: "2",
    re: /from\s+["']commander["']/,
    msg: "commander imported outside src/cli.ts and src/commands/",
    only: (f) => rel(f) !== "src/cli.ts" && !rel(f).startsWith("src/commands/"),
  },
  { point: "2", re: /from\s+["']@clack\/prompts["']/, msg: "@clack/prompts imported outside src/prompts/", only: (f) => !rel(f).startsWith("src/prompts/") },
  { point: "config", re: /["']dotenv(\/config)?["']/, msg: "dotenv is not used, the config cascade reads .env natively" },
];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  for (const r of rules) {
    if (r.only && !r.only(f)) continue;
    lines.forEach((l, i) => {
      if (r.re.test(l)) add(r.point, rel(f), i + 1, r.msg);
    });
  }
}

// Point 12: package.json version must equal the top released changelog version
const ver = {};
try {
  ver["package.json"] = readFileSync(join(root, "package.json"), "utf8").match(/"version"\s*:\s*"([^"]+)"/)?.[1];
  ver["CHANGELOG top"] = readFileSync(join(root, "docs/release/CHANGELOG.md"), "utf8").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
} catch {
  add("12", "docs/release/CHANGELOG.md", 0, "package.json or changelog is unreadable");
}
if (Object.values(ver).some((v) => v === undefined) || new Set(Object.values(ver)).size > 1)
  add("12", "(versions)", 0, `versions differ or are missing: ${JSON.stringify(ver)}`);

// Point 13: .gitignore
const gi = join(root, ".gitignore");
if (!existsSync(gi)) add("13", ".gitignore", 0, "file is missing");
else {
  const set = new Set(readFileSync(gi, "utf8").split(/\r?\n/).map((l) => l.trim()));
  for (const need of ["node_modules/", "/dist/", "logs/", ".env", "exports/", "tasks/", ".claude/settings.local.json", ".claude/agent-memory/"])
    if (!set.has(need)) add("13", ".gitignore", 0, `missing entry: ${need}`);
  for (const bad of ["test/", ".claude/settings.json", "docs/release/CHANGELOG.md", "CLAUDE.md"])
    if (set.has(bad)) add("13", ".gitignore", 0, `must not ignore: ${bad}`);
}

console.log(findings.length ? `${findings.join("\n")}\n\n${findings.length} finding(s).` : "OK: no finding.");
process.exit(findings.length ? 1 : 0);
