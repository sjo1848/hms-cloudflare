# Mandatory Pre-Critic — B0 Budget Policy Review

Task: `HMS-B0-BUDGET-POLICY-REVIEW-001`
Base: `3d40b82353ce747d9b79100e0d28e7f9348764fc`
Status: `STOP — BUNDLE_BUDGET_POLICY_GATE_REQUIRED; condition 5 is unresolved with concerning integrated evidence`

## Admission checks

- Frozen bounded contract exists before any checker/budget edit: **PASS**.
- Every registered invariant is classified with rationale: **PASS** (Task Contract).
- Measurement separates aggregate raw, aggregate gzip, entry/initial transfer, and performance timing: **PASS WITH LIMITATION**; local integrated Worker/D1 measured, no field CWV/Lighthouse claim.
- No product-code or architecture edit is permitted: **PASS**.
- Test/dev leakage audit is based on emitted production output, not source filenames alone: **PASS**; emitted-code scan recorded in result evidence.
- No budget change until all six criteria are evidenced: **PASS**.
- Independent reviewer input is read-only and cannot self-approve policy: **PASS**.

Do not change the budget checker until the initial-payload and emitted-dev/test checks are completed and this Pre-Critic is updated to a final admission result.

## Final admission result

- Conditions 1–4 and 6: PASS; condition 2 discloses the residual localStorage key `hms-local-acceptance-profile` as non-material.
- Condition 5: **UNPROVEN / CONCERN**. A clean single-session integrated local Worker/D1 run reached first Reception queue row at 3,605 ms (FCP 240 ms, LCP samples 240/676 ms, one 89 ms long task). `/rooms`, `/guests`, and `/reservation-creation-operations` took ~2.39–2.40 s concurrently. This is evidence of an operational readiness delay in the local integrated run; local emulator timing is not field performance, but the condition “no material initial-load problem” cannot be asserted.
- Earlier multiple-session runs were excluded from the conclusion because open sessions and periodic refreshes overlapped, causing artificial load and eventually Wrangler `Network connection lost`. The isolated run was captured after those sessions were closed and the local Worker restarted.
- **Admission: FAIL/CLOSED** for applying the provisional raw ceilings and starting Block B. No checker or product changes were made. Preserve current limits. Stop at `BUNDLE_BUDGET_POLICY_GATE_REQUIRED` for Controller classification/next direction.
