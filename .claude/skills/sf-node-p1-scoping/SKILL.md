---
name: sf-node-p1-scoping
description: Phase 1 of the sf-node CLI generation cycle — scoping in 7 questions (coupling mode, output formats, tests, interactivity, execution shape, distribution, config strategy), framework-fixed defaults, calibration announcement (number of batches), and writing of the scoping spec.
model: sonnet
---

# /sf-node-p1-scoping — Scoping

## Role
Project scoper — turn a vague CLI idea into a bounded, validated scope.

## Goal
Lock the project parameters (coupling mode, output formats, tests, interactivity, execution shape, distribution, config strategy) before any analysis.

## Deliverable
`docs/specs/01-scoping.md` (written in the user's language) + on-screen summary.

---

## 1. Questions

**Phase banner (show first)** — on a new tool, first list the 5 phases once (overview in `## PIPELINE` of `CLAUDE.md`). Then output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 1/5 — Scoping; (2) progress line: ▶ Scoping · Features · Interface · Architecture · Development; (3) intent in italics: Destination folder, project parameters, Salesforce coupling mode.

Start with the objective, then establish the project root (folder name → location → creation), then ask the closed parameters with the `AskUserQuestion` tool (clickable options, the recommended one first). Cap = **4 questions per call** → **two calls**.

1. **Objective** — plain text, **not** `AskUserQuestion` (free-form, non-enumerable): "Tool objective? (free description — what it automates against Salesforce)".

### Project root (folder name → location → creation)

> Skip this block if a project root is already established for this flow.

- **Folder name** — propose 2-4 candidate names derived from the objective, **in kebab-case** (e.g. `sf-export`, `org-audit`), the recommended one first, with `AskUserQuestion` (the **Other** option carries a custom name as free-form text). The user selects a candidate or types their own. This is the **project directory name**, distinct from the tool name (the `bin`) chosen in Phase 2.
- **Location** — free-form text: `Parent folder where to create the project? (path, e.g. C:\projects)`.
- **Create the folder** — project root = `[parent]\[folder-name]`. Create it, then confirm: `Project root: [path]`. If it already exists and is not empty, warn and ask the user to confirm reuse or pick another name. Store this path as the project root — all generated files and specs (`docs/specs/`) are written there.

### Closed parameters

> **Salesforce / SFDX detection (before call 1)** — Salesforce coupling is **mandatory** (never a yes/no question); the detection only presets the **coupling mode** recommendation. Scan the objective for the SFDX cluster: `Salesforce`, `sf`, `org`, `sandbox`, `Apex`, `SOQL`, `sObject`, `metadata`, `deploy`/`retrieve`, `source`, `sfdx-project`, `package.xml`, `.forceignore`, `2GP`, `permission set`, `Dev Hub`. If the objective mentions a **local source tree** (project / source / deploy / retrieve / `sfdx-project.json` / `package.xml` / `.forceignore`), flip the coupling-mode recommendation to **`sfdx-project`**; otherwise recommend **`standalone`** (org reached via `sf`, no project). State the one-line rationale before the call.

2. **`AskUserQuestion` — call 1** (4 questions, each with a recommended option):
   - **Coupling mode** (@rules/sfdx-project.md · @rules/sf-cli.md): `standalone` — reach the org via `sf`, no project (recommended unless the objective needs a source tree) · `sfdx-project` — run inside an `sfdx-project.json` folder (deploy / retrieve / source). The detection above sets which is recommended. If `sfdx-project` is chosen, **afterwards** ask the SFDX project folder path as free-form text (`SFDX project folder? (the one holding sfdx-project.json)`), or detect an `sfdx-project.json` under the chosen root.
   - **Output formats** (@rules/output.md): `JSON + table` (recommended — JSON for piping/CI, table for human reads) · `JSON only` · `CSV` · the **Other** option covers `xlsx`, a custom combination, or a multi-select. `AskUserQuestion`'s `multiSelect` may be used to pick several. All four formatters ship in `output/`; the selection sets the **default `--format`** and the primary formats surfaced in `--help` / the README.
   - **Automated tests** (`vitest`, @rules/tests.md): `Yes` (recommended, pro use) · `No`.
   - **Runtime interactivity** (@rules/cli.md): `Non-interactive` (recommended — args in → run → exit, cron/CI-safe) · `Interactive prompts` (`@clack/prompts`, always guarded against a non-TTY / `--yes` run).
3. **`AskUserQuestion` — call 2** (3 questions):
   - **Execution shape** (@rules/architecture.md): `Single CLI with subcommands` (recommended — `mytool org list`, `mytool data query …`) · `+ standalone npm run scripts` (adds `scripts/` for one-off jobs on top of the CLI) · `Library + bins` (also exposes a programmatic API — `tsup` emits `.d.ts`, @rules/config.md).
   - **Distribution** (@rules/config.md): `Local repo` (recommended — private/internal, run via `npm run` / `node dist/cli.js`) · `npm package` (published, `"files": ["dist"]`) · `Bundled single-file exe`.
   - **Config strategy** (@rules/config.md): `Cascade config.ts < .env < flags` (recommended — the full `resolveConfig()`) · `.env + flags` · `flags + config.ts only`.

## 2. Framework-fixed defaults (stated, not asked)

State these once so the user knows what is non-negotiable — do **not** ask them:
- **CLI parser** = `commander` (`node:util parseArgs` only for a 1-2 script project).
- **Logger** = `pino` (file + `stderr`, `pino-pretty` in dev — @rules/logging.md).
- **Language / module** = TypeScript strict + ESM (`"type": "module"`).
- **Build / dev** = `tsup` (bundle `dist/cli.js`, shebang) · `tsx` (dev) · `tsc --noEmit` (typecheck).
- **Salesforce** = coupling mandatory, **`sf` v2 only** (never legacy `sfdx`); `cross-spawn` runner; the tool never handles tokens — `sf` owns the OS keychain (@rules/sf-cli.md · @rules/security.md).
- **Error / feedback** = `Result<T>` + named errors, `stdout` = data / `stderr` = logs, exit codes `0`/`1`/`2` (@rules/errors.md · @rules/cli.md).

## 3. Provisional calibration — announced at the end of Phase 1

Apply the CALIBRATION table in `CLAUDE.md` (canonical source): Small (< 10 files **and** ≤ 5 commands) → 3 batches; Medium/Large (≥ 10 files **or** > 5 commands) → 4 batches; divergent criteria → the highest wins. **+1 batch if tests are enabled** — Small 4 / Medium-Large 5. The `sf` runner + typed helpers and the starter `org` group + `data` command ship in the core batches (no dedicated batch); the `output/` formatters and the coupling mode (`sfdx-project` adds `project.ts` + a `deploy`/`retrieve` group) add files and push the size up.

Announce it as **provisional** (template, rendered in the user's language):

Provisional calibration: [Small | Medium/Large] — [N] batches (incl. 1 test batch if enabled)
(Confirmed at the end of Phase 2, after counting the real commands.)

The real command count is not known yet (commands are elicited in Phase 2). The calibration is **confirmed and locked at the end of Phase 2**, on the v1.0 command count.

## 4. Libraries

Any library outside the validated stack is proposed and validated **here** — none can be added later without the deviation protocol (Phase 4). Candidates tied to the answers above:
- a schema/validation lib (`zod`) — otherwise data crossing a trust boundary is validated with hand-written TS type guards (@rules/security.md).
- `@clack/prompts` — only if **Runtime interactivity = Interactive** (call 1).

State the resolved library list (it may be "none beyond the fixed stack").

## 5. Write the spec

Write `docs/specs/01-scoping.md` (in the user's language) capturing: objective, **coupling mode** (+ the SFDX project path if `sfdx-project`), output formats (+ the default `--format`), tests (Yes/No), runtime interactivity, execution shape, distribution, config strategy, the framework-fixed defaults, the validated libraries, and the provisional calibration (size + number of batches — confirmed in Phase 2). If `docs/specs/` does not exist yet, create it (it lives in the generated project root).

→ Chain to `/sf-node-p2-featuring` after validation.
