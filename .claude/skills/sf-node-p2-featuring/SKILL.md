---
name: sf-node-p2-featuring
description: Phase 2 of the sf-node CLI generation cycle — command elicitation, MoSCoW prioritization, v1.0 scope, calibration confirmed here, blocking validation before Phase 3, written to the featuring spec.
model: sonnet
---

# /sf-node-p2-featuring — Requirements analysis

## Role
Requirements analyst — elicit the tool's commands, prioritize them (MoSCoW), and bound the v1.0 scope.

## Goal
Produce a prioritized command list, set the v1.0 perimeter, confirm the calibration, and get explicit sign-off before any interface work.

## Deliverable
`docs/specs/02-featuring.md` (written in the user's language) + on-screen sheet.

---

## Instructions — Phase 2: Requirements analysis

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 2/5 — Features; (2) progress line: Scoping ✓ · ▶ Features · Interface · Architecture · Development; (3) intent in italics: Elicit commands, prioritize (MoSCoW), and bound the v1.0 scope. See `## PIPELINE` in `CLAUDE.md`.

Read `docs/specs/01-scoping.md` first (objective + locked parameters: coupling mode, output formats, tests, interactivity, execution shape, distribution, config). Work in the user's language. Each closed/enumerable choice uses `AskUserQuestion`; open input (command ideas, custom name) stays free-form text.

### Step 1 — Tool name

Claude **proposes** 2-4 candidate names derived from the objective, **in kebab-case** (this is the `bin` name — e.g. `sf-export`, `org-audit`), then lets the user decide. **Do not mark a recommended option and do not auto-select** — the name is the user's call (a deliberate local exception to the "always recommend" rule in `CLAUDE.md`, limited to this step). Offer the candidates with `AskUserQuestion`; the built-in **Other** option carries a custom name as free-form text. Block until the user picks a candidate or provides their own name — never settle the name alone. The resolved name feeds the sheet, the spec, and `APP_NAME` / the `bin` downstream (`src/config.ts`, `package.json`).

### Step 2 — Command elicitation (iterative)

A **command** is a unit of work exposed on the CLI surface (`org list`, `data export`, `deploy`, `apex run`…). From the objective, propose a base set of candidate commands. Then loop, asking as free-form text: "Other commands to add? (free description, or 'done')". Maintain the running candidate list; stop when the user signals no more ideas.

> The **starter scaffold** already ships baseline commands — present them as included, and elicit only the commands built on top:
> - the **`org` group** (`list` / `use` / `login` / `logout`) + the **`data query` / `data export`** command (@rules/sf-cli.md) in every tool;
> - the **`deploy` / `retrieve`** group additionally when the coupling mode is `sfdx-project` (@rules/sfdx-project.md).

### Step 3 — MoSCoW prioritization

Propose a reasoned classification of every candidate command into **Must / Should / Could / Won't**, shown as a table. Then: "Confirm or list the adjustments." Apply the user's moves.

### Step 4 — v1.0 perimeter

Default derivation: **Must + Should = included in v1.0**; **Could + Won't = excluded**. Present the included/excluded split and ask the user to confirm or move individual commands either way.

### Step 5 — Synthesis sheet

Produce the sheet (in the user's language):

## Requirements — [TOOL_NAME]

**Tool name**
[TOOL_NAME] (chosen by the user; candidates proposed: [c1], [c2], [c3]) — the `bin`.

**Objective**
[Concise description, from Phase 1]

**Commands by priority (MoSCoW)**
| Priority | Command | v1.0 |
| -------- | ------- | ---- |
| Must     | …       | ✓    |
| Should   | …       | ✓    |
| Could    | …       | —    |
| Won't    | …       | —    |

**v1.0 perimeter**
- Included (Must + Should): [list]
- Deferred — Could (possible in a later version): [list]
- Dropped — Won't (out of scope, deliberate): [list]

**Technical constraints**
- Runtime: Node 24+ · TypeScript strict · ESM · `commander` · `pino` · `tsup`/`tsx`
- Coupling mode: [standalone | sfdx-project] (+ SFDX project path if sfdx-project) — `sf` v2, mandatory
- Output formats: [Phase 1 selection] (default `--format`: [value])
- Tests: [Yes/No] — `vitest`
- Interactivity: [Non-interactive | Interactive] — `@clack/prompts` if interactive
- Execution shape: [Phase 1]
- Distribution: [Phase 1]
- Config strategy: [Phase 1]
- Validated libraries: [Phase 1 list]

**Calibration (confirmed here, from the v1.0 command count)**
- Counted v1.0 commands: [N] (incl. the starter `org` + `data` commands, and `deploy`/`retrieve` in sfdx-project mode)
- Estimated files: [N]
- Chosen size: [Small | Medium / Large]
- Batches: [N] (incl. 1 test batch if enabled)

Apply the CALIBRATION table in `CLAUDE.md` (canonical source). **The calibration is confirmed here, from the v1.0 command count, and locked upon validation.** Only the included (v1.0) commands are counted — deferred/dropped ones do not enter the count. The starter `org` group + `data` command (and the `deploy`/`retrieve` group in `sfdx-project` mode) are part of the scaffold — count them in the total.

End with:

→ Validation required before Phase 3.
  The calibration is locked upon validation.
  Confirm or list the adjustments.

**Blocking rule**: do not move to Phase 3 until validation is explicit. If partial validation: list the open points, block until full resolution.

## Write the spec

Once validated, write the sheet to `docs/specs/02-featuring.md` (in the user's language), including the tool name, the MoSCoW table with the v1.0 column, and the **two distinct exclusion sections (Deferred — Could / Dropped — Won't)**.

→ Chain to `/sf-node-p3-interface` after validation.
