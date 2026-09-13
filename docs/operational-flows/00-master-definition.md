# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`  
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Canonical set: `16-target-transition-matrix.md`, `18-end-to-end-scope-matrix.md`, `19-api-command-contract-map.md`, `20-intentional-target-departures.md`, `05-maintenance-data-rbac.md`, `.orchestration/OPERATIONAL-INVARIANTS.md`.

## Governing rules

HMS follows the hotel operator workflow. Physical room state, future sellability and immediate readiness are distinct. Source behavior is preserved unless a departure is explicitly registered in `20`; unregistered divergence is a defect.

## Booking lifecycle / arrival context

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. No generic rollback. No new calendar cutoff for check-in/cancellation. No-show from `hotel_local_date >= check_in`.

Late arrival is context on CONFIRMED, not a state. Existing booking PATCH carries ETA+note. Under D10 ETA wire is RFC3339/ISO-8601 with explicit Z/offset; server parses an absolute instant, converts to the hotel's IANA timezone and validates hotel-local ETA date inside `[check_in,check_out)`. Note min 6/max 250; actor/time/audit persisted; no room/inventory/Billing mutation. Timezone-less ETA is invalid.

## D9 pricing mutation boundary

Only an explicitly pricing-affecting operation may change authoritative booking total: booking room/date edit, reassignment, extension, extra charge, or future explicitly priced command.

All other booking metadata/state/evidence writes preserve the stored total: guest/name/ordinary notes-only, check-in, cancellation, no-show, late-arrival recording and checkout. Checkout may create/reconcile invoice/settlement state against that existing total but does not reprice accommodation. Cancellation/no-show preserve financial evidence and add no automatic disposition.

## Room / maintenance

Normal occupied turnover: `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`. Open BLOCKING maintenance at vacancy routes to MAINTENANCE, then resolution -> DIRTY.

Maintenance impact `NON_BLOCKING | BLOCKING`. NON_BLOCKING may coexist with OCCUPIED/AVAILABLE/DIRTY/CLEANING with physical state unchanged and no independent sale/readiness block. BLOCKING prevents new occupancy; occupied guest stays until explicit move/checkout. V1 one open case/room.

Roles: admin/ops/housekeeping maintenance read-report-resolve; receptionist read-report/escalate not resolve; saas_admin none. Cleaning remains housekeeping.write.

## Reassignment / extension

Reassignment: CHECKED_IN, `hotel_local_date < check_out`, ready/conflict-free destination, reason min 6. Move only `[max(check_in,hotel_local_date),check_out)`, preserve history, destination OCCUPIED, old DIRTY or MAINTENANCE. Pricing-affecting: destination-current-price × total nights + extras, invoice reconciled. Overrun must extend or checkout first.

Extension: explicit checked-in later checkout, all added nights atomic. Pricing-affecting: current assigned-room price × total nights + extras, invoice reconciled.

## Billing / checkout

Payments are immutable evidence. Any pricing-affecting total change reconciles invoice atomically. False PAID state is forbidden. `settled` requires fully paid; positive balance uses pending-approved + reference + admin-only override. Checkout itself preserves booking total.

## API ownership

`19-api-command-contract-map.md` is binding: preserve/harden check-in/reassign/checkout; booking PATCH owns confirmed pre-occupancy edits, cancellation and late-arrival context; add no-show/extend-stay; add atomic `/bookings/with-guest`; preserve/extend front-desk board; add maintenance read/escalate/resolve; legacy `/dirty` compatibility-only. Front-desk board requires bookings.read -> admin/ops/receptionist only.

Generic PATCH/direct room status cannot bypass canonical commands. New API surface, pricing side effects and date-time format must align OpenAPI/client types.

## Workflow continuity

Reception booking controls embedded Billing. Stable query IDs carry context only. Revalidate after mutation, focus/context entry and modest visible polling. After success preserve filters/search and select next case by deterministic board priority.

## Technical prerequisites / waves

Before material UI growth: total generated raw JS <=300000 without raising 320000 budget. Before date-sensitive P0: persisted IANA timezone + server hotel-local date. Historical migrations immutable.

Wave 0: JS headroom + timezone. Wave 1: reassignment, maintenance, arrival exceptions, extension/Billing. Wave 2: board/Reception/Billing/guest+reservation/context continuity. Wave 3: optimization + synthetic shift. Each state-changing increment gets its own Task Contract and independent review.

## Outside scope

No frozen contracted-rate model, new arrival cutoffs, automatic refund/penalty/retention, split stay/automatic relocation, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration, or unrelated Reports/Users/Network redesign.

## Definition exit

Close analysis only when canonical documents are contradiction-free, all E2E rows implementation-ready, source departures closed-set, no Human Gate blocks scope, Pre-Critic passes, immutable Artifact+Boundary critic returns PASS, and orchestration points to that artifact. Until then implementation remains locked.