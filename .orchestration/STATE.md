# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-30  
Global Project Mode: `DELIVERY`  
Phase: `ACP INTEGRATION — PHASE 2.5`  
Runtime: `EXTERNAL_REVIEW`  
Active task: `ACP-2.5-HMS-CONTROLLED-RESERVATION`

The previous Cloudflare Access credential gate is closed and obsolete. HMS staging is already operational behind the private API / Web Worker boundary. The Human-authorized increment remains strictly **staging only**.

## HUMAN AUTHORIZATION

Authorized:
- `createReservation` against HMS staging;
- persistent idempotency and replay safety;
- policy / approval enforcement in Agent Core;
- tenant + hotel capability enforcement;
- durable mutation provenance in HMS;
- token-bound `cancelReservation` for synthetic E2E cleanup;
- staging verification.

Not authorized:
- production deployment/cutover;
- real-data migration;
- paid-resource expansion;
- unrelated UX/product scope;
- payment or other financial side effects.

## ACTIVE CONTRACT

Canonical Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`.

## FROZEN SUBSTANTIVE ARTIFACT

`61b614fb21d5d3d51595e22030a0b551e6614c1a`

Executable evidence on that artifact:
- Foundation `33288020198` — PASS.
- Product Flow / Worker+D1 / migration / historical CF-I03→CF-I08 `33288020169` — PASS after one bounded rerun of a transient local `SQLITE_BUSY` in CF-I04.
- UX/mobile browser `33288020210` — PASS.

Publication evidence:
- `.orchestration/evidence/ACP-2.5-HMS-INVARIANTS.md`
- `.orchestration/evidence/ACP-2.5-HMS-PRECRITIC.md`

## REVIEW FINDINGS CLOSED BEFORE FREEZE

1. **Persisted authorization boundary** — obsolete Access gate was reconciled and a Phase 2.5 Task Contract was added.
2. **Durable mutation provenance** — create/cancel now persist tenant/hotel/actor/session/trace/action/booking/timestamp in hotel D1, without raw operation token.
3. **Migration id collision** — initial 0012 collision was caught by rehearsal and moved to migration 0018 after existing migrations.
4. **Cancellation winner attribution** — CANCEL provenance no longer relies on final CANCELLED state. It is claimed only while the booking is CONFIRMED, before the conditional transition, in the same D1 batch/transaction. A race loser cannot falsely attribute another caller's cancellation to ACP.

## CURRENT GATE

Fresh Independent Critic review of PR #28 against:
- substantive artifact `61b614fb...`;
- Task Contract;
- invariant evidence;
- Pre-Critic evidence;
- full PR patch.

No merge to `deploy/staging` before fresh external PASS/no blocking finding.

## NEXT AUTHORIZED ACTION AFTER CRITIC PASS

Merge HMS PR #28 to `deploy/staging` → post-merge CI → promote to `acceptance/staging` → deploy HMS staging with migration 0018 + write RPCs → integrate/promote Agent Core → execute the full synthetic E2E:

`no approval -> blocked -> approved reservation -> replay -> changed-payload conflict -> inventory occupied -> token-bound cancellation -> cancellation replay -> availability restored`.

No Human action is required unless a legitimate strategy/security/cost/irreversibility/product-acceptance gate appears.
