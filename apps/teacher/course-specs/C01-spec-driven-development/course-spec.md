---
course_id: C01
title: Spec-Driven Development with Coding Agents
provider: DeepLearning.AI
url: https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents/
status: passed
decision: passed
created: 2026-08-30
last_updated: 2026-08-30
---

# Course Spec: C01 — Spec-Driven Development with Coding Agents

## 1. Intent

### Why this course now

Phase I of the roadmap is about directing agent work. The learner needs a
repeatable way to hand intent to a coding agent that survives context loss and
agent swaps, instead of ad-hoc prompting ("vibe coding"). This is the
foundational method the rest of the roadmap builds on.

### Transfer target

This repository itself (`apps/teacher`, the spec-driven course-validation
system) and the learner's Cartographer / coding-agent-workflow projects. The
learner should be able to run constitution → spec → plan → implement → validate →
replan on an existing codebase and defend the structure.

### Non-goals

- Deep evaluation methodology (C03).
- Skill authoring mechanics and progressive disclosure internals (C02).
- Harness/durable-execution design (C07).

## 2. Curriculum contract

| # | Curriculum area | Observable capability | Expected depth | Validation method |
|---:|---|---|---|---|
| 1 | Why SDD vs vibe coding | Explain context decay, intent fidelity, spec-as-contract, and when vibe coding is still fine | Applied | Teach-back + choice |
| 2 | Workflow overview | Describe the constitution → spec → plan → implement → validate → replan loop and why context is cleared between stages | Applied | Teach-back + synthesis |
| 3 | Constitution | State the three pillars (mission, tech stack, roadmap), why it is agent-agnostic and high-level | Working | Teach-back |
| 4 | Feature specification | Produce requirements / plan / validation for a roadmap phase; scope one feature; numbered task groups | Applied | Scenario + artifact |
| 5 | Feature implementation | Implement by task group with fresh context; keep planning and building separate | Working | Teach-back + failure |
| 6 | Feature validation | Validate at spec level; correct by updating the spec first; use manual check items | Applied | Failure diagnosis |
| 7 | Project replanning | Revise constitution/roadmap on a separate branch; cascade changes into existing feature specs | Applied | Scenario |
| 8 | Phase discipline / AI fatigue | Keep clean phase boundaries: merge, close, clear context before the next feature | Working | Failure diagnosis |
| 9 | Legacy / brownfield support | Bootstrap a constitution from existing docs (readmes, Confluence, Word), then replan | Working | Scenario |
| 10 | Build your own workflow | Turn a repeated prompt into a reusable skill; decide repo-local vs global | Working | Transfer |
| 11 | Agent replaceability | Explain how specs + skills make the agent swappable; what stays deterministic | Applied | Teach-back + transfer |

## 3. Learning requirements

- **LR-01:** The learner SHALL explain why spec-driven development beats
  unstructured prompting for multi-session agent work, in mechanism terms
  (context decay, intent fidelity, contract), and name a case where vibe coding
  is acceptable.
- **LR-02:** Given a fresh feature, the learner SHALL lay out the end-to-end
  workflow and justify why planning and implementation are separated and context
  is cleared between them.
- **LR-03:** The learner SHALL distinguish the constitution from a feature spec
  (scope, longevity, altitude) and place a given piece of information in the
  right one.
- **LR-04:** Presented with a failed or drifting implementation, the learner
  SHALL diagnose the cause and choose a spec-first correction rather than
  patching code directly.
- **LR-05:** In a brownfield scenario, the learner SHALL describe how to
  bootstrap SDD from existing documentation and why replanning matters.
- **LR-06:** In the transfer target, the learner SHALL explain how specs and
  skills make agents replaceable and identify what should stay deterministic
  (scripts, validators) rather than agent-judged.

## 4. Acceptance criteria

- [x] The learner can explain the central mental model without material hints.
- [x] The learner can distinguish the constitution from a feature spec.
- [x] The learner can apply the workflow to a new scenario.
- [x] The learner can identify at least one failure mode or limitation.
- [x] The learner can transfer the material to a relevant project.
- [x] The rubric threshold is met and no critical dimension scores zero.
- [x] AC-01: The learner explains why context is cleared between workflow stages,
  not merely that it is. (Q2: manageable working set, token cost, forces
  implementation from specs rather than chat history.)
- [x] AC-02: The learner chooses a spec-first correction when shown drift.
  (Q4: route by drift level, agent updates spec then re-implements, re-validate.)
- [x] AC-03: The learner names something that should remain deterministic rather
  than delegated to agent judgment. (Q6b: schema-enforced structured output,
  hard pass/fail gates, sandboxed agent handoffs.)

## 5. Transfer artifact

