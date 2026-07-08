# Config, package.json, build & dependency rules — sf-node CLI

> This rule **owns** `src/config.ts`: the typed defaults and the single `resolveConfig()` cascade (`defaults < .env < CLI flags`, **non-secret only**). It also owns the root build/quality files — `package.json`, `tsup.config.ts`, `tsconfig.json` — and the dependency pinning discipline. Secrets never live here: `sf` holds credentials in the OS keychain, the tool stores at most a non-secret alias (`@rules/security.md`). Layering: `@rules/architecture.md`.

## `src/config.ts` — the config cascade

```ts
// src/config.ts
import type { LevelWithSilent } from "pino";

// --- Static identity (not part of the runtime cascade) ----------------------
export const APP_NAME = "mytool";        // tool name — the `bin`, the log context, the [TOOL]_DEBUG var (@rules/logging.md)
export const APP_VERSION = "1.0.0";      // surfaced by `--version` (@rules/cli.md)
export const COUPLING_MODE: "standalone" | "sfdx-project" = "standalone"; // fixed in Phase 1 — @rules/sfdx-project.md

// --- Typed configuration ----------------------------------------------------
/** Fully-resolved, non-secret configuration — the single object the composition root threads down. */
export interface AppConfig {
  /** Default org alias/username; used when a command omits `--target-org`. Passed to `sf` as a discrete arg (@rules/security.md). */
  targetOrg?: string;
  /** Base directory for file exports; each output path is resolved + traversal-checked under it (@rules/security.md, @rules/output.md). */
  exportDir: string;
  /** Salesforce API version pinned on `sf` calls (e.g. "62.0"); unset → the CLI default. */
  apiVersion?: string;
  /** Page size for batched SOQL reads (@rules/output.md). */
  pageSize: number;
  /** pino level (@rules/logging.md). */
  logLevel: LevelWithSilent;
  /** Absolute path to the `sf` binary; unset → resolved from PATH by cross-spawn (@rules/sf-cli.md). */
  sfPath?: string;
}

/** Lowest cascade layer — typed, non-secret defaults. */
export const DEFAULTS: AppConfig = {
  exportDir: "exports",
  pageSize: 2000,
  logLevel: "info",
};

/** Parsed global CLI flags (from commander's `program.opts()`); every field optional — only the flags the user passed
 *  are present. cli.ts coerces `--page-size` to a number before calling resolveConfig (@rules/cli.md). */
export interface CliFlags {
  targetOrg?: string;
  exportDir?: string;
  apiVersion?: string;
  pageSize?: number;
  logLevel?: LevelWithSilent;
  sfPath?: string;
}

const LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

/** Validate an enum env value; unknown → undefined (falls back to the lower cascade layer). */
function toLevel(v: string | undefined): LevelWithSilent | undefined {
  return v !== undefined && (LEVELS as readonly string[]).includes(v) ? (v as LevelWithSilent) : undefined;
}

/** Validate a positive-integer env value; invalid → undefined. */
function toPositiveInt(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Drop `undefined` keys so a later cascade layer never clobbers an earlier value with a hole. */
function prune<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** The env layer — non-secret keys only, each parsed and validated. `.env` is loaded natively (below); real env vars feed it too. */
function fromEnv(): Partial<AppConfig> {
  const e = process.env;
  return prune<Partial<AppConfig>>({
    targetOrg: e.SF_TARGET_ORG,
    exportDir: e.EXPORT_DIR,
    apiVersion: e.SF_API_VERSION,
    pageSize: toPositiveInt(e.SF_PAGE_SIZE),
    logLevel: toLevel(e.LOG_LEVEL),
    sfPath: e.SF_CLI_PATH,
  });
}

/** Resolve the effective config: DEFAULTS < .env / env < CLI flags. Called once, in cli.ts. */
export function resolveConfig(flags: CliFlags = {}): AppConfig {
  return { ...DEFAULTS, ...fromEnv(), ...prune(flags) };
}
```

