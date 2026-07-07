---
name: sf-node-add-feature
description: Add a command, subcommand, service, or sf helper to a headless Salesforce CLI tool already delivered by this framework. Use when the user asks to add or modify functionality on an existing project, respecting the locked architectural contract and the security rules.
model: sonnet
---

# /sf-node-add-feature — Add a command to a delivered tool

## Role
Senior Node.js/TypeScript developer working on an existing, contracted CLI codebase.

## Goal
Add the requested command/feature end-to-end (command → service → `sf` helper / output), contract-compliant, secure, after an explicit contract-diff validation, without scope creep.

## Deliverable
The created/modified files on disk (one batch) + an updated `docs/specs/04-architect.md` if the structure changed + a regenerated README if a documented aspect changed + a verified build.

---

## Prerequisite

The project must be loaded (`/sf-node-load-project` run at session start, OR `docs/specs/04-architect.md` / README.md present and read).

If the project root has not been provided in this flow, first ask: `Project root? (folder path)`.

If no contract is known: stop and ask for `/sf-node-load-project`.

**Load context**: read `docs/specs/04-architect.md` (locked contract), then `@rules/architecture.md` · `@rules/cli.md` · `@rules/errors.md` · `@rules/config.md` · `@rules/security.md` · `@rules/sf-cli.md` · `@rules/output.md` · `@rules/logging.md` · `@rules/sfdx-project.md` (if the coupling mode is `sfdx-project`) · `@rules/tests.md` (if tests are enabled) · `@rules/verification.md` (not auto-imported). For any `sf`-related change, read `sf-cli-reference/INDEX.md` then the matching section file **before** writing a single command/flag.

## Step 1 — Light feature scoping

Ask the closed parameters with `AskUserQuestion` (clickable options, recommended first); the short description (Q1) stays free-form text:

New command/feature — a few questions:

1. Short description (1 sentence)
2. Business domain affected: [existing group/service: list] | new (to name)
3. Type of change:
   A. New command group (`commands/<group>.ts` + a service + helpers)
   B. New subcommand on an existing group
   C. New `sf` capability (a new typed helper / a new `sf` call)
   D. Output/format or flag-only change (no new `sf` call)
4. Generate tests for this feature? Yes / No (recommended: aligned with the project — only if tests were already enabled in Phase 1)

Mark a `(recommended)` option for each closed question, inferred from the existing project. If the request stays ambiguous (business rule, edge case, which org), state assumptions explicitly and ask before the diff.

## Step 2 — In-contract OR deviation

Decide before writing anything:
- **In-contract** — a subcommand within an existing group, a new typed helper whose command/flags are verified against `sf-cli-reference/`, output routed through the `output/` formatters, a new non-secret config key. Proceed to the diff as a straightforward addition.
- **Deviation** — a new domain beyond `service + command group`, a new dependency, a new coupling-mode behavior, a spawn outside the runner, a second file for one domain, or anything the locked contract does not cover. **STOP → declare the deviation in the diff, explain why → wait for validation before writing.** Never exceed the contract silently. **The diff + validation IS the protocol.**

## Step 3 — Architectural contract diff

