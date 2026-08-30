# Prompt: Author or Refine a Learning Skill

Use this when the shared validation skill needs a deliberate improvement after
real usage exposes a recurring failure.

Create or update the smallest reusable skill that resolves the demonstrated
problem.

Requirements:

- Start from concrete requests the skill must handle.
- Keep the name and description concise and discriminating.
- Assume the agent already has general reasoning ability.
- Put the shared purpose and essential workflow in `SKILL.md`.
- Move substantial conditional procedures into focused `references/` files.
- Add scripts only when deterministic repetition materially improves
  reliability.
- Preserve learner control and the constitution's evidence threshold.
- Do not convert one course's content into permanent global instructions.
- Do not create a new agent unless isolated context, permissions, tools,
  parallel work, or separately evaluated responsibility justifies it.
- Validate frontmatter, links, trigger wording, and unfinished placeholders.
- Test the skill against a realistic start, pass, and remediation scenario.

Before changing the skill, state the observed failure and why a narrower prompt,
course-spec change, or rubric clarification would not solve it.
