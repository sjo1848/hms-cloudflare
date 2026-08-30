# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-30  
Global Project Mode: `DELIVERY`  
Phase: `ACP INTEGRATION — PHASE 2.5`  
Runtime: `RUNNING`  
Active task: `ACP-2.5-HMS-CONTROLLED-RESERVATION`

The previous Cloudflare Access credential gate is closed and obsolete. HMS staging has already been deployed successfully with the private API / Web Worker boundary intact. The currently authorized increment is the AI Commerce Platform Phase 2.5 controlled reservation side effect in **staging only**.

## HUMAN AUTHORIZATION

The Human explicitly approved Phase 2.5 after Phase 2.4 E1 real PASS. Authorization is bounded to:

- `createReservation` against HMS staging;
- persistent idempotency and replay safety;
- policy / approval enforcement in Agent Core;
- tenant + hotel capability enforcement at the Service Binding boundary;
- durable mutation provenance in HMS;
- controlled `cancelReservation` cleanup for the synthetic E2E reservation;
- staging verification only.

Not authorized:

- production deployment or cutover;
- real-data migration;
- paid-resource expansion;
- unrelated product / UX scope;
- additional irreversible or financial side effects.

## ACTIVE CONTRACT

Canonical Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`.

Binding requirements:

1. ACP cannot choose an HMS operational binding from model/user input.
2. `reservation.write` / `reservation.cancel` capabilities and the hotel grant fail closed.
3. Reservation creation reuses canonical HMS booking/inventory rules.
4. Every side effect requires stable idempotency and survives isolate/process replacement.
5. Same operation + same payload replays without duplicate booking or inventory claims.
6. Same operation + different payload conflicts.
7. Risk-relevant create/cancel provenance is persisted durably in the hotel D1 with actor, tenant, hotel, session and request/trace identity.
8. Provenance is written in the same D1 business-operation batch as the mutation and is exactly-once per booking/action.
9. Cleanup can cancel only the reservation derived from the authorized operation token.
10. E2E must restore availability after cleanup before Phase 2.5 can close.

## CURRENT REWORK

PR #28 received two P1 review findings before merge:

- persisted orchestration state did not yet authorize the ACP reservation increment;
- successful ACP create/cancel mutations lacked durable HMS provenance after the RPC response disappeared.

The first finding is addressed by this state reconciliation + Task Contract. The second is the active technical REWORK.

## NEXT AUTHORIZED ACTION

Implement durable agent mutation provenance with the smallest schema/repository change, add adversarial tests, run Foundation + Product Flow + UX regression gates, persist invariant/Pre-Critic evidence, then stop at an exact immutable PR head for Independent Critic.

After Critic PASS: merge to `deploy/staging` → promote HMS to `acceptance/staging` → deploy HMS staging → integrate/promote AI Commerce Core → execute the real Phase 2.5 E2E:

`no approval -> blocked -> approved reservation -> replay -> different-payload conflict -> inventory occupied -> controlled cancellation -> cancellation replay -> availability restored`.

No Human action is required unless a new legitimate Human Gate appears.
