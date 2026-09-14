# 20 — Intentional target departures from accepted source

Status: `BINDING GOVERNANCE REGISTER / IMPLEMENTATION LOCKED`

Default is accepted-source parity. Only departures listed here are authorized for this workflow wave.

## D1 — Authoritative hotel-local operational date
Persist hotel IANA timezone and derive `hotel_local_date` server-side for genuine date predicates. No new check-in/cancellation cutoff.

## D2 — Normalize overrun stay before reassignment
If `hotel_local_date >= check_out`, extend to a future checkout or checkout before reassignment.

## D3 — Explicit no-show and extension commands
Use explicit commands rather than generic update for material lifecycle/inventory operations.

## D4 — Server-enforced reassignment reason
Active-stay reassignment requires trimmed reason min 6 server-side.

## D5 — Atomic inline guest + reservation
One same-hotel atomic command prevents unintended guest-only persistence when booking fails.

## D6 — Occupied maintenance + dedicated capabilities
Maintenance is independent case impact `NON_BLOCKING | BLOCKING`, supports occupied coexistence and dedicated read/report/resolve. V1 one open case/room.

## D7 — Server-owned front-desk board
Restore/extend accepted `GET /api/v1/front-desk/board` for server-owned queue/readiness/blocker meaning.

## D8 — Invoice consistency after authoritative total changes
Every actual booking-total change reconciles an existing invoice atomically; false settlement is forbidden; payment history remains evidence.

## D9 — Only explicit pricing mutations may change booking total
Priced in this wave: reservation room/date change, reassignment, extension, extra charge, or future explicitly priced command. Guest/name/ordinary notes-only, check-in, cancellation, no-show, late arrival and checkout preserve stored total.

## D10 — Timezone-aware late-arrival ETA wire
Late-arrival ETA requires RFC3339/ISO-8601 with explicit Z/offset. Server parses the instant, verifies future time, converts to hotel IANA timezone and validates hotel-local stay date. Timezone-less ETA is rejected.

## D11 — Prior-payment, credit, ledger correlation and VOIDED reconciliation
Current target schema forbids paid amount above invoice amount even though a legitimate priced mutation can lower the later authoritative total. Target preserves financial history instead of rewriting it.

Binding rules:
- `payment_entries` are immutable cash/payment evidence;
- after every successful payment or financial reconciliation, `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)` for that invoice;
- repricing never inserts, deletes or modifies a payment entry and never represents price reconciliation as a payment received;
- repricing preserves existing payment method/reference metadata; it does not fabricate a new method/reference or cash movement;
- invoice may have paid amount above amount;
- `remaining_cents = max(amount_cents - paid_amount_cents, 0)`;
- `credit_cents = max(paid_amount_cents - amount_cents, 0)`;
- non-VOIDED status is PAID when paid >= amount, otherwise PENDING;
- PENDING -> PAID caused by price decrease records reconciliation time as `paid_at`;
- PAID -> PENDING caused by price rise clears `paid_at`;
- PAID -> PAID preserves existing `paid_at` when present;
- new payment attempts are rejected while remaining is zero;
- credit is visible/auditable only; no automatic refund, transfer, wallet, penalty offset or cash movement.

An existing VOIDED invoice is fail-closed for priced mutations: reservation room/date repricing, reassignment, extension and extra charge return conflict before partial domain/financial success. State/evidence-only commands may preserve VOIDED; checkout cannot claim settlement from it. No implicit VOIDED revival.

A forward migration relaxes the legacy `paid_amount_cents <= amount_cents` constraint without rewriting historical migrations. Remaining and credit are derived values; no CREDIT invoice status is added. Financial audit must identify price reconciliation separately from payment receipt and include old/new amount, paid, remaining, credit and status.

## Non-authorized departures
Outside scope without new decision: automatic credit disposition/refund, cross-booking credit transfer, VOIDED recovery command, frozen contracted-rate pricing, new arrival cutoffs, automatic relocation/split stay, multiple maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration.

## Governance rule
If BUILD needs behavior different from source and this register, stop and return to definition.