# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT` to `.orchestration/INVARIANTS.md` for the next workflow wave.

## INV-OPS-ROOM-001 — Occupancy exit never skips turnover

If a guest actually occupied a room, checkout or reassignment cannot make the vacated room immediately `AVAILABLE`. It enters `DIRTY` unless an open `BLOCKING` maintenance case requires `MAINTENANCE`.

## INV-OPS-AVAIL-001 — Physical state and sellable availability are distinct

Room physical state, future date-range sellability and immediate check-in readiness must not be collapsed into one status/boolean.

## INV-OPS-MAINT-001 — Maintenance case is independent from physical state

Maintenance impact is `NON_BLOCKING | BLOCKING`, separate from priority. Non-blocking incidents may coexist with occupied/available state without automatically blocking sale. Blocking incidents prevent new occupancy. Opening a blocking case while occupied never moves the guest automatically; relocation/checkout is explicit.

## INV-OPS-NOSHOW-001 — No-show is not cancellation or occupancy

`NO_SHOW` is an explicit transition from eligible `CONFIRMED`, allowed when `hotel_local_date >= check_in`, releases inventory, does not dirty the room and does not invent refund/penalty policy.

## INV-OPS-EXTEND-001 — Active stay extension is atomic

Extending a `CHECKED_IN` stay claims every added night, applies accepted source repricing, reconciles Billing and updates dates as one logical operation. Any conflict leaves dates, totals, invoice, inventory and events unchanged.

## INV-OPS-CONTEXT-001 — One active case governs embedded context

Reception-selected booking governs embedded Billing and related contextual actions. A secondary workspace cannot silently retain another booking.

## INV-OPS-REVALIDATE-001 — Preview is advisory

Every mutation revalidates authoritative preconditions. Stale cross-screen state produces conflict and refresh, never false success.

## INV-OPS-TIME-001 — Hotel-local date is authoritative only where date is a business predicate

No-show, reassignment effective date, overrun classification and other genuinely date-sensitive rules use server-derived hotel-local date from a persisted valid IANA timezone. Browser time/raw UTC cannot authorize those decisions. Timezone work must not invent a check-in/cancellation cutoff.

## INV-OPS-HISTORY-001 — Reassignment preserves physical history

Only remaining inventory nights move during an in-stay reassignment. Historical nights remain associated with the room actually occupied; event history identifies old/new rooms and effective date.

## INV-OPS-OVERRUN-001 — Reassignment requires a future authoritative interval

A `CHECKED_IN` booking with `hotel_local_date >= check_out` cannot be reassigned until a later checkout is established through extension or occupancy ends through checkout. This is intentional target correction D2 and cannot be removed as an implementation simplification.

## INV-OPS-EVIDENCE-001 — Material operator evidence is backend-enforced

Cancellation/no-show require terminal reason min 6 trimmed chars; active-stay reassignment requires reason min 6; maintenance escalation requires escalation note min 6; maintenance resolution requires resolution note min 6. UI-only validation does not satisfy the contract. Failed evidence validation creates no mutation/audit success.

## INV-OPS-PRICE-001 — Booking date/room changes preserve accepted source repricing

For source-covered date/room updates, authoritative accommodation total is `total stay nights × current selected room price_cents`, plus extra charges. Reassignment uses destination price; extension uses current assigned room price with new total night count. Frozen/contracted rate requires future decision.

## INV-OPS-BILLING-001 — Booking total and invoice cannot diverge

If an invoice exists, any successful operation that changes authoritative booking total must reconcile invoice amount/status in the same logical operation. `PAID` cannot remain when `paid_amount_cents < amount_cents`; prior payment entries remain immutable.

## INV-OPS-CHECKOUT-001 — Settlement policy preserves accepted source truth

`settled` requires authoritative fully paid account. `pending-approved` is the governed positive-balance exception and retains reference/override requirements. `bookings.checkout.override` remains admin-only.

## INV-OPS-RBAC-001 — Operational capabilities are explicit and least-privilege

Maintenance mapping is binding: admin/ops/housekeeping read-report-resolve; receptionist read-report only; saas_admin none. `maintenance.report` may open/escalate; `maintenance.resolve` closes. Cleaning remains under `housekeeping.write`. Refactors cannot broaden roles silently.

## INV-OPS-MAINT-READ-001 — Maintenance read is least-privilege and room-scoped

`maintenance.read` has a canonical room-scoped read contract independent from `housekeeping.read`. Reception may inspect the active maintenance case without gaining access to the complete Housekeeping board. No open case is represented truthfully as null, not fabricated work.

## INV-OPS-API-001 — Canonical commands cannot be bypassed

`19-api-command-contract-map.md` is authoritative for lifecycle/maintenance API ownership. Generic booking PATCH or direct room-status mutation cannot bypass explicit checked-in lifecycle/maintenance commands. Parallel shadow endpoints are forbidden unless a new decision supersedes the map.

## INV-OPS-COMPAT-001 — Legacy compatibility cannot redefine domain truth

Legacy housekeeping `dirty` may remain only as compatibility alias for historical blocking maintenance-room resolution. New UI/domain behavior use canonical resolve; compatibility delegates to the same semantics.

## INV-OPS-CONTRACT-001 — OpenAPI/client contract follows runtime API

Every new/additive route, payload, response field or enum used by the workflow wave must be represented in published API/client contracts before browser acceptance. Client drift or undocumented runtime blocks completion.

## INV-OPS-DEPARTURE-001 — Source departures are closed-set

`docs/operational-flows/20-intentional-target-departures.md` is the complete authorized departure register for this wave. Behavior not listed there must preserve accepted source semantics. If BUILD requires a new departure, stop and create a product/definition decision before implementation continues.

## INV-OPS-PARITY-001 — Source behavior cannot be silently narrowed

When source permits a transition or defines pricing/financial semantics, target cannot silently add a stricter cutoff/policy or substitute a pricing model because it appears preferable. Only an explicit registered departure permits divergence.

## INV-OPS-POLICY-001 — Unsupported commercial automation requires a decision

BUILD must not invent automated refund, retention, penalty, contracted-rate migration or other new commercial behavior absent from accepted source/product decisions.