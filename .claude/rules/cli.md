# CLI surface rules — sf-node

> The command-line surface of the generated tool: the `commander` program in `cli.ts`, the thin-command pattern, the flag conventions, the exit-code contract, and the stdout/stderr discipline that makes the tool safe to pipe and to schedule (cron, Windows Task Scheduler). Error escalation and the `Result<T>` contract: `@rules/errors.md`. Layering: `@rules/architecture.md`.

## The program — `src/cli.ts`

`cli.ts` is the **only** composition root. It builds one `commander` `program`, registers each command group, installs the global error handlers, and owns the exit-code mapping. It is the **only** place `process.exit` is called.

- Parser default: **`commander`**. `node:util parseArgs` is the fallback only for a 1-2 script project (Phase 1) — no third-party parser otherwise.
- `program.name(...)`, `.description(...)`, `.version(...)` set the identity; `--help` and `--version` are **auto-provided** by commander (do not hand-roll them).
- Subcommands are grouped: `program.command("<group>")` returns a group command, on which each `commands/<group>.ts` registers its own `.command("<verb>")`. So the surface reads `mytool org list`, `mytool data query …`.
- `.exitOverride()` hands control back to the boundary instead of letting commander call `process.exit` itself — the boundary maps usage errors to exit `2` and help/version to `0`.
- After `resolveConfig()` (and `configureLogger`), `cli.ts` decides progress activation and calls `configureProgress({ enabled })` — auto-on when `stderr` is a TTY, off under `--no-progress` / `CI` / debug logging — and raises the `pino` level to `warn` while it is active so log lines do not garble the animation (`@rules/progress.md`).

```ts
// src/cli.ts — bootstrap + composition (runner → helpers → services) + global error handler + exit-code mapping.
import { Command, CommanderError } from "commander";
import { log } from "./logger";
import { APP_VERSION } from "./config";
import { ValidationError } from "./errors";
import { SfRunner } from "./sf/runner";
import { SfHelpers } from "./sf/helpers";
import { OrgService } from "./services/org.service";
import { DataService } from "./services/data.service";
import { registerOrgCommands } from "./commands/org";
import { registerDataCommands } from "./commands/data";

/** The single mapping point for a *thrown* failure: usage/validation → 2, everything else → 1. */
export function toExitCode(err: unknown): 1 | 2 {
  if (err instanceof ValidationError) return 2;   // bad flags / invalid input
  if (err instanceof CommanderError) return 2;    // unknown option, missing argument (usage)
  return 1;                                       // runtime failure (sf, IO, unexpected)
}

process.on("uncaughtException", (err) => { log.error({ err }, "uncaughtException"); process.exit(1); });
process.on("unhandledRejection", (reason) => { log.error({ err: reason }, "unhandledRejection"); process.exit(1); });

const program = new Command();
program
  .name("mytool")
  .description("Headless Salesforce automation CLI")
  .version(APP_VERSION, "-v, --version")
  .configureOutput({ writeErr: (s) => process.stderr.write(s) })  // usage errors → stderr, never stdout
  .exitOverride();                                                // do not let commander own the exit

// composition: runner → helpers → services → command groups (unidirectional — @rules/architecture.md)
const sf = new SfHelpers(new SfRunner());              // SfRunner default resolves SF_CLI_PATH || "sf" — @rules/sf-cli.md
registerOrgCommands(program, { orgService: new OrgService(sf) });
registerDataCommands(program, { dataService: new DataService(sf) });

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof CommanderError && err.exitCode === 0) process.exit(0); // --help / --version
  log.error({ err }, "command failed");
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(toExitCode(err));
}
```

## Thin-command pattern — `src/commands/<group>.ts`

A command is an **adapter**, not a place for logic. Each group file exports a `register<Group>Commands(program)` that declares its subcommands and delegates. The `.action`:

1. reads its flags (validate → raise `ValidationError` on bad input, `@rules/errors.md`),
2. calls **one** service (which owns the `sf` call and the business rule),
3. on success hands the returned data to an `output/` formatter (data → stdout/file); on a failed `Result` writes the human message to **stderr** and sets the exit code.

No business logic, no direct `sf`/`cross-spawn` call, no `console.log`, no `process.exit`.

