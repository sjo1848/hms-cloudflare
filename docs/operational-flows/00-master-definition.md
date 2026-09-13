# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`
Source reference: `sjo1848/hotel-management-system` @ `4df56a6217caab611f2f5fcbd98bde8386bb5629`
Canonical E2E scope: `docs/operational-flows/18-end-to-end-scope-matrix.md`
Canonical API map: `docs/operational-flows/19-api-command-contract-map.md`
Canonical maintenance RBAC: `docs/operational-flows/05-maintenance-data-rbac.md`
Authorized source departures: `docs/operational-flows/20-intentional-target-departures.md`

## Governing rule

HMS follows the real hotel workflow; the operator must not reconstruct state, eligibility or handoffs the system already knows. Physical room state, future sellability and immediate readiness are distinct concepts.

Accepted source behavior is preserved by default. A behavior may differ from source only when it is explicitly registered in `20-intentional-target-departures.md`. Unregistered drift is a definition or implementation defect.

The complete implementation perimeter is the master + transition matrix + operational invariants + E2E scope matrix + API command map + RBAC contract + intentional-departures register. BUILD may not omit or reinterpret a cross-module consequence, failure path, concurrency rule, financial consequence, authorization rule, evidence requirement or acceptance proof defined there.

## Canonical domain

Booking lifecycle: `CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. Lifecycle state changes are explicit commands, never generic rollback.

Room turnover after real occupancy is `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`, unless an open `BLOCKING` maintenance case makes vacancy become `MAINTENANCE`; maintenance resolution then returns to `DIRTY`.

Date-sensitive rules use server-derived `hotel_local_date` from a persisted hotel IANA timezone where date is a business predicate. D1 explicitly authorizes this correction from UTC/browser-dependent source behavior without inventing new check-in/cancellation cutoffs.

## P0 flows

**Reassignment:** for `CHECKED_IN`, destination must be immediately usable and free for the remaining stay. `effective_date=max(check_in, hotel_local_date)`. Only `[effective_date, check_out)` inventory moves; historical nights remain on the prior room. Destination becomes occupied; old room becomes dirty or maintenance according to open blocking maintenance. Source-parity pricing uses total stay nights × destination current price + extra charges, with invoice reconciliation. Operational `reason` min 6 is required. An overrun stay (`hotel_local_date >= check_out`) must first be extended or checked out. D2/D4 explicitly authorize those target hardenings.

**Maintenance:** case impact is `NON_BLOCKING | BLOCKING`, independent from priority/physical state. Non-blocking is advisory. Blocking prevents new occupancy; an occupied room remains occupied until explicit relocation/checkout. V1 keeps one open case per room. Admin/ops/housekeeping may resolve; receptionist may read/report/escalate but not resolve; saas_admin has no tenant maintenance authority. D6 authorizes the occupied-case/capability model.

**Arrival exceptions:** source parity is binding. A `CONFIRMED` booking may check in when formal evidence is complete and its room is immediately ready; no new calendar cutoff is added. Cancellation remains `CONFIRMED -> CANCELLED` with `terminal_reason` min 6 and no new arrival-date cutoff. `NO_SHOW` is allowed when `hotel_local_date >= check_in`, requires `terminal_reason` min 6, releases inventory and does not dirty the room. D3 authorizes an explicit no-show command without changing source timing.

**Extension:** explicit checked-in command; checkout only moves later; every added night is claimed atomically. Source pricing recalculates total stay nights × current room price + extra charges and reconciles any invoice. D3 authorizes the explicit command boundary.

## Billing truth

Payments are immutable evidence. Booking total and invoice amount/status cannot diverge. A `PAID` invoice cannot remain paid when authoritative total exceeds paid amount. Checkout shows authoritative total, extra charges, paid and remaining balance for the selected Reception booking.

`settled` requires a fully paid account. `pending-approved` is the governed positive-balance exception and requires the accepted reference plus admin-only `bookings.checkout.override`. D8 authorizes invoice consistency hardening after later total changes.

## API/lifecycle contract

`19-api-command-contract-map.md` is binding.

- Preserve/harden explicit check-in, reassign and check-out routes.
- Keep confirmed-booking cancellation on the existing booking-update path.
- Add explicit no-show and extend-stay commands.
- Preserve/extend `/api/v1/front-desk/board`.
- Add atomic `/api/v1/bookings/with-guest`.
- Expand maintenance open and add room-scoped maintenance read, escalate and resolve commands.
- Keep cleaning start/finish independent.
- Treat legacy `/housekeeping/:id/dirty` as bounded compatibility only.

Generic PATCH/direct status mutation cannot bypass canonical commands. New routes/fields require aligned OpenAPI/client contracts. Material operator evidence is server-validated, including terminal reasons, reassignment reason, escalation note and resolution note.

## Cross-module flow

Reception-selected `booking_id` governs embedded Billing. New reservation can create a guest inline atomically. Resulting room state drives Housekeeping/Maintenance handoff. Context query parameters preserve context only, never authorization.

`GET /api/v1/front-desk/board` owns Reception queue/readiness/blocker context. `GET /api/v1/housekeeping/board` remains the cleaning-oriented board. Room-scoped maintenance detail is available through the least-privilege maintenance-read route. D5/D7 authorize the atomic composition and restored server read model.

Freshness v1: authoritative refresh after mutation, on focus, on contextual entry and modest visible-screen polling (about 30s initial target), reduced/paused while hidden. No paid real-time dependency is justified.

## Technical gates

Before material UI growth, total generated raw JS must be `<=300000` without raising the existing `320000` budget or removing accepted behavior. Code splitting alone does not satisfy a total-size gate.

Before date-sensitive P0 behavior ships, persist hotel IANA timezone and expose trusted server hotel-local date context. Migrations are incremental; historical migrations are immutable.

## Complete E2E perimeter

`18-end-to-end-scope-matrix.md` covers technical foundations, reservation existing/new guest, check-in, cancellation, no-show, late arrival, reassignment, non-blocking/blocking/vacant maintenance, Housekeeping turnover, checkout, extension, extra-charge/invoice reconciliation, front-desk board, context/freshness, post-action continuation, audit/events, API/OpenAPI/RBAC/departure conformance and synthetic-shift acceptance.

No increment is complete because one endpoint/UI is green. It must prove domain mutation, negative/concurrency behavior, financial consequence where applicable, authorization, evidence validation, API/OpenAPI contract, cross-module handoff, audit truth and responsive operator journey.

## Sequence

Wave 0: JS headroom; timezone foundation.

Wave 1: reassignment; occupied maintenance; no-show/arrival-exception parity; extension/Billing consistency. Each receives a bounded Task Contract and independent review.

Wave 2: front-desk board/read model; Reception lifecycle UX; Billing coupling; atomic guest+reservation; contextual navigation/revalidation; next-case continuation.

Wave 3: performance/focus refinements and full synthetic hotel-shift acceptance.

## Deferred / outside scope

There is no unresolved Human Gate for the current source-parity-plus-registered-hardening wave. Future changes require a new product decision: frozen/contracted nightly rates, new check-in/cancellation/no-show cutoffs, automated refund/penalty/retention, split stay/automatic relocation, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid real-time infrastructure, production/cutover or real-data migration. Reports/Users/Network redesign is unrelated to this wave.

## Exit condition

Analysis closes only when:
1. canonical documents are contradiction-free;
2. every E2E row has owner, preconditions, authoritative effects, negative/concurrency behavior, cross-module consequence and acceptance requirements;
3. API/RBAC/evidence contracts are unambiguous;
4. every source departure is explicitly listed in `20` and every unlisted behavior preserves source semantics;
5. no unresolved Human Gate blocks scope;
6. Pre-Critic passes;
7. fresh adversarial review of the immutable artifact finds no blocking definition defect;
8. orchestration state points to that exact immutable artifact.

Until all eight conditions are true, implementation remains locked.