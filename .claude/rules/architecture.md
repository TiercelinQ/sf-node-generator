# Architecture rules — sf-node CLI (layered)

The generated tool is a **headless Node.js/TypeScript CLI mandatorily coupled to Salesforce** (`sf` v2). It is layered, not MVC: thin command adapters on top, business logic under them, process execution and formatting at the bottom, and a single composition root. Salesforce coupling is always on (`standalone` or `sfdx-project`, chosen in Phase 1).

## Layer → folder mapping

| Layer            | Location            | Content                                                                 |
| ---------------- | ------------------- | ----------------------------------------------------------------------- |
| Commands         | `src/commands/`     | Thin adapters: parse flags → call one service → format the result       |
| Services         | `src/services/`     | Business logic — orchestrates `sf/`, shapes DTOs, returns `Result<T>`    |
| Salesforce       | `src/sf/`           | Process execution — `cross-spawn` `sf …`, defensive parse — `@rules/sf-cli.md` |
| Output           | `src/output/`       | Formatters — `json` · `csv` · `xlsx` · `table` → stdout / file — `@rules/output.md` |
| Composition root | `src/cli.ts`        | `commander` bootstrap, registers commands, maps `Result`/errors → exit code — `@rules/cli.md` |
| Shared           | `src/config.ts`, `src/logger.ts`, `src/types.ts`, `src/errors.ts` | Defaults, `pino`, `Result<T>` + DTOs, named errors — importable by all |

## Responsibilities

### Commands — `src/commands/`
- One file per command group: `<group>.ts` (starter scaffold: `org.ts`, `data.ts`). Each exports a `register<Group>Commands(program)` that declares its subcommands (`.command`, `.description`, `.option`, `.action`).
- The `.action` does three things only: read/validate flags (raise `ValidationError` on bad input — `@rules/errors.md`), call **one** service, then hand the returned data to an `output/` formatter (data → stdout/file) or report the failed `Result` to stderr and set the exit code.
- **Forbidden**: business logic, a direct `sf`/`cross-spawn` call (go through a service), `console.log`, and `process.exit` (set `process.exitCode` or let a thrown named error reach the `cli.ts` boundary). CLI surface detail: `@rules/cli.md`.

### Services — `src/services/`
- One file per domain: `<domain>.service.ts`. Pure Node + TypeScript business logic. A class (or functions) that receives the injected `SfHelpers` (`@rules/sf-cli.md`), orchestrates them, applies the domain rules, and returns `Result<T>` (or raises a named error from `src/errors.ts`).
- **Forbidden**: importing `commander`, touching `process.exit` / `process.argv` / `process.stdout`, and formatting output. A service returns typed DTOs; the command formats them. Tolerated: importing `sf/`, `config`, `logger`, `types`, `errors`.

### Salesforce — `src/sf/`
- `runner.ts`: the `SfRunner` class — the single `sf` entry point and the **only place the whole tool spawns a process**. `run<T>(args)` calls `cross-spawn(bin, [...args, "--json"])`, parses the envelope defensively, and returns `Result<T>` (mapping `ENOENT`/non-zero status to a `Result` error, or a named `SfCliNotFoundError`/`SfCommandError` where a caller prefers to raise). Never a concatenated shell string, never `node:child_process` directly. `helpers.ts`: the `SfHelpers` class — typed helpers (`listOrgs`, `query`, …) on top of the runner, each `argv` **verified against `sf-cli-reference/`**, never invented; injected into the services. `project.ts`: `sfdx-project` mode only — `@rules/sfdx-project.md`.
- **Forbidden**: any CLI concern (no `commander`, no `process.exit`, no reading `process.argv`, no formatting). `sf/` is reusable outside a CLI context. Detail + the full runner: `@rules/sf-cli.md`.

### Output — `src/output/`
- `index.ts` dispatches on the chosen format to `csv.ts` · `xlsx.ts` · `table.ts` (JSON is inline `JSON.stringify`), writing to an explicit destination (`stdout` | a file path). Every user-facing dataset goes through here — no ad-hoc `console.log(JSON.stringify(...))` in a command.
- **Forbidden**: any `sf`/business dependency. `output/` imports only `types` (the DTOs it renders). It is a pure presentation layer. Detail: `@rules/output.md`.

### Composition root — `src/cli.ts`
- The bin entry (shebang, bundled to `dist/cli.js` by tsup). The **only** place that bootstraps `commander`, registers every command group, installs the global `uncaughtException`/`unhandledRejection` handlers, and owns the exit-code mapping (`0`/`1`/`2`). The **only** place `process.exit` is called. Detail: `@rules/cli.md` · `@rules/errors.md`.

