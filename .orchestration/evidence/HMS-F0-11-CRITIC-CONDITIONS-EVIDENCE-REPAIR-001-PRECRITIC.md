# Pre-Critic — F0.11 Independent Critic Conditions Evidence Repair

This bounded task repairs evidence gaps only, against the fresh `PASS_WITH_CONDITIONS` review of F0.11 A+B2. Artifact A remains immutable.

## Admission

- PASS: four findings are exact, testable evidence gaps; critic reported no demonstrated product defect or blocker.
- PASS: source inspection confirms Rooms selected identity reconciliation is in `RoomsPage.load`; Housekeeping owns board date/filter/search/selection and a deterministic next-task rule; no production change is needed to test them.
- PASS: initial CLI browser console artifact was read-only inspected. The referenced records are React DevTools `INFO`, not `ERROR`; retain fresh classified logs from the final runner rather than infer from the summary line.
- PASS: the raw-budget number must be evidenced by a fresh captured production build + explicit architecture/budget run, not browser runtime smoke.
- PASS: no code/tests/evidence edits occurred before this Task Contract and Pre-Critic admission record.

## Mutation/security/scope sweep

- No backend, D1 schema, API, financial, auth, or domain mutation code is planned. Mock browser tests simulate responses and do not write persisted data.
- Integrated runs use new disposable synthetic D1 fixtures; Worker/Vite/browser processes are owned and cleaned by the runners.
- Only F0.11 browser evidence scripts and evidence artifacts may change. No F0.12 implementation begins before A2+B Independent Critic disposition.

## Gate decision

`PRE-IMPLEMENTATION / EVIDENCE-REPAIR GATE: PASS`

Proceed with test/evidence repairs under `.orchestration/contracts/HMS-F0-11-CRITIC-CONDITIONS-EVIDENCE-REPAIR-001.md`. This is not an implementation PASS or Independent Critic verdict.
