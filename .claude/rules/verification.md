# Verification rules — single source of truth

> Centralized, reusable verification for the whole framework. Referenced by `/sf-node-p5-development`, `/sf-node-add-feature`, `/sf-node-fix-issue`, and `/sf-node-run-tests` — never duplicated in those skills.
> Two parts: **executable verification** (run real commands) and **static integrity** (read the code). Run silently; report only on a discrepancy.

---

## A. Executable verification (run the commands)

When the environment allows it (Node 24 LTS+ and npm available), these commands are **mandatory** and a failure is **blocking** — do not mark work as done while any of them fails. Run them in order:

```
npm install                  # dependencies resolve
npm run typecheck            # tsc --noEmit — MUST be clean
npm run lint                 # eslint (flat config) — clean
npm run build                # tsup — produces dist/cli.js (shebang, executable)
npm test                     # vitest run — only if tests were enabled (Phase 1); else skip — do NOT scaffold a suite
node dist/cli.js --help      # smoke — prints usage, exit 0
node dist/cli.js --version   # smoke — prints the version, exit 0
```

Rules:
- A non-zero exit or any reported error is a failure → fix the root cause, do not silence the rule. Re-run until clean.
- **Smoke scope**: `--help` / `--version` exercise the CLI wiring (commander parse, composition root, exit-0 path) **without an org**. The **full** smoke of real `sf` operations (a live `sf data query`, `sf project deploy`) needs an **authenticated org** reachable through `sf` — that is **out of automatic scope**. State it explicitly to the user; never fake it.
- If tests are enabled, `npm test` is part of the blocking chain (exit 0). If not, skip it — do **not** scaffold a suite to satisfy the step (`@rules/tests.md`).
- If Node/npm is **not** available in the environment, say so explicitly, fall back to the static checks below, and tell the user which commands they must run themselves before considering the work verified. **Never claim a clean typecheck / build you could not run.**
- Quote the relevant command output as proof when reporting completion.

---

## B. Static integrity (read the code)

### Every batch / every change
1. TypeScript compiles (`tsc --noEmit` mentally, then confirmed by §A when the env is available).
2. Imports: all used, none missing, **unidirectional** — `cli.ts → commands → services → sf` / `output`. `output/` imports no `sf/` and no business/service module; `sf/` imports nothing from `commands`/the CLI boundary (no `commander`); `services/` imports no `commander` and never calls `process.exit`. `types.ts` / `config.ts` / `errors.ts` are importable by all layers. See `@rules/architecture.md`.
3. Layer responsibilities: `commands/` are thin adapters (parse flags → call a service → format) with **no business logic**; `services/` hold the logic with **no formatting** and **no `commander`**; process **spawn lives only in `src/sf/runner.ts`**; `process.exit` **only in `cli.ts`**. See `@rules/architecture.md` / `@rules/cli.md` anti-patterns.
4. Zero `// TODO`, zero unjustified empty implementation, zero unjustified `any`, zero `console.log` (logging goes through `src/logger.ts` — `@rules/logging.md`).
5. A global `process.on("uncaughtException")` **and** `process.on("unhandledRejection")` handler is present in `src/cli.ts` (`@rules/errors.md`).
6. **CLI I/O contract**: `stdout` carries **data only** (pipeable); `stderr` carries logs and human messages — respected everywhere (`@rules/cli.md`).
7. Exit-code mapping present at the CLI boundary: `0` success · `1` runtime error · `2` usage/validation error (`@rules/cli.md` / `@rules/errors.md`).

### Last batch only — cross-file
8. Every `Result` is surfaced correctly end-to-end: a failed `Result` / named error reaches `cli.ts` and maps to a `stderr` message + the right exit code — none is swallowed or thrown raw at the user.
9. `commander` commands ↔ services ↔ `output/` formatters wired: every registered command dispatches to a service and renders through a formatter; no orphan command, no service unreachable from a command.
10. Architectural contract (`docs/specs/04-architect.md`) respected — every file, command, and library matches the locked contract, or a declared+validated deviation exists.
11. `docs/specs/` present and consistent with the delivered code.
12. `docs/release/CHANGELOG.md` present, Keep a Changelog-shaped (English), and its top released version equals `package.json` `"version"` (and therefore the derived `src/config.ts` `APP_VERSION` — no separate mirror to check). See `@rules/versioning.md`.

### Per-domain (conditional — see the matching rule for detail)
- **sf-cli** (`@rules/sf-cli.md`): every `sf` call goes through `src/sf/runner.ts` via **`cross-spawn`** with an **args array** (no `node:child_process` direct, no shell, no spawn from `commands`/`services`); the binary is resolved from PATH or the `SF_CLI_PATH` / `sfPath` config (cross-OS, no platform branch); `ENOENT` → a clear error pointing to install / `SF_CLI_PATH`; no token read/stored/logged; every helper's command/flags are traceable to a `sf-cli-reference/` section (no invented `sf` flag); a large text argument (SOQL/SOSL) is routed through `runWithLargeArg` (inline when it fits, temp `--file`/`--query-file` when it would overflow the Windows ~8191-char command line, temp file always removed), and `run()` guards the assembled length, returning a clear error rather than the opaque "Réponse sf illisible".
- **sfdx-project** (`@rules/sfdx-project.md`): if the coupling mode is `sfdx-project`, the project is detected and validated (`sfdx-project.json` read via `src/sf/project.ts`), `.forceignore` respected, and a mode guard prevents `sfdx-project`-only paths from running under `standalone`.
- **config** (`@rules/config.md`): the cascade resolves in order **defaults < `.env` < flags** in a single `resolveConfig()`; no secret in `.env` or `config.ts`.
- **logging** (`@rules/logging.md`): `src/logger.ts` present and conforming (pino → file + `stderr`); zero `console.log` in delivered `src/`; no secret/token logged.
- **progress** (`@rules/progress.md`): `src/progress.ts` present, a shared singleton (`progress`) importing only `logger`, writing **only** to `stderr`; animation gated on `stderr.isTTY && !CI && !debug && --no-progress` unset, degrading to `log.info`/`log.warn` otherwise; `stdout` stays clean when piped (no ANSI/animation leaks); `cli.ts` raises the `pino` level to `warn` while progress is active and auto-disables it under debug logging; the spinner interval is `unref`-ed and the reporter never calls `process.exit`; `output/` does not import `progress`; no new dependency; no `console.*`.
- **output** (`@rules/output.md`): every user-facing dataset goes through an `output/` formatter (`json` / `csv` / `xlsx` / `table`); `xlsx` is written to a **file only** (never dumped to `stdout`).
- **security** (`@rules/security.md`): `cross-spawn` args array (no injectable shell); any path built from input is resolved and checked (no traversal); secrets stay in the `sf` OS keychain — the tool stores at most a non-secret alias.
- **tests** (`@rules/tests.md`): if enabled, each source module has a matching test (Phase 4 mapping) and `npm test` exits 0.
- **versioning** (`@rules/versioning.md`): `docs/release/CHANGELOG.md` present and English; top released version == `package.json` `"version"` (`APP_VERSION` is derived from it — no separate mirror to check); maintenance changes recorded under `[Unreleased]` in the right category; after `/sf-node-release`, `[Unreleased]` reset empty and the cut block carries the right version + date.

---

## C. Reporting

- All clean → one short confirmation line in the user's language (no full recap of the checklist).
- Any discrepancy → name the file, the failing check (§A command output or §B item number), and the fix applied or proposed.
- Verification that could not be run (no Node/npm, or the org-dependent `sf` smoke) → state it plainly and list the commands the user must run.