- **One resolution, threaded down.** `resolveConfig()` runs **once** in `cli.ts`; the resulting `AppConfig` is passed to the services/`sf`/`output` layers (composition root). Modules never read `process.env` directly (`@rules/architecture.md`). The `sf` binary path comes from `SF_CLI_PATH` / `--sf-cli-path` (surfaced as `config.sfPath`); the runner uses it or falls back to `PATH` (`@rules/sf-cli.md`).
- **Pure merge.** The cascade is `DEFAULTS` (typed) < the env layer (validated non-secret keys) < global CLI flags. `prune` drops `undefined` so a higher layer overrides only the keys it actually sets — a missing flag never blanks a default.
- **Validated at the boundary.** Env values are parsed/validated (`toLevel`, `toPositiveInt`) — external input is never trusted raw (`@rules/security.md`). An invalid `SF_PAGE_SIZE` / `LOG_LEVEL` silently falls back to the lower layer.
- **Non-secret only.** No token/password/session id ever lives in `config.ts` or `.env` — `sf` owns credentials in the OS keychain; the tool stores at most a non-secret org alias (`@rules/security.md`).
- Any constant reused in more than one file lives here (identity + `DEFAULTS`); a shared **type** lives in `src/types.ts` (`@rules/architecture.md`).

## Environment keys (`.env`, non-secret only)

| Env key (`.env`) | `AppConfig` field | Parsed as | Default | Global CLI flag |
| ---------------- | ----------------- | --------- | ------- | --------------- |
| `SF_TARGET_ORG`  | `targetOrg` | string            | — (sf default) | `--target-org` |
| `EXPORT_DIR`     | `exportDir` | string (base dir) | `exports`      | `--export-dir` |
| `SF_API_VERSION` | `apiVersion`| string            | — (sf default) | `--api-version` |
| `SF_PAGE_SIZE`   | `pageSize`  | positive int      | `2000`         | `--page-size` |
| `LOG_LEVEL`      | `logLevel`  | pino level        | `info`         | `--log-level` |
| `SF_CLI_PATH`    | `sfPath`    | string (abs path) | — (PATH)       | `--sf-cli-path` |

- These are the **global** config flags read by `resolveConfig`. The **per-command** output flags `--format` / `--output` (`-f` / `-o`) are a separate concern, handled by the command and mapped to `{ format, destination }` (`@rules/output.md`, `@rules/cli.md`). `-o` is `--output`, not a short alias for `--target-org`.

## `.env` — native load, no `dotenv`

`.env` is read with **Node's native loader**, so there is **no `dotenv` dependency**. `cli.ts` loads it before resolving config:

```ts
// src/cli.ts (excerpt) — load the non-secret .env before resolving config.
try {
  process.loadEnvFile();          // Node ≥ 20.12 / 24 — same parser as `node --env-file=.env`; throws if .env is absent
} catch {
  /* no .env file — rely on the real environment + DEFAULTS */
}
const config = resolveConfig(toCliFlags(program.opts())); // resolve once; thread `config` down (@rules/architecture.md)
```

- `process.loadEnvFile()` is used (rather than only the `node --env-file` flag) so the packaged `bin` (shebang, no node flags) and `tsx` dev both load `.env` with no launch ceremony. Equivalent alternative for a direct node run: `node --env-file=.env dist/cli.js`.
- A key already set in the **real environment** takes precedence over `.env` (Node's `--env-file` semantics) — `fromEnv()` reads whatever ends up in `process.env`.
- **`.env.example` is committed; `.env` is gitignored** (`@rules/security.md`).

```bash
# .env.example — committed. Copy to .env (gitignored). NON-SECRET values only.
# NEVER put a Salesforce token/password/session id here — `sf` owns credentials in the OS keychain (@rules/security.md).
SF_TARGET_ORG=my-org-alias
EXPORT_DIR=exports
SF_API_VERSION=62.0
SF_PAGE_SIZE=2000
LOG_LEVEL=info
# SF_CLI_PATH=/absolute/path/to/sf   # only if `sf` is not on PATH
```

```gitignore
# .gitignore (essentials)
node_modules/
dist/
logs/            # pino log file — @rules/logging.md
.env             # non-secret config, but machine-local — @rules/security.md
exports/         # generated exports may hold org/PII data — @rules/security.md
```

## `package.json` — scripts, `type`, `bin`

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "type": "module",
  "bin": { "mytool": "dist/cli.js" },
  "files": ["dist"],
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run"
  }
}
```

- **`"type": "module"`** — the tool is ESM. Relative imports are **extensionless** (`import { resolveConfig } from "./config"`, never `./config.js`) — `moduleResolution: "bundler"` for typecheck, `tsx` in dev, and `tsup` for the bundle all resolve them; no extension ever reaches Node's ESM resolver.
- **`"bin"`** maps the tool name → the built `dist/cli.js` (shebang added by tsup). After `npm link` / global install the tool runs as `mytool`.
- **`"files": ["dist"]`** — only if publishing to npm (whitelist the built output). Omit for a private/internal tool.
- **`"test"`** is present only when tests were enabled in Phase 1 (`@rules/tests.md`); otherwise drop the script.
- `dev` runs the TS entry directly with `tsx` (no build step); `.env` is loaded programmatically by `cli.ts` (above), so dev and the built bin behave the same.

## `tsup.config.ts`

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],                       // "type": "module" — ESM only
  target: "node24",                      // match the Node LTS line (see dependency table)
  platform: "node",
  clean: true,                           // wipe dist/ before each build
  dts: false,                            // CLI: no .d.ts. Lib+bins mode → true (note below)
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" }, // shebang → dist/cli.js is directly executable (the `bin`)
});
```