```ts
// src/commands/org.ts — thin adapter: parse/validate flags → call a service → format output. No business logic, no sf call.
import type { Command } from "commander";
import { log } from "../logger";
import { ValidationError } from "../errors";
import { formatOutput } from "../output";
import type { OutputFormat, OutputDestination, Row } from "../output";
import type { OrgService } from "../services/org.service";

const FORMATS: readonly OutputFormat[] = ["table", "json", "csv", "xlsx"];
function parseFormat(v: string): OutputFormat {                    // bad value → ValidationError → exit 2
  if ((FORMATS as readonly string[]).includes(v)) return v as OutputFormat;
  throw new ValidationError(`Unknown --format '${v}' (expected: ${FORMATS.join(" | ")}).`);
}

export function registerOrgCommands(program: Command, deps: { orgService: OrgService }): void {
  const org = program.command("org").description("Manage authenticated Salesforce orgs");

  org
    .command("list")
    .description("List authenticated orgs")
    .option("-f, --format <format>", "output format: table | json | csv | xlsx", "table")
    .option("-o, --output <file>", "write to a file instead of stdout")
    .action(async (opts: { format: string; output?: string }) => {
      const format = parseFormat(opts.format);
      const destination: OutputDestination = opts.output ? { kind: "file", path: opts.output } : { kind: "stdout" };
      const result = await deps.orgService.listOrgs();             // service owns the logic + the sf call
      if (!result.ok) {
        if (result.error.kind === "error") {                       // "warning" is non-fatal → exit stays 0
          process.exitCode = 1;
          log.error({ detail: result.error.detail }, result.error.message);
        } else {
          log.warn({ detail: result.error.detail }, result.error.message);
        }
        process.stderr.write(`${result.error.message}\n`);         // human message → stderr, never stdout
        return;
      }
      const rows: Row[] = result.data.map((o) => ({ alias: o.alias ?? "", username: o.username, status: o.connectedStatus ?? "" }));
      const written = await formatOutput(rows, { format, destination }); // data → stdout / file — @rules/output.md
      if (!written.ok) {                                           // e.g. xlsx to stdout, or a file write error
        process.exitCode = 1;
        log.error({ detail: written.error.detail }, written.error.message);
        process.stderr.write(`${written.error.message}\n`);
      }
    });
}
```

## Flags & arguments conventions

- **Long flags are kebab-case**: `--target-org`, `--api-version`, `--output`. Provide a short alias only for the frequent ones (`-o` for `--output`, `-f` for `--format`).
- **`--target-org`** selects the org (matches the `sf` `-o, --target-org` convention); it is passed down to the service and on to the `sf` helper, never spliced into a command string (`@rules/security.md`).
- **`--format <table|json|csv|xlsx>`** picks the `output/` formatter; **`--output, -o <file>`** redirects the data to a file instead of stdout. The command maps them to `{ format, destination }` (no `--output` → `{ kind: "stdout" }`, `--output <path>` → `{ kind: "file"; path }`) and passes them to `formatOutput` (`@rules/output.md`).
- **Prefer `--format json` over a raw `--json` passthrough.** Exposing `sf`'s own `--json` envelope leaks the CLI-version-specific shape to the user; the tool's own `--format json` emits the tool's stable DTO. Keep `--json` out of the public surface unless a command explicitly documents an escape hatch.
- **`--help` / `--version` are auto** (commander) — never re-implement them. `--version` reads `APP_VERSION` from `config.ts`.
- **`--no-progress`** (global, boolean) disables the live progress display; the display is otherwise auto-on when `stderr` is a TTY (and off under `CI` or debug logging). It is a runtime UI toggle, not part of the config cascade — see `@rules/progress.md`.
- Validate a flag's value in the command before calling the service; an out-of-range/unknown value is a `ValidationError` → exit `2`.

## Exit-code contract

Three codes, mapped at the boundary — never scattered as magic numbers across commands.

| Code | Meaning                    | Source                                                                 |
| ---- | -------------------------- | ---------------------------------------------------------------------- |
| `0`  | Success                    | a command completed; also a `Result` failure of `kind: "warning"` (non-fatal, e.g. empty result set) |
| `1`  | Runtime error              | a `Result` failure of `kind: "error"`, an `sf` failure, an unexpected throw, `uncaughtException`/`unhandledRejection` |
| `2`  | Usage / validation error   | `ValidationError` (bad flags/input) or a commander usage error (unknown option, missing argument) |