### Shared — `config.ts` · `logger.ts` · `types.ts` · `errors.ts`
- `types.ts`: `Result<T>` (owned + quoted by `@rules/errors.md`) and the DTOs (`OrgInfo`, `QueryResult`, `OutputFormat`, …). Zero logic.
- `errors.ts`: named error classes, each with a fixed `name` (`SfCliNotFoundError`, `SfCommandError`, `ValidationError`, `ProjectNotFoundError`). Zero IO.
- `config.ts`: typed defaults + `resolveConfig()` (cascade `defaults < .env < CLI flags`, non-secret only) — `@rules/config.md`.
- `logger.ts`: the `pino` instance (file + `stderr`) — `@rules/logging.md`.
- All four are importable by **every** layer and import nothing from `commands`/`services`/`sf`/`output` (zero upward import).

## Unidirectional imports

```
src/cli.ts  (composition root — the only commander bootstrap, the only process.exit)
   └─▶ commands/ ──▶ services/ ──▶ sf/          business logic → process execution
              └───▶ output/                     commands format the returned data → stdout / file

config.ts · logger.ts · types.ts · errors.ts    ◀── importable by ALL layers (never import upward)
```

- The chain is strict: `cli → commands → services → sf`. Commands additionally import `output/` to render a service's returned DTOs. No layer skips another (a command never calls `sf/` directly; a service never formats).
- `output/` depends only on `types` (no `sf`, no service). `sf/` depends only on `config`/`logger`/`types`/`errors` (no CLI). `services/` never import `commander` and never call `process.exit`.
- The `Result<T>` contract flows **upward**: `sf/` and `services/` return it (or raise a named error); `commands/` read `result.ok`; `cli.ts` maps a failure to an exit code. Definition and escalation: `@rules/errors.md`.
- One domain = one service + one command group at most. Any constant reused across files lives in `config.ts`; any shared type in `types.ts`.

## Generated reference tree

```
<project>/
├── package.json            # "type":"module", bin, scripts (dev/build/typecheck/lint/format/test)
├── tsconfig.json           # strict, moduleResolution "bundler"
├── tsup.config.ts          # bundle src/cli.ts → dist/cli.js (shebang)
├── eslint.config.mjs · .prettierrc
├── .env.example  .gitignore
├── README.md · CLAUDE.md · .claude/settings.json
├── docs/specs/             # 01-scoping … 04-architect
├── src/
│   ├── cli.ts              # bin entry: commander program, registers commands, maps Result→exit code
│   ├── config.ts           # typed defaults + resolveConfig() — @rules/config.md
│   ├── logger.ts           # pino — @rules/logging.md
│   ├── types.ts            # Result<T>, DTOs (OrgInfo, QueryResult…)
│   ├── errors.ts           # named error classes
│   ├── sf/
│   │   ├── runner.ts       # cross-spawn sf [...args,--json] → Result<T> — @rules/sf-cli.md
│   │   ├── helpers.ts      # typed helpers (verified vs sf-cli-reference/) — @rules/sf-cli.md
│   │   └── project.ts      # sfdx-project mode — @rules/sfdx-project.md
│   ├── services/           # <domain>.service.ts — business logic
│   ├── commands/           # <group>.ts — thin adapters (starter: org.ts, data.ts)
│   └── output/             # index.ts (dispatch) + csv.ts + xlsx.ts + table.ts — @rules/output.md
├── scripts/                # standalone one-off scripts (if execution shape includes them)
└── test/                   # vitest (if enabled), mirrors src/
```

- `project.ts` ships only in `sfdx-project` coupling mode (`@rules/sfdx-project.md`); in `standalone` mode `src/sf/` is `runner.ts` + `helpers.ts`.
- `scripts/` exists only when the execution shape (Phase 3) includes standalone one-off scripts; `test/` only when tests were enabled in Phase 1.

## `cli.ts` composition sequence (non-negotiable)

```ts
// src/cli.ts — order matters: logger and handlers first, then runner → helpers → services → command groups.
import { Command } from "commander";
import { log } from "./logger";
import { SfRunner } from "./sf/runner";
import { SfHelpers } from "./sf/helpers";
import { OrgService } from "./services/org.service";
import { DataService } from "./services/data.service";
import { registerOrgCommands } from "./commands/org";
import { registerDataCommands } from "./commands/data";

process.on("uncaughtException", (err) => { log.error({ err }, "uncaughtException"); process.exit(1); });
process.on("unhandledRejection", (reason) => { log.error({ err: reason }, "unhandledRejection"); process.exit(1); });

const program = new Command();
program.name("mytool").description("Headless Salesforce automation CLI");

const sf = new SfHelpers(new SfRunner());                            // runner → helpers, the only owner of the runner
registerOrgCommands(program, { orgService: new OrgService(sf) });   // each group registers its subcommands + delegates to a service
registerDataCommands(program, { dataService: new DataService(sf) });

await program.parseAsync(process.argv);   // parse → run → the boundary maps the outcome to an exit code
```

- The global handlers are installed **first** (before parsing) so a throw during a command never crashes silently or leaks a stack to stdout. Composition is unidirectional: `SfRunner` → `SfHelpers` → services → command groups. Full bootstrap (exit-code mapping, `exitOverride`, stdout/stderr discipline): `@rules/cli.md`.

## Batch delivery

Sizing is frozen after Phase 2 (`## CALIBRATION` in `CLAUDE.md`). The layered order ships the core (types/errors/config/`sf`/`output`) first, the business layers next, the composition root last.

