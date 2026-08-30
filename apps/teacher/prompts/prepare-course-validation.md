# Prompt: Prepare a Course-Specific Validation

Create or refine the validation section of the current course spec.

Inputs:

- official course curriculum and learning objectives;
- repository course notes and exercises;
- the learner's stated work-transfer target;
- `CONSTITUTION.md` and `validation/rubric.md`.

Required output:

1. A curriculum map that merges repeated lesson titles into meaningful
   capabilities.
2. Observable learning requirements.
3. Course-specific acceptance criteria.
4. A coverage plan using teach-back, comparison, scenario, failure diagnosis,
   and transfer where relevant.
5. Likely misconceptions worth probing.
6. A small applied artifact or scenario.

Constraints:

- Do not create a separate agent for the course.
- Keep course knowledge in the course spec.
- Use the shared `course-validator` skill for the procedure.
- Do not optimize for memorizing vendor syntax or instructor wording.
- Do not expose a complete answer key before validation.
- Do not alter the roadmap checkbox.
