# Salesforce CLI integration rules — sf-node CLI tool

> **Mandatory, not opt-in.** Every tool this framework generates is coupled to Salesforce through the `sf` v2 CLI. The default scaffold is **runner + typed helpers + a starter `org` command group** (`list` / `use` / `login` / `logout`) **+ a `data query` / `data export` command** that demonstrates the runner and the `output/` formatters end to end. Targets the **`sf` v2 CLI only** — never `sfdx` (legacy). The tool never handles OAuth tokens — `sf` owns the auth flow and the OS keychain.

The runner lives in **`src/sf/runner.ts`** and is the **only place in the whole tool that spawns a process**. Every layer reaches Salesforce through it: `commands` → `services` → `sf` (`@rules/architecture.md`). A command never spawns; a service never spawns; only `src/sf/` does.

## Command catalog (source of truth for sf commands/flags)

This rule is the **hub** that routes every sf-aware skill to the command catalog under `.claude/sf-cli-reference/`. Whenever you write or modify an `sf` invocation (a helper's args array, a new subcommand, a flag):

1. **Never invent** an `sf` command, subcommand, or flag from memory — verify it against the catalog.
2. Read `sf-cli-reference/INDEX.md` first (small: convention + capability → file map), then **open only the section file** matching the capability you need (`auth-orgs.md`, `data.md`, `apex.md`, `metadata-deploy.md`, `packaging.md`, `users-schema.md`, `platform-api.md`, `advanced.md`; `apex-errors.md` for interpreting a returned error). **Never read the whole catalog** — it is large; section-scoped reads keep the context lean.
3. Each catalog entry states the exact flags and whether `--json` / `--api-version` / `-o, --target-org` apply. The typed helpers below source their args from there.
4. The catalog reflects `sf` v2 at a given release; field names/flags drift across versions. For anything uncertain or recent, confirm against the installed CLI with `sf <command> --help`.
5. **Always verify an sObject's FIELDS via `describe` before writing any SOQL — never assume field names from memory.** The `sf-cli-reference/` catalog covers commands and flags, **not** the fields of a given object; a query naming a non-existent field fails at runtime with `INVALID_FIELD`. Confirm the exact field names (and types) with `sf sobject describe --sobject <Object> [--use-tooling-api] --target-org <org>` (add `--use-tooling-api` for Tooling objects such as `SecurityHealthCheck` / `SecurityHealthCheckRisks`). This is **design-time** verification. Parse the result **defensively**: the Tooling API often returns numeric/boolean fields as **strings** (e.g. `Score` comes back as `"52"`) — coerce (`Number(...)`), never test `typeof === "number"` on a raw Tooling value.
6. **Interpreting a returned error** — when an `sf` result carries a Salesforce error (an Apex exception name, a DML `StatusCode` such as `FIELD_CUSTOM_VALIDATION_EXCEPTION`, a `LimitException`, or a compile error), read `sf-cli-reference/apex-errors.md` to turn the raw code/name into a clear `Result` `message` (`@rules/errors.md`); keep the raw code in `detail` for the log. This is **design-time** interpretation — no error dictionary is baked into the generated tool.

## Principle

The tool shells out to the user's `sf` binary with `--json` and parses the envelope. Everything the tool needs (orgs, auth, SOQL, Tooling API, bulk, Apex, metadata) is an `sf` subcommand — **no `jsforce` / `@salesforce/core` dependency**.

- `sf` is a **runtime prerequisite**; if absent → a clear error (the runner maps `ENOENT`). Documented in the README, never a hard npm dependency of the tool.
- **Resolve `sf` cross-OS via `SF_CLI_PATH` env / the config `sfPath` key (no platform branch).** The composition root injects the resolver: `SF_CLI_PATH` wins, then `config.sfPath`, else the bare command `sf` from `PATH`. This covers non-standard installs (the standalone installer's bundled binary, custom paths) on every OS without an `if (win32)`. See `@rules/config.md`.
- **Install (cross-OS, documented in the README, not imposed)**: the official `sf` installer bundles its own Node; `npm install -g @salesforce/cli` also works on the system Node. Either way the tool only needs `sf` reachable (PATH or `SF_CLI_PATH`).
- **Use `cross-spawn`, not `node:child_process`.** On Windows the `sf` binary is a `sf.cmd` shim; a bare `child_process.spawn("sf", …, { shell: false })` fails with `ENOENT` (Node's security fix blocks running a `.cmd` without a shell). `cross-spawn` resolves the shim and **escapes arguments correctly** — it keeps the "argument array, no injectable shell" guarantee on every OS. Add `cross-spawn ^7.0.6` (dependency) + `@types/cross-spawn ^6.0.6` (dev) — see `@rules/config.md`. `esModuleInterop` is on, so the default import works.

## Runner — `src/sf/runner.ts`

```ts
import spawn from "cross-spawn";          // resolves the Windows sf.cmd shim, escapes args — no injectable shell
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Result } from "../types";

export interface SfEnvelope<T> { status: number; result: T; warnings?: string[]; message?: string; name?: string; }

/** A large text argument that can be passed inline OR spilled to a temp file (see "Windows command-line length"). */
export interface LargeArg { inlineFlag: string; fileFlag: string; value: string; ext: string; }

export class SfRunner {
  /**
   * resolveBin returns the sf command/path (SF_CLI_PATH or the configured sfPath, else "sf"). Cross-OS, no platform branch.
   * cmdLineBudget caps the assembled command line: on Windows `sf` is a `.cmd` shim run via cmd.exe, which rejects a line
   * over ~8191 chars. Default 6000 on Windows (headroom for the cmd wrapper + arg quoting), generous elsewhere. Injectable for tests.
   */
  constructor(
    private readonly resolveBin: () => string = () => process.env.SF_CLI_PATH || "sf",
    private readonly cmdLineBudget: number = process.platform === "win32" ? 6000 : 100_000,
  ) {}

  /** Approximate the assembled command line and tell whether it would blow the budget (Windows cmd.exe ~8191 hard limit). */
  private overflows(args: string[]): boolean {
    const parts = [this.resolveBin(), ...args, "--json"];
    const approx = parts.reduce((n, p) => n + p.length + 3, 0) + 32; // +3 quoting/space per part, +32 cmd wrapper
    return approx > this.cmdLineBudget;
  }

  /** Run `sf <args> --json`. args is an ARRAY — never a concatenated shell string (security). */
  async run<T>(args: string[]): Promise<Result<T>> {
    if (this.overflows(args)) {   // guard BEFORE spawning: a too-long line dies in cmd.exe with an opaque message
      return this.fail(
        "Commande sf trop longue pour la ligne de commande Windows (~8191 caractères). Passez l'argument volumineux (ex. SOQL) via un fichier, ou réduisez-le.",
        `Longueur estimée > budget (${this.cmdLineBudget}).`,
      );
    }
    return new Promise((resolve) => {
      const child = spawn(this.resolveBin(), [...args, "--json"]);   // cross-spawn — args array, no injectable shell
      let out = "", err = "";
      child.stdout?.on("data", (d) => (out += d));       // cross-spawn types streams as nullable
      child.stderr?.on("data", (d) => (err += d));
      child.on("error", (e) =>
        resolve(this.fail(e.message.includes("ENOENT")
          ? "Salesforce CLI (sf) introuvable. Installez le CLI ou définissez SF_CLI_PATH."
          : e.message)));
      child.on("close", () => {
        const raw = out || err;
        if (/too long|trop longue/i.test(raw)) {   // belt-and-suspenders: cmd.exe rejected the line despite the budget
          return resolve(this.fail(
            "Commande sf trop longue pour la ligne de commande Windows. Passez l'argument volumineux via un fichier.",
            raw.trim(),
          ));
        }
        let parsed: SfEnvelope<T> | undefined;
        try { parsed = JSON.parse(raw); } catch { /* non-JSON output */ }
        if (!parsed) return resolve(this.fail("Réponse sf illisible.", raw));
        if (parsed.status !== 0) return resolve(this.fail(parsed.message ?? "Commande sf en échec.", parsed.name));
        resolve({ ok: true, data: parsed.result });
      });
    });
  }

  /**
   * Run sf with a large text argument passed **inline when it fits**, or **spilled to a temp file** when it would overflow
   * the command line (Windows). Generic — any command with an inline flag + a file-input flag can use it: `sf data query`
   * (`--query` / `--file`), `sf data export bulk` (`--query` / `--query-file`), `sf data search` (`--query` / `--file`).
   * The temp file (non-secret SOQL) lives under the OS temp dir and is always removed (@rules/security.md).
   */
  async runWithLargeArg<T>(baseArgs: string[], large: LargeArg): Promise<Result<T>> {
    const inline = [...baseArgs, large.inlineFlag, large.value];
    if (!this.overflows(inline)) return this.run<T>(inline);   // fits → inline as usual
    let dir: string | undefined;
    try {
      dir = await mkdtemp(join(tmpdir(), "sf-node-"));          // unique temp dir — name not built from user input
      const file = join(dir, `arg${large.ext}`);
      await writeFile(file, large.value, "utf8");               // spill the SOQL to a file (not a secret)
      return await this.run<T>([...baseArgs, large.fileFlag, file]);
    } catch (e) {
      return this.fail("Échec de l'écriture de l'argument volumineux dans un fichier temporaire.", (e as Error).message);
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true }).catch(() => { /* best-effort cleanup */ });
    }
  }
  private fail(message: string, detail?: string): Result<never> {
    return { ok: false, error: { kind: "error", message, detail } };
  }
}
```

- `spawn(bin, [...args, "--json"])` via **`cross-spawn`** — argument array, no shell (cross-spawn never spawns through a shell, so there is no injectable command line). User values (alias, SOQL, paths) are **separate array elements**, never spliced into a string. This is the command-injection guard (`@rules/security.md`).
- The runner returns `Result<T>` (`@rules/errors.md`) — never throws across a layer. The command boundary maps a failed `Result` to a `stderr` message + a non-zero exit code (`@rules/cli.md`); the `sf` runner itself never calls `process.exit`.
- Parse **defensively**: `sf` field names vary across CLI versions. Read the `status` / `result` envelope, guard missing fields, and verify the actual shape at generation time against the installed `sf`.
- Map a non-zero `status` / `ENOENT` / unparseable output to a `Result` error. Named errors (`SfCliNotFoundError`, `SfCommandError`) live in `src/errors.ts` for the cases a service wants to raise instead of returning (`@rules/errors.md`).
- The runner stays **uninstrumented for progress** — the surrounding **service** wraps each `sf` operation with a `progress.step` (the spinner animates during the async spawn); `sf/` keeps its purity (`@rules/progress.md`, `@rules/architecture.md`).
- **Windows command-line length** — on Windows `sf` is a `.cmd` shim run via cmd.exe, which rejects a command line over ~8191 chars, so a large inline argument (a many-field SOQL, a long `WHERE IN`) overflows before `sf` even starts. `run()` **guards** the assembled length and returns a **clear `Result` error** (never the opaque "Réponse sf illisible") when it would overflow; `runWithLargeArg()` **spills** the large argument to a temp file and switches to the command's file-input flag when needed. Generic, not query-specific — see below.

## Windows command-line length — robust length handling

Failure mode: `sf` is a Windows `.cmd` shim launched through cmd.exe (~8191-char command-line limit). A big inline argument — the classic case is a `SELECT` over ~170 `PermissionsXxx` fields, but also a long `WHERE Id IN (...)`, a big SOSL, a long value list — pushes the line past the limit, and cmd.exe aborts with "La ligne de commande est trop longue" before `sf` runs. Two layers, applied to **every** generated tool:

1. **Spill large args to a file (preventive, transparent).** `runWithLargeArg(baseArgs, { inlineFlag, fileFlag, value, ext })` passes `value` inline (`inlineFlag value`) when the assembled line fits the budget, and otherwise writes `value` to a temp file and uses the command's **file-input flag** instead — each pair verified against `data.md`:
   - `sf data query` → inline `--query`, file `--file`.
   - `sf data query --use-tooling-api` → inline `--query`, file `--file`.
   - `sf data export bulk` → inline `--query`, file `--query-file`.
   - `sf data search` (SOSL) → inline `--query`, file `--file`.
   The temp file holds non-secret SOQL under the OS temp dir and is **always removed** (`finally`, `@rules/security.md`).
2. **Length guard (defensive backstop).** `run()` checks the assembled command line against `cmdLineBudget` (default **6000** chars on Windows, generous elsewhere — injectable for tests) and returns a **clear** `Result` error if it would overflow, so any command that did not spill (a future helper, a huge flag value) fails with an actionable message instead of the opaque parse error. A secondary check maps a cmd.exe "too long" / "trop longue" message to the same clear error.

Any new helper carrying a potentially-large text argument (SOQL, SOSL, a long value list) **must** route it through `runWithLargeArg` with the correct inline/file flag pair from the catalog — never `run()` with a raw inline arg.

## Composition root wiring — `src/cli.ts`

```ts
import { SfRunner } from "./sf/runner";
import { SfHelpers } from "./sf/helpers";
import * as config from "./config";

// SF_CLI_PATH wins, then the config sfPath key, else the bare "sf" resolved from PATH (cross-spawn resolves sf.cmd on Windows).
const runner = new SfRunner(() => process.env.SF_CLI_PATH || config.sfPath || "sf");
const sf = new SfHelpers(runner);   // injected into the services — the only owner of the runner
```

## Typed helpers — `src/sf/helpers.ts` (on top of the runner)

```ts
listOrgs(): Promise<Result<OrgInfo[]>>                       // sf org list                                    → auth-orgs.md §3
getDefaultOrg(): Promise<Result<string | undefined>>        // sf config get target-org                       → auth-orgs.md §4
setDefaultOrg(alias: string): Promise<Result<void>>         // sf config set target-org=<alias>               → auth-orgs.md §4
loginWeb(alias: string): Promise<Result<void>>              // sf org login web --alias <alias>  (sf opens the browser) → auth-orgs.md §2
logout(alias: string): Promise<Result<void>>                // sf org logout --target-org <alias> --no-prompt → auth-orgs.md §2
reconnect(alias: string): Promise<Result<void>>             // re-run sf org login web on an expired token    → auth-orgs.md §2
query(soql: string, org?: string): Promise<Result<QueryResult>>          // sf data query (--query, or --file for long SOQL)      → data.md §8
queryTooling(soql: string, org?: string): Promise<Result<QueryResult>>   // sf data query --use-tooling-api (--query|--file)       → data.md §8
bulkExport(soql: string, outputFile: string, org?: string): Promise<Result<BulkJobInfo>>  // sf data export bulk (--query|--query-file) --output-file <f> → data.md §8
bulkImport(file: string, sobject: string, org?: string): Promise<Result<BulkJobInfo>>     // sf data import bulk --file <f> --sobject <s>         → data.md §8
runApex(file: string, org?: string): Promise<Result<ApexRunResult>>      // sf apex run --file <file>                      → apex.md §7
```

Each helper **builds the args array** (user values = separate elements) and delegates to `run<T>()`:

```ts
// src/sf/helpers.ts
import type { Result, OrgInfo, QueryResult } from "../types";
import type { SfRunner } from "./runner";

interface OrgListResult { nonScratchOrgs?: OrgInfo[]; scratchOrgs?: OrgInfo[]; }

export class SfHelpers {
  constructor(private readonly runner: SfRunner) {}

  /** sf org list — auth-orgs.md §3. The result splits nonScratchOrgs / scratchOrgs (parse defensively). */
  async listOrgs(): Promise<Result<OrgInfo[]>> {
    const res = await this.runner.run<OrgListResult>(["org", "list"]);
    if (!res.ok) return res;
    const { nonScratchOrgs = [], scratchOrgs = [] } = res.data ?? {};
    return { ok: true, data: [...nonScratchOrgs, ...scratchOrgs] };
  }

  /** sf config set target-org=<alias> — auth-orgs.md §4. `sf config set` uses key=value: the alias stays a
   *  single argv element (cross-spawn, no shell → no injection), it is not spliced into a command string. */
  setDefaultOrg(alias: string): Promise<Result<void>> {
    return this.runner.run<void>(["config", "set", `target-org=${alias}`]);
  }

  /** sf data query — data.md §8. Large SOQL spills to `--file` when it would overflow the Windows command line
   *  ("Windows command-line length"); otherwise inline `--query`. org omitted → sf uses the default target-org. */
  query(soql: string, org?: string): Promise<Result<QueryResult>> {
    const base = ["data", "query"];
    if (org) base.push("--target-org", org);           // org is a separate argv element
    // soql is never spliced into a string: inline as a discrete element, or written to a temp file when too long.
    return this.runner.runWithLargeArg<QueryResult>(base, { inlineFlag: "--query", fileFlag: "--file", value: soql, ext: ".soql" });
  }
}
```

- **Every helper's command and flags are verified against the catalog** (the comment after each signature points at its section file). Do not guess a flag — look it up: orgs/auth/config → `auth-orgs.md`, `query` / `queryTooling` / `bulkExport` / `bulkImport` → `data.md`, `runApex` → `apex.md`, project-scoped deploy/retrieve → `metadata-deploy.md` (`@rules/sfdx-project.md`).
- **`--target-org` is "required" *or* a default org.** The catalog marks `-o, --target-org` **(required)** for the `data` / `apex` commands (`data.md`, `apex.md`), but `sf` satisfies it from a **configured default org** (`sf config set target-org`, or the `SF_TARGET_ORG` / `config.targetOrg` the tool sets) when the flag is absent — it is not a hard failure. That is why every helper takes `org?` optional and appends `--target-org` **only when a caller supplies one**, falling back to the default otherwise (`@rules/config.md` `targetOrg`). Read the catalog's "(required)" as "required unless a default target-org is set".
- Model the return types **defensively** in `src/types.ts` — only the fields the tool reads, all optional where `sf` may omit them:
  - `OrgInfo`: `alias?`, `username`, `orgId?`, `instanceUrl?`, `connectedStatus?` (`"Connected"`, `"RefreshTokenAuthError"`…), `isDefaultUsername?`, `isScratch?`.
  - `QueryResult`: `totalSize`, `done`, `records: Record<string, unknown>[]` (or a generic `QueryResult<T>`).
  - `BulkJobInfo`, `ApexRunResult`: the few fields the tool surfaces (job id / status, success / compiled / logs) — kept minimal and optional.
- The `data query` command reads `result.records` from the helper, then routes them through the **`output/` formatters** (`@rules/output.md`) — never `console.log(JSON.stringify(...))`. For large exports, prefer `bulkExport` (server-side pagination via `sf data export bulk`) over an in-memory `query` (see `@rules/output.md` "large result sets").

## Auth orchestration

- The tool **drives** `sf org login/logout` and `sf config set target-org`; it never reads, writes, or stores a token. `sf` performs the OAuth web flow and stores tokens in its own OS keychain.
- **"Reconnect on expired token"** = re-run `sf org login web` for that alias, triggered when `connectedStatus === "RefreshTokenAuthError"` (read from `listOrgs()` / `sf org display`).
- The tool may persist at most a **non-secret** org alias (in config, `@rules/config.md`); never a token (`@rules/security.md`). Nothing the tool writes is a secret.

## Starter `org` command group + `data` command (default scaffold)

The layering (`@rules/architecture.md`) is `commands` → `services` → `sf` + `output`. The starter scaffold spans these files:

| File | Role |
| ---- | ---- |
| `src/sf/runner.ts` | The runner — the only spawner. |
| `src/sf/helpers.ts` | Typed helpers on top of the runner. |
| `src/services/org.service.ts` | Org business logic (list with status, resolve/set default, login/logout/reconnect) — calls the helpers, returns `Result<T>`. No spawning, no formatting. |
| `src/commands/org.ts` | `org list` / `org use <alias>` / `org login <alias>` / `org logout <alias>` — thin adapters: validate flags → call the service → route data through `output/`. |
| `src/commands/data.ts` | `data query <soql>` / `data export <soql>` — demonstrates the runner + the `output/` formatters. |

- `org use <alias>` → `setDefaultOrg` (`sf config set target-org=<alias>`); `org login` → `loginWeb`; `org logout` → `logout`; `org list` → `listOrgs` (mark the default and the connection status).
- Each command **validates its input** (alias non-empty, SOQL present) before calling the service, and maps a failed `Result` to `stderr` + exit code at the boundary (`@rules/cli.md`). Business logic stays in the service; process execution stays in `src/sf/`.
- Every dataset a command emits goes through `formatOutput(...)` (`@rules/output.md`) with an explicit `{ format, destination }` — `stdout` carries data, `stderr` carries logs.

## Coupling modes

The coupling mode is chosen in Phase 1 and is a fixed property of the tool:

- **`standalone`** — the org is reached via `sf`, no SFDX project. Only the org-level helpers above are scaffolded.
- **`sfdx-project`** — the tool runs inside an `sfdx-project.json` folder and **adds project-scoped commands** (`deploy` / `retrieve`) on top of the same runner. Detection, `.forceignore`, the project-scoped `sf project ...` subcommands, and the mode guard are detailed in **`@rules/sfdx-project.md`**.

Both modes use the same `SfRunner` and the same `Result<T>` contract.

## Anti-patterns — what NOT to do

- **Do not** build the `sf` command as a concatenated string or use `shell: true` with interpolated input — pass an args array via `cross-spawn`.
- **Do not** call `node:child_process.spawn("sf", …)` directly — on Windows it fails to resolve the `sf.cmd` shim (`ENOENT`). Use `cross-spawn`.
- **Do not** spawn `sf` from a `services/` or `commands/` module — the runner lives in `src/sf/runner.ts` and is the only spawner; other layers call it.
- **Do not** read, store, or log an org token — `sf` owns tokens; the tool stores at most a non-secret alias.
- **Do not** add `jsforce` / `@salesforce/core` for the v1 use cases — the CLI covers them.
- **Do not** assume exact `sf --json` field names — parse defensively and verify against the installed CLI.
- **Do not** target `sfdx` (legacy) — `sf` v2 only.
- **Do not** emit a dataset with `console.log(JSON.stringify(...))` from a command — route it through the `output/` formatters (`@rules/output.md`).
- **Do not** pass a potentially-large SOQL/SOSL/value inline via `run()` on Windows — route it through `runWithLargeArg` (inline when it fits, temp `--file` / `--query-file` when it would overflow the ~8191-char command line).
- **Do not** let a command-line-too-long failure surface as the opaque "Réponse sf illisible" — the runner guards the assembled length and returns a clear, actionable error.

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: sf-cli). Not restated here, to avoid drift across files.
