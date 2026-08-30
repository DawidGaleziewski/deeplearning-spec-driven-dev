# Learning Validation Ledger

Append one row for every completed validation attempt, including unsuccessful
attempts. Do not rewrite earlier attempts.

The Course cell must begin with its roadmap ID, and Result must be `passed` or
`remediation`, so repository validation can correlate the records.

| Date | Course | Attempt | Result | Score | Strongest evidence | Remaining gap | Spec |
|---|---|---:|---|---:|---|---|---|
| 2026-08-30 | C01 — Spec-Driven Development with Coding Agents | 1 | passed | 14/15 | Unaided mechanism-level account of the constitution→spec→plan→implement→validate→replan loop and why context is cleared between stages (Q2); spec-first drift correction routed by altitude (Q4) | Feature-spec DRY (specs should reference the constitution, not restate the tech stack) and proportionality of the workflow to feature size | course-specs/C01-spec-driven-development/course-spec.md |
