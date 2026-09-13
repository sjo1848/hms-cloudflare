# HMS — Operational Flow Definition Pack

Status: `ANALYSIS / IMPLEMENTATION LOCKED`  
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.

## Canonical entry point

Read `00-master-definition.md` first. It is the single current summary of the operational-flow definition package. Detailed documents below provide the binding semantics and evidence behind that summary.

Core product rule: **HMS follows the operator workflow; the operator must not reconstruct state the system already knows.**

Core parity rule: **accepted source behavior is preserved unless an explicit product decision authorizes a departure.**

Core domain rule: **physical room state and sellable availability are different concepts.**

## Canonical detailed documents

- `01-domain-model.md` — booking, room, inventory, maintenance and availability model.
- `02a-reassignment.md` — checked-in room reassignment, remaining-night inventory and source-parity pricing.
- `02b-canonical-maintenance-model.md` — canonical `NON_BLOCKING | BLOCKING` maintenance model.
- `02c-no-show.md` — source-parity no-show lifecycle semantics.
- `02d-stay-extension.md` — active-stay extension with source-parity pricing.
- `03a-frontdesk-continuity.md` — Reception workflow continuity.
- `03b-context-navigation.md` — stable-ID contextual navigation.
- `03c-refresh-read-model.md` — refresh/revalidation strategy and front-desk read model.
- `03d-operational-time.md` — authoritative hotel-local operational date/time without inventing new calendar cutoffs.
- `04-acceptance-and-sequencing.md` — acceptance scenarios.
- `04a-sequencing-refinement.md` — current wave order.
- `05-maintenance-data-rbac.md` — maintenance schema/event/RBAC requirements.
- `06-booking-temporal-rules.md` — source-parity check-in/cancellation/no-show and operational-date rules.
- `07-maintenance-future-reservations.md` — maintenance effect on sellability and future reservations.
- `08-extension-billing.md` — extension pricing/Billing atomicity.
- `09-technical-prerequisites.md` — budget/headroom and other prerequisite constraints.
- `10-operational-ux-targets.md` — target operator interactions.
- `11-reservation-guest-composition.md` — atomic inline guest + reservation flow.
- `12-housekeeping-maintenance-board.md` — Housekeeping/Maintenance operational board behavior.
- `13-financial-policy-gates.md` — source-parity financial policy register and future-decision boundaries; no current open Human Gate.
- `14-billing-consistency.md` — accounting invariants.
- `15-lifecycle-event-contract.md` — lifecycle/audit event truth contract.
- `16-target-transition-matrix.md` — authoritative booking/room command matrix.
- `17-reassignment-history.md` — room-history/inventory trace semantics.

## Superseded analysis artifacts

Files explicitly marked `SUPERSEDED` are retained only for traceability and are not implementation authority. Git history remains the source for earlier discarded reasoning.

## Governance

- `.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md` — analysis contract.
- `.orchestration/decisions/CF-OPS-FLOWS-001.md` — consolidated binding decisions.
- `.orchestration/decisions/CF-OPS-FLOWS-003-MAINTENANCE-MODEL.md` — maintenance refinement.
- `.orchestration/OPERATIONAL-INVARIANTS.md` — operational invariants.
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md` — baseline evidence.
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-DEEP-DIVE.md` — adversarial/source evidence.
- `.orchestration/STATE.md` / `STATUS.json` — authoritative phase gate.

Implementation remains forbidden until the definition package passes fresh independent review and orchestration state explicitly exits the definition lock.