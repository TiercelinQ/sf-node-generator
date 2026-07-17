---
name: sf-node-app
description: Start menu of the sf-node CLI generator — new tool, resume an existing session, load a delivered project, or maintain one. Invoke at the beginning of a conversation or at any time via /sf-node-app.
model: haiku
---

# /sf-node-app — Start / resume / maintenance menu

## Role
Entry-point dispatcher for the sf-node CLI generator.

## Goal
Route the user to the right flow without re-asking resolved questions.

## Deliverable
The menu, then a handoff to the selected skill.

---

Present the start menu with the `AskUserQuestion` tool (single question, 4 clickable options — do not make the user type a number):
- New tool
- Resume a session (SESSION file)
- Load an already-delivered project (Phase 5 complete)
- Maintain a delivered project (fix / add / analyze)

Map the chosen option to the routing below; a pasted SESSION block still triggers the resume protocol directly. The folder/SESSION-path prompts stay free-form text.

**1 — New tool**: start `/sf-node-p1-scoping`, which handles the project folder name, location, and creation (the project root is established there).

**2 — Resume**: ask for the SESSION file path (`docs/sessions/SESSION_[tool]_S[N].md`), read it fully (native `Read` tool, never `cat` — Windows-compatible). The project root is the folder containing `docs/` (two levels up from the SESSION file); confirm it. Then apply the resume protocol:

1. Read the SESSION block fully.
2. Reply: `Resuming [tool] — [next phase] | Batch [X/total] | Open points: [list or "none"]`
3. Chain immediately without re-asking resolved questions.

If a SESSION block is pasted directly into the message: apply the resume protocol without showing the menu.

**3 — Load a delivered project**: ask for the project root to load, then chain to `/sf-node-load-project` (`.claude/` present at that root):
Project root to load? (folder path, e.g. C:\projects\sf-export)

**4 — Maintain a delivered project**: ask for the project root, first ensure the project is loaded (`/sf-node-load-project` if not already), then route to the right maintenance skill based on the user's intent:
Project root to maintain? (folder path, e.g. C:\projects\sf-export)
- understand / trace how a command works → `/sf-node-trace-feature`
- add a command / feature → `/sf-node-add-feature`
- fix a bug → `/sf-node-fix-issue`
- restructure existing code → `/sf-node-refactor-code`
- cut a release / bump the version → `/sf-node-release`
- verify the build / run checks → `/sf-node-run-tests`

If `/sf-node-app` is typed mid-project: show the menu only, without resetting the current state.
