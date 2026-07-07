---
name: sf-node-p5-development
description: Phase 5 of the sf-node generation cycle — development and batch delivery, files written directly to disk, executable verification (install/typecheck/lint/build/smoke), final README + CLAUDE.md + .claude/settings.json.
model: sonnet
---

# /sf-node-p5-development — Batch development

## Role
Senior Node.js/TypeScript developer — build the contracted CLI tool to a clean, buildable state.

## Goal
Deliver the tool in batches, each typecheck/lint/build-clean and contract-compliant, ending with install/run instructions and a verified build.

## Deliverable
The full project source on disk + `README.md` + `CLAUDE.md` + `.claude/settings.json` + a verified build.

---

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 5/5 — Development; (2) progress line: Scoping ✓ · Features ✓ · Interface ✓ · Architecture ✓ · ▶ Development; (3) intent in italics: Deliver the tool in batches. Use the short label `Interface` in the progress map. See `## PIPELINE` in `CLAUDE.md`.

## Code rules

At start, read and fully apply: `@rules/architecture.md` · `@rules/cli.md` · `@rules/sf-cli.md` · `@rules/errors.md` · `@rules/config.md` · `@rules/security.md` · `@rules/logging.md` · `@rules/output.md` · `@rules/sfdx-project.md` (if coupling mode = `sfdx-project`) · `@rules/tests.md` (if tests) · `@rules/verification.md` (not auto-imported). Read `docs/specs/04-architect.md` — the **locked contract** this build follows. Verify every `sf` command/flag against `sf-cli-reference/` **by section** (`INDEX.md` first, then the matching capability file) — never invent one.

Critical reminders:
- ESLint clean · Prettier · TypeScript strict · TSDoc on classes and public API. Zero `// TODO`, zero unjustified empty implementation, zero unjustified `any` (external data — `sf --json`, files, args, env — is `unknown` then validated).
- **Layering** (`@rules/architecture.md`): `commands` (thin adapters: parse/validate flags → call one service → format) → `services` (business logic, returns `Result<T>`) → `sf` (process execution) + `output` (formatting); `cli.ts` the only composition root. No layer skips another; a command never spawns `sf`, a service never formats.
- **`sf` runner** (`@rules/sf-cli.md`): every `sf` call via `src/sf/runner.ts` using **`cross-spawn`** with an args array (`--json` appended) — never `node:child_process`, never a concatenated shell string, never a spawn from `commands`/`services`. Binary resolved from `SF_CLI_PATH` / `sfPath` else `PATH` (cross-OS, no platform branch); `ENOENT` → a clear "sf not found" error. `sf` v2 only, never `sfdx`.
- **Error contract** (`@rules/errors.md`): library layers return `Result<T>` or raise a named error; the command maps a failed `Result` to `stderr` + exit code (`error → 1`, `warning → 0`); `cli.ts` maps thrown errors via `toExitCode`. Global `uncaughtException` / `unhandledRejection` handlers mandatory.
- **CLI I/O** (`@rules/cli.md`): `stdout` = data only (pipeable); `stderr` = logs + human messages. Exit codes `0`/`1`/`2` mapped at the boundary; `process.exit` only in `cli.ts` (a command sets `process.exitCode`).
- **Output** (`@rules/output.md`): every dataset through `formatOutput(...)`; no `console.log(JSON.stringify(...))`; `xlsx` to a file only.
- **Logging** (`@rules/logging.md`): `src/logger.ts` (pino → file + `stderr`); zero `console.log`/`console.error` in delivered code; never log a token/secret; pino order is `(object, message)`.
- **Secrets** (`@rules/security.md`): `sf` owns credentials in the OS keychain; a non-secret alias at most in `.env`; a path built from input is resolved + confined under `exportDir`; no `eval`/`vm` on untrusted input.
- No library that was not validated in Phase 1.

## Anti-patterns — what NOT to do

- **Do not** deviate from `docs/specs/04-architect.md` silently — any structural change triggers the deviation protocol (stop, declare, validate) from `@rules/architecture.md`.
- **Do not** weaken a security rule to make something work (`@rules/security.md`) — args array via `cross-spawn`, validated `unknown` input, confined paths, no token stored/logged.
- **Do not** spawn `sf` from a command or a service, build the `sf` args as a shell string, or expose `sf`'s raw `--json` as the public output (emit the tool's `--format json` DTO).
- **Do not** call `process.exit` outside `cli.ts`, write data to `stderr` or a log to `stdout`, or `console.log` a dataset.
- **Do not** leave a `// TODO`, an empty body, or a placeholder. Each batch is complete and self-contained.
- **Do not** introduce a library, or an `sf` command/flag not in the contract / not traceable to `sf-cli-reference/`.
- **Do not** mark the work done while `@rules/verification.md §A` is failing (see Verification).

