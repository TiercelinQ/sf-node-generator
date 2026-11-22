// Role: look up an `sf` command and its flags in the .claude/sf-cli-reference/ catalog and return only
//   the useful entry (file, line, excerpt), or "absent".
// Inputs: "<command>" [--flags a,b,c]   (e.g. "data query" --flags target-org,query; the "sf" prefix is optional)
// Outputs: stdout = file:line, entry excerpt, status of each requested flag; or "absent" with
//   nearby commands (same first word).
// Exit codes: 0 command and flags found, 1 command or flag absent, 4 invalid argument.
// Command replaced: manual catalog reading by /sf-node-add-feature and /sf-node-p4-architect (sf-cli.md rule).
// Example: node .claude/scripts/search-sf-catalog.mjs "data query" --flags target-org,query

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const fi = argv.indexOf("--flags");
const flags = fi >= 0 ? (argv.splice(fi, 2)[1] ?? "").split(",").map((f) => f.trim().replace(/^-+/, "")).filter(Boolean) : [];
const wanted = (argv[0] ?? "").trim().replace(/^sf\s+/, "").replace(/\s+/g, " ");
if (!wanted) {
  console.error('Usage: search-sf-catalog.mjs "<command>" [--flags a,b,c]');
  process.exit(4);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "sf-cli-reference");
const entries = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "INDEX.md")) {
  const lines = readFileSync(join(dir, file), "utf8").split(/\r?\n/);
  lines.forEach((l, i) => {
    const m = l.match(/^### `sf ([^`]+)`/);
    if (!m) return;
    let j = i + 1;
    while (j < lines.length && !/^###? /.test(lines[j])) j++;
    entries.push({ name: m[1].trim(), file, line: i + 1, text: lines.slice(i, j).join("\n").trim() });
  });
}

const hit = entries.find((e) => e.name === wanted);
if (!hit) {
  const near = entries.filter((e) => e.name.startsWith(wanted.split(" ")[0] + " ")).map((e) => `sf ${e.name}`);
  console.log(`absent: "sf ${wanted}"`);
  if (near.length) console.log(`Nearby commands: ${near.slice(0, 15).join(" | ")}`);
  process.exit(1);
}

console.log(`${hit.file}:${hit.line}\n${hit.text}`);
let missing = 0;
const flagLine = hit.text.split("\n").find((l) => l.startsWith("Flags:")) ?? "";
for (const f of flags) {
  const found = new RegExp(`(?<![\\w-])${f.length === 1 ? "-" : "--"}${f}(?![\\w-])`).test(flagLine);
  console.log(`flag ${f}: ${found ? "present" : "absent"}`);
  if (!found) missing++;
}
process.exit(missing ? 1 : 0);