- One entry → `dist/cli.js`. **tsup externalizes `dependencies` / `peerDependencies` by default** (they resolve from `node_modules` at runtime) and bundles only your `src/` (+ any imported `devDependency`). So every runtime-imported package (pino, pino-pretty, commander, cross-spawn, exceljs, csv-stringify) must be a `dependency`. For **local** and **npm-package** distribution `node_modules` is present at runtime, so external deps are correct. The **bundled single-file exe** mode (Phase 1) is a separate advanced build (bundle deps in, or Node SEA / `@vercel/ncc`) and must special-case `pino`/`pino-pretty`, which resist ESM bundling.
- **Lib+bins mode** (the tool also exposes a programmatic API): add the library entry (`entry: ["src/cli.ts", "src/index.ts"]`) and set **`dts: true`** to emit declarations for the library entry.

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",       // extensionless relative imports (tsup bundles)
    "types": ["node"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,             // default import of CJS deps (cross-spawn, pino-pretty)
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true                       // tsc is typecheck-only; tsup owns emit — no rootDir/outDir (avoids TS6059)
    // "verbatimModuleSyntax": true      // optional — enforces `import type`. Leave OFF if a CJS dep imported
    //                                   // via `export =` (cross-spawn / pino-pretty) fights the default import.
  },
  "include": ["src", "tsup.config.ts", "eslint.config.mjs"],
  "exclude": ["node_modules", "dist"]
}
```

- **`moduleResolution: "bundler"`** + tsup → **extensionless relative imports**; never write `./config.js`.
- **`strict: true`** plus `noUnusedLocals` / `noUnusedParameters`; no unjustified `any` — external data (`sf --json`, files, args, env) is `unknown` then validated (`@rules/security.md`).
- Typecheck is **`tsc --noEmit`**; the shipped bundle comes from tsup/esbuild, not `tsc`.
- **No `rootDir` / `outDir`** — `tsc` is typecheck-only and `include` lists the root-level `tsup.config.ts`; a `rootDir: "src"` raises `TS6059` ("file not under rootDir"). Use `noEmit: true` and omit `rootDir`/`outDir`.

## `eslint.config.mjs` (flat config)

```js
// eslint.config.mjs — ESLint 10 flat config with typescript-eslint (self-contained: bundles parser + plugin).
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Match tsconfig's noUnusedParameters convention: an intentionally-unused arg/var is prefixed `_`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
```

- **`argsIgnorePattern: "^_"` is mandatory.** `typescript-eslint`'s `no-unused-vars` does **not** honor the `_` prefix by default, whereas `tsconfig`'s `noUnusedParameters` does — without this override a deliberately-unused `_dest` / `_e` parameter (e.g. `output/table.ts`) fails `eslint` while passing `tsc`. Keep the two in sync.
- `recommended` (non-type-checked) is enough for a CLI. Add `recommendedTypeChecked` only if type-aware lint is needed (it requires `parserOptions.project`).
- No `@eslint/js` dependency needed — `typescript-eslint`'s shared config is self-contained.

## Dependency versioning

`package.json`: caret versions (`^`), pinned to the minor validated in Phase 1. `package-lock.json` committed.

```json
"dependencies":    { "commander": "^15.0.0", "cross-spawn": "^7.0.6", "pino": "^10.3.1",
                     "pino-pretty": "^13.1.3", "exceljs": "^4.4.0", "csv-stringify": "^6.8.1" },
"devDependencies": { "typescript": "^5.9.3", "tsup": "^8.5.1", "tsx": "^4.23.0",
                     "@types/node": "^24", "@types/cross-spawn": "^6.0.6",
                     "eslint": "^10.6.0", "typescript-eslint": "^8.63.0",
                     "prettier": "^3.9.4" }