**Artifact or exercise:** This repository's spec-driven course-validation system
(`apps/teacher`): CONSTITUTION.md, roadmap.md, course-specs, validation rubric,
deterministic `validate_learning_state.py`, and the phase kickoff/wrap-up skills.
**Location:** `/home/dawid/projects/deeplearning-spec-driven-dev/apps/teacher`
**What it demonstrates:** Applying constitution/roadmap/feature-spec structure and
agent-agnostic skills to a real, non-toy codebase; separating deterministic
validation from agent judgement.
**What it does not demonstrate:** The learner's unaided recall of the workflow
mechanism and the distinctions — covered by the interview.

## 6. Learning tasks

- [x] Confirm the official curriculum.
- [ ] Complete a lightweight pre-course diagnostic. (waived — course already done)
- [x] Complete the relevant course material.
- [x] Produce or identify the transfer artifact.
- [x] Run the validation interview.
- [x] Complete remediation, if required. (not required)
- [x] Record the final decision and synchronize the roadmap.

## 7. Validation plan

| Outcome | Evidence requested | Minimum acceptable signal |
|---|---|---|
| LR-01 | Teach-back | Mechanism, not slogans; names a vibe-coding-OK case |
| LR-02 | Teach-back + synthesis | Ordered workflow + reason for context separation |
| LR-03 | Boundary + sorting | Correct placement of sample info in constitution vs feature spec |
| LR-04 | Failure diagnosis | Identifies drift cause; picks spec-first fix |
| LR-05 | Scenario | Constitution-from-docs bootstrap + replanning rationale |
| LR-06 | Transfer | Concrete adaptation to this repo / Cartographer; names a deterministic boundary |

## 8. Validation attempts

### Attempt 1 — 2026-08-30

**Result:** passed
**Format:** 7-question adaptive interview across 2 rounds, no material hints given.
**Material hints used:** none
**Strong evidence:**

- Q1/Q2: Unaided mechanism-level account of why SDD beats unstructured prompting —
  context decay across sessions, cognitive-load management, human-in-the-loop per
  roadmap item — and why context is cleared between stages (manageable working
  set, token cost, forces implementation from specs not chat history).
- Q1: Named POC / throwaway work as the legitimate vibe-coding case.
- Q3: Correctly sorted all four sample items (tech-stack, feature requirement,
  audience, task-group) into constitution vs feature spec; articulated the
  scope / lifespan / altitude split.
- Q4: Spec-first correction routed by drift level (logic → feature spec &
  validation.md; tech → constitution tech-stack.md), agent-driven, re-validate.
- Q5: Ordered brownfield plan — gather artifacts, gap-analyze into a doc,
  constitution first, heaviest effort on roadmap reconciliation; identified drift
  risk of skipping replanning.
- Q6a: Mapped this repo onto SDD vocabulary and flagged where the analogy breaks
  (`rubric.md` is cross-cutting steering/policy, not per-feature validation);
  critiqued the `CONSTITUTION.md` single-file naming.
- Q6b: Transfer to Cartographer — schema-enforced structured output, hard
  pass/fail gates, sandboxed agent handoffs as deterministic boundaries.

**Gaps:**

- Q7 diagnosis missed the feature-spec DRY point (specs reference the
  constitution rather than restating the tech stack) and the "features too
  trivial to justify full SDD ceremony" angle. Partial but adequate.

**Rubric scores:** 14/15

| Dimension | Score 0–3 | Evidence |
|---|---:|---|
| Mental model | 3 | Q1/Q2 unaided; explained the *why* of context clearing, not just that it happens. |
| Distinctions and trade-offs | 3 | Q3 all four items sorted correctly with altitude/lifespan rationale; Q1 named the vibe-coding-OK case. |
| Application | 3 | Q5 ordered brownfield plan; understood greenfield-from-intent vs brownfield-from-current-state. |
| Diagnosis and limitations | 2 | Q4 strong and correctly routed by altitude; Q7 caught bloat + altitude confusion but missed DRY and over-ceremony points. |
| Transfer | 3 | Q6a mapped repo to SDD vocab and identified where the analogy breaks; Q6b concrete Cartographer adaptation. |

**Remediation tasks:**

1. None — passed.

## 9. Final decision

**Decision:** passed
**Decision rationale:** Total 14/15 with Application 3 and Transfer 3, no
dimension below 2, no material hints used at any point, and all three
course-specific acceptance criteria (AC-01 context-clearing rationale, AC-02
spec-first correction, AC-03 deterministic boundary) satisfied on the merits.
The strongest single signal was the unaided mechanism-level explanation of the
workflow and context discipline. Non-blocking follow-ups recorded for later
revisiting: feature-spec DRY and proportionality of the workflow to feature size.
**Roadmap updated:** yes — C01 checked
**Ledger updated:** yes — attempt 1, passed
**Repository validation:** passed (`scripts/validate_learning_state.py`)
