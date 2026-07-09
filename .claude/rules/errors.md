# Error handling rules — sf-node CLI

> This rule **owns** the `Result<T>` contract (defined below) and the service → command → boundary escalation. Exit-code mapping and the stdout/stderr surfaces: `@rules/cli.md`. Logging via `pino`: `@rules/logging.md`. The `sf` runner returns `Result`: `@rules/sf-cli.md`.

## `Result<T>` contract

The single type, in `src/types.ts`. Library layers return it; the command reads it; the boundary maps a failure to an exit code.

```ts
// src/types.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: "error" | "warning"; message: string; detail?: string } };
```

- `ok: true` → `data` present, the command formats it (exit `0`).
- `ok: false`, `kind: "error"` → a fatal failure; the command writes `message` to stderr and sets exit `1`.
- `ok: false`, `kind: "warning"` → a non-fatal outcome (e.g. an empty result set); the command writes `message` to stderr and leaves exit `0` — a scheduled job treats it as success.
- `message` is the human-facing summary (stderr); `detail` is the diagnostic (log file). Never put a stack trace or a secret in `message`.

## Service → command → boundary escalation

- **Service / `sf` / library layers** (`services/`, `sf/`, `output/`): return `Result<T>` **or** raise a **named error** from `src/errors.ts` (a class extending `Error` with a fixed `name`). They **never** call `process.exit` and **never** write to stdout/stderr for an error — they hand the failure upward.
- **Command** (`commands/<group>.ts`): reads `result.ok`. On failure it logs the detail via `pino`, writes `error.message` to **stderr**, and sets the exit code (`kind: "error"` → `process.exitCode = 1`; `kind: "warning"` → stays `0`). It never throws a raw exception to the user.
- **Boundary** (`cli.ts`): the global `uncaughtException` / `unhandledRejection` handlers plus the top-level `try/catch` around `parseAsync`. Any **thrown** named error (a `ValidationError` from a flag guard, an unexpected throw) is logged via `pino` and mapped to an exit code by the single `toExitCode` helper (`ValidationError` → `2`, else `1` — `@rules/cli.md`).

## Named errors — `src/errors.ts`

```ts
// src/errors.ts — each error carries a fixed `name`. Raised by library layers, mapped at the boundary.
export class SfCliNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = "SfCliNotFoundError"; }
}
export class SfCommandError extends Error {
  constructor(message: string, readonly detail?: string) { super(message); this.name = "SfCommandError"; }
}
export class ValidationError extends Error {          // bad flags / invalid input → exit code 2
  constructor(message: string) { super(message); this.name = "ValidationError"; }
}
export class ProjectNotFoundError extends Error {     // sfdx-project mode — @rules/sfdx-project.md
  constructor(message: string) { super(message); this.name = "ProjectNotFoundError"; }
}
```

- The `sf` runner **returns** a `Result` error (`kind: "error"`) on `ENOENT` (a clear "sf not found" message), on a non-zero `sf` status, and when the assembled command line would overflow the Windows ~8191-char limit (a clear "command line too long" message, not the opaque "Réponse sf illisible" — `@rules/sf-cli.md`) — it never throws a raw spawn error across a layer. `Result.error` is a **plain object** (`{ kind, message, detail? }`), not a named-error instance. The named `SfCliNotFoundError` / `SfCommandError` classes exist for a layer that prefers to **raise** (throw) instead of return (`@rules/sf-cli.md`).
- A service raises `ValidationError` for a business-rule violation it cannot express as data; a flag guard in a command raises it for bad input. Both surface as exit `2`.

## Service returning `Result`

```ts
// src/services/org.service.ts — business logic: returns Result, never touches commander / process.exit / stdout.
import type { Result, OrgInfo } from "../types";
import type { SfHelpers } from "../sf/helpers";

export class OrgService {
  constructor(private readonly sf: SfHelpers) {}   // the typed sf helpers, injected in cli.ts — @rules/sf-cli.md

  async listOrgs(): Promise<Result<OrgInfo[]>> {
    const res = await this.sf.listOrgs();          // sf/ owns the spawn; the helper merges the org lists
    if (!res.ok) return res;                       // propagate the sf failure unchanged
    if (res.data.length === 0) {                   // business decision: empty is a non-fatal warning
      return { ok: false, error: { kind: "warning", message: "No authenticated org found." } };
    }
    return { ok: true, data: res.data };
  }
}
```

