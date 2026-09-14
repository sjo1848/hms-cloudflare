# 20 — Intentional target departures from accepted source

Status: `BINDING GOVERNANCE REGISTER / IMPLEMENTATION LOCKED`

Default is accepted-source parity. Only departures listed here are authorized for this workflow wave.

## D1 — Authoritative hotel-local operational date
Persist hotel IANA timezone and derive `hotel_local_date` server-side for genuine date predicates rather than UTC/browser date. No new check-in/cancellation cutoff.

## D2 — Normalize overrun stay before reassignment
If `hotel_local_date >= check_out`, extend to a future checkout or checkout before reassignment so remaining-night movement has a truthful future interval.

## D3 — Explicit no-show and extension commands
Add explicit no-show and extend-stay commands instead of generic booking update for material lifecycle/inventory operations.

## D4 — Server-enforced reassignment reason
Active-stay reassignment requires trimmed reason min 6 server-side.

## D5 — Atomic inline guest + reservation
Use one same-hotel atomic command so failed booking intent cannot leave unintended guest-only state.

## D6 — Occupied maintenance + dedicated capabilities
Maintenance becomes independent case impact `NON_BLOCKING | BLOCKING` with occupied coexistence, escalation/resolution and maintenance.read/report/resolve. V1 one open case/room.

## D7 — Server-owned front-desk board
Restore/extend accepted `GET /api/v1/front-desk/board` so queue/readiness/blocker meaning is server-owned.

## D8 — Invoice consistency after authoritative total changes
Every actual booking-total change reconciles an existing invoice atomically; false PAID state is forbidden; payments remain immutable.

## D9 — Only explicit pricing mutations may change booking total
Accepted source generic update can recalculate accommodation on unrelated status/metadata writes. Target removes that coupling.

Pricing-affecting in this wave: reservation room/date change, reassignment, extension, extra charge, or future explicitly priced command.

All other booking metadata/state/evidence writes preserve the stored total, including guest/name/ordinary notes-only update, check-in, cancellation, no-show, late arrival and checkout. Checkout may alter invoice/settlement lifecycle against the preserved total but does not reprice accommodation. Cancellation/no-show preserve financial evidence and add no automatic disposition.

## D10 — Timezone-aware late-arrival ETA wire
Accepted source OpenAPI declares `late_arrival_eta` as `date-time`, while source UI serializes a UTC instant and strips the timezone suffix before sending a naive datetime. Target removes that ambiguity.

Target wire contract requires RFC3339/ISO-8601 date-time with explicit `Z` or numeric UTC offset. Server parses it as an absolute instant, verifies it is future, converts it to hotel IANA timezone, and validates hotel-local date against `check_in <= eta_date < check_out`. Timezone-less ETA is rejected.

## D11 — Overpayment credit and VOIDED fail-closed reconciliation
Current target schema forbids `paid_amount_cents > amount_cents`, but a legitimate priced mutation can reduce the authoritative total after prior payments. Target permits this financial truth rather than rewriting payment history.

Binding rules:
- payment entries remain immutable;
- invoice may have `paid_amount_cents > amount_cents`;
- `remaining_cents = max(amount_cents - paid_amount_cents, 0)`;
- `credit_cents = max(paid_amount_cents - amount_cents, 0)`;
- non-VOIDED invoice status is `PAID` when `paid_amount_cents >= amount_cents`, otherwise `PENDING`;
- if reconciliation changes PENDING -> PAID because price fell, `paid_at` becomes the reconciliation timestamp;
- if reconciliation changes PAID -> PENDING because price rose, `paid_at` is cleared;
- if invoice remains PAID, preserve existing `paid_at` when already present;
- credit is visible financial truth only: no automatic refund, wallet credit, transfer to another booking, penalty offset or cash movement is introduced;
- new payment attempts are rejected while `remaining_cents = 0`.

An existing `VOIDED` invoice is a fail-closed boundary. Reservation room/date repricing, reassignment, extension and extra-charge mutations must return conflict and write no partial state until a separately authorized financial recovery flow restores valid invoice authority. State/evidence-only commands may preserve a VOIDED invoice, but checkout cannot claim settlement from a VOIDED invoice.

The required forward migration relaxes the legacy `paid_amount_cents <= amount_cents` constraint without rewriting historical migration files. `credit_cents` and `remaining_cents` are derived values; no new CREDIT invoice status is introduced.

## Non-authorized departures
Without a new decision, remain outside scope: automatic refund/credit payout or application, cross-booking credit transfer, manual VOIDED recovery workflow, frozen contracted-rate pricing on actual priced room/date mutations, new arrival cutoffs, automatic refund/retention/penalty, automatic relocation/split stay, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration.

## Governance rule
If BUILD needs behavior different from source and this register, stop and return to definition.