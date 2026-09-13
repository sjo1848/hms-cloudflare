# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`  
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Canonical set:
- `16-target-transition-matrix.md`
- `18-end-to-end-scope-matrix.md`
- `19-api-command-contract-map.md`
- `20-intentional-target-departures.md`
- `05-maintenance-data-rbac.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`

## Governing rules

HMS follows the hotel operator workflow. Physical room state, future sellability and immediate check-in readiness are distinct facts. Accepted source behavior is preserved unless a departure is explicitly registered in `20`. BUILD may not reinterpret domain, financial, authorization, evidence, API or cross-module rules as implementation details.

## Booking lifecycle

Primary path: `CONFIRMED -> CHECKED_IN -> CHECKED_OUT`.

Alternative terminal paths from `CONFIRMED`: `CANCELLED`, `NO_SHOW`.

No generic rollback is authorized. No new calendar cutoff is added to check-in/cancellation. No-show becomes eligible when `hotel_local_date >= check_in`.

Late arrival is **not** a booking state: it is context on a still-`CONFIRMED` booking. Canonical source-compatible write is the existing booking PATCH with `front_desk.late_arrival_eta` and `late_arrival_note`; ETA must be future and its hotel-local date inside `[check_in,check_out)`, note min 6/max 250, with actor/time/audit persistence and no inventory/room/Billing mutation.

## Room / maintenance model

Normal occupied turnover: `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`.

Maintenance case impact is `NON_BLOCKING | BLOCKING`, separate from room state and priority.

- `NON_BLOCKING` may coexist with `OCCUPIED`, `AVAILABLE`, `DIRTY` or `CLEANING`; it never independently changes physical state or blocks sale/readiness.
- `BLOCKING` prevents new occupancy. On an occupied room the guest stays until explicit reassign/checkout; on vacant eligible states the room becomes `MAINTENANCE`; resolution from maintenance returns `DIRTY`.
- V1 allows one open maintenance case per room.

Binding maintenance roles: admin/ops/housekeeping read-report-resolve; receptionist read-report/escalate but not resolve; saas_admin none. Cleaning remains separately governed by `housekeeping.write`.

## Reassignment

Only `CHECKED_IN` with `hotel_local_date < check_out`. Destination must be ready and conflict-free for remaining stay; reason min 6.

`effective_date=max(check_in,hotel_local_date)`. Move only remaining inventory `[effective_date,check_out)`; preserve historical room-night truth. Destination -> OCCUPIED. Old room -> DIRTY unless open BLOCKING case requires MAINTENANCE. Source pricing uses total stay nights × destination current price + extras and reconciles invoice atomically. An overrun stay must extend first or checkout.

## Extension and Billing

Extension is an explicit checked-in command: later checkout only, all added nights atomic, source repricing using current assigned-room price + extras, invoice reconciliation, booking stays CHECKED_IN and room OCCUPIED.

Payments are immutable evidence. Booking total and invoice cannot diverge. A PAID invoice cannot remain paid if authoritative amount exceeds paid amount. Checkout `settled` requires full payment; `pending-approved` is the positive-balance exception and requires reference plus admin-only `bookings.checkout.override`.

## API ownership

`19-api-command-contract-map.md` is binding.

- Preserve/harden check-in, reassign, checkout.
- Existing booking PATCH owns confirmed pre-occupancy edits, cancellation and late-arrival context.
- Add explicit no-show and extend-stay commands.
- Add atomic `/bookings/with-guest`.
- Preserve/extend `GET /api/v1/front-desk/board`.
- Front-desk board requires `bookings.read`: admin/ops/receptionist allowed; housekeeping/saas_admin denied.
- Housekeeping board stays cleaning-oriented.
- Add least-privilege room maintenance read and explicit maintenance escalate/resolve.
- Legacy `/housekeeping/:id/dirty` is compatibility-only.

Generic PATCH/direct room status cannot bypass canonical lifecycle/maintenance commands. New/additive contracts must update OpenAPI/client types.

## Freshness / workflow continuity

Reception-selected `booking_id` governs embedded Billing. Context query params preserve context, never authorization. Revalidate after mutation, on focus/context entry and via modest visible-screen polling. After successful action preserve filters/search and select the next case by deterministic board priority.

## Technical prerequisites

Before material UI growth: total generated raw JS `<=300000` without raising the 320000 budget. Before date-sensitive P0 behavior ships: persisted valid IANA timezone and trusted server hotel-local date. Historical migrations remain immutable.

## Implementation waves

- Wave 0: JS headroom; timezone foundation.
- Wave 1: reassignment; occupied/vacant maintenance model; arrival exceptions/no-show/late arrival; extension/Billing consistency.
- Wave 2: front-desk board; integrated Reception/Billing; atomic guest+reservation; contextual refresh/continuation.
- Wave 3: optimization and full synthetic hotel-shift acceptance.

Each state-changing increment gets its own Task Contract and independent review.

## Out of scope / deferred

No frozen contracted-rate model, new check-in/cancellation/no-show cutoff, automatic refund/penalty/retention, split stay/automatic relocation, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid realtime dependency, production/cutover/real-data migration or unrelated Reports/Users/Network redesign.

## Definition exit

Analysis closes only when the canonical set is contradiction-free, all E2E rows are implementation-ready, source departures are closed-set, no Human Gate blocks scope, Pre-Critic passes, a fresh critic of immutable Artifact+Boundary returns PASS, and orchestration state points to that exact artifact. Until then implementation remains locked.