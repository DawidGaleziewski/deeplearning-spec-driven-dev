# Repository Instructions for Learning Agents

## Mission

Operate this repository as a spec-driven learning system. Help the learner move
through `roadmap.md`, create one course spec at a time, validate understanding,
and preserve an auditable record of evidence.

## Read order

Before changing learning state, read:

1. `CONSTITUTION.md`
2. `roadmap.md`
3. `validation/rubric.md`
4. the relevant `course-spec.md`, if it exists
5. `.claude/skills/course-validator/SKILL.md` and only the referenced material
   required for the current mode

## Supported modes

### Start

When the learner asks to start or prepare a course:

- choose the requested course, or the first unchecked non-optional course;
- enforce the one-active-course rule;
- obtain the official curriculum from its primary course page or supplied
  materials;
- create `course-specs/<course-id>-<slug>/course-spec.md` from the template;
- set its status to `learning`;
- agree on one small transfer artifact or work application;
- do not change the roadmap checkbox.

### Validate

When the learner says a course is finished or requests validation:

- ensure the course spec exists; create it retroactively if necessary;
- set its status to `validating`;
- prepare questions from the curriculum and acceptance criteria;
- ask one short round at a time and wait for the learner's response;
- evaluate using `validation/rubric.md`;
- follow `.claude/skills/course-validator/references/interview-protocol.md`;
- do not reveal a model answer before the learner commits to an answer.

### Remediate

When the learner does not yet meet the pass threshold:

- set status to `remediation`;
- keep the roadmap item unchecked;
- record evidence and gaps;
- create at most three targeted tasks;
- later re-test only the failed outcomes plus one transfer question.

### Complete

Only after a pass:

- set the course spec status and decision to `passed`;
- add the validation evidence and scores to the course spec;
- append one ledger row;
- change exactly the matching roadmap checkbox to `[x]`;
- run `python scripts/validate_learning_state.py`;
- report what was demonstrated and what should still be revisited later.

## Interaction rules

- Ask three to five questions per round, not an entire exam at once.
- Prefer teach-back, comparison, scenario, diagnosis, and design questions.
- Use course terminology where useful, but accept correct equivalent language.
- Probe vague answers before judging them incorrect.
- Count materially hinted answers as partial evidence.
- Do not ask the learner to reveal private company information or credentials.
- Use sanitized or hypothetical work examples when company context is sensitive.
- Never mark a course complete merely because the learner requests it.

## File mutation boundaries

For learning operations, modify only:

- `roadmap.md`
- `course-specs/**`
- `validation/learning-ledger.md`
- learner-created course artifacts when explicitly requested

Do not change the constitution, rubric, agent, skill, scripts, or prompts during
ordinary validation. Such changes require an explicit process-improvement
request.
