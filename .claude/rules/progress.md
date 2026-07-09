# Runtime progress reporter — sf-node CLI

> Every generated tool ships a **hand-rolled, zero-dependency progress reporter** (`src/progress.ts`) that shows the operations a command performs while it runs — steps with a spinner, a bar for known-total work — so a developer running the tool to test it sees what happens. It writes **only to `stderr`** (stdout stays data-only, `@rules/cli.md`), animates **only on a TTY**, and **degrades to `pino` log lines** otherwise. It coexists with `pino` via a level rule (below). No new dependency — same rationale as the hand-rolled `table` formatter (`@rules/output.md`).

The reporter is a **shared singleton** imported directly as `progress`, exactly like `log` (`@rules/logging.md`) — importable by every layer, importing nothing upward, no `commander` (`@rules/architecture.md`). It is the **single sanctioned direct-`stderr` writer besides `pino`**: this is the one place `process.stderr.write` is allowed outside the logger (the "no `console.*`" rule still holds — no `console.log` / `console.error` anywhere).

## Three surfaces from one abstraction

- **TTY + enabled** → animated steps (braille spinner + `✓`/`✗`) and, for known-total work, a filled bar.
- **Known total** (a client-side loop: pagination, writing N rows) → `progress.bar(label, total)` renders a real bar advanced by `tick()`. A **single blocking `sf` call** (`sf data export bulk --wait`) only returns at the end, so it uses `progress.step()` (indeterminate spinner), **never a fake bar** — do not pretend to a progress you cannot measure.
- **Non-TTY / `--no-progress` / `CI` / debug logging** → the reporter is disabled; each `step.succeed` / `bar.done` **degrades to a `log.info` line** — the enriched-logs view, identical to today's `pino` behavior.

## Activation (decided once, in `cli.ts`)

