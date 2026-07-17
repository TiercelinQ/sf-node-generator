# Versioning & changelog rules — sf-node CLI tool

> The generated tool keeps a human-readable changelog and a SemVer version. This rule defines the changelog format, where the version lives, how each maintenance operation feeds the changelog, and how `/sf-node-release` cuts a version. Referenced by `/sf-node-p5-development`, `/sf-node-add-feature`, `/sf-node-fix-issue`, `/sf-node-refactor-code`, `/sf-node-load-project`, and `/sf-node-release`.

## Canonical file — `docs/release/CHANGELOG.md`

- The changelog lives at **`docs/release/CHANGELOG.md`** (create the `docs/release/` folder if absent). This is the single source of truth for the tool's release history.
- **Written in English**, regardless of the user's language — it is a deploy artifact meant to be pasted into a GitHub release. (Specs and README stay in the user's language; the changelog does not.)
- Format: **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)** + **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

Seed written at generation (Phase 5):

```markdown
# Changelog

All notable changes to this project are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

## [1.0.0] - <YYYY-MM-DD>
### Added
- Initial release.
```

## Entry categories

Under `## [Unreleased]`, group entries in these sections (Keep a Changelog), in this order, omitting empty ones:

- `### Added` — a new command/capability (backward compatible).
- `### Changed` — a change to existing behavior, an internal refactor.
- `### Fixed` — a bug fix.
- `### Removed` — a removed command/flag/capability.
- `### Security` — a security fix.

A **breaking change** (incompatible with the previous version) is marked with a leading `**BREAKING:**` in its entry (usually under `Changed` or `Removed`). This marker drives the MAJOR inference at release.

## Version source — single source, `APP_VERSION` auto-derived

- **Canonical**: `package.json` `"version"`.
- **Derived (nothing to mirror)**: `src/config.ts` `APP_VERSION` is imported from `package.json` (`import { version } from "../package.json"`), so it **always equals** the canonical version automatically. `/sf-node-release` bumps `package.json` `"version"` **only** — there is no second location to write and nothing to keep in sync (`@rules/config.md`). `--version` reads `APP_VERSION`, i.e. the same literal.
- The version at the **top released block** of `docs/release/CHANGELOG.md` must match the canonical version. Between releases, `[Unreleased]` sits above it and carries the pending entries.

## SemVer mapping (per maintenance operation)

Operations **accumulate** entries under `[Unreleased]` — they do **not** bump the version. The bump happens once, at `/sf-node-release`. The mapping below is what each operation contributes, and what the release inference reads:

| Operation | Changelog section | Release effect |
| --------- | ----------------- | -------------- |
| `add-feature` | `Added` (+ `Changed` if it alters existing behavior) | MINOR |
| `fix-issue` | `Fixed` | PATCH |
| `refactor-code` | `Changed` (internal) | PATCH |
| breaking change (any op) | `**BREAKING:**` marker (`Changed`/`Removed`) | MAJOR |

## Release inference (`/sf-node-release`)

From the accumulated `[Unreleased]` entries, infer the increment:

1. Any `**BREAKING:**` marker or a `Removed` entry → **MAJOR**.
2. Else any `Added` entry → **MINOR**.
3. Else (only `Fixed` / internal `Changed`) → **PATCH**.

The inferred increment is **proposed** to the user (`AskUserQuestion`, inferred option preselected as recommended); the user can override — notably to force a MAJOR the inference cannot detect. MAJOR is never applied silently.

### What counts as breaking (MAJOR) for a headless CLI tool

The **CLI contract is the public API** — anything a script, a pipe, or a scheduled job depends on. A change is breaking when it breaks a caller written against the previous version:

- A **command or flag renamed or removed** (a downstream `mytool org list …` invocation stops working).
- A change to **exit-code semantics** (`0` success · `1` runtime error · `2` usage/validation) — a scheduler's success/failure alerting is keyed on the code (`@rules/cli.md`).
- A change to the **`stdout` data format/shape** (a renamed/removed field, a different JSON/CSV structure) that breaks a downstream pipe (`… --format json | jq …`).
- A change to an **existing command's default behavior** (a default flag value, the default output format/destination, a default org resolution).
- A **removed or renamed config key** (`.env` variable / CLI flag) a caller relied on (`@rules/config.md`).

## Anti-patterns — what NOT to do

- **Do not** put the changelog at the project root — it lives in `docs/release/CHANGELOG.md`. (The tool's root `CHANGELOG.md`, if any, is a separate concern; this system owns `docs/release/CHANGELOG.md`.)
- **Do not** write the changelog in the user's language — English only.
- **Do not** bump `package.json` `"version"` in a maintenance operation — only `/sf-node-release` bumps.
- **Do not** hand-write `APP_VERSION` in `src/config.ts` — it is derived from `package.json` (`import { version } …`); bumping `package.json` is enough. A hardcoded duplicate is exactly the desync this removes.
- **Do not** apply a MAJOR bump without explicit user confirmation.
- **Do not** leave stale entries under `[Unreleased]` after a release — they move into the cut version block, and `[Unreleased]` is reset empty.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: `docs/release/CHANGELOG.md` present and Keep a Changelog-shaped (English); the top released version matches `package.json` `"version"` (and therefore `src/config.ts` `APP_VERSION`, which is derived from it — no separate mirror to check); every maintenance change added an `[Unreleased]` entry in the right category (no silent change); after a release, `[Unreleased]` is reset empty and the cut block carries the correct version + date.
