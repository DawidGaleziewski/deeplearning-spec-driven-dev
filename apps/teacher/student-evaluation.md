# Student Evaluation

A living assessment of how close the learner is to operating as a **product
engineer** and as an **AI engineer**. It is built only from validated evidence:
passed course interviews (`validation/learning-ledger.md`), the course specs, and
directly observable artifacts in this repository. Confidence is stated explicitly
because the evidence base is still small.

- **Last updated:** 2026-08-30
- **Courses validated:** 1 / 7 required (C01)
- **Evidence confidence:** low — one interview, plus repository artifacts

---

## 1. Headline read

| Track | Current level | One-line summary |
|---|---|---|
| Product engineer | **Working (2 / 4)** | Strong at process, specs, and directing agent work on real codebases; unproven on end-user product judgment (UX, discovery, shipping to users). |
| AI engineer | **Early-intermediate (1.5 / 4)** | Good instincts and genuine shipped agent experience (Cartographer), but the formal grounding — evaluation, agent architecture, retrieval, production feedback — is still ahead on the roadmap. |

Scale: 0 unable · 1 aware · 2 working · 3 applied/independent · 4 can set the
standard for others.

---

## 2. Strengths (evidence-backed)

### S1 — Spec-driven workflow as a working mental model
Explained, unaided, why structured specs beat unstructured prompting in
mechanism terms (context decay across sessions, cognitive-load management,
human-in-the-loop per roadmap item) and *why* context is cleared between stages,
not merely that it is. (C01 Q1/Q2, Mental model 3/3.)

### S2 — Correct altitude discrimination
Cleanly separates constitution-level concerns (mission, tech stack, roadmap) from
feature-level concerns (requirements, plan, validation), and places new
information in the right document. (C01 Q3, Distinctions 3/3.)

### S3 — Spec-first correction discipline
When an implementation drifts, routes the fix by altitude (logic → feature spec
& validation; tech → constitution) and drives it through the agent rather than
hand-patching code. This is the habit that keeps agent-assisted codebases
maintainable. (C01 Q4.)

### S4 — Transfer to real systems, not instructor mimicry
Mapped an unfamiliar codebase (this repo) onto the course vocabulary and
identified where the analogy *breaks* (`rubric.md` is cross-cutting policy, not
per-feature validation). Also critiqued a naming choice rather than accepting it.
(C01 Q6a, Transfer 3/3.)

### S5 — Shipped AI-agent experience
Built "Cartographer," a company agent that crawls an internal portal for routes,
pages, and errors and writes results through a schema-constrained API. Reasoned
correctly about deterministic boundaries — schema-enforced structured output,
hard pass/fail gates, sandboxed agent-to-agent handoffs, prompt-injection
containment — even though the course did not cover this. (C01 Q6b.)

### S6 — Systems-building intent (observable)
This repository is itself a non-trivial artifact: a spec-driven learning system
with a constitution, phased roadmap, per-course specs, a deterministic state
validator, containerization phase, CI/CD, an MCP integration, and a
skill-evaluation loop. The learner builds process infrastructure, not just
features.

---

## 3. Weak points and open questions

### W1 — Diagnosis stops at the first plausible cause
Given a failing SDD adoption (600-line constitution, specs restating the tech
stack, slow planning), identified constitution bloat and altitude confusion but
missed the second-order issues: feature specs should *reference* the constitution
rather than restate it (DRY), and some features are too small to justify the full
ceremony. Diagnosis scored 2/3. *Practice: for any diagnosis, force a second and
third distinct cause before answering.*

### W2 — No formal grounding in evaluation
The strongest self-identified gap. Reasoned well about hard gates and structured
output from first principles, but has not built traces, datasets, code/human/LLM
evaluators, or run a controlled improvement experiment. **Directly addressed by
C03; do not consider the AI-engineer track credible without it.**

### W3 — Skills / progressive disclosure unproven
Notes show awareness of skill authoring, repo-local vs global scope, and an eval
loop, but packaging a reusable capability with progressive disclosure has not
been validated. **Addressed by C02 (next course).**

### W4 — Production and harness concerns untested
Durable execution, recovery, memory, supervision, secure boundaries, agent
handoffs with explicit trade-offs — no evidence yet. **Addressed by C07;** partly
by C06.

### W5 — Product-engineer signal is narrow
All current evidence is about *how work is directed and structured*. There is no
validated evidence of user-facing product judgment: discovery, prioritisation
against user value, UX decisions, measuring whether a shipped feature worked,
handling real user feedback. This track cannot move past "working" on process
skill alone.

### W6 — Precision under pressure
In free-form answers, occasionally reaches for a nearby-but-imprecise cause
(e.g. attributing the bloated-constitution scenario partly to "didn't update
tech-stack.md and vibe coded," which does not quite fit the prompt). The
underlying model is sound; the articulation sometimes runs ahead of it.

---

## 4. Track detail

### Product engineer — Working (2 / 4)

| Competency | Level | Basis |
|---|---|---|
| Translating intent into a buildable plan | 3 | C01 Q2/Q5 |
| Working an existing / legacy codebase methodically | 3 | C01 Q5 |
| Spec & documentation hygiene | 2 | C01; W1 DRY gap |
| Directing coding agents effectively | 3 | C01 overall |
| User discovery & prioritisation | ? | no evidence |
| UX / interface judgment | ? | no evidence (manual-check awareness only, C01 Q-notes) |
| Measuring shipped outcomes | 1 | aware (changelog, validation.md); not outcome-based |

### AI engineer — Early-intermediate (1.5 / 4)

| Competency | Level | Basis |
|---|---|---|
| Agent workflow design (plan/implement/validate) | 2–3 | C01; Cartographer |
| Deterministic boundaries around agents | 2 | C01 Q6b; Cartographer |
| Context & token management | 2 | C01 Q2 |
| Evaluation (traces, datasets, evaluators, experiments) | 1 | W2 — reasoned, not practiced |
| Skills / reusable capability packaging | 1 | W3 — aware only |
| Retrieval / context engineering | ? | no evidence (C06) |
| Harness / durable execution / supervision | 0–1 | W4 — no evidence (C07) |
| Security (prompt injection, sandboxing) | 2 | C01 Q6b — named the risks |

---

## 5. Trajectory

The roadmap is well-targeted at the gaps above:

1. **C02 (next)** closes W3 and sharpens the instructions/skills/tools/MCP/
   subagents distinctions.
2. **C03** closes W2 — the single most important gap for the AI-engineer track.
3. **C04–C05** build orchestration and knowledge-graph reasoning.
4. **C06** closes retrieval / context-engineering / production-feedback gaps.
5. **C07** closes W4.

The **product-engineer** track (W5) is only partly served by this roadmap. If
that title matters, add deliberate evidence: ship something to real users,
choose what *not* to build, and measure whether it worked.

---

## 6. Per-course findings log

### C01 — Spec-Driven Development with Coding Agents · passed 14/15 · 2026-08-30

- **Added strengths:** S1, S2, S3, S4 (and corroborated S5).
- **Added / confirmed weaknesses:** W1 (diagnosis depth), W6 (precision), W2/W3/
  W4 noted as roadmap-forward.
- **Net effect:** Product-engineer track → Working (2/4). AI-engineer track →
  Early-intermediate (1.5/4), gated on C03 for further movement.
