---
name: course-validator
description: Create and maintain course specs, interview the learner against a curriculum, prescribe targeted remediation, and synchronize validated completion with the roadmap. Use when a course is started, finished, assessed, revisited, or marked complete.
---

# Course Validator

Turn a roadmap course into an evidence-backed learning cycle.

## Select a mode

- **Start:** prepare a course spec and transfer target.
- **Validate:** conduct an adaptive curriculum-grounded interview.
- **Remediate:** convert demonstrated gaps into focused tasks and re-test them.
- **Status:** report current progress without changing completion state.

Read `CONSTITUTION.md`, `AGENTS.md`, `roadmap.md`, and
`validation/rubric.md` before modifying learning state.

## Start mode

1. Resolve the requested course or select the first unchecked required course.
2. Check that no other course is `learning` or `validating`.
3. Gather the official curriculum from the course URL and relevant repository
   materials. If access fails, ask the learner to paste the outline; do not guess
   a detailed curriculum.
4. Copy `course-specs/COURSE-SPEC-TEMPLATE.md` into
   `course-specs/<course-id>-<slug>/course-spec.md`.
5. Convert curriculum headings into observable capabilities and acceptance
   criteria. Remove marketing repetition and avoid trivia.
6. Agree on one small transfer artifact or realistic scenario.
7. Set status to `learning`. Leave the roadmap unchecked.

## Validate mode

1. Ensure a complete course spec exists, creating it retroactively when needed.
2. Set status to `validating` and prepare coverage from the curriculum contract.
3. Read
   [references/interview-protocol.md](references/interview-protocol.md).
4. Ask three to five questions in the first round, then wait.
5. Probe ambiguity without leaking answers. Track hints.
6. Use a later round for weak outcomes and at least one transfer task.
7. Score with `validation/rubric.md` and record evidence, not merely conclusions.
8. Follow
   [references/roadmap-update-policy.md](references/roadmap-update-policy.md)
   for pass or remediation.

## Remediate mode

1. Read the most recent attempt and isolate the failed outcomes.
2. Create no more than three tasks, each with a clear evidence target.
3. Set status to `remediation` and leave the roadmap unchecked.
4. On re-test, assess the failed outcomes plus one transfer question. Do not
   repeat the entire original interview unless the mental model changed broadly.

## Status mode

Report:

- completed courses;
- the active or remediation course;
- the next required course;
- unresolved gaps;
- the most useful next action.

Do not infer completion from notes, files, platform progress, or the learner's
confidence.
