# Block F bounded repair — wait for browser Back focus restoration

Task ID: `HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001`
Status: `FROZEN BEFORE CHANGE`
Parent Task Contract: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Base: local Block F candidate at `39ee0a2b38e7205b8e041e792e16ee469c996241` plus uncommitted F-account implementation.

## Finding and bounded scope

The integrated CF-I06 browser runner checks browser-Back focus synchronously immediately after the Case heading is present. Reception intentionally restores Case focus in a `requestAnimationFrame` after route/context hydration. This repair changes only the browser assertion to wait for the contractually required focus state, then reruns the complete browser scenario. If the focus state does not arrive within the bounded timeout, the regression remains a failure and product code must be investigated.

No product behavior, contract, capability, API, schema, accounting logic, Cash behavior, budget, or workflow is changed by this repair. Evidence remains local synthetic Worker/D1/Vite only.

## Invariant mapping

- `INV-EVID-001` — APPLIES: browser evidence must wait on and assert the actual focus restoration predicate; preserve full failure diagnostics and record the final runner result.
- `INV-STATE-001` — APPLIES: repair is included in immutable Artifact A and its exact identity is recorded by the immediate orchestration-only Boundary B.
- `INV-SCOPE-001` — APPLIES: do not absorb product or next-block work into this evidence-only correction.
- `INV-CF-I07-004` — APPLIES: the browser runner must verify its owned process tree is gone before PASS.

## Acceptance and evidence

The browser runner waits until `.reception-case-title` owns `document.activeElement` after browser Back; it must PASS across the existing response-loss, recovery, Cash regression, viewport, keyboard, application-return and browser-return journey. Full Worker/D1 process cleanup must be positively verified before terminal PASS. See `.orchestration/evidence/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-RESULTS.md` after rerun.
