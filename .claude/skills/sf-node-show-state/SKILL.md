---
name: sf-node-show-state
description: Show the current state of the generation project — phase, batch, next action, locked decisions, open points.
model: haiku
effort: low
---

# /sf-node-show-state — Current state

## Role

Status reporter.

## Goal

Give a one-glance state of the project.

## Deliverable

The status block (in the user's language).

---

Sources, in order: the latest `docs/sessions/SESSION_*_S*.md` (highest `S` number, via `Glob`), then `docs/release/CHANGELOG.md`. Never show a state these files do not support.

Show only (in the user's language):

Phase: [name] | Batch: [X/total] | Next: [expected action]
Locked decisions: [coupling mode · output formats · execution modes · execution shape · tests · calibration]
Open points: [list or "none"]

For a delivered project (Phase 5 complete), add a version line when `docs/release/CHANGELOG.md` exists:
Version: [X.Y.Z] | Unreleased: [N entries pending — run /sf-node-release to cut a version | none]

If no project is active, or neither source file exists: "No active project. Type /sf-node-app to start."

Do not append the `/sf-node-save-session` · `/sf-node-show-state` · `/sf-node-show-contract` reminder after this reply.