```ts
// src/cli.ts (excerpt) — after resolveConfig(); progress depends only on the stream + flag + env.
import { configureProgress } from "./progress";
import { configureLogger } from "./logger";

const wantsDebug = process.env[`${APP_NAME.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_DEBUG`] === "1"
  || config.logLevel === "debug" || config.logLevel === "trace";
const progressEnabled =
  program.opts().progress !== false     // commander: `--no-progress` sets opts.progress === false
  && !!process.stderr.isTTY             // never animate on a redirected/piped stream (cron/CI)
  && !process.env.CI                    // honor the CI convention
  && !wantsDebug;                       // a debugging run keeps full logs instead of the animation

configureLogger(progressEnabled ? "warn" : config.logLevel); // coexistence: see below
configureProgress({ enabled: progressEnabled });
```

- Global flag `--no-progress` (boolean; commander's negated option). No `.env` key is required (this is a runtime UI toggle, not config cascade); an optional `NO_PROGRESS` env may be honored for parity. `--no-progress` is documented in `@rules/cli.md` / `@rules/config.md` global-flag surface.
- The reporter never keeps the process alive (the spinner interval is `unref`-ed) and never calls `process.exit` (only `cli.ts` does, `@rules/cli.md`).

## Coexistence with `pino` (`@rules/logging.md`)

`pino` already writes to `stderr` + the log file. If both wrote `info` to `stderr` at once, log lines would garble the animation. Rule:

- **Progress enabled (TTY)** → `cli.ts` raises the `pino` level to **`warn`** (via `configureLogger("warn")`), so the reporter owns the `info`-level narrative on `stderr`; warnings/errors still print. Trade-off: during an interactive progress run the **log file** also gets `warn+` for that run — acceptable, the operator is watching the live steps. Services still call `log.debug/info` as usual; those are simply gated out of `stderr` for the run.
- **Progress disabled** → `pino` behaves exactly as today (`info` → file + `stderr`), and the reporter's `step`/`bar` completions emit `log.info` lines. Nothing changes for cron/CI.
- **Debug requested** (`[TOOL]_DEBUG=1` or `--log-level debug`/`trace`) → progress is **auto-disabled** so a debugging run keeps full logs. The animation never hides diagnostics.

## Reference implementation — `src/progress.ts`

```ts
// src/progress.ts — hand-rolled, zero-dependency runtime progress reporter.
// Writes ONLY to stderr (stdout stays data-only, @rules/cli.md). Animated only on a TTY;
// otherwise every completion degrades to a pino log line (@rules/logging.md). At most one
// live line at a time (a command's operations run sequentially).
import { log } from "./logger";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]; // braille spinner
const CLEAR = "\x1b[2K\r";                                          // erase line + carriage return
const GREEN = "\x1b[32m", RED = "\x1b[31m", DIM = "\x1b[2m", RESET = "\x1b[0m";
const BAR_WIDTH = 24;

let enabled = false;                              // set once by configureProgress() from cli.ts
let live: { render: () => void } | null = null;   // the current animated line, if any
let timer: ReturnType<typeof setInterval> | null = null;

/** Enable the animated reporter (TTY only). Called once in cli.ts after resolveConfig(). */
export function configureProgress(opts: { enabled: boolean }): void {
  enabled = opts.enabled;
}

function write(s: string): void {
  process.stderr.write(s);
}
function startTimer(): void {
  if (timer || !enabled) return;
  timer = setInterval(() => live?.render(), 80);
  timer.unref?.();                                // never keep the process alive for a spinner
}
function stopTimerIfIdle(): void {
  if (!live && timer) {
    clearInterval(timer);
    timer = null;
  }
}

export interface StepHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
}
export interface BarHandle {
  tick(n?: number): void;
  set(value: number): void;
  done(text?: string): void;
}

/** A step: indeterminate spinner on a TTY, a single log line when disabled. */
export function step(label: string): StepHandle {
  let text = label;
  let done = false;

  if (!enabled) {
    return {
      update: (t) => { text = t; },
      succeed: (t) => { if (!done) { done = true; log.info(t ?? text); } },
      fail: (t) => { if (!done) { done = true; log.warn(t ?? text); } },
    };
  }

  let frame = 0;
  const self = { render: () => write(`${CLEAR}${DIM}${FRAMES[frame = (frame + 1) % FRAMES.length]}${RESET} ${text}`) };
  live = self;
  startTimer();
  self.render();

  const finish = (mark: string, t: string | undefined): void => {
    if (done) return;
    done = true;
    if (live === self) live = null;
    write(`${CLEAR}${mark} ${t ?? text}\n`);      // freeze the final line
    stopTimerIfIdle();
  };
  return {
    update: (t) => { text = t; if (live === self) self.render(); },
    succeed: (t) => finish(`${GREEN}✓${RESET}`, t),
    fail: (t) => finish(`${RED}✗${RESET}`, t),
  };
}

/** A bar: filled gauge for a KNOWN total. Disabled or total<=0 → a single log line on done(). */
export function bar(label: string, total: number): BarHandle {
  let value = 0;
  let done = false;

  if (!enabled || total <= 0) {
    return {
      tick: (n = 1) => { value += n; },
      set: (v) => { value = v; },
      done: (t) => { if (!done) { done = true; log.info(t ?? `${label} (${value}/${total})`); } },
    };
  }

  const render = (): void => {
    const ratio = Math.min(1, value / total);
    const filled = Math.round(ratio * BAR_WIDTH);
    const gauge = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
    write(`${CLEAR}${label} ${gauge} ${Math.round(ratio * 100)}% ${value}/${total}`);
  };
  live = { render };
  render();
  return {
    tick: (n = 1) => { value += n; if (live?.render === render) render(); },
    set: (v) => { value = v; if (live?.render === render) render(); },
    done: (t) => {
      if (done) return;
      done = true;
      if (live?.render === render) live = null;
      write(`${CLEAR}${GREEN}✓${RESET} ${t ?? label}\n`);
      stopTimerIfIdle();
    },
  };
}

/** The single reporter surface — imported directly, like `log`. */
export const progress = { step, bar };
```

- **Zero dependency**: braille frames + ANSI `\x1b[2K\r` on `stderr`, an 80 ms `setInterval` for the spinner (`unref`-ed). No cursor hide/show (so a crash never leaves the cursor hidden — robustness over polish).
- **One live line at a time**: a command runs its operations sequentially, so a single `live` slot is enough; a new `step`/`bar` replaces the previous live handle.
- **Disabled path is a no-op UI**: only `succeed`/`done` emit a `log` line — safe in tests (never a TTY) and in cron.

## Instrumentation — where to emit

The layering is `commands → services → sf` + `commands → output` (`@rules/architecture.md`). Emit at the natural operation boundaries; keep `sf/` and `output/` clean.

- **Services (`src/services/*.service.ts`)** own the business steps and the counts. The spinner animates during the awaited `sf` call (the event loop is free — the runner spawns asynchronously):

```ts
import { progress } from "../progress";

async listOrgs(): Promise<Result<OrgInfo[]>> {
  const s = progress.step("Listing authenticated orgs…");
  const res = await this.sf.listOrgs();
  if (!res.ok) { s.fail("Org list failed"); return res; }
  s.succeed(`${res.data.length} org(s)`);
  return { ok: true, data: res.data };
}
```

- **Commands (`src/commands/<group>.ts`)** bracket the file write around `formatOutput` — so `output/` stays pure (a formatter never writes to `stderr`, `@rules/output.md` / `@rules/cli.md`):

```ts
const w = progress.step("Writing output…");
const written = await formatOutput(rows, { format, destination });
if (written.ok) w.succeed(destination.kind === "file" ? `wrote ${destination.path}` : "written");
else w.fail(written.error.message);
```

- **`src/sf/runner.ts`** stays **uninstrumented** (preserves the purity of `sf/`): the `sf` operation is covered by the surrounding service step. `sf/` may import `progress` (as it already imports `log`) if a low-level spinner is ever wanted, but the default puts labels in the services to avoid duplicate wording.
- **`src/output/`** is **unchanged and pure** — it never imports `progress` and never writes to `stderr`.

## Anti-patterns — what NOT to do

- **Do not** write the progress display to `stdout` — `stderr` only; `stdout` stays data-only and pipeable (`@rules/cli.md`).
- **Do not** animate when `process.stderr.isTTY` is false, when `CI` is set, or when debug logging is requested — degrade to `log` lines (a cron/pipe run must stay clean).
- **Do not** render a filled bar for a single blocking `sf` call whose total you cannot measure — use `step()` (indeterminate spinner); no fake progress.
- **Do not** `console.log` / `console.error` a progress line — the reporter (`process.stderr.write`) and `pino` are the only sanctioned `stderr` writers.
- **Do not** import `progress` into `output/` or make a formatter write to `stderr` — bracket the write in the **command**.
- **Do not** call `process.exit` from the reporter, or leave the spinner interval keeping the process alive (`unref` it).
- **Do not** add a spinner/progress dependency (`ora`, `nanospinner`, `cli-progress`) — the hand-rolled reporter covers it (same rationale as the `table` formatter, `@rules/output.md`).
- **Do not** let `info` `pino` lines print to `stderr` while the reporter is active — `cli.ts` raises the level to `warn` for the run.

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: progress). Not restated here, to avoid drift across files.
