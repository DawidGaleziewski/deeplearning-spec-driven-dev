# Agent Engineering Learning Roadmap

Every item intentionally starts unchecked. A checkbox means **validated**, not
merely watched.

## Phase I — Directing agent work

- [x] **C01 — Spec-Driven Development with Coding Agents** — 1h 16m
  Course: <https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents/>
  Capability gate: create and iterate a constitution, specification, plan,
  implementation, verification, and replanning flow for an existing codebase.

- [ ] **C02 — Agent Skills with Anthropic** — 2h 19m
  Course: <https://www.deeplearning.ai/courses/agent-skills-with-anthropic/>
  Capability gate: distinguish instructions, skills, tools, MCP, workflows, and
  subagents; package a reusable capability with progressive disclosure.

## Phase II — Establishing trust

- [ ] **C03 — Evaluating AI Agents** — 2h 16m
  Course: <https://www.deeplearning.ai/courses/evaluating-ai-agents/>
  Capability gate: construct traces and datasets, select code/human/LLM
  evaluators, evaluate components and trajectories, and run a controlled
  improvement experiment.

## Phase III — Orchestrating knowledge work

- [ ] **C04 — Building and Evaluating Data Agents** — 1h 59m
  Course: <https://www.deeplearning.ai/courses/building-and-evaluating-data-agents>
  Capability gate: design a planner/executor workflow over multiple data
  sources, measure goal-plan-action alignment, and add useful inline evaluation.

- [ ] **C05 — Agentic Knowledge Graph Construction** — 3h 8m
  Course: <https://www.deeplearning.ai/courses/agentic-knowledge-graph-construction>
  Capability gate: model nodes and relationships from structured and
  unstructured evidence, coordinate schema-proposal workflows, and explain what
  should remain deterministic.

## Phase IV — Engineering production systems

- [ ] **C06 — AI Engineering Fundamentals** — 9h 5m
  Course: <https://frontendmasters.com/courses/ai-engineering/>
  Capability gate: build, measure, and improve an AI feature using context
  engineering, advanced tools, retrieval, evaluation, and production feedback.

- [ ] **C07 — Harness Engineering & Agent Orchestration** — 5h 5m
  Course: <https://frontendmasters.com/courses/agent-harness/>
  Capability gate: design durable execution, recovery, memory, secure
  boundaries, supervision, and agent handoffs with explicit trade-offs.

## Conditional bridge

- [ ] **B01 — AI Agents Fundamentals, v2** — 7h 10m — optional
  Course: <https://frontendmasters.com/courses/ai-agents-v2/>
  Entry condition: take only if a diagnostic after C05 shows material gaps in
  agent loops, tool calling, context management, code execution, or approvals.
  This item does not block C06.

## Roadmap operating rules

- The first unchecked required course is the default next course.
- B01 is never selected automatically; its entry condition must be recorded.
- Only one course spec may be `learning` or `validating` at a time.
- A failed validation creates remediation tasks, not a checkmark.
- Completion updates the course spec, ledger, and roadmap together.
