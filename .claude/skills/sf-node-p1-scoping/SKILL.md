---
name: sf-node-p1-scoping
description: Phase 1 of the sf-node CLI generation cycle — scoping in 4 user-facing questions (coupling mode, output formats, tests, interactivity) plus stated framework defaults (execution shape, distribution, config strategy — overridable on request), and writing of the scoping spec. Sizing is determined internally in Phase 2, not announced in Phase 1.
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

**Phase banner (show first)** — on a new tool, first list the 5 phases once (overview in `## PIPELINE` of `CLAUDE.md`). Then output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 1/5 — Scoping; (2) progress line: ▶ Scoping · Features · Surfaces · Architecture · Development; (3) intent in italics: Destination folder, project parameters, Salesforce coupling mode.

Start with the objective, then establish the project name and root (name → location → creation), then ask the closed parameters in **a single `AskUserQuestion` call** (clickable options, the recommended one first, one plain-language consequence per option). Anything the user cannot decide without seeing its consequence is **auto-detected or a stated default** (§2), never a question — Phase 1 asks only what genuinely needs the user's input.

1. **Objective** — plain text, **not** `AskUserQuestion` (free-form, non-enumerable): "Tool objective? (free description — what it automates against Salesforce)".

### Project name and root (name → location → creation)

> Skip this block if a project root is already established for this flow.

- **Tool name** — propose 2-4 candidate names derived from the objective, **in kebab-case** (e.g. `sf-export`, `org-audit`), the recommended one first, with `AskUserQuestion` (the **Other** option carries a custom name as free-form text). This **single name** is used for **both** the project directory and the `bin` — no second naming question. Phase 2 confirms it and lets the user adjust the `bin` only if they want it to differ from the folder.
- **Location** — free-form text: `Parent folder where to create the project? (path, e.g. C:\projects)`.
- **Create the folder** — project root = `[parent]\[name]`. Create it, then confirm: `Project root: [path]`. If it already exists and is not empty, warn and ask the user to confirm reuse or pick another name. Store this path as the project root — all generated files and specs (`docs/specs/`) are written there.

### Closed parameters

> **Salesforce / SFDX detection (before the call)** — Salesforce coupling is **mandatory** (never a yes/no question); the detection only presets the **coupling mode** recommendation. Scan the objective for the SFDX cluster: `Salesforce`, `sf`, `org`, `sandbox`, `Apex`, `SOQL`, `sObject`, `metadata`, `deploy`/`retrieve`, `source`, `sfdx-project`, `package.xml`, `.forceignore`, `2GP`, `permission set`, `Dev Hub`. If the objective mentions a **local source tree** (project / source / deploy / retrieve / `sfdx-project.json` / `package.xml` / `.forceignore`), flip the coupling-mode recommendation to **`sfdx-project`**; otherwise recommend **`standalone`** (org reached via `sf`, no project). State the one-line rationale before the call.

2. **`AskUserQuestion` — one call, 4 questions** (each with a recommended option and a one-line consequence so an Apex developer sees what the choice changes):
   - **Coupling mode** (@rules/sfdx-project.md · @rules/sf-cli.md): `standalone` — reach the org via `sf`, no project folder (recommended unless the objective needs a source tree) · `sfdx-project` — the tool runs inside an `sfdx-project.json` folder and gains `deploy` / `retrieve` / source commands. The detection above sets which is recommended. If `sfdx-project` is chosen, **afterwards** ask the SFDX project folder path as free-form text (`SFDX project folder? (the one holding sfdx-project.json)`), or detect an `sfdx-project.json` under the chosen root.
   - **Output formats** (@rules/output.md): `JSON + table` (recommended — JSON to pipe into `jq`/CI, table to read on screen) · `JSON only` · `CSV` · the **Other** option covers `xlsx`, a custom combination, or a multi-select. `AskUserQuestion`'s `multiSelect` may be used to pick several. All four formatters ship in `output/` regardless; the selection only sets the **default `--format`** and the formats surfaced in `--help` / the README.
   - **Automated tests** (`vitest`, @rules/tests.md): `Yes` (recommended — a `test/` suite and one extra delivery batch) · `No` (no test files, one fewer batch).
   - **Runtime interactivity** (@rules/cli.md): `Non-interactive` (recommended — args in → run → exit, safe for cron/CI) · `Interactive prompts` (`@clack/prompts`, always guarded against a non-TTY / `--yes` run).