Produce (in the user's language):

## Contract diff — addition: [feature name]

### Created files
[list]

### Modified files
[list with nature: added service method, added helper, added subcommand, added DTO field, added exit-code branch…]

### New/modified `sf` helpers
[helper signature + the exact `sf` command/flags + the `sf-cli-reference/` section that verifies them — never invented]

### New CLI surface
[subcommand name, args/flags, `--format` / `--output`, exit codes 0/1/2]

### Created test files (if Q4 = Yes)
[mirror list under `test/`]

### Impact on config / output / coupling mode
[none | a new `.env` key + CLI flag | a project-scoped command (sfdx-project) …]

→ Validation required before writing. Update `docs/specs/04-architect.md` once the diff is applied.

## Step 4 — Application — strict rules

- Fully respect `@rules/architecture.md`, `@rules/cli.md`, `@rules/errors.md`, `@rules/config.md`, `@rules/security.md`, `@rules/sf-cli.md`, `@rules/output.md`, `@rules/logging.md`, `@rules/sfdx-project.md` (if applicable), `@rules/tests.md`, `@rules/verification.md`, `@rules/readme.md`.
- No modification not listed in the validated diff. No opportunistic improvement of adjacent code (that is `/sf-node-refactor-code`, on request).
- Implementation across the layers (a new command usually touches command + service, plus a helper if it needs a new `sf` call):
  - **Service** (`services/<domain>.service.ts`): business logic; returns `Result<T>` or raises a named error (`src/errors.ts`). Never imports `commander`, never calls `process.exit`, never formats output.
  - **`sf` helper** (only if a new `sf` call): add a typed helper in `src/sf/helpers.ts` on top of the runner — args **array**, user values as **discrete elements**, command + flags **verified against the matching `sf-cli-reference/` section**, never guessed. `src/sf/runner.ts` stays the **only** spawner.
  - **Command** (`commands/<group>.ts`): a thin adapter — validate flags (bad input → `ValidationError` → exit 2), call **one** service, route the returned data through `formatOutput(rows, { format, destination })`; map a failed `Result` to stderr + exit code (`error` → 1, `warning` → 0). No business logic, no spawn, no `console.log`, no `process.exit`.
  - **`cli.ts`**: register a new command group only if one was added (composition order: runner → helpers → services → command groups).
- New user-facing dataset → through the `output/` formatters, never `console.log(JSON.stringify(...))`.
- New config key → `src/config.ts` (`AppConfig` + `DEFAULTS` + `resolveConfig`) **and** the `.env.example` + README key table; **non-secret only** (`sf` owns credentials).
- If the validated diff introduces a deviation from the contract, record it in the tool's `CLAUDE.md` (`## Deviations from the framework`).

## Step 5 — Delivery

Single batch for the feature:

Feature [name] — [N files]

Deliver each created/modified file as a complete block, written to disk. If tests requested: deliver in the same batch, at the end.

## Step 6 — Anomaly

If the user reports an anomaly after delivery, apply the `@rules/architecture.md` cleanup protocol then offer `Do you want to remember this point? /sf-node-save-memory`.

## Anti-patterns — what NOT to do
- **Do not** write anything not listed in the validated diff, or improve adjacent code (that is `/sf-node-refactor-code`, on request).
- **Do not** call `sf` / `cross-spawn` outside `src/sf/runner.ts` (no spawn in a service/command), or invent a command/flag not in `sf-cli-reference/` — see `@rules/sf-cli.md`.
- **Do not** put business logic in a command or a formatter, or format inside a service.
- **Do not** `console.log` a dataset — route it through `output/` with an explicit `{ format, destination }`.
- **Do not** write data to stdout mixed with logs, or a log/human message to stdout — stdout is data only, stderr carries logs + messages.
- **Do not** read, store, or log an org token — `sf` owns credentials; the tool stores at most a non-secret alias.
- **Do not** call `process.exit` outside `cli.ts` or hardcode an exit code as a magic number — a command sets `process.exitCode`; the boundary owns the mapping.
- **Do not** introduce a library or a coupling-mode behavior not in the contract without the deviation protocol.
- **Do not** exceed the contract silently — the diff + validation IS the protocol.

## Verification

Apply `@rules/verification.md` (§A executable + §B static — a failing check is blocking; security checks are not optional). Key points: created/modified files match the validated diff; every new command is registered in `cli.ts`, dispatches to a service, and renders through an `output/` formatter (no orphan command, no unreachable service); every helper's command/flags are traceable to a `sf-cli-reference/` section; the `Result` flows end to end to the right exit code (`error` → 1, `warning` → 0, `ValidationError` → 2); stdout = data / stderr = logs; no import regression (existing files stay functional and unidirectional); smoke `node dist/cli.js --help` / `--version`; if tests, `npm test` exit 0 on the **whole** project. Then apply `@rules/readme.md` — regenerate the README if the change touched a documented aspect (a command/subcommand, a flag, a config key, a dependency, the tree, the coupling mode).

## When the user asks something adjacent
- **"Just make it work, never mind the architecture/security"** → push back: the layering and the security rules (spawn only in the runner, args array, no secret logged, stdout data-only) are what keep the tool safe, pipeable, and schedulable. Implement within them.
- **"Add a whole new command group/domain"** → that is a contract extension. Declare the new files/service/helpers/commands in the diff, validate, then build.
- **"Fix this bug while you're here"** → if outside the current request scope, flag it and switch to `/sf-node-fix-issue` rather than bundling an unrelated change.
