# HMS — Operational Flow Definition Pack

Status: `ANALYSIS / IMPLEMENTATION LOCKED`  
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.

## Canonical entry point

Read `00-master-definition.md` first, then `18-end-to-end-scope-matrix.md`. The master defines the binding product/domain semantics; the E2E matrix defines the complete implementation and acceptance perimeter.

Core product rule: **HMS follows the operator workflow; the operator must not reconstruct state the system already knows.**

Core parity rule: **accepted source behavior is preserved unless an explicit product decision authorizes a departure.**

Core domain rule: **physical room state, future sellability and immediate readiness are different concepts.**

## Canonical detailed documents

- `00-master-definition.md` — single binding summary and phase exit rule.
- `01-domain-model.md` — booking, room, inventory, maintenance and financial relationships.
- `02a-reassignment.md` — checked-in room reassignment, remaining-night inventory and source-parity pricing.
- `02b-canonical-maintenance-model.md` — canonical `NON_BLOCKING | BLOCKING` maintenance model.
- `02c-no-show.md` — source-parity no-show lifecycle semantics.
- `02d-stay-extension.md` — active-stay extension with source-parity pricing.
- `03a-frontdesk-continuity.md` — Reception workflow continuity.
- `03b-context-navigation.md` — stable-ID contextual navigation.
- `03c-refresh-read-model.md` — refresh/revalidation and front-desk board direction.
- `03d-operational-time.md` — authoritative hotel-local operational date/time without inventing new cutoffs.
- `04-acceptance-and-sequencing.md` — representative acceptance scenarios.
- `04a-sequencing-refinement.md` — implementation wave order.
- `05-maintenance-data-rbac.md` — maintenance schema/event/RBAC requirements.
- `06-booking-temporal-rules.md` — source-parity check-in/cancellation/no-show and operational-date rules.
- `07-maintenance-future-reservations.md` — maintenance effect on sellability and future reservations.
- `08-extension-billing.md` — extension pricing/Billing atomicity.
- `09-technical-prerequisites.md` — bundle headroom, timezone and migration prerequisites.
- `10-operational-ux-targets.md` — target operator interactions.
- `11-reservation-guest-composition.md` — atomic inline guest + reservation flow.
- `12-housekeeping-maintenance-board.md` — Housekeeping/Maintenance board behavior.
- `13-financial-policy-gates.md` — source-parity financial register and future decision boundaries; no current open Human Gate.
- `14-billing-consistency.md` — accounting invariants.
- `15-lifecycle-event-contract.md` — lifecycle/audit truth contract.
- `16-target-transition-matrix.md` — authoritative booking/room command matrix.
- `17-reassignment-history.md` — room-history/inventory trace semantics.
- `18-end-to-end-scope-matrix.md` — complete E2E implementation, failure, cross-module and acceptance scope.

## Superseded analysis artifacts

Files explicitly marked `SUPERSEDED` are traceability only and are not implementation authority. Git history remains the source for earlier discarded reasoning.

## Governance

- `.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md` — analysis contract.
- `.orchestration/decisions/CF-OPS-FLOWS-001.md` — consolidated binding decisions.
- `.orchestration/decisions/CF-OPS-FLOWS-003-MAINTENANCE-MODEL.md` — maintenance refinement.
- `.orchestration/OPERATIONAL-INVARIANTS.md` — durable operational invariants.
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md` — target baseline evidence.
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-DEEP-DIVE.md` — adversarial/source evidence.
- `.orchestration/STATE.md` / `STATUS.json` — authoritative phase gate.

Implementation remains forbidden until the package passes a fresh full-scope review. Phase exit requires that the master, transition matrix, invariants and every row in `18-end-to-end-scope-matrix.md` are mutually consistent and implementation-ready.