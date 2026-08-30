# Course Validation Rubric

## Scoring scale

| Score | Meaning |
|---:|---|
| 0 | Missing, fundamentally incorrect, or unable to engage with the outcome |
| 1 | Partial recognition; important misconceptions or heavy prompting remain |
| 2 | Working understanding; correct reasoning with minor gaps or light probing |
| 3 | Applied understanding; clear reasoning, trade-offs, and transfer to a new case |

## Dimensions

### 1. Mental model

Can the learner explain the core mechanism in their own words and connect its
major components?

### 2. Distinctions and trade-offs

Can the learner distinguish concepts that are easy to confuse and explain when
one approach is preferable?

### 3. Application

Can the learner make a defensible decision or produce a workable design in a
new scenario?

### 4. Diagnosis and limitations

Can the learner recognize failure modes, uncertainty, safety boundaries, and
conditions under which the approach should not be used?

### 5. Transfer

Can the learner adapt the material to a relevant project without blindly
copying the instructor's implementation?

## Pass rule

A course passes only when:

- the total score is at least **10/15**;
- Application scores at least **2**;
- Transfer scores at least **2**;
- no dimension scores **0**;
- at least one important response was produced without a material hint;
- all course-specific critical acceptance criteria pass.

A score is evidence, not arithmetic permission to ignore a critical
misconception. The agent must explain any override and may only make the result
stricter, never easier.

## Hints

- **Probe:** asks for clarification without supplying domain information; does
  not reduce the score by itself.
- **Light hint:** narrows the search space; caps that outcome at 2 unless later
  demonstrated independently.
- **Material hint:** supplies a key concept or solution step; the response cannot
  independently satisfy the outcome during that attempt.

## Permitted evidence

Use a mixture of:

- teach-back explanations;
- compare-and-choose questions;
- realistic scenarios;
- failure diagnosis;
- code, specs, diagrams, or repository artifacts;
- retrospective explanation of an implementation decision.

Course badges and self-reported completion may be recorded but do not contribute
to the score.