## 2. Framework-fixed defaults (stated, not asked)

State these once so the user knows what is non-negotiable — do **not** ask them:
- **CLI parser** = `commander` (`node:util parseArgs` only for a 1-2 script project).
- **Logger** = `pino` (file + `stderr`, `pino-pretty` in dev — @rules/logging.md).
- **Runtime feedback** = progress reporter (`src/progress.ts`) — steps/spinner + bar on `stderr`, auto-on a TTY, `--no-progress` to disable (@rules/progress.md).
- **Language / module** = TypeScript strict + ESM (`"type": "module"`).
- **Build / dev** = `tsup` (bundle `dist/cli.js`, shebang) · `tsx` (dev) · `tsc --noEmit` (typecheck).
- **Salesforce** = coupling mandatory, **`sf` v2 only** (never legacy `sfdx`); `cross-spawn` runner; the tool never handles tokens — `sf` owns the OS keychain (@rules/sf-cli.md · @rules/security.md).
- **Error / feedback** = `Result<T>` + named errors, `stdout` = data / `stderr` = logs, exit codes `0`/`1`/`2` (@rules/errors.md · @rules/cli.md).

### Project-shape defaults (stated, not asked — overridable on request)

These three were previously questions. Each has one sensible default for an internal Salesforce tool, and an Apex developer rarely has the Node context to choose meaningfully up front — so **state the default, do not ask**. The user overrides only by saying so.

- **Execution shape** (@rules/architecture.md) = single CLI with subcommands (`mytool org list`, `mytool data query …`). Override on request: `+ standalone npm run scripts` (adds `scripts/` for one-off jobs) or `library + bins` (also a programmatic API — `tsup` emits `.d.ts`, @rules/config.md).
- **Distribution** (@rules/config.md) = local repo (private/internal, run via `npm run` / `node dist/cli.js`). Override on request: `npm package` (published, `"files": ["dist"]`) or `bundled single-file exe`.
- **Config strategy** (@rules/config.md) = full cascade `config.ts < .env < flags` (the complete `resolveConfig()`). Override on request: `.env + flags` or `flags + config.ts only`.

State them in **one line** (user's language), e.g.: "Défauts appliqués — CLI à sous-commandes, dépôt local, config en cascade `config.ts < .env < flags`. Pour en changer (scripts autonomes, paquet npm/exe, config réduite), dis-le maintenant ; sinon on continue." Only if the user asks to change one do you turn it into an `AskUserQuestion`.

## 3. Calibration — internal, not announced here

Do **not** announce a calibration to the user in Phase 1. The command count is unknown (commands are elicited in Phase 2), so any batch number stated now is speculative and would only change — announcing it is ceremony, not information.

Sizing is an **internal planning input** (it drives the batch split in Phase 5), determined at the **end of Phase 2** from the real v1.0 command count and recorded in the spec — see `## CALIBRATION` in `CLAUDE.md` (canonical table) and `/sf-node-p2-featuring`. Nothing about it needs the user's decision.

## 4. Libraries

Any library outside the validated stack is proposed and validated **here** — none can be added later without the deviation protocol (Phase 4). Candidates tied to the answers above:
- a schema/validation lib (`zod`) — otherwise data crossing a trust boundary is validated with hand-written TS type guards (@rules/security.md).
- `@clack/prompts` — only if **Runtime interactivity = Interactive** (the interactivity question).

State the resolved library list (it may be "none beyond the fixed stack").

## 5. Write the spec

Write `docs/specs/01-scoping.md` (in the user's language) capturing: objective, **coupling mode** (+ the SFDX project path if `sfdx-project`), output formats (+ the default `--format`), tests (Yes/No), runtime interactivity, execution shape, distribution, config strategy, the framework-fixed defaults, and the validated libraries. Do not write a provisional calibration in Phase 1 — the sizing (size + number of batches) is recorded internally in Phase 2 once the commands are known. If `docs/specs/` does not exist yet, create it (it lives in the generated project root).

→ Chain to `/sf-node-p2-featuring` after validation.