**Small project (3 batches):**

| Batch | Content                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------- |
| 1     | `src/types.ts` + `src/errors.ts` + `src/config.ts` + `src/sf/` (runner + helpers, `project.ts` if sfdx) + `src/output/` |
| 2     | `src/services/` + `src/commands/` (starter `org.ts`, `data.ts`)                                           |
| 3     | `src/cli.ts` + `src/logger.ts` + root configs (`tsconfig.json`, `tsup.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.env.example`, `.gitignore`) + `package.json` + README + `CLAUDE.md` + `.claude/settings.json` + install instructions |

**Medium / Large project (4 batches):** split the business layers so each ships on its own (services are the core, commands wire them).

| Batch | Content                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------- |
| 1     | `src/types.ts` + `src/errors.ts` + `src/config.ts` + `src/sf/` + `src/output/`                            |
| 2     | `src/services/`                                                                                            |
| 3     | `src/commands/`                                                                                            |
| 4     | `src/cli.ts` + `src/logger.ts` + root configs + `package.json` + README + `CLAUDE.md` + `.claude/settings.json` + install instructions |

> **Salesforce integration (mandatory)** — no dedicated batch. `src/sf/runner.ts` + `src/sf/helpers.ts` (the runner and the starter set of typed `sf`-command helpers) ship in **Batch 1** — they are the core the services build on. The starter CLI command group `commands/org.ts` (+ `data.ts`) and their thin services ship with the services/commands batch (Batch 2 Small · Batch 2-3 Medium/Large). The coupling mode (`standalone` | `sfdx-project`) and the `output/` formatters add files and push the size up. See `@rules/sf-cli.md` · `@rules/sfdx-project.md`.

### Tests batch (only if Phase 1 tests = Yes)
Add a final dedicated batch — `test/` (mirroring `src/`) + `vitest.config.ts` + dev dependencies (`vitest`) + the `"test"` script. → Small 4 batches / Medium-Large 5 batches. Patterns and coverage: `@rules/tests.md`.

### Delivery format
- Announcement: `Batch N/[total] — [content]`.
- Files written directly to disk, complete and self-contained blocks.
- Automatic chaining between batches without confirmation.
- Last batch: install/run instructions (`npm install`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`) + the `sf` v2 prerequisite note (`@rules/sf-cli.md`) + `README.md` at the root (`@rules/readme.md`).

## Integrity verification

Per-batch and cross-file integrity checks (layer responsibilities, unidirectional imports, `Result<T>` flow, exit-code mapping at the boundary, stdout/stderr discipline, contract) live in **`@rules/verification.md`** — the single source of truth for verification. Run them silently every batch; report only on a discrepancy. Cross-file checks (all inter-layer imports resolved, every command group registered in `cli.ts`, the contract in `docs/specs/04-architect.md` respected) run on the last batch.

## Anti-patterns — what NOT to do

- **Do not** put business logic in a command or a formatter. Commands parse + delegate + format; services own the logic; `sf/` owns the process; `output/` renders.
- **Do not** call `sf`/`cross-spawn` from a command or a service module other than `src/sf/` — every `sf` call goes through `src/sf/runner.ts` (`@rules/sf-cli.md`).
- **Do not** import `commander`, read `process.argv`, or call `process.exit` from a `service`, `sf`, or `output` module — those are CLI concerns owned by `commands/` (set the exit code) and `cli.ts` (call `process.exit`).
- **Do not** let `output/` import `sf/` or a service, or let `sf/` import a CLI concern — keep the bottom layers dependency-clean.
- **Do not** skip a layer (a command reaching into `sf/`, a service formatting output) — the chain is `cli → commands → services → sf`, with `commands → output` for rendering.
- **Do not** `console.log` a dataset — route every user-facing dataset through an `output/` formatter with an explicit destination (`@rules/output.md`).
- **Do not** spread one domain across more files than `service + command group`. If it grows, that is a contract change → declare the deviation (Phase 4 protocol).
- **Do not** put a shared constant in a single layer — promote it to `config.ts`; a shared type to `types.ts`.
- **Do not** invent an `sf` command or flag from memory — verify against `sf-cli-reference/` (`@rules/sf-cli.md`).

## Anomaly resolution — cleanup protocol

When an anomaly needs several attempts, once the definitive fix is delivered produce a mandatory cleanup report:

```
Anomaly resolved. Elements to remove from the previous attempts:

File [name]:
- [line / block / import / flag / service call / exit-code branch to delete]
- ...
```

- List only the elements added during the failed attempts that are no longer needed.
- Cover all affected files: TS sources, root configs, `package.json`.
- Deliver the complete cleaned files if the user confirms.
- Then offer: "Do you want to remember this point? `/sf-node-save-memory`"

## Deletions

Total deletion across all files: code, imports, a command/subcommand (its `.command` registration + `.action` + the service it called if now orphaned), flags, types, exit-code branches. Forbidden: commented-out code, empty implementations, residue. Deliver the complete modified files.
