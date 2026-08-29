# CF-PRODUCT-FLOW-AUDIT-001 — Integral Product Flow Audit

Status: ACTIVE / PRODUCT ACCEPTANCE REWORK
Base artifact: `67cf45e400bf690045f0c0b67bab5d869f10b23d`
Branch: `rework/integral-product-flow-audit`

## Trigger

Human Product Acceptance exposed a material gap that prior CI did not detect: existing rooms can disappear from future-date availability while a newly created room appears. The audit must treat this as evidence of insufficient end-to-end flow coverage, not as an isolated UI bug.

## Objective

Produce a new staging candidate whose critical hotel workflows and negative paths are verified end-to-end with real Worker + D1 semantics, browser coverage at mobile-first widths, explicit state-transition assertions, and independent Critic review.

No production/cutover is authorized. Final state is REMOTE_HUMAN_PRODUCT_ACCEPTANCE.

## Product semantics to verify

### Reservation inventory vs physical room state

Reservation inventory and physical readiness are separate concepts.

- Advance reservation/search may include rooms whose current physical state is `AVAILABLE`, `OCCUPIED`, `DIRTY`, or `CLEANING` when the requested stay has no overlapping inventory claim or room hold.
- `MAINTENANCE` and `OUT_OF_ORDER` are not advance-reservable while that blocking state remains active.
- Check-in and immediate room reassignment remain stricter: destination room must be physically `AVAILABLE` at the moment of transition.
- Date overlap uses half-open stay intervals `[check_in, check_out)`; checkout on a date does not block a new check-in on that same date.
- Active booking inventory is represented by `room_inventory_nights`; terminal/cancelled bookings must not retain claims.

## Mandatory flow matrix

### Reception / reservations

1. Search existing-room availability for a free future interval.
2. AVAILABLE + no conflict => offered.
3. DIRTY/CLEANING/OCCUPIED-now + non-overlapping future stay => offered.
4. MAINTENANCE/OUT_OF_ORDER => not offered.
5. Overlapping active booking inventory => not offered.
6. Overlapping hold => not offered.
7. Boundary checkout == next check-in => offered.
8. Missing, equal, reversed, malformed dates => explicit validation error.
9. Create booking with free room => success and inventory nights claimed.
10. Concurrent/second overlapping booking => conflict without partial booking/claims.
11. Edit confirmed booking room/dates => availability revalidated; current booking may retain its own room nights.
12. Cancel confirmed booking => inventory claims released and dates become reservable.
13. Terminal/non-confirmed booking mutation => rejected.
14. Check-in requires complete checklist and physically AVAILABLE room.
15. Check-in against DIRTY/CLEANING/MAINTENANCE/OCCUPIED target => rejected without partial transition.
16. Successful check-in => booking CHECKED_IN + room OCCUPIED + event.
17. Reassignment => only physically AVAILABLE, date-free destination; old room released and new room OCCUPIED atomically.
18. Checkout => booking CHECKED_OUT + room DIRTY + inventory released + housekeeping handoff/invoice semantics preserved.

### Rooms / holds

- list/create/edit; duplicate room number conflict.
- hold create/edit/delete.
- hold overlap conflict and booking-overlap conflict.
- room states and operational transitions remain coherent.

### Guests

- list/create and duplicate-email conflict.
- tenant isolation and role capability enforcement.

### Housekeeping / maintenance

- DIRTY -> CLEANING -> AVAILABLE happy path.
- illegal transitions rejected.
- maintenance open blocks operational availability as defined above.
- maintenance resolve provenance/state is correct and room returns to contracted state.
- existing/open maintenance case conflicts are explicit.

### Billing / cash

- invoice retrieval and total reconciliation.
- extra charge updates totals.
- payment happy path.
- duplicate/replayed operation token is idempotent/contract-safe.
- overpayment/invalid amount conflicts do not partially mutate state.
- cash balance/closure and replay semantics preserve audit provenance.

### Reports

- occupancy and revenue ranges.
- zero-data range.
- invalid range/error/retry.
- terminal/active status contribution matches source contract.

### Users / network / RBAC

- user membership create/update/deactivate paths.
- duplicate/conflict retry behavior.
- `saas_admin` remains network-only; hotel operations denied.
- tenant roles cannot gain network capability.
- cross-hotel data access remains denied.

### Web/mobile behavior

Widths: 375, 390, 430, 1366.

- internal navigation never reloads the document.
- direct route + reload works.
- browser Back/Forward works.
- core controls are usable without hover.
- loading/error/empty states preserve visual continuity.
- reservation availability search is exercised through the actual UI, including pre-existing rooms—not only rooms created by the test.

### Deployment parity

- Vite-only success is insufficient evidence for hosting behavior.
- exact candidate must pass Worker/D1/local runtime checks and final remote staging smoke behind Cloudflare Access.

## Test strategy

1. Add focused unit/SQL-contract tests for advance reservability and boundary dates.
2. Add deterministic API regression fixtures covering every physical room state and active/terminal booking state.
3. Add an integral regression runner that invokes existing CF-I03..CF-I08 coverage plus new cross-feature scenarios rather than replacing historical tests.
4. Browser regression must create, edit, cancel, check-in, reassign and checkout a representative booking and prove expected room availability before/after transitions.
5. Negative paths must assert both response and post-failure database state.
6. Freeze evidence to the exact implementation SHA before Critic.

## Gates

- Focused tests: PASS.
- Historical regressions: PASS.
- Typecheck/build/Wrangler dry-run: PASS.
- Migration rehearsal/reconciliation: PASS.
- Browser/mobile integral flow: PASS.
- Exact-artifact Pre-Critic evidence: PASS.
- Independent Critic: PASS or REWORK.
- Integrated candidate CI: PASS.
- Deliberate staging deploy: PASS.
- Remote smoke: PASS.
- Final gate: REMOTE_HUMAN_PRODUCT_ACCEPTANCE.

## Stop conditions

Do not stop for routine implementation decisions or ordinary REWORK. Stop only for a genuine Human Action/Input, material external blocker, production decision, or final Human Product Acceptance.
