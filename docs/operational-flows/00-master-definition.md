# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`
Source reference: `sjo1848/hotel-management-system` @ `4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Governing rule

HMS follows the real hotel workflow; the operator must not reconstruct state, eligibility or handoffs the system already knows. Physical room state, future sellability and immediate readiness are distinct concepts. Accepted source behavior is preserved unless an explicit product decision authorizes a departure.

## Canonical domain

Booking lifecycle: `CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with alternative terminal `CANCELLED` and `NO_SHOW`. Lifecycle state changes are explicit commands, never generic status rollback.

Room turnover after real occupancy is always `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`, unless an open blocking maintenance case makes vacancy become `MAINTENANCE`; maintenance resolution then returns to `DIRTY`.

Date-sensitive rules use server-derived `hotel_local_date` from a persisted hotel IANA timezone where the accepted business rule is date-sensitive.

## P0 flows

**Reassignment:** for `CHECKED_IN`, destination must be immediately usable and free for the remaining stay. `effective_date=max(check_in, hotel_local_date)`. Only `[effective_date, check_out)` inventory moves; historical nights remain on the prior room. Destination becomes occupied; old room becomes dirty or maintenance according to open blocking maintenance. Source-parity pricing recalculates accommodation using total stay nights × destination room current price, plus extra charges; invoice state is reconciled atomically.

**Maintenance:** case impact is `NON_BLOCKING | BLOCKING`, independent from priority and physical room state. Non-blocking is advisory. Blocking prevents new occupancy; if already occupied, guest remains until explicit relocation/checkout. V1 keeps one open case per room.

**Arrival exceptions:** source parity is binding. A `CONFIRMED` booking may check in when formal checklist/evidence is complete and its room is immediately ready; no additional calendar-day block is introduced. Cancellation remains an explicit `CONFIRMED -> CANCELLED` terminal action with required reason and no new arrival-date cutoff. `NO_SHOW` is distinct and allowed from hotel-local arrival date: `hotel_local_date >= check_in`. It releases inventory without dirtying the room.

**Extension:** explicit command for a checked-in stay; checkout only moves later and all added nights are claimed atomically. Accepted source pricing is preserved: authoritative accommodation is recalculated as total stay nights × current room price, then extra charges are added; any existing invoice is reconciled.

## Billing truth

Payments are immutable evidence. Booking total and invoice amount/status must remain consistent. A paid invoice cannot remain `PAID` if authoritative total later exceeds paid amount. Checkout must display authoritative total, paid and remaining balance for the Reception-selected booking.

Source parity fixes checkout policy semantics: `settled` requires a fully paid account; `pending-approved` is the governed positive-balance exception and requires the accepted reference/override rules. This is binding behavior, not a Human Gate.

## Cross-module flow

Reception-selected `booking_id` governs embedded Billing. New reservation supports inline guest creation without forcing a module switch and without accidental partial guest-only state. Checkout/reassignment handoff is represented by room state: dirty goes to Housekeeping; blocking maintenance goes to Maintenance. Context query parameters preserve UI context only, never authorization.

Freshness v1: refresh after mutation, refresh on focus, modest visible-screen polling (about 30s initial target), reduced/paused while hidden. No WebSocket/paid real-time dependency is currently justified.

## Technical gates

Current generated JS is approximately `319858/320000` raw bytes and the gate sums all JS assets. Before material UI growth, reduce total raw JS to `<=300000` without raising the budget or removing accepted behavior. Code splitting is useful for load performance but does not itself satisfy the total-size gate.

Before date-sensitive P0 work ships, persist hotel IANA timezone and expose a trusted server helper/context for hotel-local date. Schema changes are incremental; historical migrations are not rewritten.

## Sequence

Wave 0: JS headroom; timezone foundation.

Wave 1: reassignment; occupied maintenance; no-show/arrival-exception parity; extension/Billing consistency. Each gets a bounded Task Contract and independent review.

Wave 2: front-desk read model; Reception lifecycle UX; Billing coupling; atomic guest+reservation; contextual navigation/revalidation; next-case continuation.

Wave 3: performance/focus refinements and full synthetic hotel-shift acceptance.

## Product decisions explicitly deferred

The current definition has no unresolved Human Gate. Future departures from source behavior require an explicit product decision, including a frozen/contracted nightly-rate model, new early/late check-in cutoff, cancellation cutoff, configurable no-show hour, automated cancellation/no-show refund/penalty, split-stay extension or multi-case maintenance.

## Exit condition

Analysis closes only after canonical documents are contradiction-free, Pre-Critic passes, independent review finds no blocking definition defect, and orchestration state points to the immutable definition artifact. Until then implementation remains locked.