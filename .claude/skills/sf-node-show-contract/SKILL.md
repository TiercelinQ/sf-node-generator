---
name: sf-node-show-contract
description: Show the complete validated architectural contract (Phase 4) — the file tree with each file's role and the command registry (command → service → sf helper → output). Reads docs/specs/04-architect.md.
model: haiku
---

# /sf-node-show-contract — Validated architectural contract

## Role

Contract reporter.

## Goal

Display the locked contract from the source of truth.

## Deliverable

The contract on screen (in the user's language).

---

Read `docs/specs/04-architect.md` (the locked source of truth) and display the complete validated file tree with the role of each file, followed by the command registry table (command → service → sf helper → output format), the coupling mode (standalone | sfdx-project), and (if tests) the source → test mapping.

If `docs/specs/04-architect.md` does not exist and no contract has been validated in session yet: `No validated contract — Phase 4 not reached.`

Do not append the `/sf-node-save-session` · `/sf-node-show-state` · `/sf-node-show-contract` reminder after this reply.
