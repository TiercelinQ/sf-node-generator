# Salesforce Node CLI Generator (`sf-node`) - Unified

> Claude Code generator for **headless Node.js / TypeScript command-line tools** mandatorily coupled to **Salesforce** (`sf` v2 CLI).

Part of a family of Claude Code generators. See also [electron-app-generator](https://github.com/TiercelinQ/electron-app-generator), [flutter-app-generator](https://github.com/TiercelinQ/flutter-app-generator), [python-app-generator](https://github.com/TiercelinQ/python-app-generator), and [vscode-ext-generator](https://github.com/TiercelinQ/vscode-ext-generator). Where those generate UI apps, `sf-node` generates **headless CLI automation tools** that shell out to the `sf` CLI.

Unified edition: the full generation pipeline **plus** post-delivery maintenance skills, an explicit role per skill, persisted specs, centralized executable verification, and native memory.

---

## What it does

A structured prompt system that generates complete, production-ready Salesforce CLI tools through a 5-phase cycle, then maintains them:

1. **Scoping** - 4 user-facing questions (coupling mode `standalone` org via `sf` / `sfdx-project` inside an SFDX folder, output formats, tests, runtime interactivity), each option with a plain-language consequence. Execution shape, distribution, and config strategy are stated framework defaults (overridable on request), not questions. No palette, no UI (headless).
2. **Featuring** - command elicitation, MoSCoW prioritization, locked sizing.
3. **Surfaces** - map each validated command onto its CLI surface (positional args, flags, input source, output format + destination, exit codes).
4. **Architecture** - full file tree, command registry (command to service to `sf` helper to formatter), `Result<T>` + named errors, config keys - locked before any code is written.
5. **Development** - auto-chained batch delivery, executable verification (typecheck, lint, build, smoke `--help`).

Each phase writes a spec in the user's language to `docs/specs/` (`01-scoping` ... `04-architect`); the contract is the source of truth.

**Maintenance commands**: `/sf-node-add-feature` (add a command, contract-compliant), `/sf-node-trace-feature` (trace behavior across the layers), `/sf-node-fix-issue` (root-cause debugging), `/sf-node-refactor-code` (validated, behavior-preserving), `/sf-node-run-tests` (executable verification). Plus `/sf-node-load-project` and `/sf-node-generate-readme` for existing tools.

Every generated tool enforces the same layered architecture, the `Result<T>` + stdout/stderr + exit-code contract, the `cross-spawn` `sf` runner, and secret-safe handling (tokens stay in the `sf` OS keychain, never in a file).

---

## Generated tool stack

| Element         | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Target          | Headless CLI tool (cross-OS, Windows-first)                        |
| Runtime         | Node.js 24 LTS+ · ESM (`"type": "module"`)                         |
| Language        | TypeScript strict                                                  |
| Architecture    | Layered - `commands` to `services` to `sf` / `output` · root `cli.ts` |
| CLI parser      | `commander` (default) · `node:util parseArgs` (small-project fallback) |
| Salesforce CLI  | `sf` v2 - **mandatory** · `cross-spawn` runner + typed helpers      |
| Coupling mode   | `standalone` (org via `sf`) or `sfdx-project` (inside an SFDX folder) |
| Config          | Cascade `config.ts` < `.env` (native) < CLI flags · non-secret only |
| Secrets         | Held by the `sf` OS keychain - never in a file                    |
| Logging         | `pino` (file + stderr, `pino-pretty` in dev)                       |
| Runtime feedback | Hand-rolled progress reporter - steps/spinner + bar on stderr, auto-TTY, `--no-progress` |
| Output          | Formatters - JSON · CSV (`csv-stringify`) · xlsx (`exceljs`) · console table |
| Error contract  | `Result<T>` + named errors + exit-code mapping (0/1/2)             |
| Build           | `tsup` (bundle `dist/cli.js`, shebang) · `tsx` (dev)              |
| Tests           | `vitest` (opt-in)                                                 |
| Quality         | ESLint (flat config) + Prettier · TSDoc                           |

---

## Requirements

```bash
claude --version    # Claude Code CLI - installed and authenticated
node --version      # Node.js 24 LTS+
sf --version        # Salesforce CLI v2 - runtime prerequisite of the generated tool
```

---

## Getting started

```bash
git clone https://github.com/TiercelinQ/sf-node-generator.git
cd sf-node-generator
claude
```

Then in Claude Code:

```
/sf-node-app
```

---

## Commands

| Command                     | Action                                                  |
| --------------------------- | ------------------------------------------------------- |
| `/sf-node-app`              | Start menu (4 entry points incl. maintenance)           |
| `/sf-node-p1-scoping`       | Scoping - coupling mode, output, tests, execution        |
| `/sf-node-p2-featuring`     | Featuring - command sheet + locked sizing                |
| `/sf-node-p3-surfaces`     | Surfaces - the CLI contract                     |
| `/sf-node-p4-architect`     | Architect - locked architecture contract                 |
| `/sf-node-p5-development`   | Auto-chained batch delivery                              |
| `/sf-node-add-feature`      | Add a command to a shipped tool                          |
| `/sf-node-trace-feature`    | Trace a command across the layers                        |
| `/sf-node-fix-issue`        | Fix a bug - decision tree, root cause                    |
| `/sf-node-refactor-code`    | Refactor under explicit validation only                  |
| `/sf-node-run-tests`        | Executable verification (typecheck, lint, build, smoke)  |
| `/sf-node-load-project`     | Load an existing tool from its specs/README              |
| `/sf-node-generate-readme`  | Generate README.md for an existing tool                  |
| `/sf-node-save-session`     | Save current session state                               |
| `/sf-node-show-state`       | Current project status                                   |
| `/sf-node-show-contract`    | Display locked architecture contract                     |
| `/sf-node-save-memory`      | Persist a note in Claude Code native memory              |

---

## Generated tool structure

```
mytool/
├── package.json · tsconfig.json · tsup.config.ts · eslint.config.mjs · .prettierrc
├── .env.example · .gitignore · README.md
├── CLAUDE.md                      # Tool identity (origin, business context, deviations)
├── .claude/settings.json          # Guardrails + Stop verification hook (self-enforced tool)
├── docs/specs/                    # Generation specs (user's language): 01-scoping ... 04-architect
└── src/
    ├── cli.ts                     # bin entry: commander program, exit-code mapping
    ├── config.ts · logger.ts · progress.ts · types.ts · errors.ts   # shared - importable by all layers
    ├── sf/                        # runner.ts (cross-spawn) · helpers.ts · project.ts (sfdx mode)
    ├── services/                  # business logic - returns Result<T>
    ├── commands/                  # thin adapters (starter: org.ts, data.ts)
    └── output/                    # index.ts (dispatch) · csv.ts · xlsx.ts · table.ts
```

---

## CLI contract (in place of a design system)

`sf-node` is headless, so instead of a visual design system it enforces a **CLI contract**:

- **`stdout` carries data only** (the `output/` formatter's bytes) - pipeable to `jq` and friends.
- **`stderr` carries logs and human messages** - `pino` writes there and to a log file; `stdout` is never a log destination.
- **Exit codes**: `0` success · `1` runtime error · `2` usage/validation error - mapped once at the `cli.ts` boundary, never scattered.
- **`Result<T>`** flows up from `services`/`sf`/`output`; the command reads `result.ok`; the boundary maps a failure to an exit code.
- **Non-interactive by default** (cron / Windows Task Scheduler friendly); interactive prompts (`@clack/prompts`) are opt-in and guarded against a non-TTY run.
- **Runtime progress** on `stderr` (steps/spinner + bar) shows the operations a command performs - auto-on a TTY, silent when piped / cron / CI, `--no-progress` to disable; `stdout` stays clean.

---

## Salesforce coupling

Coupling is **mandatory** - every generated tool integrates the `sf` v2 CLI (never `sfdx` legacy):

- All `sf` calls go through `src/sf/runner.ts` via **`cross-spawn`** with an argument array (resolves the Windows `sf.cmd` shim, no injectable shell).
- The tool **never handles OAuth tokens** - `sf` owns the auth flow and the OS keychain; the tool stores at most a non-secret org alias.
- The binary is resolved cross-OS via `SF_CLI_PATH` / the `sfPath` config (no platform branch); `ENOENT` maps to a clear "sf not found" error.
- Every `sf` command/flag is verified against `.claude/sf-cli-reference/` (loaded by section) - never invented from memory.

---

## Security

`.claude/rules/security.md` is non-negotiable, applied to 100% of generated tools: `cross-spawn` argument array (no `shell: true`, no concatenated command string), external data validated from `unknown`, file paths resolved and confined under the base directory (no traversal), **no secret in `.env` / config / logs / commits** (`sf` keychain only). `/sf-node-fix-issue` and `/sf-node-add-feature` route through it.

---

## Documentation

- [GUIDE.md](GUIDE.md) - full usage guide (FR)
- `.claude/rules/` - domain rules:
  - `architecture.md` · `cli.md` · `errors.md` · `config.md` · `security.md` · `sf-cli.md` · `sfdx-project.md` · `output.md` · `logging.md` · `progress.md` · `tests.md`
  - `verification.md` - single source of truth for executable + static checks
  - `readme.md` - README synchronization rule
- `.claude/sf-cli-reference/` - `sf` v2 command/flag catalog (loaded by section)

---

## Generator family

| Generator | Stack | Target |
| --------- | ----- | ------ |
| [python-app-generator](https://github.com/TiercelinQ/python-app-generator) | Python · PyQt6 · QSS | Windows desktop |
| [electron-app-generator](https://github.com/TiercelinQ/electron-app-generator) | Node.js · Electron · React · TS | Windows desktop |
| [flutter-app-generator](https://github.com/TiercelinQ/flutter-app-generator) | Flutter · Dart · Riverpod | Android |
| [sf-node-generator](https://github.com/TiercelinQ/sf-node-generator) | Node.js · TypeScript · Salesforce CLI | Headless CLI |
| [vscode-ext-generator](https://github.com/TiercelinQ/vscode-ext-generator) | TypeScript · esbuild · native theming | VS Code extension |
| **sf-node-generator** | Node.js · TypeScript · `sf` v2 CLI | Headless CLI tool (Salesforce) |

---

## License

MIT