## Command mapping a failed `Result`

```ts
// src/commands/org.ts (excerpt) — read result.ok, log detail, write the summary to stderr, set the exit code.
const result = await orgService.listOrgs();                    // the service injected via registerOrgCommands(program, deps)
if (!result.ok) {
  if (result.error.kind === "error") {
    process.exitCode = 1;                                       // fatal → exit 1
    log.error({ detail: result.error.detail }, result.error.message);
  } else {
    log.warn({ detail: result.error.detail }, result.error.message); // warning → exit stays 0
  }
  process.stderr.write(`${result.error.message}\n`);            // human summary → stderr, never stdout
  return;
}
// success → format result.data through the output/ layer (@rules/output.md · full adapter in @rules/cli.md)
```

## Global handler — `cli.ts`

The safety net for anything that escaped the `Result` path (installed before parsing, `@rules/architecture.md`):

```ts
// src/cli.ts
process.on("uncaughtException", (err) => { log.error({ err }, "uncaughtException"); process.exit(1); });
process.on("unhandledRejection", (reason) => { log.error({ err: reason }, "unhandledRejection"); process.exit(1); });
```

A thrown named error that reaches the top-level `catch` is logged, its `message` written to stderr, and the process exits via `toExitCode(err)` (`@rules/cli.md`).

## Rules

- **Never throw a raw exception to the user.** Library layers return `Result` or raise a **named** error; the command maps it to a stderr message; the boundary maps any escaped throw to an exit code. A stack trace never reaches stdout.
- **`process.exit` only in `cli.ts`** (the boundary + the global handlers). A command sets `process.exitCode`; a service/`sf`/`output` module does neither.
- **Every non-re-throwing `catch` logs via `log.error`** (or `log.warn`) so the detail lands in the log file — never swallow an error silently (`catch { /* nothing */ }`).
- Build the user-facing wording at the command/boundary, not in the model — a service raises a typed error / returns `Result`; the command decides the message shown.
- The `message` is a concise summary for stderr; the `detail` (and any stack) goes to the `pino` log — do not dump a stack trace to the user (`@rules/logging.md`).
- Error handling on every fallible operation: the `sf` spawn (`@rules/sf-cli.md`), file IO (`--output`, `sfdx-project` reads), JSON parsing, config resolution.
- **Interpret a Salesforce error before wording the `message`.** When a `Result` failure comes from an `sf` Apex/DML/limit/compile error (an exception name, a DML `StatusCode`, a `LimitException`), consult `sf-cli-reference/apex-errors.md` (routed by `@rules/sf-cli.md`) to write a clear, actionable `message`; keep the raw code/name in `detail` for the log — never surface an opaque code alone.
- Never log a token, secret, or password (`@rules/security.md`).

## Anti-patterns — what NOT to do

- **Do not** throw a raw exception out of a service/`sf` module for a known failure — return `{ ok: false, error: {...} }` or raise a named error.
- **Do not** call `process.exit` outside `cli.ts` — a command sets `process.exitCode`.
- **Do not** write an error message to stdout — the human summary goes to stderr, the detail to the `pino` log; stdout is data only (`@rules/cli.md`).
- **Do not** build the user-facing message inside a service — the service raises a typed error / returns `Result`; the command owns the wording.
- **Do not** swallow a `catch` that does not re-throw without a `log.error(...)`.
- **Do not** dump a stack trace or a secret into the stderr summary — `detail` → log file only.
- **Do not** forget the global `uncaughtException` / `unhandledRejection` handlers in `cli.ts` — both are mandatory.
- **Do not** map a failure to an exit code with a scattered magic number — thrown errors go through `toExitCode`, `Result` failures through the fixed `warning → 0 / error → 1` rule.

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: errors). Not restated here, to avoid drift across files.
