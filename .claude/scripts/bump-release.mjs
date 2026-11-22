// Role: prepare or apply a SemVer release from the [Unreleased] changelog section.
// Inputs: <root> [major|minor|patch|X.Y.Z] [--date YYYY-MM-DD]
//   Without an increment: read-only, prints the inferred increment and the three candidate versions (JSON).
//   With an increment: freezes [Unreleased] into a dated block, then updates package.json (the only version
//   to write: APP_VERSION is derived from it) and the README title line.
// Outputs: stdout = release block (or inference JSON); stderr = modified files.
// Exit codes: 0 ok, 2 changelog missing or version unreadable, 3 nothing to release, 4 invalid argument.
// Command replaced: /sf-node-release, steps 1 to 4 (choosing the increment stays with the model).
// Example: node .claude/scripts/bump-release.mjs C:\projects\MyApp minor

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const dateIdx = args.indexOf("--date");
const date = dateIdx >= 0 ? args.splice(dateIdx, 2)[1] : new Date().toLocaleDateString("sv-SE");
const [root, choice] = args;
if (!root || (choice && !/^(major|minor|patch|\d+\.\d+\.\d+)$/.test(choice)) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Usage: bump-release.mjs <root> [major|minor|patch|X.Y.Z] [--date YYYY-MM-DD]");
  process.exit(4);
}

const read = (p) => readFileSync(p, "utf8");
const pathChangelog = join(root, "docs", "release", "CHANGELOG.md");
const pathPackage = join(root, "package.json");
const pathReadme = join(root, "README.md");

if (!existsSync(pathChangelog)) {
  console.error("CHANGELOG.md is missing: route to /sf-node-load-project.");
  process.exit(2);
}
const changelog = read(pathChangelog);
const eol = changelog.includes("\r\n") ? "\r\n" : "\n";
const lines = changelog.split(/\r?\n/);
const start = lines.findIndex((l) => /^## \[Unreleased\]/i.test(l));
if (start < 0) {
  console.error("[Unreleased] section not found.");
  process.exit(2);
}
let end = lines.findIndex((l, i) => i > start && /^## \[/.test(l));
if (end < 0) end = lines.length;
const body = lines.slice(start + 1, end);
const hasEntries = body.some((l) => /^\s*[-*] /.test(l));
if (!hasEntries) {
  console.error("Nothing to release: [Unreleased] is empty.");
  process.exit(3);
}

const sections = {};
let current = "";
for (const l of body) {
  const m = l.match(/^### (\w+)/);
  if (m) current = m[1];
  else if (current && /^\s*[-*] /.test(l)) sections[current] = (sections[current] ?? 0) + 1;
}
const breaking = body.some((l) => l.includes("**BREAKING:**"));
const inferred = breaking || sections.Removed ? "major" : sections.Added ? "minor" : "patch";

const pkgText = read(pathPackage);
const cur = pkgText.match(/"version"\s*:\s*"(\d+)\.(\d+)\.(\d+)"/);
if (!cur) {
  console.error("Version not readable in package.json.");
  process.exit(2);
}
const [x, y, z] = cur.slice(1).map(Number);
const candidates = { major: `${x + 1}.0.0`, minor: `${x}.${y + 1}.0`, patch: `${x}.${y}.${z + 1}` };

if (!choice) {
  console.log(JSON.stringify({ current: `${x}.${y}.${z}`, inferred, candidates, entries: sections }, null, 2));
  process.exit(0);
}

const next = candidates[choice] ?? choice;
const block = body.join(eol).replace(/^(\r?\n)+|(\r?\n)+$/g, "");
const released = [`## [${next}] - ${date}`, block].join(eol);
const newLines = [...lines.slice(0, start), "## [Unreleased]", "", ...released.split(eol), "", ...lines.slice(end)];
writeFileSync(pathChangelog, newLines.join(eol));
writeFileSync(pathPackage, pkgText.replace(/("version"\s*:\s*")\d+\.\d+\.\d+(")/, `$1${next}$2`));
const done = ["docs/release/CHANGELOG.md", "package.json"];

if (existsSync(pathReadme)) {
  const readme = read(pathReadme);
  const titled = readme.replace(/^(# .+? \u2014 v)\d+\.\d+\.\d+/m, `$1${next}`);
  writeFileSync(pathReadme, titled);
  done.push("README.md");
}
console.error(`Version ${x}.${y}.${z} -> ${next}. Modified files: ${done.join(", ")}`);
console.log(released);
