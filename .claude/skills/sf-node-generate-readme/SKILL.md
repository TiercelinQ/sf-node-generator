---
name: sf-node-generate-readme
description: Analyze the specs and source of an existing sf-node CLI project and generate its README.md (objective, commands, stack, tree, config keys, Salesforce prerequisite, output formats, install & run). Invoke from the target project root.
model: sonnet
---

# /sf-node-generate-readme — Generate the README.md

## Role
Technical writer — produce an accurate tool README from specs + code.

## Goal
Write a README that reflects what was actually built.

## Deliverable
`README.md` at the project root (full regeneration — the README is derived, hand edits are not preserved).

---

Prerequisite: invoked from the target project root. Follows @rules/readme.md.

Use the native Claude Code tools (no shell — Windows-compatible):

1. **Sources, in priority**: `docs/specs/*` (especially `04-architect.md` — the contract) for the intended structure, then the real code:
   - List source files via `Glob` `src/**/*` (exclude `node_modules/`, `dist/`).
   - Read `package.json`, `src/cli.ts` (registered commands + exit-code mapping), `src/commands/` (subcommands, args/flags), `src/services/`, `src/sf/` (coupling mode + helpers), `src/output/` (wired formats), `src/config.ts` + `.env.example` (config keys).
   - Detect the coupling mode: `sfdx-project` if `src/sf/project.ts` + a root `sfdx-project.json`, else `standalone`.
   - Detect `test/` via `Glob` `test/**/*.test.*`.
   - When specs and code disagree, the code is what shipped — describe the code and note the divergence.
2. Generate `README.md` at the root via `Write`:

```markdown
# [TOOL_NAME] — v[VERSION]

## Objective
[Inferred from docs/specs, config.ts and the structure — 2 sentences max]

## Commands
[Per command group → subcommand: purpose · args / flags · exit codes (0 success · 1 runtime · 2 usage/validation). Inferred from src/commands/ + src/cli.ts]

## Stack & dependencies
- OS: cross-OS (Windows-first) · Runtime: Node.js 24 LTS+ · ESM · TypeScript strict · CLI parser: commander
- Salesforce CLI: sf v2 (mandatory) · Coupling mode: [standalone | sfdx-project]
- Logging: pino (file + stderr) · Output: [json · csv · xlsx · table — inferred from src/output/]
- Tests: [Yes (Vitest) | No — inferred from the presence of test/]
- Runtime dependencies: [inferred from package.json]

## File tree
[Actual src/ tree with the role of each file — cli.ts · services/ · sf/ · commands/ · output/ · shared config/logger/types/errors]

## Configuration
[Config keys resolved through the cascade defaults < .env < CLI flags: the .env variables (.env.example) and the CLI flags that override them. Non-secret only — secrets stay in the sf OS keychain.]

## Salesforce prerequisite
The `sf` v2 CLI is **required** — coupling is mandatory. Install it and make it reachable: on the PATH, or point the tool at the binary via the `SF_CLI_PATH` environment variable (`sfPath` config). Cross-OS install via the official standalone installer (ships its own Node, avoids the npm `.cmd` shim) — Windows / macOS / Linux. Coupling mode: **[standalone | sfdx-project]** — standalone: any org authenticated through `sf`; sfdx-project: run from inside an SFDX project folder (`sfdx-project.json` read, `.forceignore` respected). The tool never handles OAuth tokens — `sf` owns the auth flow and the OS keychain.

## Output formats
Emitted formats: [json · csv · xlsx · table]. xlsx is written to a file only. stdout carries data (pipeable); stderr carries logs and human messages.

## Install & run
npm install
npm run build            # tsup — produces dist/cli.js
node dist/cli.js --help  # usage
node dist/cli.js <command> [flags]

Scheduling (unattended runs): Windows Task Scheduler or cron — invoke `node dist/cli.js <command>` with the required flags; data on stdout, logs on stderr.

## Tests
[Section included only if test/ detected]
npm test
```

3. Write the file via `Write` (never `cat`/heredoc — Windows-incompatible).
4. If anything is undeterminable from specs + code: ask the closed questions with `AskUserQuestion` (clickable options) before writing.

Confirm with: `README.md generated at the project root.`
