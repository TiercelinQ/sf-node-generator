# README synchronization rule

> The generated tool's `README.md` is a **derived** document — its source of truth is the code plus `docs/specs/04-architect.md`. After any post-delivery change, the README must keep reflecting what shipped. This is the single, shared definition of when and how to refresh it. Referenced by `/sf-node-add-feature`, `/sf-node-fix-issue`, `/sf-node-refactor-code`.

## What the README documents

objective · commands & subcommands (the CLI surface: args / flags, exit codes) · stack & dependencies · file tree · config keys (`.env` variables + CLI flags) · **Salesforce prerequisite** (`sf` v2 install + `SF_CLI_PATH` + the coupling mode: `standalone` vs `sfdx-project`) · output formats (`json` / `csv` / `xlsx` / `table`) · **runtime progress display** (steps/spinner on `stderr`, auto-on a TTY, `--no-progress` to disable — `@rules/progress.md`) · install & run (`npm install`, `npm run build`, `node dist/cli.js …`, scheduling note — Windows Task Scheduler / cron, where the progress display is auto-off). Exact sections: `/sf-node-generate-readme`.

The **Salesforce prerequisite is always documented** — coupling is mandatory in this framework (`@rules/sf-cli.md`): the `sf` v2 CLI must be reachable (PATH or `SF_CLI_PATH`), and the README states the coupling mode the tool was generated for (`standalone` or `sfdx-project`).

## When to refresh (trigger)

Regenerate the README **iff** the change touched a documented aspect above:
- a dependency added/removed, or a stack change,
- the file tree changed (a file / command / service / formatter added, renamed, moved, or deleted),
- a command or subcommand added or renamed, or its flags / exit codes changed,
- a config key changed (a `.env` variable or a CLI flag added, renamed, or removed),
- the coupling mode or the `sf` / `SF_CLI_PATH` prerequisite changed,
- build or install/run steps changed (including the scheduling note).

A purely internal change (a private helper, the body of an existing service, a bug fix with no structural impact) does **not** trigger a refresh.

## How to refresh

Regenerate the README via the logic of `/sf-node-generate-readme` (reads specs + code), in the same delivery, without asking. Full regeneration — the README is derived, so hand edits are not preserved. No manual "offer" step.

## Read-only skills

Verification/analysis skills (`/sf-node-run-tests`, `/sf-node-trace-feature`) never rewrite the README. At most they flag it as stale; refreshing is done by the write skills above.
