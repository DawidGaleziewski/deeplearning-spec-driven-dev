---
paths:
  - "roadmap.md"
  - "course-specs/**/*.md"
  - "validation/**/*.md"
---

# Learning-state rules

- `roadmap.md` records validated completion, not viewing progress.
- A checked course requires a course spec with `status: passed` and
  `decision: passed`.
- A passed course spec requires the matching roadmap item to be checked.
- Update the spec, ledger, and roadmap in the same change.
- Never alter earlier ledger rows.
- Keep at most one course in `learning` or `validating` status.
- Run `python scripts/validate_learning_state.py` after changing completion
  state.
