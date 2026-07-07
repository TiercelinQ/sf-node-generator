---
name: sf-node-p4-architect
description: Phase 4 of the sf-node generation cycle — complete architectural contract (file tree + role of each file, command registry command→service→sf→output, Result<T> + named errors, config keys, coupling mode, output formatters, source→test mapping), written to the contract spec and locked after validation.
model: sonnet
---

# /sf-node-p4-architect — Architectural contract

## Role
Software architect — design the locked layered structure the whole build will follow.

## Goal
Produce a complete, unambiguous architectural contract that freezes the file tree, the `command → service → sf → output` wiring, the `Result<T>` / named-error model, the config keys, and the coupling mode.

## Deliverable
`docs/specs/04-architect.md` (written in the user's language) — the locked source of truth + on-screen contract.

---

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 4/5 — Architecture; (2) progress line: Scoping ✓ · Features ✓ · Interface ✓ · ▶ Architecture · Development; (3) intent in italics: Lock the file/structure contract. Use the short label `Interface` in the progress map. See `## PIPELINE` in `CLAUDE.md`.

At start: read `@rules/architecture.md` (layer tree, batch tables, layering contract), `@rules/cli.md` (composition root, exit codes), `@rules/sf-cli.md` (runner, typed helpers, starter scaffold), `@rules/output.md`, `@rules/config.md`, `@rules/errors.md`. **If the coupling mode is `sfdx-project` (Phase 1), also read `@rules/sfdx-project.md`** (project detection, `deploy` / `retrieve`). **If tests were enabled (Phase 1), read `@rules/tests.md`.** Read `docs/specs/01-scoping.md` through `03-interface.md` for the validated decisions (coupling mode, output formats, interactivity, tests, and the full command surface).

Present (in the user's language, as plain Markdown — never inside a code block, except the tree, which is a fenced code block):

1. **Complete project tree** (model: `@rules/architecture.md`), tailored to the chosen commands, coupling mode, and execution shape — with the **role of each file**. Conditionals:
   - `src/sf/project.ts` ships **only** in `sfdx-project` mode; in `standalone` mode `src/sf/` is `runner.ts` + `helpers.ts`.
   - `scripts/` exists **only** when the execution shape (Phase 3) includes standalone one-off scripts.
   - `test/` exists **only** when tests were enabled in Phase 1.
   - One `src/services/<domain>.service.ts` + one `src/commands/<group>.ts` per domain/group from the interface spec; the `output/` formatters that ship come from Phase 1/3.

2. **Command registry table** — every command from `docs/specs/03-interface.md`, mapped end-to-end:

| Command | Service | `sf` helper(s) | Output formatter (default) |
| ------- | ------- | -------------- | -------------------------- |
| `org list` | `OrgService.listOrgs()` | `SfHelpers.listOrgs()` (`sf org list`) | `table` |
| `org use <alias>` | `OrgService.setDefault()` | `SfHelpers.setDefaultOrg()` (`sf config set target-org`) | `table` |
| `data query <soql>` | `DataService.query()` | `SfHelpers.query()` (`sf data query`) | *(Phase 3 default)* |
| `data export <soql>` | `DataService.export()` | `SfHelpers.bulkExport()` (`sf data export bulk`) | `csv` / `xlsx` → file |
| `<group> <verb>` | `…Service.…()` | `SfHelpers.…()` (`sf …`) | *(Phase 3 default)* |

   Every helper's `sf` command/flags trace to a `sf-cli-reference/` section (`@rules/sf-cli.md`) — no invented flag. **If `sfdx-project`**: add the `deploy` / `retrieve` rows (`SfProjectCommands.deployStart()` / `retrieveStart()` → `sf project deploy start` / `sf project retrieve start`, `@rules/sfdx-project.md`).

3. **Error model** — the `Result<T>` contract in `src/types.ts` (`ok: true; data` | `ok: false; error: { kind: "error" | "warning"; message; detail? }`) plus the named errors in scope in `src/errors.ts`: `SfCliNotFoundError`, `SfCommandError`, `ValidationError` (+ `ProjectNotFoundError` in `sfdx-project` mode). State the **exit-code mapping at the boundary** (`@rules/cli.md`, `@rules/errors.md`): thrown errors via the single `toExitCode` (`ValidationError`/commander usage → `2`, else `1`); returned `Result` failures via the fixed `warning → 0` / `error → 1`; success → `0`. `process.exit` only in `cli.ts`; global `uncaughtException` / `unhandledRejection` handlers mandatory.

4. **Config keys table** — the `AppConfig` cascade (`@rules/config.md`): each key, its `.env` variable, its global CLI flag, type, and default:

| Key | `.env` | CLI flag | Type | Default |
| --- | ------ | -------- | ---- | ------- |
| `targetOrg` | `SF_TARGET_ORG` | `--target-org` | string | `sf` default |
| `exportDir` | `EXPORT_DIR` | `--export-dir` | string | `exports` |
| `apiVersion` | `SF_API_VERSION` | `--api-version` | string | `sf` default |
| `pageSize` | `SF_PAGE_SIZE` | `--page-size` | positive int | `2000` |
| `logLevel` | `LOG_LEVEL` | `--log-level` | pino level | `info` |
| `sfPath` | `SF_CLI_PATH` | `--sf-cli-path` | absolute path | `PATH` |

   Non-secret only — `sf` owns credentials in the OS keychain; the tool stores at most a non-secret alias (`@rules/security.md`). `.env` is loaded natively (`process.loadEnvFile()`), no `dotenv`.

5. **Coupling mode** — `standalone` or `sfdx-project` (fixed in Phase 1), materialized as `COUPLING_MODE` in `config.ts`. **If `sfdx-project`**: the project detection is part of the contract — `detectSfdxProject(process.cwd())` resolved once at startup in `cli.ts`, a missing/invalid `sfdx-project.json` → fatal `ProjectNotFoundError` + non-zero exit; `.forceignore` delegated to `sf`; the default package directory read from `packageDirectories` (never hardcoded). File: `src/sf/project.ts` (`@rules/sfdx-project.md`).

6. **Output formatters in scope** — which of `json` / `csv` / `xlsx` / `table` ship (from Phase 1/3), each a file in `src/output/` behind the single `formatOutput(rows, { format, destination })` dispatch. `output/` imports only `types` (pure presentation, no `sf`/service dependency). `xlsx` requires a file destination (`@rules/output.md`).

7. **Source → test mapping** (only if tests enabled in Phase 1) — each source module → its `test/…test.ts` file, mirroring `src/` (`@rules/tests.md`): `test/sf/runner.test.ts` (mock `cross-spawn`), `test/sf/helpers.test.ts` (fake `SfRunner`), `test/services/*.service.test.ts` (fake `SfHelpers`), `test/output/*.test.ts`, `test/config.test.ts` (+ `test/sf/project.test.ts` in `sfdx-project` mode).

**Frozen calibration** — restate the batch count fixed after Phase 2 (`## CALIBRATION` in `CLAUDE.md`): Small = **3** batches (**4** with tests) · Medium/Large = **4** batches (**5** with tests). Map the batch contents from `@rules/architecture.md`: Batch 1 = `types` + `errors` + `config` + `src/sf/` (runner + helpers, + `project.ts` if sfdx) + `src/output/`; the business layers next (`services` then `commands`, split for Medium/Large); the last batch = `cli.ts` + `logger.ts` + root configs + `package.json` + README + `CLAUDE.md` + `.claude/settings.json`; the test batch last (if tests). The `sf` runner + helpers ship in **Batch 1** (no dedicated Salesforce batch).

**→ Validation required. This contract is locked.**

Any deviation (merge, split, rename, addition, or removal of a file, a command, a service, an `sf` helper, an output formatter, a config key, or a library) requires:

1. Stop.
2. Declare the deviation + justification.
3. Validation before resuming.

**Blocking rule**: do not deliver Batch 1 until validation is explicit.

## Write the spec

Once validated, write the full contract to `docs/specs/04-architect.md` (in the user's language). This file is the **locked source of truth** re-read by `/sf-node-p5-development`, `/sf-node-load-project`, `/sf-node-show-contract`, `/sf-node-add-feature`, and `/sf-node-refactor-code`.

→ Chain to `/sf-node-p5-development` after validation.
