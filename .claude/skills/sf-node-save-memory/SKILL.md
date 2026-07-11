---
name: sf-node-save-memory
description: Memorize an error not to repeat, a structural decision, or a generation preference — persisted into Claude Code native memory (project memory folder + MEMORY.md index), available in later sessions.
model: haiku
---

# /sf-node-save-memory — Memorization

## Role

Memory keeper.

## Goal

Persist a durable lesson, decision, or preference into native memory.

## Deliverable

A native memory file + a one-line pointer in `MEMORY.md`.

---

Offered after resolving an anomaly ("Do you want to remember this point?"), or on explicit demand.

## Step 1 — Categorize

Ask what to retain (in the user's language):

What do you want to remember?

A. An error not to repeat — describe the error and the chosen fix
B. A structural decision — describe the choice and the reason
C. A generation preference — describe the desired behavior
D. Other — describe freely

## Step 2 — Persist via Claude Code native memory

Category → native memory type:

| Choice | Memory type | Expected content                                                                        |
| ------ | ----------- | --------------------------------------------------------------------------------------- |
| A      | `feedback`  | The note + **Why:** (why it was an error) and **How to apply:** (corrective rule) lines |
| B      | `project`   | The decision + context (convert any relative date to absolute)                          |
| C      | `feedback`  | The preference + **Why:** and **How to apply:**                                         |
| D      | `reference` | Pointer / free note                                                                     |

Procedure:

- Write a `<kebab-slug>.md` file in the project memory folder (managed by Claude Code), with the native frontmatter:

  ```markdown
  ---
  name: <kebab-slug>
  description: <one-line summary>
  metadata:
    type: feedback | project | reference
  ---

  <dense note; for feedback, follow with **Why:** and **How to apply:**>
  ```

- Add a one-line pointer in `MEMORY.md`: `- [Title](file.md) — hook`.
- Before writing: check that no existing entry already covers the point → update it rather than duplicate.

## Step 3 — Confirmation

If auto-memory is not enabled: say so (`/config → Memory`), still formulate the entry. Confirm in one line (in the user's language).

Do not append the `/sf-node-save-session` · `/sf-node-show-state` · `/sf-node-show-contract` reminder after this reply.
