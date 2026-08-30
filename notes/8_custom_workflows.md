# Skills

We may want to automate things we constantly do and create sjkill for the process. Ie.

```md
I want to stop repeationg the feature spec prompt. Use your skill creator to help me write a feature spec, local skill. Here is the previous prompt:

Find the next phase on specs/roeadmap.md and make a branch, ask me about feature specs. Create:
- a new directory YYYY-MM-DD-feature-name under specs for this feature work In there:
    - `plan.md` a series of numbered task groups,
    - `requirments.md` for scope decisions, context `
     - `validation.md` for how to implementastion succeded and can be merged

Refer to specs/mission.md and specs/tech-stack.md for guidance.

Important: You **must** use your AskuserQuestion tool, grouped on these 3, before writing to disk.
```

Restart clauide code for skills to be used/

## invoking skills
we can invoke skills by simply asking agent to use them.
Skills can also use other skills.

Agents use "descriptive enclouer" with skill description to know where to invoke what. But their judgment is not alweays perfect

# awesome prompt for eval skills

```md
When we create or modify a skill or subagent, treat it as unfinished until it's
been evaluated against a baseline. Follow the skill-creator's eval loop:

1. Draft the skill/agent.
2. Write 2–3 test prompts that sound like something I'd actually say — include
   at least one lean/underspecified prompt, not just the ideal one.
3. Run each prompt TWICE, in parallel subagents launched in the same turn:
   - "with": the new skill/agent
   - "baseline": no skill at all (new work) OR the previous version (edits —
     snapshot it first)
   If the skill has side effects (writes files, git, network), give each run an
   isolated git worktree so my working tree is never touched.
4. While the runs are in flight, pre-register the assertions: objective,
   named, checkable — ideally by script. Don't wait to see outputs first.
5. Grade every run against those assertions. Capture tokens + duration from
   each subagent's completion notification.
6. Report back a comparison table (pass rate, tokens, time, with vs baseline)
   plus a qualitative diff of the actual outputs — where did the skill change
   the result, where did it not matter.
7. If an assertion passes for both arms, say so — it's not measuring the skill.
   If the skill's real value can't be tested this way (e.g. it hinges on an
   interactive step a subagent can't do), state that explicitly.
8. Fold the findings back into the skill, then tell me what changed and whether
   another iteration is worth it.

Clean up worktrees and throwaway branches afterward. Keep the test
prompts/assertions in the skill's evals/ folder so we can re-run them.

Short trigger version, if you just want to invoke it:

Eval this skill before calling it done: 2–3 realistic prompts, with-skill vs
baseline in parallel worktree-isolated subagents, pre-registered assertions,
comparison table + qualitative diff, then iterate.
```

# mcp

useful mcp is Context7. It gives agent knoladge on current packages. Often using CLI skill is better however.

We can instal ctx7 with

```
npx ctx7 setup --claude

```

# plugins

Many available for SDD. For example github spec kit.

- Spec-ki
- OpenSpec

# backlog and reasearch
We sometimes want to research i.e which technology to use. we can hold this in backlog/ siumilar way we do with specs. We can later add this by agent to roadmap
