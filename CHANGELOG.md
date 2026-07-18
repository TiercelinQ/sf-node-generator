# Changelog

All notable changes to this generator are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.
(This is the changelog of the **generator** itself, distinct from the `docs/release/CHANGELOG.md` of each generated tool.)

## [1.2.0] - 2026-07-18
### Added
- Post-delivery reminder: the Phase 5 delivery summary and the generated tool `CLAUDE.md` now list the maintenance commands and `/sf-node-release`.

## [1.1.0] - 2026-07-17
### Added
- App changelog + SemVer versioning system for generated tools: new `rules/versioning.md`, new `/sf-node-release` skill, and a seeded `docs/release/CHANGELOG.md` (Keep a Changelog, English). The release skill bumps `package.json` `"version"` only — `APP_VERSION` is derived from it.
- Maintenance skills (`add-feature`, `fix-issue`, `refactor-code`) now record their change under `## [Unreleased]`; `/sf-node-load-project` offers to initialize the changelog retroactively on a legacy tool.

### Changed
- `CLAUDE.md`, `p5-development`, `verification.md`, `sf-node-app`, `show-state` updated for the versioning system.

## [1.0.0]
- Unified edition baseline: 5-phase generation pipeline (p1 scoping to p5 development), calibration, layered architecture (`commands` → `services` → `sf` / `output`, composition root `cli.ts`), error contract (`Result<T>`, named errors, exit-code mapping), CLI I/O contract (stdout data-only / stderr logs), mandatory Salesforce `sf` v2 integration via a `cross-spawn` runner, output formatters (json / csv / xlsx / table), the progress reporter, and the maintenance skill set.
