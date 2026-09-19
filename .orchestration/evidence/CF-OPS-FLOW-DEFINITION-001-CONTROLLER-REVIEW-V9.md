# CONTROLLER REVIEW V9 — FULL DEFINITION PACK

Artifact reviewed: `31eee995d97fef4fcddacade9cca1afabdced391`
Boundary reviewed: `a5de81baf39fcbcb597dc036dde3d382d1b2bef5`
Verdict: `REWORK`

Boundary structure: PASS — B9 is one metadata-only commit over A9.

## F1 — Active Task Contract still describes pre-UX scope — BLOCKING GOVERNANCE

`.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md` still defines the old P0/P1/P2 scope and exit criteria. It does not name D12, 21/22, E2E-21, capability-aware navigation, focused task surfaces, filter/history continuity or the new interaction acceptance perimeter.

Because this file is the active Task Contract, an implementation/planning agent could legitimately follow it and omit the newly binding UX scope.

Required repair:
- rewrite the active Task Contract as the complete domain + app-interaction definition contract;
- bind canonical documents 18–22, transition/RBAC/invariants;
- state that implementation planning is forbidden until immutable independent review passes;
- include app-interaction exit criteria and current source-departure set D1-D12.

## F2 — Binding decision contains stale review-gate language — GOVERNANCE CONSISTENCY

`CF-OPS-FLOWS-001.md` still says UX is “being reconciled” and refers to A7/B7 as the relevant superseded gate even though A8 was also reviewed/reworked and A9 is current.

Required repair:
- remove artifact-version-specific Human Gate prose from the binding business decision;
- state simply that no internal product-policy gate remains and immutable external definition review is required before implementation planning;
- bind D12/21/22 explicitly.

## F3 — E2E companion list omits binding interaction matrix 22 — CONSISTENCY

E2E-21 uses 21/22 semantics, but the E2E document’s canonical companion header names 21 and not 22.

Required repair:
- add 22 to canonical companions.

## Other areas — PASS

No further blocker found in D1-D12, route compatibility, capability bootstrap, domain/RBAC, financial truth, overlay/back stack, filter/history/scroll, selected-booking Billing, refresh/conflict, accessibility/motion, responsive perimeter or JS-budget constraints.

Result: REWORK F1-F3. Implementation remains locked.
