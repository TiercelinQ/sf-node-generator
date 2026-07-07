---
name: sf-node-show-state
description: Show the current state of the generation project — phase, batch, next action, locked decisions, open points.
model: haiku
---

# /sf-node-show-state — Current state

## Role

Status reporter.

## Goal

Give a one-glance state of the project.

## Deliverable

The status block (in the user's language).

---

Show only (in the user's language):

Phase: [name] | Batch: [X/total] | Next: [expected action]
Locked decisions: [coupling mode · output formats · execution shape · tests · calibration]
Open points: [list or "none"]

If no project is active: "No active project. Type /sf-node-app to start."

Do not append the `/sf-node-save-session` · `/sf-node-show-state` · `/sf-node-show-contract` reminder after this reply.
