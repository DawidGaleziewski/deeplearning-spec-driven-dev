---
name: changelog
description: Update CHANGELOG.md at the agent-health-clinic app root with an entry for today's changes. Invoke manually before merging a branch. Bootstraps the changelog from git history if it does not exist yet.
---

# changelog

Keep `apps/agent-health-clinic/CHANGELOG.md` current. Run this before merging a branch.

The changelog lives at the app root (`apps/agent-health-clinic/CHANGELOG.md`), has one
`## YYYY-MM-DD` heading per day that had changes, newest date first, and bullets that
describe **user- or developer-facing changes** — not raw commit subjects.

## Steps

1. **Locate the file.** `apps/agent-health-clinic/CHANGELOG.md`.

2. **If it does not exist — bootstrap it.**
   - `git log --date=short --pretty=format:'%ad|%h|%s' -- apps/agent-health-clinic`
   - For each date (newest first), inspect the commits of that day
     (`git show --stat <hash> -- apps/agent-health-clinic`) and write a `## YYYY-MM-DD`
     section with bullets summarising what actually changed. Merge related commits into
     one bullet; drop pure noise (formatting, typo fixes in notes).
   - Keep the header block from the current file if one already exists.

3. **If it exists — add today's changes.**
   - Find the last commit that touched the changelog:
     `git log -1 --format=%H -- apps/agent-health-clinic/CHANGELOG.md`
   - Collect changes since then: `git log <hash>..HEAD -- apps/agent-health-clinic`
     plus uncommitted work (`git status`, `git diff`, `git diff --cached`).
   - Under a `## <today>` heading (today's date is available in the session context;
     create the heading at the top if missing, below any header block), add bullets for
     the new changes. If a `## <today>` heading already exists, append to it and revise
     existing bullets rather than duplicating.

4. **Writing bullets.**
   - Describe the change from a reader's point of view: new features, behaviour changes,
     breaking changes, bug fixes, notable refactors, new specs/docs.
   - One line each, imperative-free past-tense phrasing ("Added…", "Fixed…", "Changed…").
   - Group by theme; skip dependency bumps and formatting-only churn unless significant.
   - Reference spec folders or roadmap phases when relevant.

5. **Do not commit.** Leave the edited `CHANGELOG.md` in the working tree and show the
   user the diff so they can adjust wording before merging.
