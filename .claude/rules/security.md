# Security rules — Node CLI + Salesforce — NON-NEGOTIABLE

> Applied to 100% of generated tools. Any deviation requires the contract declaration protocol (stop → declare → validate). The tool is a headless CLI that shells out to `sf` and reads/writes local files: the attack surface is **process execution**, **untrusted input**, **file paths**, and **secrets**. `sf` owns all Salesforce credentials — the tool never handles a token.

## 1. Process execution — the `sf` runner only

- **Every `sf` (and any external-CLI) invocation spawns with an argument ARRAY via `cross-spawn`, from `src/sf/runner.ts` only.** No other module spawns a process (`@rules/architecture.md`, `@rules/sf-cli.md`).
- **Never `node:child_process.spawn("sf", …)` directly.** On Windows the binary is a `sf.cmd` shim; a bare spawn fails with `ENOENT` (Node's security fix blocks running a `.cmd` without a shell). `cross-spawn` resolves the shim **and escapes arguments** on every OS.
- **Never `shell: true` with interpolated input, never a concatenated command string.** `cross-spawn` never spawns through a shell, so there is no injectable command line.
- **User-provided values (org alias, SOQL, file paths, flag values) are separate array elements** — never spliced into a string. This is the command-injection guard.

```ts
// GOOD — args array, no shell, each user value a discrete element (src/sf/runner.ts)
spawn(bin, ["data", "query", "--query", soql, "--target-org", orgAlias, "--json"]);

// BAD — never: an injectable shell string. `soql` = 'x"; rm -rf ~ #' would run.
spawn(`sf data query --query "${soql}"`, { shell: true });
```

- The binary is resolved from **`config.sfPath`** (populated by `SF_CLI_PATH` / `--sf-cli-path`) or the bare `sf` on `PATH` — cross-OS, no `if (win32)` (`@rules/sf-cli.md`).
- The runner returns **`Result<T>`** (`@rules/errors.md`): it maps `ENOENT` → a clear "sf not found" error and a non-zero `sf` status / unparseable `--json` → an error — it never throws a raw spawn error at the user.

## 2. Input validation — external data is `unknown` then validated

- **All data crossing a trust boundary is typed `unknown`, then validated before use**: the `sf --json` envelope, `sfdx-project.json`, CLI args/flags, imported file contents (CSV/JSON to load), and env values.
- Validate with dedicated **TS type guards** (shape, required fields, bounds, enum membership). A schema library (`zod`…) is used **only if validated in Phase 1** — otherwise hand-written guards.
- The **`sf --json` envelope is parsed defensively**: field names drift across `sf` versions; read `status` / `result`, guard missing fields, never assume an exact shape (`@rules/sf-cli.md`).
- Numeric/enum **env values** (`SF_PAGE_SIZE`, `LOG_LEVEL`) are parsed and validated in `resolveConfig()` (`@rules/config.md`), never trusted raw.
- **No `any` on external data** — `unknown` then narrow. An `any` that lets an unvalidated `sf` field flow into logic is a defect.

## 3. File paths — resolve and confine

- **Every path derived from user input** (`--output` / `EXPORT_DIR` destinations, an `--input` file to import, an Apex `--file`) is resolved with `path.resolve` and **verified to stay under the allowed base directory** before any read/write. No traversal (`..`), no absolute escape.

```ts
import { resolve, relative, isAbsolute, sep } from "node:path";
import { ValidationError } from "./errors"; // bad input → exit 2 (@rules/errors.md)

/** Resolve `candidate` and confirm it stays under `baseDir`; raise ValidationError otherwise. */
export function resolveWithin(baseDir: string, candidate: string): string {
  const base = resolve(baseDir);
  const target = resolve(base, candidate);
  const rel = relative(base, target);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ValidationError(`Path escapes the allowed directory: ${candidate}`);
  }
  return target;
}
```

- The `output/` layer writes only **under the resolved `exportDir`**; an import reads only the explicitly provided file. Create parent dirs with `recursive: true` **under the base**, never outside it.
- On Windows, `relative` returns an **absolute** path for a cross-drive target, so `isAbsolute(rel)` catches a `D:\…` escape; `path.resolve` collapses `..` segments so a `../../etc/passwd` candidate is caught by the `..` prefix.

## 4. Secrets — never in a file, a log, or a commit

- **No secret ever in a file, in config, in logs, or in a commit.** `sf` owns all Salesforce credentials (OAuth access/refresh tokens) in the **OS keychain**; the tool never reads, writes, or logs a token.
- The tool persists at most a **non-secret** org alias (`SF_TARGET_ORG` in `.env`, or a config default). An alias is a handle to a keychain entry, not a credential.
- **`.env` holds non-secret configuration only and is gitignored**; only `.env.example` (placeholder values) is committed (`@rules/config.md`).
- **Never echo a token / password / session id** to stdout, stderr, or the log file (`@rules/logging.md`). The `Result` error `message` (stderr) and `detail` (log) must never carry a secret. If a real secret ever has to be handled, defer to `sf` / the OS keychain — never plain `.env` or `config.ts`.
- **Generated data exports can contain org / PII data** — the export directory is gitignored (or lives outside the repo); never commit exported records (`@rules/config.md`).

## 5. Misc

- **No `eval`, `new Function`, or `node:vm`** on any untrusted input (env, file contents, `sf` output, CLI args). No dynamic `import()` of a path built from user input.
- **`npm audit`** is part of the last-batch install instructions (`@rules/architecture.md` batch delivery); keep dependencies on supported versions (`@rules/config.md`).
- **`sf` is a documented runtime prerequisite**, not a bundled dependency; the README states the cross-OS install + the `SF_CLI_PATH` fallback and the coupling mode (`@rules/sf-cli.md`, `@rules/readme.md`).
- `stdout` carries **data only** (pipeable); a diagnostic, a path, or an error detail never leaks into piped output — the human message goes to stderr, the detail to the log file (`@rules/cli.md`, `@rules/logging.md`).

## Anti-patterns — what NOT to do

- **Do not** build the `sf` command as a concatenated string or use `shell: true` with interpolated input — pass an args array via `cross-spawn`.
- **Do not** call `node:child_process.spawn("sf", …)` directly — on Windows it fails to resolve the `sf.cmd` shim (`ENOENT`). Use `cross-spawn`.
- **Do not** spawn a process from `commands/`, `services/`, or `output/` — only `src/sf/runner.ts` spawns (`@rules/sf-cli.md`).
- **Do not** use external data (`sf --json`, files, args, env) without validating it from `unknown` first — no `any` shortcut.
- **Do not** read or write a path built from user input without the under-base-dir check — no traversal, no absolute escape.
- **Do not** put a token / password / secret in `.env`, `config.ts`, a log line, a `Result` message/detail, or a commit — `sf` keychain only; a non-secret alias is the most the tool stores.
- **Do not** commit `.env` or exported data files — only `.env.example`.
- **Do not** `eval` / `new Function` / `vm` untrusted input, nor dynamic-`import()` a user-supplied path.
- **Do not** target `sfdx` (legacy) — `sf` v2 only.

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: security). Not restated here, to avoid drift across files.
