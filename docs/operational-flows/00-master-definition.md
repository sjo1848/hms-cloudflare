# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`  
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Canonical set: `16-target-transition-matrix.md`, `18-end-to-end-scope-matrix.md`, `19-api-command-contract-map.md`, `20-intentional-target-departures.md`, `05-maintenance-data-rbac.md`, `.orchestration/OPERATIONAL-INVARIANTS.md`.

## Governing rules

HMS follows the hotel operator workflow. Physical room state, future sellability and immediate readiness are distinct. Source behavior is preserved unless a departure is explicitly registered in `20`; unregistered divergence is a defect.

## Booking lifecycle

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. No generic rollback. No new calendar cutoff for check-in/cancellation. No-show from `hotel_local_date >= check_in`.

Late arrival is context on CONFIRMED, not a state: existing booking PATCH with `front_desk.late_arrival_eta` + note; ETA future and hotel-local date inside `[check_in,check_out)`; note min 6/max 250; actor/time/audit; no room/inventory/Billing mutation.

## Pricing mutation boundary — D9

Only an explicitly pricing-affecting operation may change authoritative booking total: booking room/date edit, reassignment, extension, extra charge, or another future priced command.

State/evidence-only operations **preserve the existing booking total**: check-in, cancellation, no-show, late-arrival recording and checkout. Checkout may create/reconcile invoice and settlement state against that existing total but does not reprice accommodation. Cancellation/no-show preserve total and financial evidence for follow-up. This intentionally removes the accepted source generic-PATCH side effect that can recalculate price on unrelated state/evidence writes.

## Room / maintenance

Normal occupied turnover: `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`. Open BLOCKING maintenance at vacancy routes to MAINTENANCE, then resolution -> DIRTY.

Maintenance impact is `NON_BLOCKING | BLOCKING`. NON_BLOCKING may coexist with OCCUPIED/AVAILABLE/DIRTY/CLEANING with physical state unchanged and no independent sale/readiness block. BLOCKING prevents new occupancy; occupied guest remains until explicit move/checkout. V1 one open case/room.

Roles: admin/ops/housekeeping maintenance read-report-resolve; receptionist read-report/escalate but not resolve; saas_admin none. Cleaning remains `housekeeping.write`.

## Reassignment / extension

Reassignment: CHECKED_IN, `hotel_local_date < check_out`, ready/conflict-free destination, reason min 6. Move only `[max(check_in,hotel_local_date),check_out)`, preserve history, destination OCCUPIED, old DIRTY or MAINTENANCE. This is pricing-affecting: destination-current-price × total nights + extras, invoice reconciled. Overrun must extend or checkout first.

Extension: explicit checked-in later checkout, all added nights atomic. Pricing-affecting: current assigned-room price × total nights + extras, invoice reconciled.

## Billing / checkout

Payments are immutable evidence. Any pricing-affecting total change reconciles invoice atomically. A PAID invoice cannot remain paid when coverage becomes insufficient. `settled` requires fully paid; positive balance uses `pending-approved` + reference + admin-only override. Checkout itself preserves booking total.

## API ownership

`19-api-command-contract-map.md` is binding: preserve/harden check-in/reassign/checkout; booking PATCH owns confirmed pre-occupancy edits, cancellation and late-arrival context; add no-show/extend-stay; add atomic `/bookings/with-guest`; preserve/extend front-desk board; add maintenance read/escalate/resolve; legacy `/dirty` compatibility-only. Front-desk board requires `bookings.read` -> admin/ops/receptionist only.

Generic PATCH/direct room status cannot bypass canonical commands. New API surface must align OpenAPI/client types.

## Workflow continuity

Reception booking controls embedded Billing. Stable query IDs carry context only. Revalidate after mutation, focus/context entry and modest visible polling. After success preserve filters/search and select next case by deterministic board priority.

## Technical prerequisites / waves

Before material UI growth: total generated raw JS `<=300000` without raising 320000 budget. Before date-sensitive P0: persisted IANA timezone + server hotel-local date. Historical migrations immutable.

Wave 0: JS headroom + timezone. Wave 1: reassignment, maintenance, arrival exceptions, extension/Billing. Wave 2: board/Reception/Billing/guest+reservation/context continuity. Wave 3: optimization + synthetic shift. Each state-changing increment gets its own Task Contract and independent review.

## Outside scope

No frozen contracted-rate model, new arrival cutoffs, automatic refund/penalty/retention, split stay/automatic relocation, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration, or unrelated Reports/Users/Network redesign.

## Definition exit

Close analysis only when canonical documents are contradiction-free, all E2E rows are implementation-ready, source departures are closed-set, no Human Gate blocks scope, Pre-Critic passes, immutable Artifact+Boundary critic returns PASS, and orchestration points to that artifact. Until then implementation remains locked.