```

Conditional (added only when the matching Phase 1 option is on):
- **Interactive prompts** (opt-in): `@clack/prompts ^1.7.0` in `dependencies`. Not added by default — a headless CLI takes its input from flags/env, and prompts must be guarded against a non-TTY / `--yes` run (`@rules/cli.md`).
- **Tests** (Phase 1): `vitest ^4.1.10` in `devDependencies` + the `"test": "vitest run"` script (`@rules/tests.md`).

Versioning notes:
- **`@types/node`**: match the **target Node LTS line** — `^24` for Node 24. Targeting current (Node 26) → `^26`. Keep it in sync with the `tsup` `target` and `engines.node`.
- **`typescript ^5.9.3` + `typescript-eslint ^8.63.0`**: typescript-eslint 8's TypeScript peer range is `>=4.8.4 <6.1.0`, so pin TypeScript to the **latest 5.x** line (`5.9.3` at authoring time — the newest stable within that range). **TypeScript 6.x never shipped stable** (it went from `6.0.0-beta` straight to the `7.x` line; the registry `latest` is `7.0.2`), and typescript-eslint 8 does **not** support TS 7. Do **not** pin `^6.x` / `^7.x` until a typescript-eslint major widens its peer range to include it. Confirm both at generation time: `npm view typescript dist-tags`, `npm view typescript-eslint peerDependencies`.
- **`eslint ^10.6.0`**: **flat config only** (`eslint.config.mjs`) and needs **Node ≥ 20**. **`commander ^15.0.0`** also needs **Node ≥ 20** — both are satisfied by the Node 24 target.
- **`csv-stringify ^6.8.1`**: the **standalone package from the `csv` project** (`csv-stringify`, not the umbrella `csv` bundle) — import `csv-stringify` / `csv-stringify/sync` for the sync API (`@rules/output.md`).
- **`exceljs ^4.4.0`**: the maintained **xlsx** choice. **Avoid SheetJS / `xlsx`** (supply-chain / security history) — do not substitute it (`@rules/output.md`).
- **`pino ^10.3.1`** + **`pino-pretty ^13.1.3`** — **both runtime `dependencies`** (the mandatory logging pair, `@rules/logging.md`). `pino-pretty` is imported at module load by `src/logger.ts` (used whenever `NODE_ENV !== "production"`), so it must be a `dependency`, **not** a devDependency: **tsup externalizes `dependencies` but bundles `devDependencies`**, and a bundled `pino-pretty` throws `Dynamic require of "tty" is not supported` in the ESM output. Rule of thumb: every package imported by shipped `src/` goes in `dependencies`.
- **`cross-spawn ^7.0.6`** (runtime) + **`@types/cross-spawn ^6.0.6`** (dev): the only correct way to spawn `sf` cross-OS (`@rules/sf-cli.md`, `@rules/security.md`).

> **Version maintenance**: this table and these notes reflect the state validated at authoring time. Before pinning in a new project, re-confirm the current minors (`npm outdated`, the release notes) — they age. The caret rule and the structure stay; the numbers and notes are refreshed per project in Phase 1.

## Anti-patterns — what NOT to do

- **Do not** add `dotenv` — `.env` is read natively (`process.loadEnvFile()` / `--env-file`).
- **Do not** read `process.env` scattered across the code — the env layer is read **once** in `resolveConfig()`; modules receive the resolved `AppConfig`.
- **Do not** put a token/password/secret in `.env` or `config.ts` — non-secret only; `sf` owns credentials, the tool stores at most a non-secret alias (`@rules/security.md`).
- **Do not** commit `.env` — only `.env.example` (placeholder values).
- **Do not** let a later cascade layer's `undefined` clobber an earlier value — `prune` before merge.
- **Do not** trust an env value raw — validate it (`toLevel`, `toPositiveInt`); an invalid value falls back to the lower layer.
- **Do not** add a `.js` extension to a relative import — `moduleResolution: "bundler"` + tsup use extensionless imports.
- **Do not** hardcode a constant reused in more than one file — promote it to `config.ts`; a shared type to `src/types.ts`.
- **Do not** bump a dependency major without re-checking the compatibility notes above (peer ranges, Node floor, flat config).

## Integrity verification

`@rules/verification.md` is the single source of truth for verification (run silently, report only on a discrepancy). The concrete checks for this domain are the **Anti-patterns** listed above (read each as a check) together with `@rules/verification.md` (§A executable checks + §B per-domain: config). Not restated here, to avoid drift across files.
