# SFDX project coupling mode — sf-node CLI tool

> Conditional — only when the Phase 1 coupling mode = **`sfdx-project`** (vs `standalone`). In this mode the tool runs inside, or points at, an SFDX project folder: it reads `sfdx-project.json`, respects `.forceignore`, and adds project-scoped `sf project ...` commands on top of the same `SfRunner` (`@rules/sf-cli.md`). When the mode is `standalone`, none of this applies — no project detection, no `deploy` / `retrieve` command group.

The mode is a **fixed property of the tool**, decided in Phase 1 and locked in the Phase 4 contract. It is not a runtime toggle.

## When it applies

- The tool's Phase 1 coupling mode is `sfdx-project`.
- The tool operates on a local SFDX source tree (deploy, retrieve, preview, convert, generate a manifest) targeting an org resolved via `sf` (the org helpers of `@rules/sf-cli.md` still apply).
- The project root is **resolved once at startup** by the composition root (`src/cli.ts`); a missing project is a fatal startup error, not a per-command surprise.

## Project detection — `src/sf/project.ts`

`detectSfdxProject(cwd): Promise<Result<SfdxProject>>` reads and parses `sfdx-project.json` from the given directory. Incoming JSON is `unknown`, then validated before use.

```ts
// src/sf/project.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Result, SfdxProject } from "../types";

/** Read + validate sfdx-project.json. Missing file → Result error (the startup path maps it to ProjectNotFoundError). */
export async function detectSfdxProject(cwd: string): Promise<Result<SfdxProject>> {
  const file = join(cwd, "sfdx-project.json");
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return { ok: false, error: {
      kind: "error",
      message: `Aucun sfdx-project.json trouvé dans ${cwd}.`,
      detail: "Lancez l'outil depuis un dossier SFDX, ou utilisez le mode standalone.",
    } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);            // external data → unknown, validated below
  } catch (e) {
    return { ok: false, error: { kind: "error", message: "sfdx-project.json illisible (JSON invalide).", detail: (e as Error).message } };
  }
  if (!isSfdxProject(parsed)) {
    return { ok: false, error: { kind: "error", message: "sfdx-project.json invalide : packageDirectories manquant ou mal formé." } };
  }
  return { ok: true, data: parsed };
}

function isSfdxProject(v: unknown): v is SfdxProject {
  if (typeof v !== "object" || v === null) return false;
  const dirs = (v as Record<string, unknown>).packageDirectories;
  return Array.isArray(dirs)
    && dirs.every((d) => typeof d === "object" && d !== null && typeof (d as Record<string, unknown>).path === "string");
}
```

DTO in `src/types.ts` (model only the fields the tool reads, defensively):

```ts
export interface PackageDirectory { path: string; default?: boolean; }
export interface SfdxProject {
  packageDirectories: PackageDirectory[];   // at least one; exactly one `default: true` in a valid project
  sourceApiVersion?: string;
  namespace?: string;
  sfdcLoginUrl?: string;
  packageAliases?: Record<string, string>;
}
```

- The **default package directory** is `packageDirectories.find((d) => d.default)?.path` — never hardcode a path like `force-app`; read it from the parsed project.
- A missing / invalid file returns a `Result` error. When the tool **requires** a project at startup (this mode), the composition root treats that failure as fatal by raising the named `ProjectNotFoundError` (`src/errors.ts`, `@rules/errors.md`), which the CLI boundary maps to `stderr` + a non-zero exit code (`@rules/cli.md`).

## Respecting `.forceignore`

- Do **not** act on paths excluded by `.forceignore`, and do **not** reimplement `.forceignore` matching. The `sf project deploy start` / `sf project retrieve start` commands already honor `.forceignore` server-side and client-side — deploying/retrieving source through them is automatically compliant.
- To inspect what is excluded, use `sf project list ignored` (`-p, --source-dir`, `metadata-deploy.md`) rather than parsing the file yourself. Surface its output through the `output/` formatters if the tool exposes it.
- Any custom path enumeration the tool does (e.g. listing candidate files) must delegate the ignore decision to `sf`, not to a hand-rolled matcher.

## Project-scoped `sf` subcommands

All run through the same `SfRunner.run<T>()` (args array, `--json` appended). Flags verified against `metadata-deploy.md`:

