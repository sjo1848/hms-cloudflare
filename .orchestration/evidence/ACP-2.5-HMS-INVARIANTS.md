# ACP 2.5 HMS — Invariant Evidence

Substantive artifact: `30ec09e6dcab7fde3cf791290a69aab30fd6eb58`  
Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`  
Scope: HMS staging controlled reservation RPC only; no production, paid expansion or real-data migration.

| Requirement / invariant | Result | Expected surface | Acceptance / evidence |
|---|---|---|---|
| Authorized scope/state | PASS | `.orchestration/STATE.md`, `STATUS.json`, Task Contract | Old Access gate reconciled; explicit Human authorization persisted for Phase 2.5 staging-only create + cleanup. |
| Backend authorization authoritative | PASS | `agent-hms-authorization.ts`, `AgentHmsService` | `reservation.write` / `reservation.cancel` required in Service Binding caller props; allowed hotel grant checked before service mutation. |
| Tenant/database isolation | PASS | trusted caller props + `resolveAgentHotel` | Caller/model cannot select physical D1 binding; hotel id must be granted and control-plane route resolves operational D1. |
| Canonical HMS booking rules | PASS | `AgentHmsReservationService`, `D1BookingRepository` | Create reuses guest/room/hold/inventory validation, canonical CONFIRMED booking and room-night claims. |
| Active bookings cannot overlap room-night | PASS | existing D1 inventory claims + inherited CF-I03 | Same canonical uniqueness/claim behavior preserved; CF-I03 PASS in Product Flow run `33287796046`. |
| Persistent idempotency | PASS | `reservationBookingId`, repository find/create | Booking id derives from trusted tenant/hotel/actor/operation token; replay survives Worker/isolate replacement because identity is in HMS D1, not Core memory. |
| Same token + same payload replay | PASS | reservation service tests | Replay returns same booking with `replayed=true`; no second create call/event. |
| Same token + different payload conflict | PASS | reservation service tests | Existing deterministic booking with different reservation fields returns `CONFLICT`. |
| Concurrent completion recovery | PASS | reservation service tests | Create error followed by same canonical booking is normalized to replay rather than duplicate mutation. |
| Persistence failure classification | PASS | create error revalidation path | If no raced booking exists and inventory remains valid, original failure surfaces as `INTERNAL_ERROR`; persistence faults are not mislabeled as availability conflict. |
| Risk mutation traceability | PASS | migration `0018_agent_mutation_provenance.sql`; repository batch | Durable event stores booking/action/tenant/hotel/actor/session/trace/timestamp. Raw operation token is not stored. |
| Business-operation atomicity | PASS | `D1BookingRepository.create/cancel`; `d1-booking-repository.agent-provenance.test.ts` | Booking + claims + CREATE event share one `database.batch`; cancellation + inventory cleanup + CANCEL event share one `database.batch`. |
| Exactly-once provenance | PASS | event id + DB uniqueness | Deterministic `${bookingId}:CREATE|CANCEL`, primary key + `UNIQUE(booking_id, action)` + `INSERT OR IGNORE`; service replay does not invoke a second mutation. |
| Cleanup is token-bound | PASS | `cancelReservation` | Booking id must equal the id derived from same tenant/hotel/actor/operation token; mismatch returns FORBIDDEN. |
| Cancellation replay safe | PASS | reservation service tests | First cancellation mutates; subsequent cancelled state returns replay without second repository cancellation event. |
| Migration chain integrity | PASS | `0018_agent_mutation_provenance.sql` | Initial accidental `0012` collision was caught by rehearsal and corrected after existing `0012–0017`; migration rehearsal PASS in run `33287796046`. |
| Existing product parity/regressions | PASS | Product Flow historical jobs | CF-I03, CF-I04, CF-I05, CF-I06, CF-I07, CF-I08 all PASS in run `33287796046`. |
| Worker+D1 integral flow | PASS | Product Flow runtime | Real local Worker+D1 integral product flow PASS in run `33287796046`. |
| UX/mobile unaffected | PASS | browser regression | UX/mobile browser run `33287796053` SUCCESS on exact substantive SHA. |
| Foundation/static/config | PASS | CI | Foundation run `33287796048` SUCCESS: install, types, tests, web build, architecture fitness, D1 query plans, Wrangler dry-run, SPA config. |
| Cost/scope guard | PASS | config/diff/contract | No paid resource, production route, custom domain, real-data or unrelated UX scope added. |

## P1 review closure mapping

### P1 — persisted authorization boundary

Resolved by explicit Phase 2.5 state reconciliation and `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`. The old Access credential gate is no longer authoritative; the Human approval is bounded to staging controlled reservation + cleanup.

### P1 — persist reservation mutation provenance

Resolved by migration `0018_agent_mutation_provenance.sql`, trusted provenance propagation, same-batch D1 mutation/event statements and focused batch-atomicity tests. Successful create/cancel is attributable after the RPC response and isolate disappear. Replay is exactly-once per booking/action and raw operation token is not persisted.

## Exact executable gates

- Foundation: `33287796048` — SUCCESS.
- Product Flow / Worker+D1 + historical regressions: `33287796046` — SUCCESS.
- UX/mobile browser: `33287796053` — SUCCESS.
- Substantive artifact under those gates: `30ec09e6dcab7fde3cf791290a69aab30fd6eb58`.

No applicable invariant remains FAIL or UNPROVEN for the HMS portion of Phase 2.5. Deployment and cross-repository ACP E2E remain downstream gates and are not claimed by this evidence.