## Delivery

- Write to the project root chosen at the start of the flow (via `/sf-node-app` or `/sf-node-p1-scoping`); if it was not set in this flow, ask for it once: `Destination folder for the files? (e.g. C:\projects\my-tool)`.
- Create the folders and write the files **directly to disk** — no manual action required.
- Announcement (in the user's language): `Batch N/[total] — [content]`.
- Automatic chaining between batches without confirmation.
- Batch split: the tables in `@rules/architecture.md` (Small 3 / Medium-Large 4, frozen in Phase 2; +1 test batch if tests). The **`sf` runner + helpers ship in Batch 1** (the core the services build on); the starter `org` / `data` command groups + their thin services ship with the services/commands batch. In `sfdx-project` mode, `src/sf/project.ts` ships in Batch 1 and the `deploy` / `retrieve` groups with the commands batch.

## Verification

Apply `@rules/verification.md` — both the executable commands (§A, blocking when the env is available) and the static integrity checks (§B). Silent — reported only on a discrepancy. Cross-file checks run on the last batch.

## Last batch — mandatory extra deliverables

- **`src/cli.ts`** (+ **`src/logger.ts`**, the pino setup — `@rules/logging.md`) with the strict composition order (`@rules/architecture.md`, `@rules/cli.md`): global `uncaughtException` / `unhandledRejection` handlers first → `process.loadEnvFile()` (guarded) → `resolveConfig()` → `configureLogger()` → build the `commander` program (`.name` / `.description` / `.version(APP_VERSION)` / `.exitOverride()` / `configureOutput` errors → `stderr`) → `SfRunner` → `SfHelpers` → services → register command groups → `parseAsync` in a `try/catch` mapping the outcome to an exit code. **If `sfdx-project`**: `detectSfdxProject(process.cwd())` at startup, fatal `ProjectNotFoundError` if absent.
- **`package.json`** + the root configs per `@rules/config.md`: `tsconfig.json` (strict, `moduleResolution: "bundler"`, extensionless imports), `tsup.config.ts` (bundle `src/cli.ts` → `dist/cli.js`, esm, `target: node24`, shebang, `clean`), `eslint.config.mjs` (flat config), `.prettierrc`, `.env.example` (non-secret keys only), `.gitignore` (`node_modules/`, `dist/`, `logs/`, `.env`, `exports/`). `"type": "module"`, `bin → dist/cli.js`, caret-pinned dependencies matching the Phase 1 selection; the `"test"` script only if tests enabled.
- **`README.md`** at the root (`@rules/readme.md`): objective · commands & subcommands (positional args / flags, exit codes) · stack & dependencies · file tree · config keys (`.env` variables + CLI flags) · **Salesforce prerequisite** (cross-OS `sf` v2 install + `SF_CLI_PATH` fallback + the coupling mode this tool was generated for: `standalone` or `sfdx-project`) · output formats (`json` / `csv` / `xlsx` / `table`) · install & run (`npm install`, `npm run build`, `node dist/cli.js …`) + a **scheduling note** (cron / Windows Task Scheduler: redirect `stdout` → a data file, `stderr` → a log, the exit code drives success/failure alerting) + the `npm audit` reminder.
- **`CLAUDE.md`** at the generated project root (in the user's language), recording the tool's identity for future sessions:

  ```markdown
  # [nom-outil]

  ## Origin
  Framework: sf-node v1.0.0

  ## Business context
  [What the tool does — synthesized from docs/specs/02-featuring.md: objective + key commands. Coupling mode: standalone | sfdx-project.]

  ## Deviations from the framework
  - None
  ```
  `[nom-outil]` = the tool name (`APP_NAME`). The version is the one declared at the top of the framework `CLAUDE.md` (currently 1.0.0). Replace the `Deviations` list with every deviation validated via the Phase 4/5 deviation protocol (`- [deviation] — reason: [justification]`); if none, keep `- None`.
- **`.claude/settings.json`** at the generated project root so the tool stays self-enforced in later maintenance sessions:

  ```json
  {
    "permissions": {
      "allow": ["Bash(npm:*)", "Bash(npx:*)", "Bash(node:*)", "Bash(sf:*)", "Read", "Write", "Edit"],
      "deny": ["Read(**/.env)", "Read(**/.env.*)", "Write(**/.env)", "Write(**/.env.*)", "Edit(**/.env)", "Edit(**/.env.*)", "Read(**/secrets/**)", "Write(**/secrets/**)", "Write(**/node_modules/**)", "Write(**/dist/**)"]
    },
    "hooks": {
      "Stop": [{ "hooks": [{ "type": "command", "command": "npm run lint" }] }]
    }
  }
  ```
  The `Stop` hook runs the fast static check (`npm run lint`) at the end of each turn; `Bash(sf:*)` lets a maintenance session verify flags with `sf <command> --help`. Note in the README that the user can tune or remove the hook.
- Confirm `docs/specs/` is present and consistent with the delivered code.

## Test batch — only if Phase 1 tests = Yes

Add a final dedicated batch: announce `Batch [final]/[total] — test/ + dev dependencies`. Deliver `test/` mirroring `src/` (per `@rules/tests.md`: mock `cross-spawn` in the runner test, a fake `SfRunner` for the helpers, a fake `SfHelpers` for the services, formatter shape tests, the `resolveConfig` cascade test — **French test names**, no real `sf` / network / filesystem), the optional `vitest.config.ts`, the dev dependency `vitest`, and the `"test": "vitest run"` script. Append the `npm test` instruction to the README.

## Executable verification (last batch — blocking when the env allows)

Run `@rules/verification.md §A` in order and quote the relevant output as proof:

```
npm install                  # dependencies resolve
npm run typecheck            # tsc --noEmit — clean
npm run lint                 # eslint (flat config) — clean
npm run build                # tsup → dist/cli.js (shebang, executable)
npm test                     # vitest run — only if tests enabled; else skip (do NOT scaffold a suite)
node dist/cli.js --help      # smoke — prints usage, exit 0
node dist/cli.js --version   # smoke — prints the version, exit 0
```

- A non-zero exit or any reported error is **blocking** — fix the root cause (never silence the rule), re-run until clean.
- **Smoke scope**: `--help` / `--version` exercise the commander wiring and the composition root **without an org**. The **full** smoke of real `sf` operations (a live `sf data query`, `sf project deploy`) needs an **authenticated org** reachable through `sf` — that is **out of automatic scope**. State it explicitly to the user; never fake it.
- If Node/npm is **not** available, say so plainly, fall back to the static checks (§B), and list the commands the user must run before considering the work verified. Never claim a clean typecheck/build you could not run.

## Final delivery summary

Once the last batch (plus the test batch if any) is delivered, close Phase 5 with a **delivery summary** in the user's language. **Make every file and the project folder a clickable Markdown link** `[label](path)`, each path pointing to the real on-disk location under the project root (relative to the project root, or absolute if the project root lies outside the current workspace). **Valid link syntax (mandatory)**: a Markdown link destination cannot contain spaces unless wrapped in angle brackets — when the path contains spaces (typical of absolute Windows paths), wrap the destination in `<…>` and use forward slashes, e.g. `[README.md](<D:/Documents/00 Mes Documents/.../my-tool/README.md>)`. Without spaces, a plain relative path is fine. List:

- **Project folder** — the project root (clickable).
- **README.md** — how to run, stack, tree, config keys, the Salesforce prerequisite (clickable).
- **Generated `CLAUDE.md`** — the tool identity for future sessions (clickable).
- **Documentation — phase specs** — one clickable link each: `docs/specs/01-scoping.md`, `docs/specs/02-featuring.md`, `docs/specs/03-interface.md`, `docs/specs/04-architect.md` (and the latest `docs/sessions/SESSION_*.md` if one exists).
- **How to run** — the key commands (also in the README):

  ```
  npm install
  npm run build
  node dist/cli.js --help
  ```
  (+ `npm test` if tests enabled.) Plus the **`sf` v2 prerequisite** (reachable via `PATH` or `SF_CLI_PATH`), the coupling mode, and the scheduling note.

The summary points to the documents; it does not restate them.

## Post-delivery adjustments

Isolated fix on the affected file + its direct dependencies. Deliver the complete fixed file. If the change touched a documented aspect (a command, a flag, a config key, the tree, the coupling mode, the stack), refresh the README via the logic of `/sf-node-generate-readme` in the same delivery (`@rules/readme.md`).
After resolving an anomaly: cleanup report (`@rules/architecture.md`) then offer `Do you want to remember this point? /sf-node-save-memory`.