| Command | Key flags (catalog) | Purpose |
| ------- | ------------------- | ------- |
| `sf project deploy start` | `-d, --source-dir` / `-m, --metadata` / `-x, --manifest` · `-o, --target-org` · `-l, --test-level` · `-w, --wait` · `-r, --dry-run` | Deploy source to an org. |
| `sf project retrieve start` | `-d, --source-dir` / `-m, --metadata` / `-x, --manifest` · `-o, --target-org` · `-w, --wait` | Retrieve metadata into the project. |
| `sf project deploy preview` | `-d, --source-dir` / `-m, --metadata` / `-x, --manifest` · `-o, --target-org` · `--concise` | Preview components / conflicts / ignored. |
| `sf project convert source` | `-r, --root-dir` · `-d, --output-dir` · `-x, --manifest` | Source format → metadata (mdapi) format. |
| `sf project convert mdapi` | `-r, --root-dir` (required) · `-d, --output-dir` · `-x, --manifest` | Metadata format → source format. |
| `sf project generate manifest` | `-m, --metadata` / `-p, --source-dir` · `-n, --name` · `-t, --type` (pre\|post\|destroy) · `--from-org` | Generate a `package.xml`. |

A project-scoped helper builds an args array exactly like the org helpers, then delegates to the runner:

```ts
// src/sf/project-commands.ts — project-scoped helpers, all via SfRunner (args array)
import type { Result, DeployResult } from "../types";
import type { SfRunner } from "./runner";

export class SfProjectCommands {
  constructor(private readonly runner: SfRunner) {}

  /** sf project deploy start — metadata-deploy.md §5. Each value is a separate argv element. */
  deployStart(opts: { sourceDir?: string; manifest?: string; org?: string; dryRun?: boolean }): Promise<Result<DeployResult>> {
    const args = ["project", "deploy", "start"];
    if (opts.sourceDir) args.push("--source-dir", opts.sourceDir);
    if (opts.manifest)  args.push("--manifest", opts.manifest);
    if (opts.org)       args.push("--target-org", opts.org);
    if (opts.dryRun)    args.push("--dry-run");
    return this.runner.run<DeployResult>(args);
  }
}
```

- `DeployResult` in `src/types.ts` is modeled defensively — only the fields the tool surfaces (`status?`, `success?`, `numberComponentsDeployed?`, `details?`), all optional.
- In this mode a starter **`deploy` / `retrieve` command group** is scaffolded (`src/commands/deploy.ts`, `src/commands/retrieve.ts`) following the same `commands` → `services` → `sf` layering as the org group (`@rules/sf-cli.md`, `@rules/architecture.md`). Deploy/retrieve results are routed through the `output/` formatters (`@rules/output.md`).

## Mode guard

Keep the check small and explicit — one mode constant, not scattered `if`s:

```ts
// src/config.ts (excerpt) — coupling mode is a fixed tool property, set in Phase 1
export const COUPLING_MODE: "standalone" | "sfdx-project" = "sfdx-project";
```

- **`sfdx-project` tool**: resolve the project root once at startup (`detectSfdxProject(process.cwd())` in `src/cli.ts`); fail fast with `ProjectNotFoundError` if absent. All project-scoped commands then reuse the resolved `SfdxProject` — no re-detection per command.
- **`standalone` tool**: the project-scoped commands are **not scaffolded** at all; never call `detectSfdxProject`, never assume an `sfdx-project.json`. A project-scoped operation reaching a standalone tool is a bug, guarded once:

```ts
if (COUPLING_MODE !== "sfdx-project") {
  return { ok: false, error: { kind: "error", message: "Commande projet indisponible en mode standalone." } };
}
```

## Anti-patterns — what NOT to do

- **Do not** hardcode a package directory (`force-app`) — read `packageDirectories` and honor the `default` entry.
- **Do not** ignore `.forceignore` or reimplement its matching — deploy/retrieve through `sf`, which already honors it; inspect with `sf project list ignored`.
- **Do not** assume an SFDX project in `standalone` mode — no detection, no project-scoped command.
- **Do not** parse `sfdx-project.json` into a typed value without validating it first — `JSON.parse` yields `unknown`, then a type guard.
- **Do not** spawn `sf project ...` outside `src/sf/` — project-scoped helpers use the same `SfRunner` as everything else (`@rules/sf-cli.md`).
- **Do not** re-detect the project on every command — resolve the root once at startup and reuse it.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: the **Anti-patterns** listed above are the concrete checks for this domain — read each as a check; §A executable checks and §B per-domain: sfdx-project cover the rest. Run silently; report only on a discrepancy.