- **A *thrown* failure** (a `ValidationError`, a commander usage error, an unexpected error) is mapped by the single `toExitCode` helper in the `cli.ts` catch. Named-error → exit code is the one mapping point.
- **A returned `Result` failure** is handled by the command: `kind: "error"` → `process.exitCode = 1`; `kind: "warning"` → exit stays `0`. The command sets the code; it never calls `process.exit` (only `cli.ts` does, in the boundary and the global handlers).
- Set `process.exitCode` rather than `process.exit(n)` inside a command so stdout/stderr flush before the process ends.

## stdout = data · stderr = logs + messages

The discipline that makes the tool pipeable and scriptable:

- **`stdout` carries data only** — the `output/` formatter's bytes (JSON/CSV/xlsx/table), nothing else. `mytool data query … --format json | jq …` must see clean JSON with no log line mixed in.
- **`stderr` carries everything human**: `pino` log lines (file + `stderr`, `@rules/logging.md`) and the one-line human error/warning messages a command writes on a failed `Result`.
- A formatter writes to **stdout or the `--output` file**; it never writes to stderr. A log/message never goes to stdout.
- The **progress reporter** (`src/progress.ts`) is the sanctioned live-UI surface on **`stderr`** (steps/spinner + bar), TTY-gated and silent when piped/cron/CI — it never touches stdout, so a piped run stays clean. The reporter and `pino` are the only `stderr` writers (`@rules/progress.md`).
- Zero `console.log` in delivered code — data goes through `output/`, diagnostics through `log.*` (`@rules/logging.md`).

This separation is what makes the tool **cron- and Windows Task Scheduler-friendly**: a scheduled run redirects `stdout` to a data file and `stderr` to a log, and the exit code drives success/failure alerting — no interactive prompt, no banner on stdout.

## Non-interactive by default · `@clack/prompts` opt-in

- The tool is **non-interactive by default**: args in → run → exit. This is the contract for cron/CI. A command must be fully drivable by flags.
- Interactive prompts (`@clack/prompts`) are **opt-in per project** (Phase 1) and only for a genuinely interactive invocation. **Guard every prompt**: never prompt when `stdout`/`stdin` is not a TTY, or when a `--yes` / non-interactive flag is set. A non-TTY run without `--yes` takes the **safe default** (abort a destructive action) rather than blocking.

```ts
// A prompt must never block a scheduled / piped run.
import { confirm, isCancel } from "@clack/prompts";

async function confirmDestructive(message: string, opts: { yes: boolean }): Promise<boolean> {
  if (opts.yes) return true;                       // explicit consent → proceed
  if (!process.stdout.isTTY) return false;         // non-interactive (cron/pipe) → safe default: abort
  const answer = await confirm({ message });
  return !isCancel(answer) && answer === true;
}
```

## Anti-patterns — what NOT to do

- **Do not** put business logic or an `sf`/`cross-spawn` call in a command — parse, delegate to a service, format (`@rules/architecture.md`).
- **Do not** call `process.exit` outside `cli.ts` — a command sets `process.exitCode`; the boundary and the global handlers call `process.exit`.
- **Do not** hardcode an exit code as a magic number in a command — the thrown-error mapping is the single `toExitCode` helper; the `Result` mapping is the fixed `warning → 0 / error → 1` rule.
- **Do not** write data to stderr or a log/human message to stdout — stdout is data only, stderr is logs + messages.
- **Do not** `console.log` a dataset — route it through an `output/` formatter (`@rules/output.md`).
- **Do not** expose `sf`'s raw `--json` envelope as the public output — emit the tool's stable DTO via `--format json`.
- **Do not** prompt (`@clack/prompts`) when stdout is not a TTY or `--yes` is set — it would hang a cron/CI run.
- **Do not** re-implement `--help` / `--version` — commander provides them.
- **Do not** let a raw exception or a stack trace reach stdout — the global handlers log it and exit `1` (`@rules/errors.md`).

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: cli). Not restated here, to avoid drift across files.
