# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT` to `.orchestration/INVARIANTS.md` for the next workflow wave.

## INV-OPS-ROOM-001 — Occupancy exit never skips turnover

If a guest actually occupied a room, checkout or reassignment cannot make the vacated room immediately `AVAILABLE`. It enters `DIRTY` unless an open `BLOCKING` maintenance case requires `MAINTENANCE`.

## INV-OPS-AVAIL-001 — Physical state and sellable availability are distinct

Room physical state, future date-range sellability and immediate check-in readiness must not be collapsed into one status/boolean.

## INV-OPS-MAINT-001 — Maintenance case is independent from physical state

Maintenance impact is `NON_BLOCKING | BLOCKING`, separate from priority. Non-blocking incidents may coexist with occupied/available state without automatically blocking sale. Blocking incidents prevent new occupancy. Opening a blocking case while occupied never moves the guest automatically; relocation/checkout is an explicit lifecycle action.

## INV-OPS-NOSHOW-001 — No-show is not cancellation or occupancy

`NO_SHOW` is an explicit transition from eligible `CONFIRMED`, allowed from `hotel_local_date >= check_in` in source parity, releases reservation inventory, does not dirty the room and does not invent refund/penalty policy.

## INV-OPS-EXTEND-001 — Active stay extension is atomic

Extending a `CHECKED_IN` stay claims every added night, applies accepted source repricing, reconciles Billing and updates dates as one logical operation. Any conflict leaves dates, totals, invoice, inventory and events unchanged.

## INV-OPS-CONTEXT-001 — One active case governs embedded context

Reception-selected booking governs embedded Billing and related contextual actions. A secondary workspace cannot silently retain another booking.

## INV-OPS-REVALIDATE-001 — Preview is advisory

Every mutation revalidates authoritative preconditions. Stale cross-screen state produces conflict and refresh, never false success.

## INV-OPS-TIME-001 — Hotel-local date is authoritative only where date is a business predicate

No-show, reassignment effective date, operational classification and other genuinely date-sensitive rules use server-derived hotel-local date from a persisted valid IANA timezone. Browser time and raw UTC date cannot authorize those decisions. Timezone work must not silently add a calendar cutoff to check-in or cancellation when accepted source semantics have none.

## INV-OPS-HISTORY-001 — Reassignment preserves physical history

Only remaining inventory nights move during an in-stay reassignment. Historical nights remain associated with the room actually occupied; event history identifies old/new rooms and effective date.

## INV-OPS-PRICE-001 — Booking date/room changes preserve accepted source repricing

For source-covered date/room updates, authoritative accommodation total is `total stay nights × current selected room price_cents`, plus extra charges. Reassignment uses destination room price; extension uses current assigned room price with the new total night count. A frozen/contracted-rate model requires a future explicit product decision.

## INV-OPS-BILLING-001 — Booking total and invoice cannot diverge

If an invoice exists, any successful operation that changes authoritative booking total must reconcile invoice amount/status in the same logical operation. A `PAID` invoice cannot remain `PAID` when `paid_amount_cents < amount_cents`; prior payment entries remain immutable.

## INV-OPS-CHECKOUT-001 — Settlement policy preserves accepted source truth

Checkout policy `settled` requires an authoritative fully paid account. `pending-approved` is the governed positive-balance exception and retains its reference/override requirements. `bookings.checkout.override` remains admin-only. UI declarations cannot weaken this backend invariant.

## INV-OPS-RBAC-001 — Operational capabilities are explicit and least-privilege

Maintenance capability mapping is binding: admin/ops/housekeeping have read-report-resolve; receptionist has read-report only; saas_admin has no tenant maintenance authority. `maintenance.report` may open/escalate risk; `maintenance.resolve` closes cases. Cleaning continues under `housekeeping.write`. Refactors cannot broaden these role boundaries silently.

## INV-OPS-API-001 — Canonical commands cannot be bypassed

`docs/operational-flows/19-api-command-contract-map.md` is authoritative for lifecycle/maintenance API ownership. Generic booking PATCH or direct room-status mutation cannot bypass explicit checked-in lifecycle or maintenance commands. Parallel shadow endpoints are forbidden unless a new decision explicitly supersedes the map.

## INV-OPS-COMPAT-001 — Legacy compatibility cannot redefine domain truth

The legacy housekeeping `dirty` resolution path may remain only as a compatibility alias for the historical blocking maintenance-room case. New UI and new domain behavior use the canonical maintenance resolve command. Compatibility code must delegate to the same domain semantics rather than preserve contradictory behavior.

## INV-OPS-CONTRACT-001 — OpenAPI/client contract follows runtime API

Every new/additive route, payload field, response field or enum used by the new workflow wave must be represented in the published API/client contract before browser acceptance. Client drift or undocumented runtime behavior blocks completion.

## INV-OPS-PARITY-001 — Definition work cannot silently add product restrictions

When accepted source behavior permits a lifecycle transition or defines pricing/financial semantics, the target definition cannot silently add a stricter calendar/status/policy gate or substitute a different pricing model because it appears operationally preferable. Such a departure requires an explicit product decision.

## INV-OPS-POLICY-001 — Unsupported new commercial automation requires a decision

BUILD must not invent automated refund, retention, penalty, contracted-rate migration or other new commercial behavior absent from accepted source/product decisions. Such changes require an explicit future product contract.