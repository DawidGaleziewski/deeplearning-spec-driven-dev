# Learning Agent SDD

This repository turns a course roadmap into a spec-driven learning loop.

The loop is deliberately simple:

1. Select the next unchecked item in `roadmap.md`.
2. Create a course spec from the official curriculum.
3. Study and build something small with the material.
4. Ask the learning governor to validate the course.
5. Complete a short adaptive interview.
6. Mark the roadmap only after the evidence passes the rubric.

## Start a session

From the repository root, either start Claude Code with the dedicated agent:

```bash
claude --agent learning-governor
```

Or use a normal agent session and paste one of these prompts:

- `prompts/start-next-course.md`
- `prompts/validate-completed-course.md`
- `prompts/review-roadmap.md`

The agent reads `CLAUDE.md`, `AGENTS.md`, `CONSTITUTION.md`, and the
`course-validator` skill before changing learning state.

## Authoritative files

- `CONSTITUTION.md` defines the non-negotiable learning principles.
- `roadmap.md` is the completion source of truth.
- `course-specs/` stores one evolving spec per started course.
- `validation/learning-ledger.md` records validation attempts.
- `validation/rubric.md` defines the pass threshold.
- `.claude/skills/course-validator/` contains the reusable validation workflow.

All roadmap items intentionally begin unchecked. Watching a course does not
check it off; validation does.

## Validate repository state

Run:

```bash
python scripts/validate_learning_state.py
```

This checks that every roadmap checkmark has a passed course spec, every passed
course spec has a roadmap checkmark, and no more than one course is actively
being learned or validated.
