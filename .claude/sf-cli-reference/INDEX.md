# SF CLI v2 — Command & flag reference (INDEX)

> Binding reference for the `sf` v2 command catalog. **Only relevant when the Salesforce CLI integration is on** (Phase 1 = Yes). Loaded on demand **by section, never read whole**: read this file first, then open only the section file(s) matching the capability you need.
> Executable: `sf` | CLI version: 2.142.0 | Release: Summer '26 | Updated: 2026-06-27
> Source: Salesforce CLI Command Reference (developer.salesforce.com).

## Reading convention

Under each command, a `Globals:` line states the availability of three cross-cutting flags:
- `--json`: machine-readable JSON output.
- `--api-version=<value>`: forces the REST API version used.
- `-o, --target-org=<value>`: target org (alias or username). `✓` = available, `✗` = not applicable.

Always present, not repeated: `--flags-dir=<value>` (loads flags from a directory) and `--help`.
For Dev Hub-targeting commands, the org flag is `-v, --target-dev-hub` instead of `-o`.

> Flag scope: exhaustive and verified for the stable plugins (`auth-orgs`, `metadata-deploy`, `apex`, `data`, `packaging`, `users-schema`, `platform-api`). For the recent plugins (`advanced.md`), globals + main flags are provided; confirm the detail with `sf <command> --help` as they change every release.

## Capability → file map

| You need to… | File | Covers |
|---|---|---|
| Connect/disconnect orgs, list/display/open, scratch orgs, sandboxes, aliases, CLI config | `auth-orgs.md` | §2 Auth · §3 Org management · §4 Configuration |
| Deploy/retrieve metadata, convert, generate a manifest, generate components (class/trigger/LWC/VF) | `metadata-deploy.md` | §5 Deploy/Retrieve · §6 Project & component generation |
| Run anonymous Apex, run/get Apex tests, debug logs, `logic` | `apex.md` | §7 Apex & Logic |
| Query (SOQL/SOSL), record CRUD, bulk import/export/update/upsert/delete, tree | `data.md` | §8 Data |
| Create/install/version/promote packages (2GP & 1GP) | `packaging.md` | §9 Packaging |
| Create users, assign permsets/licenses, describe/list sObjects, CMDT | `users-schema.md` | §10 Users & permissions · §11 Schema/sObjects/CMDT |
| System/CLI info (help/version/plugins), org limits, direct REST/GraphQL requests, diagnostics | `platform-api.md` | §1 System & global · §12 Limits & diagnostics · §13 Direct API |
| Experience Cloud, Lightning local dev, Agentforce, Code Analyzer, plugin development | `advanced.md` | §14-19 (recent plugins) |
| **Interpret** a Salesforce error surfaced by `sf` (Apex exception, DML `StatusCode`, `LimitException`, compile error) | `apex-errors.md` | §1-5 error catalog (design-time — `@rules/errors.md`) |

> `apex-errors.md` is an **error-interpretation reference** (a lookup of error names/codes → meaning), not a command-syntax section — the `Globals:` convention above does not apply to it. It complements `apex.md` (the Apex *commands*: run anonymous Apex, run tests, logs).

## Local verification

```bash
sf commands --json          # machine-readable list of every command
sf <topic> --help           # subcommands of a topic
sf <command> --help         # full flags and examples of a command
sf version --verbose        # versions of the CLI and each plugin
```

> Reliable way to verify flags: `sf <command> --help` on the installed version. oclif output separates FLAGS (command-specific) from GLOBAL FLAGS (`--flags-dir`, `--json`).
