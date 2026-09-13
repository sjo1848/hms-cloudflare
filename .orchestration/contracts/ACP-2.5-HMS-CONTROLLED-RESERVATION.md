# TASK CONTRACT — ACP-2.5-HMS-CONTROLLED-RESERVATION

TASK ID: `ACP-2.5-HMS-CONTROLLED-RESERVATION`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `ACP INTEGRATION — PHASE 2.5`  
STATUS: `AUTHORIZED / STAGING ONLY`

## OBJECTIVE

Expose the first controlled AI Commerce Platform write boundary into HMS staging: create one canonical reservation and provide token-bound cancellation solely for deterministic E2E cleanup, while preserving HMS booking/inventory rules, tenant isolation, capability authorization, durable audit provenance and replay safety.

## AUTHORIZED SCOPE

- `AgentHmsService.createReservation` guarded by `reservation.write`.
- `AgentHmsService.cancelReservation` guarded by `reservation.cancel`, used for bounded staging cleanup.
- Hotel Norte staging grant only: `10000000-0000-0000-0000-000000000001`.
- Canonical `D1BookingRepository` / D1 inventory claims remain the business source of truth.
- Minimal hotel-D1 migration needed for durable ACP mutation provenance.
- Synthetic staging E2E only.

## FORBIDDEN SCOPE

- production deployment/cutover;
- real customer reservation mutation;
- direct ACP access to D1;
- model/user selection of HMS database binding or hotel grant;
- payment/financial side effects;
- unrelated UX/product expansion;
- paid Cloudflare expansion;
- weakening Cloudflare Access or existing HMS authorization.

## SECURITY / TENANT CONTRACT

- caller `clientId` remains `ai-commerce-platform`;
- Service Binding capability must explicitly include `reservation.write` or `reservation.cancel` as applicable;
- `context.hotelId` must be inside caller `allowedHotelIds`;
- trusted ACP tenant-to-hotel routing remains outside model/user input;
- explicit actor/tenant/session/trace context accompanies the call;
- authorization fails closed before mutation.

## IDEMPOTENCY CONTRACT

Reservation identity is deterministic from trusted `{tenantId, hotelId, actorId, operationToken}` and does not rely on process memory.

Required behavior:

- same operation token + same payload -> same booking, no duplicate side effect, replay reported;
- same operation token + different payload -> conflict;
- concurrent same-token completion -> one committed booking/inventory set, later caller observes replay;
- cleanup derives the same expected booking identity from the original operation token;
- cancellation of a booking not derived from that operation token -> forbidden;
- cancellation replay -> already-cancelled booking returned without duplicate mutation event.

The raw operation token must not be persisted in audit storage.

## DURABLE PROVENANCE CONTRACT

Every successful ACP reservation create or cancel must leave durable hotel-D1 provenance containing at minimum:

- booking id;
- action (`CREATE` / `CANCEL`);
- ACP tenant id;
- HMS hotel id;
- actor id;
- session id;
- trace/request id;
- event timestamp.

Requirements:

- provenance is part of the same D1 business-operation batch as the booking/inventory mutation;
- event identity is deterministic per booking/action;
- replay does not create a second event;
- raw operation token is never stored;
- audit data remains attributable after the RPC response and Worker isolate disappear.

Applicable invariant: risk-relevant mutations retain actor/hotel/request traceability.

## BUSINESS RULE CONTRACT

- valid guest and room must exist;
- room must be reservable and free for every claimed night;
- money remains integer cents;
- reservation status is canonical HMS `CONFIRMED`;
- booking and room-night claims use existing HMS repository semantics;
- cancellation removes inventory claims using existing HMS cancellation semantics;
- persistence failures remain internal errors and are not mislabeled as ordinary availability conflicts.

## REQUIRED ADVERSARIAL TESTS

At minimum prove:

1. missing `reservation.write` capability denies create;
2. canonical create succeeds and records trusted provenance;
3. same token/same payload replays with one booking and one create provenance event;
4. same token/different payload conflicts;
5. concurrent same-token completion resolves to one canonical booking;
6. unavailable room/invalid references do not create a booking or provenance event;
7. unexpected persistence failure remains `INTERNAL_ERROR` when inventory is still valid;
8. cleanup rejects booking id not derived from the token;
9. first cancellation succeeds and records trusted cancellation provenance;
10. cancellation replay is safe and does not duplicate provenance;
11. date/range validation fails before resolving hotel data;
12. inherited Foundation, product-flow, UX/mobile and Wrangler gates remain green.

## STAGING E2E ACCEPTANCE

Phase 2.5 is technically complete only after the deployed ACP/HMS path proves:

`reservation attempt without approval -> blocked`

then:

`approved reservation -> HMS CONFIRMED booking -> same-token replay -> different-payload conflict -> room unavailable for same dates -> token-bound cancellation -> cancellation replay -> room available again`.

The synthetic booking must be left `CANCELLED` and inventory restored at the end of the gate.

## EVIDENCE / PRE-CRITIC

Before merge to `deploy/staging`:

- exact feature SHA passes Foundation CI;
- exact feature SHA passes relevant product-flow/UX gates;
- invariant evidence exists at `.orchestration/evidence/ACP-2.5-HMS-INVARIANTS.md`;
- Pre-Critic evidence exists at `.orchestration/evidence/ACP-2.5-HMS-PRECRITIC.md`;
- PR patch is reviewed against this contract;
- no applicable invariant is `FAIL` or `UNPROVEN`;
- Independent Critic PASS is anchored to the exact immutable feature head.

## DONE WHEN

HMS staging exposes capability-scoped create/cancel RPCs, canonical booking/inventory semantics remain intact, idempotency is persistent, provenance is durable and exactly-once, all required tests/checks pass on an immutable head, Independent Critic passes, staging deploy succeeds, and the complete ACP Phase 2.5 E2E creates then cleans up one synthetic reservation with availability restored.
