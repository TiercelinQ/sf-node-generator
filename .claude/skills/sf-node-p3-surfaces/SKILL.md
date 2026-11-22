---
name: sf-node-p3-surfaces
description: Phase 3 of the sf-node generation cycle — map each validated v1.0 command onto its concrete CLI surface (subcommands, positional args, flags, I/O sources, output format, exit codes), grouped confirmation, validated synthesis written to the interface spec before Phase 4.
model: opus
effort: medium
---

# /sf-node-p3-surfaces — Surfaces (CLI contract)

## Role
CLI/interface designer — map the validated commands onto the concrete `commander` surface.

## Goal
Define, per command, the exact CLI contract: full name, positional args, flags, input source, output format + destination, and the `0`/`1`/`2` exit conditions — plus the global flags and the `--format`/`--output` convention that make the tool pipeable and schedulable.

## Deliverable
`docs/specs/03-surfaces.md` (written in the user's language) + on-screen synthesis.

---

## 1. Proposal

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 3/5 — Surfaces; (2) progress line: Scoping ✓ · Features ✓ · ▶ Surfaces · Architecture · Development; (3) intent in italics: Map the validated features onto the CLI surface. Use the label `Surfaces` in the progress map. See `## PIPELINE` in `CLAUDE.md`.

**Read `@rules/cli.md`, `@rules/output.md`, and `@rules/config.md` first** (not auto-imported). Read `docs/specs/01-scoping.md` (coupling mode, output formats, execution modes, tests) and `docs/specs/02-featuring.md` (the validated v1.0 commands and, with the guided assistant, the execution flows) for the decisions this phase builds on.

Based on the commands validated in Phase 2, propose the CLI surface: a **command tree** (groups → verbs) plus a **per-command spec**. The starter `org` group and the `data query` / `data export` demo commands are always part of the tree (`@rules/sf-cli.md`). Produce (in the user's language):

## Proposed command surface — [APP_NAME]

**Command tree**

```
[APP_NAME]
├── org
│   ├── list                 # list authenticated orgs (default + status)
│   ├── use <alias>          # set the default target-org
│   ├── login <alias>        # sf opens the browser OAuth flow
│   └── logout <alias>       # revoke a local auth
├── data
│   ├── query <soql>         # SOQL → output formatter
│   └── export <soql>        # bulk export → file
└── <group> <verb> …         # one line per validated v1.0 command
```

Then, for **each** command, a spec block (template below — repeat it for every command in the tree):

### `<group> <verb>` — [purpose in one line]
- **Positional args**: `<soql>` (required) · `<alias>` (required) · … — or *none*.
- **Flags** (per-command, on top of the global flags):

  | Flag | Type | Default | Required |
  | ---- | ---- | ------- | -------- |
  | `-f, --format <fmt>` | enum `table\|json\|csv\|xlsx` | *(per-command default, chosen in §2)* | no |
  | `-o, --output <file>` | path | stdout | no |
  | `--<flag> <value>` | … | … | … |

- **Input source**: flags (primary) · env/config (global settings) · stdin (piped SOQL / NDJSON to import) · file (`--file` for import / `apex run`). State which the command reads.
- **Output**: default `--format` = *(§2 choice)*; `-o, --output <file>` → file under `exportDir`, else `stdout` (data). `stderr` carries logs + human messages. `xlsx` requires a file destination.
- **Exit conditions** (`@rules/cli.md`): `0` success — including an empty result set (`Result` `kind: "warning"`, non-fatal, stays `0`); `1` runtime failure (`sf` error, IO error, unexpected throw); `2` usage/validation (bad flag value, missing/invalid SOQL or alias, unknown `--format`).
- **Execution modes**: `Flags only` - n/a, fully flag-driven, nothing is ever asked. *(Only if the guided assistant was enabled in Phase 1:)* the command's assistant, one row per question in asking order. Derive the questions from the command's own inputs (every required value and every choice the command needs), never from an example:

  | # | Question (user's language) | Type | Default | Validation | Equivalent flag | Required outside a terminal |
  | - | -------------------------- | ---- | ------- | ---------- | --------------- | --------------------------- |
  | 1 | …                          | text / select / confirm / multiselect | … | … | `--<flag>` | yes / no |

  Entry rule (`@rules/cli.md`): no argument in a terminal runs the assistant; with flags given, only the missing values are asked (hybrid); no argument outside a terminal is a usage error (exit `2`, help shown), never a blocking prompt. The assistant ends by printing the equivalent command line on `stderr`. A destructive command asks for confirmation first (always guarded, `--yes` skips it).
- **Flow** *(only if Phase 2 marked this command as a flow)*: the ordered steps (each step = one service it composes), `--only <steps>` / `--skip <steps>` when step selection is "all or some" (the assistant then opens with "everything, or choose the steps"), `--dry-run` when the flow has a dry-run step, a closing "another item?" question when it repeats, and the failure rule: the first failed step stops the flow, the steps already done are listed on `stderr`, exit `1`.

**Global flags** (every command inherits — resolved once by `resolveConfig()`, cascade `defaults < .env < flags`, `@rules/config.md`):

| Flag | Config field | Type | Default | `.env` key |
| ---- | ------------ | ---- | ------- | ---------- |
| `--target-org <alias>` | `targetOrg` | string | `sf` default org | `SF_TARGET_ORG` |
| `--api-version <v>` | `apiVersion` | string | `sf` default | `SF_API_VERSION` |
| `--export-dir <dir>` | `exportDir` | string | `exports` | `EXPORT_DIR` |
| `--page-size <n>` | `pageSize` | positive int | `2000` | `SF_PAGE_SIZE` |
| `--log-level <lvl>` | `logLevel` | pino level | `info` | `LOG_LEVEL` |
| `--sf-cli-path <path>` | `sfPath` | absolute path | resolved from `PATH` | `SF_CLI_PATH` |
| `--no-progress` | — (UI toggle, not in the cascade) | boolean | progress auto-on a TTY | — |
| `--yes` *(guided assistant only)* | - (UI toggle, not in the cascade) | boolean | off | - |

- `--help` / `--version` are **auto-provided** by commander — never re-specified. `--version` reads `APP_VERSION` from `config.ts`.
- `--no-progress` disables the live progress display (steps/spinner on `stderr`); the display is auto-on when `stderr` is a TTY and off when piped / `CI` / debug logging — a runtime UI toggle, not a config-cascade key (`@rules/progress.md`).
- `--yes` (only with the guided assistant) skips every confirmation question; it never replaces a required value, which stays an error (exit `2`) when missing outside a terminal. Like `--no-progress`, it is a runtime toggle, not a config-cascade key (`@rules/cli.md`).

**Output convention** (`@rules/output.md`, `@rules/cli.md`) — the same across every command:
- `-f, --format <table|json|csv|xlsx>` picks the `output/` formatter; the per-command default is confirmed in §2.
- `-o, --output <file>` redirects the dataset to a file (resolved + confined under `exportDir`, `@rules/security.md`); absent → `stdout`. `-o` is `--output`, **not** a short alias for `--target-org`.
- `stdout` carries **data only** (pipeable: `… --format json | jq …`); `stderr` carries logs + human messages. Prefer the tool's own `--format json` over exposing `sf`'s raw `--json` envelope.

> **If the coupling mode is `sfdx-project` (Phase 1)** — add the project-scoped command surface on top of the org/data groups (`@rules/sfdx-project.md`), each with its own spec block:
> - `deploy` → `sf project deploy start`: flags `--source-dir` / `--metadata` / `--manifest`, `--target-org`, `--dry-run`, `--wait`.
> - `retrieve` → `sf project retrieve start`: flags `--source-dir` / `--metadata` / `--manifest`, `--target-org`, `--wait`.
>
> In `standalone` mode, no `deploy` / `retrieve` command exists.

## 2. Customization — questions via `AskUserQuestion`

For each question, mark the recommended option `(recommended)`, chosen from the validated command context. Ask with `AskUserQuestion` (clickable options, 2-4 each, built-in **Other** for a custom value; ≤ 4 questions per call — split into several calls). Ask in the user's language. Show only the questions relevant to the validated commands.

Grouped confirmations (first call, ≤ 4 questions):

1. **Command grouping** — keep the proposed tree (`org`, `data`, `<group>` …)? `Keep as proposed (recommended)` · `Adjust` (**Other** → free-form rename/regroup).
2. **Tool-wide default output format** (the fallback for a command that sets none): `table` (recommended — human-readable) · `json` · `csv`.
3. **Default destination for an export-style command**: `stdout` (recommended for `data query`) · a file under `exportDir` (recommended for `data export` / bulk).
Assistant calls (next call, **only if the guided assistant was enabled in Phase 1**; with `Flags only`, skip them: every command is fully flag-driven):

4. **Commands with an assistant** (`multiSelect` over the v1.0 commands; the flows marked in Phase 2 are the recommended ones).
5. **Destructive commands that confirm first** (always guarded: no terminal or `--yes` skips the question): the enumerated destructive commands among those (e.g. `org logout`, a delete/import command).

The questions of each assistant (the table of the spec block) are proposed by the skill from the command's inputs and adjusted at the synthesis validation, free-form; only closed choices inside them (a `select`, a `confirm` default) use `AskUserQuestion` if the user asks to change them.

Per-command default format (next call(s), one question per data-producing command, batched ≤ 4 per call, split as needed): `table` · `json` · `csv` · `xlsx`. Recommend `table` for interactive reads, and `csv` / `xlsx` to a file for a `data query` written out. (`data export` uses the Bulk API — `csv` / `json` only, always to a file — not the `output/` formatters, so `xlsx` does not apply there.)

Command/verb renames beyond the enumerable grouping choice are handled free-form at the synthesis validation, not via `AskUserQuestion`.

## 3. Synthesis

Produce the complete synthesis of the validated interface (in the user's language): the command tree, each command's spec block (positional args, per-command flags, input source, output format + destination, exit conditions, execution modes with each assistant's question table and each flow's steps and flags), the global flags table, the `--format`/`--output` convention, and — in `sfdx-project` mode — the `deploy` / `retrieve` surface. Note any deviation from the starter scaffold.

**→ Explicit validation required before Phase 4.**

## 4. Write the spec

Once validated, write the synthesis to `docs/specs/03-surfaces.md` (in the user's language).

→ Chain to `/sf-node-p4-architect` after validation.
