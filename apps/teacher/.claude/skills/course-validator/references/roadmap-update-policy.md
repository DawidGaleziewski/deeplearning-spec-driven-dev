# Roadmap Update Policy

Read this reference only when recording a validation result or changing course
status.

## Passed

Apply these changes together:

1. In the course spec:
   - set `status: passed`;
   - set `decision: passed`;
   - update `last_updated`;
   - complete the validation-attempt record;
   - record scores, evidence, hints, and rationale;
   - set Roadmap updated, Ledger updated, and Repository validation fields.
2. Append a `passed` row to `validation/learning-ledger.md`.
3. Change only the matching item in `roadmap.md` from `[ ]` to `[x]`.
4. Run `python scripts/validate_learning_state.py`.

If the deterministic validation fails, repair the inconsistent learning files.
Do not delete evidence or weaken the validator.

## Remediation

Apply these changes together:

1. Set the course spec to `status: remediation` and `decision: remediation`.
2. Record the attempt, scores, evidence, hints, and gaps.
3. Add up to three remediation tasks with observable evidence targets.
4. Append a `remediation` row to the ledger.
5. Keep the roadmap checkbox unchanged.
6. Run the repository-state validator.

## Paused or abandoned

Record the reason in the course spec and set `status: paused` or
`status: proposed`. Do not create a pass, delete earlier attempts, or check the
roadmap.

## Prohibited transitions

- `learning` directly to a roadmap checkmark
- `remediation` directly to `passed` without re-validation
- `passed` without a ledger entry
- roadmap checkmark without a passed spec
- retroactively rewriting an unsuccessful ledger entry
