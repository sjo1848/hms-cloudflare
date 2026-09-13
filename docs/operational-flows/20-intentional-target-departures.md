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

Pricing-affecting in this wave: reservation room change, stay-date change, reassignment, extension, extra charge, or future explicitly priced command.

All other booking metadata/state/evidence writes preserve the stored total, including guest/name/ordinary notes-only update, check-in, cancellation, no-show, late arrival and checkout. Checkout may alter invoice/settlement lifecycle against the preserved total but does not reprice accommodation. Cancellation/no-show preserve financial evidence and add no automatic disposition.

## D10 — Timezone-aware late-arrival ETA wire

Accepted source OpenAPI declares `late_arrival_eta` as `date-time`, while source UI serializes a UTC instant and strips the timezone suffix before sending a naive datetime. Target removes that ambiguity.

Target wire contract requires an RFC3339/ISO-8601 date-time with an explicit `Z` or numeric UTC offset. Server parses it as an absolute instant, verifies it is in the future, converts it to the hotel's persisted IANA timezone, and validates the resulting hotel-local date against `check_in <= eta_date < check_out`.

Audit stores an absolute timestamp/instant representation; UI renders in hotel/user context as appropriate. A timezone-less ETA is rejected as malformed instead of being guessed.

Reason: future-time and hotel-day semantics cannot be authoritative when the payload omits its offset. This hardening aligns the target with the OpenAPI `date-time` intent while correcting the accepted source serialization ambiguity.

## Non-authorized departures

Without a new decision, remain outside scope: frozen contracted-rate pricing on actual priced room/date mutations; new arrival cutoffs; automatic refund/retention/penalty; automatic relocation/split stay; multiple simultaneous maintenance cases; new OUT_OF_ORDER design; paid realtime; production/cutover/real-data migration.

## Governance rule

If BUILD needs behavior different from source and this register, stop and return to definition.