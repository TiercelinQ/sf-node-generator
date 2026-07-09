# Logging rules — sf-node CLI (pino)

## Principle

- **`pino` (^10)** — mandatory runtime dependency in every generated tool (fast structured JSON logger; Node has no stdlib equivalent with a file sink).
- **pino writes to a log file AND to `stderr`** — `stdout` stays **data-only** (pipeable), per the CLI I/O contract (`@rules/cli.md`). A log line never reaches stdout.
- **`pino-pretty` (runtime dependency)** is the human-readable transport, enabled **only in dev** (`NODE_ENV !== "production"` or `[TOOL]_DEBUG=1`). Production writes raw JSON to stderr. It is a **runtime `dependency`** (not a devDependency): `logger.ts` imports it at module load, and **tsup bundles devDependencies** — a bundled `pino-pretty` breaks the ESM output with `Dynamic require of "tty" is not supported` (`@rules/config.md`).
- Level comes from `config.logLevel` (the cascade, `@rules/config.md`); `[TOOL]_DEBUG=1` forces `debug`.
- When the **progress reporter** is active, `cli.ts` raises the `stderr` level to `warn` (the reporter owns the `info` narrative); debug logging auto-disables the reporter — see "Coexistence with the progress reporter" below and `@rules/progress.md`.
- **Zero `console.log` / `console.error`** in delivered code — only `log.*`.
- **Never log a token, secret, password, session id, or PII** (`@rules/security.md`).

---

## Centralized setup — `src/logger.ts`

Single setup point. `log` is exported as a ready `pino` instance and imported directly by every layer (`log.info(...)`, `log.error(...)`). `cli.ts` calls `configureLogger(config.logLevel)` once, right after `resolveConfig()`, to apply the resolved level.

