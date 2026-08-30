# ACP 2.5 HMS — Invariant Evidence

Substantive artifact: `61b614fb21d5d3d51595e22030a0b551e6614c1a`  
Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`  
Scope: HMS staging controlled reservation RPC only; no production, paid expansion or real-data migration.

| Requirement / invariant | Result | Expected surface | Acceptance / evidence |
|---|---|---|---|
| Authorized scope/state | PASS | `.orchestration/STATE.md`, `STATUS.json`, Task Contract | Old Access gate reconciled; explicit Human authorization persisted for Phase 2.5 staging-only create + cleanup. |
| Backend authorization authoritative | PASS | `agent-hms-authorization.ts`, `AgentHmsService` | `reservation.write` / `reservation.cancel` required in Service Binding caller props; hotel grant checked before service mutation. |
| Tenant/database isolation | PASS | caller props + `resolveAgentHotel` | Caller/model cannot select physical D1 binding; control-plane route resolves operational D1. |
| Canonical HMS booking rules | PASS | reservation service + `D1BookingRepository` | Create reuses guest/room/hold/inventory validation and canonical CONFIRMED booking/claims. |
| Active bookings cannot overlap room-night | PASS | inherited inventory claims + CF-I03 | Canonical uniqueness/claim behavior preserved; CF-I03 PASS in Product Flow run `33288020169`. |
| Persistent idempotency | PASS | `reservationBookingId` + D1 booking | Identity derives from trusted tenant/hotel/actor/operation token and survives isolate replacement. |
| Same token + same payload replay | PASS | service tests | Same booking returned with `replayed=true`; no duplicate create/event. |
| Same token + different payload conflict | PASS | service tests | Deterministic booking with changed reservation fields returns CONFLICT. |
| Concurrent create recovery | PASS | service tests | Same-token raced completion is observed as replay. |
| Persistence failure classification | PASS | create error revalidation | Valid remaining inventory + failed persistence stays INTERNAL_ERROR rather than availability conflict. |
| Risk mutation traceability | PASS | migration `0018_agent_mutation_provenance.sql` | Durable booking/action/tenant/hotel/actor/session/trace/timestamp; raw operation token not stored. |
| Create mutation/audit atomicity | PASS | repository batch + focused test | Booking + claims + CREATE event are in one `database.batch`. |
| Cancel mutation/audit atomicity | PASS | repository batch + focused test | CANCEL provenance claim + conditional transition + inventory cleanup are one `database.batch`. |
| Cancellation winner attribution | PASS | `D1BookingRepository.cancel` | CANCEL event is claimed only while booking is still CONFIRMED, before the conditional transition in the same D1 transaction. A caller arriving after another cancellation inserts no event and gets zero update changes/replay; final CANCELLED state is never used as attribution proof. |
| Exactly-once provenance | PASS | event id + DB uniqueness | `${bookingId}:CREATE|CANCEL`, PK + `UNIQUE(booking_id, action)` + `INSERT OR IGNORE`; replay cannot duplicate events. |
| Cleanup token-bound | PASS | `cancelReservation` | Booking id must equal id derived from same trusted operation token; mismatch FORBIDDEN. |
| Cancellation replay safe | PASS | service + repository tests | Already-cancelled booking returns replay; no second cancellation mutation/event. |
| Migration chain integrity | PASS | migration 0018 + rehearsal | Earlier 0012 collision was caught and removed; fresh migration rehearsal PASS in run `33288020169`. |
| Existing product parity/regressions | PASS | historical suite | CF-I03→CF-I08 all PASS on rerun of `33288020169`; the first CF-I04 attempt hit local workerd `SQLITE_BUSY`, then a single bounded rerun passed the full suite. |
| Worker+D1 integral flow | PASS | Product Flow runtime | Real local Worker+D1 integral flow PASS in `33288020169`. |
| UX/mobile unaffected | PASS | browser regression | `33288020210` SUCCESS. |
| Foundation/static/config | PASS | CI | `33288020198` SUCCESS: install, types/tests, build, architecture fitness, D1 plans, Wrangler dry-run, SPA config. |
| Cost/scope guard | PASS | config/diff/contract | No paid resource, production route, custom domain, real-data or unrelated UX scope. |

## P1 review closure mapping

### P1 — persisted authorization boundary
Resolved by authoritative Phase 2.5 state reconciliation and explicit Task Contract.

### P1 — durable reservation mutation provenance
Resolved by migration 0018, trusted provenance propagation, same-batch D1 writes and focused atomicity tests. Raw operation token is not persisted.

### P1 — tie cancellation provenance to winning update
Resolved in artifact `61b614fb...`: the CANCEL provenance INSERT executes first and requires `status='CONFIRMED'`; the conditional CONFIRMED→CANCELLED UPDATE and inventory cleanup follow in the same D1 batch/transaction. If another caller already won, the event predicate is false and the update changes zero rows, preventing false ACP attribution. The focused repository test covers this race boundary explicitly.

## Exact executable gates

- Foundation: `33288020198` — SUCCESS.
- Product Flow / Worker+D1 + migration + historical regressions: `33288020169` — SUCCESS after one bounded rerun of the historical job for transient local `SQLITE_BUSY`.
- UX/mobile browser: `33288020210` — SUCCESS.
- Substantive artifact: `61b614fb21d5d3d51595e22030a0b551e6614c1a`.

No applicable HMS-side invariant remains FAIL or UNPROVEN. Deployment and cross-repository ACP E2E remain downstream gates and are not claimed here.
