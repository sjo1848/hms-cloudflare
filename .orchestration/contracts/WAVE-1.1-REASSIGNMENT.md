# TASK CONTRACT — WAVE-1.1-REASSIGNMENT

TASK ID: `WAVE-1.1-REASSIGNMENT`  
PROJECT: `HMS Cloudflare`  
PHASE: `BUILD`  
BRANCH: `impl/wave-1.1-reassignment`  
BASE ARTIFACT: `b28595ddf90056d39d31e331a85b1a193936f9ec`  
STATUS: `READY / AUTHORIZED`

## Objective and authority

Implement the end-to-end backend command for a checked-in guest's in-stay
room reassignment. The read-only authority is
`origin/analysis/operational-flow-definition-v11`, specifically documents
02a, 06, 07, 16, 17, 19 and 20. The definition branch is not merged or
vendored into this implementation branch.

This wave is the backend/domain enabler for the later Reception reassignment
UX. It does not redesign Reception UI, repair Reports, change Users or
Housekeeping, introduce split-stay entities, or begin deployment/promotion.

## Binding invariants

- Only `CHECKED_IN` bookings may reassign.
- The authoritative hotel-local date comes from request context. Reject when
  `hotel_local_date >= check_out`; extension or checkout is required first.
- Require a trimmed reason of at least 6 characters.
- `effective_date = max(check_in, hotel_local_date)` and only
  `[effective_date, check_out)` inventory claims move.
- Past inventory claims and lifecycle history remain attached to the old room.
- Destination differs from the current room, is physically `AVAILABLE`, has
  no overlapping hold or inventory claim, and has no open `BLOCKING`
  maintenance. `NON_BLOCKING` is advisory and does not reject by itself.
- The destination becomes `OCCUPIED`; the old room becomes `MAINTENANCE` when
  it has open `BLOCKING` maintenance, otherwise `DIRTY`.
- Repricing uses the destination's current price for the total stay nights
  plus existing extra charges. Payment entries are never changed.
- Booking-total changes use the existing D11 trigger/reconciliation boundary;
  VOIDED invoices and ledger mismatch reject before domain mutation.
- A successful operation atomically changes booking, remaining inventory,
  room states, invoice reconciliation and lifecycle/financial evidence.
- `REASSIGN` history records old room, new room, effective hotel-local date,
  reason, actor, hotel and request identity.
- Stale booking/room/maintenance/hold/inventory/price/billing state returns
  conflict with no partial domain, inventory, billing or event drift.
- Hotel membership/routing is authoritative; cross-tenant identifiers fail
  closed.

## Forbidden actions

No generic PATCH bypass, automatic guest move, automatic future-booking
reassignment, split-stay entity, new invoice status, payment-entry mutation,
payment fabrication, Reports/Users repair, large Reception UI, staging,
deployment, main or production mutation.

## Invariant mapping

- `INV-ATOMIC-001` APPLIES — booking, remaining claims, room transitions and
  evidence must share one winning operation.
- `INV-AUDIT-001` APPLIES — one truthful REASSIGN event and conditional price
  reconciliation evidence on success; none on stale/rejected paths.
- `INV-DOMAIN-001` APPLIES — explicit lifecycle command, not generic update.
- `INV-TENANT-001` APPLIES — booking and room IDs are resolved in the
  authenticated hotel's operational D1.
- `INV-RBAC-001` APPLIES — lifecycle capability is backend enforced.
- `INV-PARITY-001` APPLIES — V11 temporal, history, destination and billing
  rules are preserved.
- `INV-ENUM-001` APPLIES — CHECKED_IN, OCCUPIED, DIRTY, MAINTENANCE and
  canonical REASSIGN semantics remain explicit.
- `INV-UX-001` APPLIES — API response contains the information needed by the
  later Reception workflow; no new UI is implemented here.
- `INV-RESP-001` N/A — no new responsive UI in this wave.
- `INV-EVID-001` APPLIES — all claims map to D1/API tests and immutable V11
  source.
- `INV-LEGACY-001` N/A — no legacy case synthesis is introduced.
- `INV-MONEY-001` APPLIES — repricing invokes D11 and preserves payment
  ledger exactness.
- `INV-STATE-001` APPLIES — artifact/evidence and orchestration boundary stay
  non-circular.
- `INV-ORDER-001` N/A — reassignment does not rank a queue.
- `INV-CF-I07-001..004` N/A — no admin/network role or audit route changes.
- `INV-CF-I08-001..005` N/A — Reports is outside scope.
- `INV-SCOPE-001` APPLIES — reassignment remains separate from the later UI
  and unrelated infrastructure.

## Acceptance evidence

Targeted executing-D1/API tests must cover normal DIRTY handoff,
BLOCKING→MAINTENANCE handoff, remaining-night-only movement, NON_BLOCKING
advisory destination, short reason, overrun, destination conflict, hold and
inventory conflict, upward/downward D11 reconciliation, VOIDED/ledger
mismatch atomic rejection, stale concurrent mutation, truthful history,
tenant denial and payment-entry preservation. Existing D11 and CF-I05/CF-I06
regressions must remain green.

The wave stops at its Controller checkpoint after implementation, adversarial
QA, Pre-Critic evidence and orchestration reconciliation. Independent Critic
remains a later frozen integration/promotion review and is not manufactured
here.