```ts
// src/logger.ts
import { resolve } from "node:path";
import pino, { multistream, type Logger, type LevelWithSilent } from "pino";
import pretty from "pino-pretty";
import { APP_NAME } from "./config";

const LOG_FILE = resolve(process.cwd(), "logs", "app.log"); // project-root logs/, gitignored (@rules/security.md)

/** e.g. tool `sf-export` → env var `SF_EXPORT_DEBUG`. Non-alphanumerics normalized so the name is shell-usable. */
function debugEnabled(): boolean {
  const key = `${APP_NAME.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_DEBUG`;
  return process.env[key] === "1";
}

const dev = process.env.NODE_ENV !== "production" || debugEnabled();

// File sink: structured JSON, sync so the final line survives process.exit(1); logs/ created on demand.
const fileStream = pino.destination({ dest: LOG_FILE, mkdir: true, sync: true });
// stderr keeps stdout data-only (@rules/cli.md): pretty in dev, raw JSON in prod.
const errStream = dev ? pretty({ destination: 2, colorize: true, translateTime: "SYS:standard" }) : process.stderr;

/** The single pino instance — imported directly as `log` by every layer. */
export const log: Logger = pino(
  {
    level: debugEnabled() ? "debug" : "info", // bootstrap level; configureLogger() applies the resolved cascade level
    base: undefined,                           // drop pid/hostname noise from CLI log lines
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  multistream([
    { stream: fileStream, level: "trace" },    // permissive: the logger's own `level` is the single gate
    { stream: errStream, level: "trace" },
  ]),
);

/** Apply the resolved config level (cascade defaults < .env < flags). Called once in cli.ts after resolveConfig(). */
export function configureLogger(level: LevelWithSilent): void {
  log.level = debugEnabled() ? "debug" : level; // [TOOL]_DEBUG=1 forces debug regardless of config
}
```

- **File + stderr, split by role.** The file is `logs/app.log` (project root, gitignored, `@rules/security.md`) with `sync: true` so the last line is flushed even on `process.exit(1)`; stderr carries the same events for the operator. `stdout` is never a destination (`@rules/cli.md`). For a globally-installed tool, point `LOG_FILE` at an OS data dir instead — keep the single-file-sink shape.
- **`pino-pretty` is an inline stream on stderr, dev-only** — not a worker transport (`transport: { target: 'pino-pretty' }` spawns a worker; the inline stream is simpler and synchronous for a CLI). Prod stderr gets raw JSON.
- **Level is the single gate.** The two multistream sinks are permissive (`trace`); the logger's own `level` decides what is emitted. `configureLogger()` sets it from `config.logLevel`, with `[TOOL]_DEBUG=1` forcing `debug`.
- `APP_NAME` (used for the debug env var) lives in `config.ts` (`@rules/config.md`).

---

## Usage in modules

```ts
// src/services/data.service.ts
import { log } from "../logger";

export async function exportRecords(soql: string, org?: string): Promise<Result<ExportSummary>> {
  log.debug({ soql, org }, "Running export query"); // pino order: (mergingObject, message)
  // ...
}
```

- **pino call order is `(object, message)`** — the context object first, the message second: `log.info({ count }, "Exported records")`. This is the deviation from `console.log(msg, ...args)` — do not put the message first.
- Structured context (`{ soql, org, count }`) lands as JSON fields in the file and is pretty-printed on stderr in dev.

### Level conventions

| Level | Usage                                                                 |
| ----- | --------------------------------------------------------------------- |
| debug | Detailed traces, intermediate values, the `sf` args array, query text (never a secret) |
| info  | Important business steps (command start/finish, N records exported)   |
| warn  | Unexpected but non-blocking (empty result set, a retried `sf` call)   |
| error | A caught named error (`SfCommandError`, `ValidationError`…) or an uncaught error |

### Errors always logged

In a `catch` that does **not** re-throw (it returns a `Result` error or writes to stderr), call `log.error({ err }, message)` so the stack lands in the file — pino's standard `err` serializer records the name/message/stack:

```ts
try {
  return await this.runner.run<QueryResult>(args);
} catch (err) {
  log.error({ err }, "Query failed");                    // stack → log file via the std `err` serializer
  return { ok: false, error: { kind: "error", message: "Query failed." } }; // @rules/errors.md
}
```

Never swallow a non-re-throwing `catch` without a `log.error(...)` (`@rules/errors.md`). The `Result` failure a command surfaces is logged there too: `error.detail` → the log, `error.message` → stderr (`@rules/cli.md`).

---

## Activation + global handlers — `src/cli.ts`

The composition root installs the global handlers **first** (before parsing argv) and applies the resolved level right after `resolveConfig()`:

```ts
// src/cli.ts — order matters: handlers and level before any command runs.
import { log, configureLogger } from "./logger";

process.on("uncaughtException", (err) => { log.error({ err }, "uncaughtException"); process.exit(1); });
process.on("unhandledRejection", (reason) => { log.error({ err: reason }, "unhandledRejection"); process.exit(1); });

const config = resolveConfig(toCliFlags(program.opts()));
configureLogger(config.logLevel);        // apply the cascade level ([TOOL]_DEBUG=1 forces debug)
log.info({ tool: APP_NAME }, "Starting");
```

- The global `uncaughtException` / `unhandledRejection` handlers log via pino, then **exit 1** — the tool never crashes silently or leaks a stack to stdout (`@rules/errors.md`, `@rules/cli.md`). With the file sink in `sync: true` mode, the fatal line is persisted before the process ends.
- `process.exit` lives **only** in `cli.ts` (the boundary + the global handlers), never in a service/`sf`/`output`/command module (`@rules/cli.md`).

---

## Coexistence with the progress reporter

`src/progress.ts` also writes to `stderr` (`@rules/progress.md`). To keep log lines from garbling the live animation:
- **Progress active (TTY)** — `cli.ts` raises the `pino` level to **`warn`** (`configureLogger("warn")`); the reporter carries the `info` narrative on `stderr`. Warnings/errors still print. The **log file** gets `warn+` for that run — an accepted trade-off (the operator is watching the live steps).
- **Progress disabled** (piped / cron / `CI` / `--no-progress`) — `pino` behaves exactly as documented above (`info` → file + `stderr`); the reporter degrades to `log.info` / `log.warn` lines (the enriched-logs view).
- **Debug logging** (`[TOOL]_DEBUG=1` or `--log-level debug` / `trace`) — the reporter is **auto-disabled** so a debugging run keeps full logs; the animation never hides diagnostics.

---

## Anti-patterns — what NOT to do

- **Do not** use `console.log` / `console.error` in delivered code — only `log.*`.
- **Do not** write a log line to `stdout` — stdout is **data only**; pino goes to the file + stderr (`@rules/cli.md`).
- **Do not** emit progress via `console.*` — the progress reporter (`src/progress.ts`) is the only sanctioned direct-`stderr` writer besides `pino` (`@rules/progress.md`).
- **Do not** log a token, secret, password, session id, or PII (`@rules/security.md`).
- **Do not** configure pino outside `src/logger.ts` (single setup point; `configureLogger()` called once in `cli.ts`).
- **Do not** silence a non-re-throwing `catch` without `log.error({ err }, ...)`.
- **Do not** put the message before the context object — pino is `(mergingObject, message)`: `log.info({ count }, "…")`.
- **Do not** spin up a `pino-pretty` worker transport in prod — pretty is dev-only, inline on stderr; prod stderr is raw JSON.
- **Do not** forget the global `uncaughtException` / `unhandledRejection` handlers in `cli.ts` — both are mandatory (`@rules/errors.md`).

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: logging). Not restated here, to avoid drift across files.
