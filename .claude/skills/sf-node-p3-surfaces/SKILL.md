---
name: sf-node-p3-surfaces
description: Phase 3 of the sf-node generation cycle — map each validated v1.0 command onto its concrete CLI surface (subcommands, positional args, flags, I/O sources, output format, exit codes), grouped confirmation, validated synthesis written to the interface spec before Phase 4.
model: sonnet
---

# /sf-node-p3-surfaces — Surfaces

## Role
CLI/interface designer — map the validated commands onto the concrete `commander` surface.

## Goal
Define, per command, the exact CLI contract: full name, positional args, flags, input source, output format + destination, and the `0`/`1`/`2` exit conditions — plus the global flags and the `--format`/`--output` convention that make the tool pipeable and schedulable.

## Deliverable
`docs/specs/03-surfaces.md` (written in the user's language) + on-screen synthesis.

---

## 1. Proposal

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 3/5 — Surfaces; (2) progress line: Scoping ✓ · Features ✓ · ▶ Surfaces · Architecture · Development; (3) intent in italics: Map the validated features onto the CLI surface. Use the label `Surfaces` in the progress map. See `## PIPELINE` in `CLAUDE.md`.

**Read `@rules/cli.md`, `@rules/output.md`, and `@rules/config.md` first** (not auto-imported). Read `docs/specs/01-scoping.md` (coupling mode, output formats, interactivity opt-in, tests) and `docs/specs/02-featuring.md` (the validated v1.0 commands) for the decisions this phase builds on.

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
- **Interactive prompt**: n/a — non-interactive (fully flag-driven). *(Only if interactivity was enabled in Phase 1:)* the guarded prompt + its safe default — never prompt when `stdout`/`stdin` is not a TTY or `--yes` is set; a non-TTY run without `--yes` takes the safe default (abort a destructive action). See `@rules/cli.md`.

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

- `--help` / `--version` are **auto-provided** by commander — never re-specified. `--version` reads `APP_VERSION` from `config.ts`.
- `--no-progress` disables the live progress display (steps/spinner on `stderr`); the display is auto-on when `stderr` is a TTY and off when piped / `CI` / debug logging — a runtime UI toggle, not a config-cascade key (`@rules/progress.md`).

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
4. **[Only if interactivity was enabled in Phase 1]** which destructive command(s) prompt for confirmation (always guarded — non-TTY / `--yes` → safe default): the enumerated destructive commands (e.g. `org logout`, a delete/import command). If interactivity is off, skip this — every command is fully flag-driven.

Per-command default format (next call(s), one question per data-producing command, batched ≤ 4 per call, split as needed): `table` · `json` · `csv` · `xlsx`. Recommend `table` for interactive reads, `csv` / `xlsx` (to a file) for bulk exports.

Command/verb renames beyond the enumerable grouping choice are handled free-form at the synthesis validation, not via `AskUserQuestion`.

## 3. Synthesis

Produce the complete synthesis of the validated interface (in the user's language): the command tree, each command's spec block (positional args, per-command flags, input source, output format + destination, exit conditions, interactive prompt), the global flags table, the `--format`/`--output` convention, and — in `sfdx-project` mode — the `deploy` / `retrieve` surface. Note any deviation from the starter scaffold.

**→ Explicit validation required before Phase 4.**

## 4. Write the spec

Once validated, write the synthesis to `docs/specs/03-surfaces.md` (in the user's language).

→ Chain to `/sf-node-p4-architect` after validation.
