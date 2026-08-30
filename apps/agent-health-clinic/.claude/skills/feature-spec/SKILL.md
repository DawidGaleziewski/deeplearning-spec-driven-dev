---
name: feature-spec
description: >-
  Kick off the next roadmap phase for agent-health-clinic: find the next
  unstarted phase in specs/roadmap.md, cut its feature branch, interview the
  user, and write the specs/YYYY-MM-DD-slug/ folder (requirements.md, plan.md,
  validation.md). Use this whenever the user wants to start, spec, plan, or
  scope the next phase / next feature / next chunk of roadmap work — phrases
  like "start the next phase", "spec out the next feature", "plan the next
  roadmap item", "let's begin phase N", or "set up the specs for X". Invoke it
  even if the user does not say the word "spec".
metadata:
  type: workflow
---

# feature-spec

Turn the next roadmap phase into a branch and a spec folder the implementer can
work from. This replaces re-typing the feature-spec prompt by hand.

The three spec files have distinct jobs — keep them that way:

| File             | Holds                                                                    |
|------------------|-------------------------------------------------------------------------|
| `requirements.md`| Context, in-scope / out-of-scope, decisions, open questions.            |
| `plan.md`        | Numbered task groups in rough dependency order, plus implementer notes. |
| `validation.md`  | A checklist of verifiable boxes; "ready to merge when" at the end.      |

Study the existing folders under `apps/agent-health-clinic/specs/` (e.g.
`2026-08-29-agent-ailment-management/`, `2026-08-30-containerization/`) before
writing — match their depth, tone, and structure. New spec files should read
like a sibling of those, not a lighter template.

## Steps

### 1. Load the guidance

Read, from `apps/agent-health-clinic/specs/`:

- `roadmap.md` — the phase list and the cross-cutting constraints (mobile-first).
- `mission.md` — product framing and the in-universe voice for any UI copy.
- `tech-stack.md` — the stack every plan must stay inside.

### 2. Find the next phase

List `apps/agent-health-clinic/specs/*/` and the merge commits on `master`
(`git log --oneline --merges`). The existing `YYYY-MM-DD-slug` folders and
`Merge branch ... : Phase N` commits tell you which phases are already done. The
**next phase** is the lowest-numbered roadmap phase with no spec folder and no
merge commit.

State which phase you picked and its roadmap title, and derive a `slug`
(kebab-case of the title, e.g. "Therapy directory" → `therapy-directory`). Use
today's date from the session context for the `YYYY-MM-DD` prefix.

The roadmap has been renumbered before (a phase inserted mid-list), so older
spec folders and code comments may cite a stale "Phase N" for work that is now a
different number. Trust `roadmap.md`'s current ordering, and note any stale
cross-references you spot as a docs fix-up in `plan.md`.

### 3. Cut the branch

- `git checkout master && git pull --ff-only` so the branch starts from an
  up-to-date master. If that is not clean, stop and tell the user. (On a
  detached HEAD / worktree where `checkout master` won't work, branch directly
  off the `master` ref.)
- If a branch or spec folder named `YYYY-MM-DD-slug` already exists, **stop** —
  that phase is already underway; surface it rather than inventing a variant
  name.
- `git checkout -b YYYY-MM-DD-slug` — the branch name matches the spec folder
  name exactly (this is the project convention — see existing `origin/` branches).

### 4. Interview — required before writing anything

This is the point of the skill: the user decides scope, not you. Do **not**
skip it because the roadmap entry or the user's opening message "seems clear" —
even a detailed request leaves scope-boundary and design calls open, and a
silent guess here is what produces a spec the user has to unwind later.

Make **one** `AskUserQuestion` call with **exactly three** questions, grouped,
covering:

1. **Scope** — what is in scope for this phase versus explicitly deferred to a
   later one. Offer concrete in/out splits drawn from the roadmap entry and the
   phases that follow it.
2. **Decisions** — the key technical and design choices this phase locks in
   (and any open questions to leave flagged). Offer the realistic alternatives
   for each, with a recommendation.
3. **Validation** — how the implementation proves it succeeded and what "ready
   to merge" requires (automated tests, manual responsive checks at
   ~375/768/1280px, docs, changelog, scope held).

Ground every option in what you read in step 1 and the neighbouring spec
folders — come with a recommendation, not a blank prompt. If an answer opens a
material follow-up, ask it (a short second `AskUserQuestion` is fine) rather
than guessing. Do not create the spec folder or write any file before these
answers are in. If `AskUserQuestion` is genuinely unavailable (a
non-interactive run), write the three questions and your recommended answers
into the conversation, proceed on those recommendations, and record the
assumptions in a `## Open questions` note.

### 5. Write the spec folder — one pass

Create `apps/agent-health-clinic/specs/YYYY-MM-DD-slug/` with all three files,
fully drafted (not stubs):

**`requirements.md`**
```
# Requirements — <Phase title>

## Context
<Which phase number this is; one short paragraph per prior phase that this one
builds on; what this phase adds; the one-line tech-stack reminder.>

## Scope
### In scope
<Grouped by area (API / frontend / shared / testing), specific enough that the
plan is almost implied — endpoints with methods and bodies, screens with
breakpoint behaviour, what the tests must cover.>
### Out of scope (later phases)
<Bulleted, each noting which later phase owns it.>

## Decisions
<Bulleted; each decision in bold followed by its rationale — mirror the
existing folders.>

## Open questions
<Anything deliberately left to the implementer, with the constraint that bounds
their choice.>
```

**`plan.md`**
```
# Plan — <Phase title>

<One short paragraph on the ordering: what unblocks what, what can run in
parallel.>

## 1. <Task group>
1.1. <task>
1.2. <task>

## 2. <Task group>
...

## Notes for the implementer
<Stack gotchas, existing patterns to match, module boundaries, framework
version caveats — see the neighbouring plan.md files.>
```
Task groups run rough dependency order: shared contract first, then API, then
frontend, then tests, then an integration/docs/changelog wrap-up group whose
last item is "tick off validation.md, then open for review/merge".

**`validation.md`**
```
# Validation — <Phase title>

<One sentence on what a green checklist proves.>

## <Area>
- [ ] <verifiable statement — an endpoint returns X, a screen renders Y at 375px>

## Responsive (manual)
- [ ] <the ~375 / ~768 / ~1280px checks from tech-stack.md>

## Tests
- [ ] <unit / e2e / lint / build commands that must pass>

## Ready to merge when
- [ ] All boxes above are checked.
- [ ] Scope held: <the out-of-scope list, restated>.
- [ ] Docs updated (<which READMEs>).
- [ ] CHANGELOG.md updated via the `changelog` skill.
- [ ] All plan.md task groups complete.
```

Every validation box must be objectively checkable. Fold the step-4 answers
into all three files.

### 6. Hand off for review

Do **not** commit. Show the user the new branch name and the three files (a
`git status` plus the paths), and invite edits to wording or scope before they
start implementing. Note that phase wrap-up later goes through the
`changelog` skill and a `--no-ff` merge to master.
