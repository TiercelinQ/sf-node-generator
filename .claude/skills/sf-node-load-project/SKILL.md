---
name: sf-node-load-project
description: Load an existing sf-node CLI project (Phase 5 complete) from its specs, README, and source — bring the generator rules to bear on already-delivered code. Invoke from the target project root.
model: sonnet
---

# /sf-node-load-project — Load an existing project

## Role
Onboarding analyst — take charge of a delivered CLI codebase under the generator rules.

## Goal
Understand the tool's layered structure and confirm the rules apply to any later change.

## Deliverable
A one-block confirmation (in the user's language) of the loaded project.

---

Prerequisite: invoked from the target project root — `.claude/` and `docs/specs/04-architect.md` present.

> If the project root has not been provided in this flow, first ask (plain text, non-enumerable): `Project root to load? (folder path)`. Read everything below relative to that root.

Use the native Claude Code tools (no shell — Windows-compatible):

1. **Read the source of truth in priority order:**
   - `docs/specs/04-architect.md` (the locked contract — most reliable). If present, it is authoritative for the file tree and the command registry (command → service → sf helper → output).
   - Other `docs/specs/*` for the scoping / featuring / interface decisions.
   - `README.md` at the root. If both specs and README are absent: offer `/sf-node-generate-readme` and stop.
2. **Detect the coupling mode**: `sfdx-project` if `src/sf/project.ts` and a root `sfdx-project.json` are present, else `standalone` (@rules/sfdx-project.md).
3. **Detect tests** via `Glob` `test/**/*.test.*` → count the files for the Tests line.
4. Read `package.json` and walk `src/` to confirm the layered structure (`cli.ts` · `services/` · `sf/` · `commands/` · `output/` · shared `config`/`logger`/`types`/`errors`), the registered command groups, and the wired output formats.
5. Confirm take-over with this exact format (in the user's language):

Project loaded: [TOOL_NAME] v[VERSION]

Stack : Node.js 24 LTS+ · TypeScript strict · commander
Coupling mode : [standalone | sfdx-project]
Commands detected : [command groups / subcommands]
Services : [count]
Output formats : [json · csv · xlsx · table]
Salesforce CLI : sf v2 (mandatory) — runner src/sf/runner.ts
Tests : [present ([N] files) | absent]
Specs : [docs/specs present: yes/no]

Generator rules applied. Ready for: add-feature | fix-issue | refactor-code | run-tests | trace-feature.

6. Read and apply all rules to any later change (not auto-imported — read them before touching code): `CLAUDE.md`, @rules/architecture.md · @rules/cli.md · @rules/errors.md · @rules/config.md · @rules/security.md · @rules/sf-cli.md · @rules/output.md · @rules/logging.md · @rules/sfdx-project.md (if coupling = sfdx-project) · @rules/tests.md (if tests present) · @rules/verification.md · @rules/readme.md.
7. Any structural, layering, or security deviation detected between the code and the rules (or vs `docs/specs/04-architect.md`): report it, do not fix without a request (hand off to `/sf-node-fix-issue` or `/sf-node-refactor-code`).
