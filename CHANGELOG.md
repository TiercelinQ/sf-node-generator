# Changelog

All notable changes to this generator are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.
(This is the changelog of the **generator** itself, distinct from the `docs/release/CHANGELOG.md` of each generated tool.)

## [2.0.0] - 2026-11-22
### Added
- `.claude/scripts/` with four dependency-free Node scripts: `bump-release.mjs` (`package.json` is the only version to write), `run-verification.mjs` (with the `--help` and `--version` smoke), `static-checks.mjs` and `search-sf-catalog.mjs`. Tested on fixtures only, not on a generated project. The commands that could call them are unchanged.

### Changed
- **Major version.** Every skill now carries an `effort` field and a rebalanced `model` (`opus` for `p1-scoping`, `p2-featuring`, `p3-surfaces`, `p4-architect`, `fix-issue` and `refactor-code`, `haiku` for `release` and `run-tests`), which changes the cost profile of every command. Values come from the 2026-11-22 cost and quality audit and the Claude Code skill frontmatter documentation.
- `sf-node-show-state` names its sources (the latest `docs/sessions/SESSION_*_S*.md`, then `docs/release/CHANGELOG.md`) instead of risking an invented state.
- `sf-node-p4-architect` refers to Phase 1 for the execution shape; `sf-node-load-project` no longer requires `docs/specs/04-architect.md` as a prerequisite.
- `sf-node-save-memory` asks the memory category with `AskUserQuestion` instead of a typed A-D choice.
- `sf-node-app` maintenance menu routes `/sf-node-generate-readme`.
- `rules/verification.md` lists the skills that load it (all 7 of them, not 4).

## [1.6.0] - 2026-11-04
### Added
- Phase 1 asks **Execution modes** (`Flags only` | `Flags + guided assistant`) in place of the former "Runtime interactivity" question (still 4 questions). The recommendation comes from the objective, not from a fixed default. With the assistant, the generated tool started with no argument in a terminal asks a series of questions and runs one or several commands; with flags given, it asks only the missing values (hybrid).
- Phase 2 Step 4b "Execution flows": which v1.0 commands are multi-step flows, their ordered steps, step selection, repeat, dry run. The synthesis sheet gains an "Execution flows" table.
- Phase 3 specifies, per command, the assistant's question table (type, default, validation, equivalent flag, required outside a terminal) and, per flow, `--only` / `--skip` / `--dry-run`, the failure rule, and the global `--yes` flag. Phase 3 questions 4 and 5 choose the commands with an assistant and the destructive ones that confirm first.
- `rules/cli.md` section "Execution modes": entry rules (terminal or not), single `canPrompt()` guard, prompts on `stderr`, equivalent command line printed at the end, cancel handling, flows. `rules/architecture.md`: `src/prompts/` layer and the documented flow-service exception. Matching updates in `config`, `tests`, `verification`, `security`, `readme` and the Phase 4/5, add-feature, generate-readme, show-state and save-session skills.

### Changed
- The prompt guard now tests `stdin` and `stderr` (never `stdout`, which may be piped for data) and writes prompts to `stderr`. The former sample tested `process.stdout.isTTY`.
- Outside a terminal, a destructive command without `--yes` is refused with a `ValidationError` (exit `2`) instead of silently aborting.

## [1.5.0] - 2026-08-01
### Added
- Phase 5 offers `/sf-node-save-session` between batches when the session is running long or the context is heavily loaded (safety net before saturation; automatic chaining stays the default).
- Phase 2 Step 1 states the identifier constraint explicitly (kebab-case `bin`, already space-free; a free-typed name is normalized; a display name with spaces, when it matters for the README, is recorded separately).
- `/sf-node-release` now updates the README title line (`# [TOOL_NAME] — v[NEW]`) as a targeted edit of that single line; the version-bump trigger is documented in `rules/readme.md`.
- The tool-template `.claude/settings.json` deny anchoring is documented as deliberate in Phase 5 ("Deny anchoring" note — no deny may match `docs/release/CHANGELOG.md`).

### Changed
- `rules/architecture.md` §"cli.ts composition sequence" is reduced to a structural skeleton with an explicit pointer to the complete bootstrap owned by `rules/cli.md` (one reference sequence instead of two diverging ones).
- The provisional-calibration announcement sentence is removed from the CLAUDE.md CALIBRATION section (the announcement lives in p1/p2); closing paragraph harmonized across the 5 generators.

## [1.4.0] - 2026-07-26
### Added
- Phase 5 now writes the delivery baseline session file `docs/sessions/SESSION_<Tool>_S0.md` automatically at the end of the last batch (`/sf-node-save-session` template, `N = 0`, overwritten if Phase 5 is replayed). Manual `/sf-node-save-session` saves keep numbering from `S1`. The delivery summary links it.

## [1.3.0] - 2026-07-25
### Added
- The generated tool `.gitignore` template (`rules/config.md §.gitignore`) is completed with the common Claude Code socle: on top of the existing sf-node additions (`node_modules/`, `/dist/`, `logs/`, `.env`, `exports/`) it now ignores `tasks/`, the local `.claude/` settings (`settings.local.json` + `agent-memory/`), and the private `docs/specs/`, while keeping `docs/release/CHANGELOG.md`, `.claude/settings.json`, the generated `CLAUDE.md`, `test/`, and `scripts/` tracked. Wired into the Phase 5 last-batch deliverables and the verification checklist.

### Changed
- The generated tool `README.md` is now always written in English (public-facing document), regardless of the user's interface language. Updated `rules/readme.md`, `sf-node-generate-readme`, and the language note in `rules/versioning.md`.

## [1.2.0] - 2026-07-18
### Added
- Post-delivery reminder: the Phase 5 delivery summary and the generated tool `CLAUDE.md` now list the maintenance commands and `/sf-node-release`.

## [1.1.0] - 2026-07-17
### Added
- App changelog + SemVer versioning system for generated tools: new `rules/versioning.md`, new `/sf-node-release` skill, and a seeded `docs/release/CHANGELOG.md` (Keep a Changelog, English). The release skill bumps `package.json` `"version"` only — `APP_VERSION` is derived from it.
- Maintenance skills (`add-feature`, `fix-issue`, `refactor-code`) now record their change under `## [Unreleased]`; `/sf-node-load-project` offers to initialize the changelog retroactively on a legacy tool.

### Changed
- `CLAUDE.md`, `p5-development`, `verification.md`, `sf-node-app`, `show-state` updated for the versioning system.

## [1.0.0]
- Unified edition baseline: 5-phase generation pipeline (p1 scoping to p5 development), calibration, layered architecture (`commands` → `services` → `sf` / `output`, composition root `cli.ts`), error contract (`Result<T>`, named errors, exit-code mapping), CLI I/O contract (stdout data-only / stderr logs), mandatory Salesforce `sf` v2 integration via a `cross-spawn` runner, output formatters (json / csv / xlsx / table), the progress reporter, and the maintenance skill set.
