# CF-I04 REWORK-3 — External Independent Critic

Reviewed artifact: `cea75f7ebce322e49be16c1167b55efa59cbada6`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`
Diagnosis: `DOMAIN_PARITY_DEFECT + UX_PARITY_DEFECT + EVIDENCE_DEFECT`

## Summary

REWORK-3 resolves most of the hard backend findings from the previous cycle. The target now persists the actual check-in guest count, persists checkout policy/reference, closes the hold-vs-reassignment final-boundary race, contains deterministic stale-destination and hold-race regressions, preserves valid `A -> B -> A -> C` reassignment history, and retains the D1 final-event rollback guards.

The remaining blockers are narrower. They are not architecture decisions and do not require a Human Gate. They concern exact lifecycle parity and browser/mobile acceptance under the already-approved source contract and `CF-UX-PARITY-001`.

## Blocking findings

### P1 — Check-in still adds an unauthorized extra boolean gate

The accepted source domain defines check-in completion as:
- actual positive `check_in_guests_count`;
- document verified;
- contact confirmed;
- stay confirmed.

The target now correctly persists `check_in_guests_count`, but the API still additionally requires `guest_count_confirmed === true`, and the UI still renders a separate `Guest count confirmed` checkbox.

That extra boolean does not exist in the accepted source completion rule or the CF-I04 Task Contract. A source-equivalent valid check-in containing a positive guest count plus document/contact/stay confirmations can therefore fail in the target only because the extra checkbox/field is absent.

Required repair:
- remove `guest_count_confirmed` as a separate required domain/API/UI gate;
- let the positive actual guest count itself satisfy the guest-count requirement;
- keep actual count persistence, actor/time/request traceability and the three accepted confirmations.

### P1 — Checkout still adds an unauthorized extra `payment_policy_accepted` gate

The accepted source checkout rule requires a concrete payment policy (`settled` or `pending-approved`), conditional reference, charges reviewed, room release confirmed and housekeeping handoff.

The target now correctly carries policy/reference, but still separately requires `payment_policy_accepted === true`, and the target UI renders a `Payment policy accepted` checkbox in addition to the policy selector.

That is not part of the source lifecycle rule or CF-I04 contract. A valid source-equivalent checkout can therefore fail for an extra target-only acknowledgement.

Required repair:
- remove `payment_policy_accepted` as a separate required API/UI gate;
- treat choosing a valid policy as the policy requirement;
- preserve charge review, room release, housekeeping handoff and policy/reference persistence/audit.

### P1 — `pending-approved` reference validation is weaker than the source contract

The accepted source domain considers `pending-approved` complete only when the closing reference, after trimming, has length **at least 6**.

The target backend accepts `check_out_reference` with minimum length 3, and the target input also uses `minLength={3}`.

Required repair:
- enforce the source minimum of 6 trimmed characters for `pending-approved` at the authoritative backend boundary;
- align the UI constraint and regression evidence;
- add a regression proving a 3–5 character pending reference is rejected and a 6+ character reference is accepted.

### P1 — Mobile check-in is not actually the accepted source step flow

The source mobile check-in is an explicit staged task flow with four visible steps:
`Verificación -> Datos/estadía -> Habitación -> Confirmar ingreso`, including progress state, next/back navigation and step-specific gating.

The target introduces `checkInStep`, but does not use it to render distinct steps, progress, next/back controls or step-specific content. Instead, all fields remain visible at once and the same `Complete check-in` submit button must be pressed repeatedly before the API call is allowed.

The browser regression codifies this by clicking the same `Complete check-in` button three times after filling the full form. This is not a port/adaptation of the accepted mobile task model; it is an artificial click counter.

There is also a state-leak issue: `checkInStep` is not reset when another booking/case is selected. Once it reaches the terminal value for one case, a subsequent confirmed booking can bypass the intended staged progression.

Required repair:
- implement the lifecycle-relevant source mobile check-in flow as real visible stages with progress and next/back behavior;
- gate each stage according to the accepted source semantics;
- reset mobile step state when the selected booking/case changes or the workflow closes/completes;
- do not require repeated clicks on an unchanged submit button as a proxy for steps.

### P1 — Responsive browser evidence still does not prove lifecycle usability at all contracted widths

At 375px the test exercises check-in/error/recovery/reassignment/checkout. At 390/430/768/1024 it only verifies the workspace/queue/selected case shell after changing the viewport.

The CF-I04 acceptance criterion requires the required mobile and desktop lifecycle flows to remain usable at 375/390/430/768/1024. Shell reachability is not enough.

The new checkout policy/reference controls are also not substantively exercised by browser evidence: the regression does not select/test `pending-approved` with its reference behavior.

Required repair:
- at 390 and 430 exercise the actual mobile staged lifecycle controls, not only case selection;
- at 768 and 1024 exercise the desktop lifecycle controls sufficiently to prove check-in/reassignment/checkout remain usable;
- include observable checkout policy/reference behavior in the browser evidence;
- make the evidence document claim exactly what the script proves.

## Findings considered resolved for this cycle

- actual positive check-in guest count is persisted in D1;
- checkout policy/reference fields are persisted in D1;
- final reassignment guard now checks for overlapping room holds;
- deterministic stale-destination reassignment rollback is present with exact state assertions;
- deterministic hold-vs-reassignment rollback is present;
- valid repeated reassignment history `A -> B -> A -> C` remains allowed and tested;
- stale checkout rollback guard remains present;
- no generic lifecycle status PATCH bypass was observed;
- `RUNTIME_CAPABILITY_FALLBACK` remains accurately preserved;
- no paid/production/later-increment expansion was observed.

## Required next action

Under `PM-AUTONOMY-001`, Codex consumes this review directly and autonomously:

1. remove the two target-only boolean gates (`guest_count_confirmed`, `payment_policy_accepted`);
2. enforce source checkout-reference semantics (`pending-approved` requires trimmed length >= 6);
3. replace the mobile check-in click-counter with the actual source-parity staged task flow and reset behavior;
4. strengthen Playwright so lifecycle controls are substantively exercised at 375/390/430/768/1024, including policy/reference behavior;
5. align the evidence document with exactly what is proven;
6. run complete self-adversarial QA, D1/API regressions, browser tests, build/types/Wrangler/diff checks;
7. publish a fresh immutable CF-I04 artifact and stop at the next Independent Critic boundary.

Do not advance to CF-I05 before a fresh CF-I04 PASS.
