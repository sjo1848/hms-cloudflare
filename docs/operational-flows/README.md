# HMS — Operational Flow Definition Pack

Status: `ANALYSIS / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`

## Canonical entry points

Read in this order:

1. `00-master-definition.md` — binding product/domain summary.
2. `18-end-to-end-scope-matrix.md` — complete E2E implementation and acceptance perimeter.
3. `19-api-command-contract-map.md` — canonical API paths, payload/evidence contracts, compatibility and authorization.
4. `20-intentional-target-departures.md` — every authorized departure from accepted source behavior.
5. `16-target-transition-matrix.md` — booking/room transition authority.
6. `05-maintenance-data-rbac.md` — binding maintenance capability map.
7. `.orchestration/OPERATIONAL-INVARIANTS.md` — durable implementation invariants.

Core rules:

- HMS follows the operator workflow; the operator must not reconstruct known state.
- Accepted source behavior is preserved unless the departure is explicitly listed in `20`.
- Physical room state, future sellability and immediate readiness are distinct.
- No endpoint/UI is complete without its E2E, API/RBAC, audit, negative-path and cross-module proof.

## Detailed documents

- `01-domain-model.md` — booking, room, inventory, maintenance and financial relationships.
- `02a-reassignment.md` — in-stay reassignment, history, evidence, pricing and inventory.
- `02b-canonical-maintenance-model.md` — `NON_BLOCKING | BLOCKING` maintenance model.
- `02c-no-show.md` — no-show semantics.
- `02d-stay-extension.md` — checked-in extension semantics.
- `03a-frontdesk-continuity.md` — Reception continuity.
- `03b-context-navigation.md` — stable-ID navigation.
- `03c-refresh-read-model.md` — refresh/revalidation and front-desk board.
- `03d-operational-time.md` — hotel-local time foundation.
- `04-acceptance-and-sequencing.md` / `04a-sequencing-refinement.md` — acceptance and wave order.
- `05-maintenance-data-rbac.md` — binding maintenance data/RBAC.
- `06-booking-temporal-rules.md` — source-parity temporal rules plus explicit overrun departure.
- `07-maintenance-future-reservations.md` — future-reservation consequences.
- `08-extension-billing.md` — extension/Billing atomicity.
- `09-technical-prerequisites.md` — bundle/timezone/migration gates.
- `10-operational-ux-targets.md` — UX acceptance targets.
- `11-reservation-guest-composition.md` — atomic guest + reservation.
- `12-housekeeping-maintenance-board.md` — operational board behavior.
- `13-financial-policy-gates.md` — source-parity financial register; no current open Human Gate.
- `14-billing-consistency.md` — accounting invariants.
- `15-lifecycle-event-contract.md` — lifecycle/audit truth.
- `16-target-transition-matrix.md` — transition matrix.
- `17-reassignment-history.md` — room-history semantics.
- `18-end-to-end-scope-matrix.md` — full E2E scope.
- `19-api-command-contract-map.md` — API/compatibility/RBAC/OpenAPI/evidence contract.
- `20-intentional-target-departures.md` — authorized target corrections/hardenings and non-authorized drift.

## Governance

- `.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md`
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`
- `.orchestration/decisions/CF-OPS-FLOWS-003-MAINTENANCE-MODEL.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-DEEP-DIVE.md`
- `.orchestration/reviews/CF-OPS-FLOW-DEFINITION-001.md` — historical review ledger only.
- `.orchestration/STATE.md` / `STATUS.json` — current phase authority.

Files explicitly marked `SUPERSEDED` and failed prior artifacts are historical evidence, not implementation authority.

Implementation remains forbidden until a fresh immutable review passes across master, E2E matrix, API/evidence map, departure register, RBAC, transition matrix and invariants.