# CF-I06 REWORK-2 — External Independent Critic

Artifact A: `8d4584fe8e9f1afecef104d32d900513d57d32c8`  
Boundary B: `d93debc9f86b7a2ced54f0fa986e422ddc24b61c`  
Verdict: **REWORK-3**  
Human Gate: **NONE**  
Diagnosis: `CLIENT_CONTROLLED_WINNER_TOKEN + TENANT_RBAC_EVIDENCE_GAP + FINANCIAL_FAILURE_EVIDENCE_GAP`

## Accepted repairs

The following REWORK-2 repairs are materially present and must be preserved:

- canonical billing routes are unique and the temporary `-v2` routes are removed;
- balance and close-cash use one inclusive `received_at >= opening` shift rule;
- `TRANSFER` is included in the source-equivalent non-cash subtotal;
- first-shift opening derives from earliest payment when there is no prior closure;
- cash-closure audit is produced by a D1 trigger in the same insert transaction;
- browser executes charge + payment at 375/390/430/768/1024 and also executes overpay, stale-close and successful close paths;
- positive `/settle-payment` response path exists in the focal regression;
- forbidden and unknown roles are denied the balance read;
- fresh inherited CF-I03/04/05 runner evidence is now reported as PASS;
- artifact A + orchestration-only boundary B publication is correct;
- no CF-I07, production, remote D1, real-data or paid-resource scope drift occurred.

## Blocking findings

### 1. P1 — Close-cash exact-winner proof trusts a client-controlled request id

`apps/api/src/index.ts` accepts `x-request-id` from the client whenever it is non-empty and <=128 characters. `POST /billing/close-cash` then proves ownership by querying `cash_closures WHERE request_id = currentRequestId AND opening_time = currentOpening` after the conditional insert.

Two concurrent requests can therefore deliberately reuse the same `x-request-id`. Request A wins the insert. Request B's insert affects zero rows because the shift is already closed, but B then queries by the same client-supplied request id and can find A's row. B can consequently return success although B did not win the authoritative mutation.

This violates `INV-ATOMIC-001` and the prior REWORK-2 exit criterion requiring exact winner proof.

Required repair:

- determine success from the authoritative conditional write result itself (`meta.changes === 1`) inside the close operation, or use a separate server-generated operation token that the client cannot choose/reuse;
- do not use client-supplied tracing/correlation ids as ownership/compare-and-set tokens;
- keep the D1 trigger for exactly-once closure event creation;
- add a deterministic race where both requests deliberately send the same `x-request-id`; require one success, one conflict, one closure and one closure event.

### 2. P1 — Required real cross-tenant object isolation is still not demonstrated

The focal regression creates `hotel-b` with operational binding `UNKNOWN_DB` and asserts a 403. That proves fail-closed unknown binding, not the prior Critic exit criterion:

- a second authorized tenant with real tenant-local booking/invoice/payment/closure identity;
- cross-tenant reads/writes denied without existence leakage or side effects.

No second-tenant financial object fixture or cross-tenant object-id attempt is present in the artifact.

Required repair:

- add a deterministic second-tenant test boundary (test-only binding/mock is acceptable if it preserves the production physical-isolation model);
- create a real financial identity in tenant B;
- from tenant A attempt relevant invoice/payment/closure read/write using tenant-B identities;
- assert fail-closed behavior and zero business/audit mutation in both tenant stores.

### 3. P1 — RBAC write-denial evidence remains incomplete

The focal regression proves `housekeeping` and an unknown role cannot read `/billing/balance`. It does not prove a capability-restricted financial mutation is denied with zero side effects.

Required repair:

- execute at least one denied financial write for a forbidden role and one for an unknown role, e.g. extra charge/payment/close-cash as appropriate;
- assert 403 plus unchanged invoice/payment/charge/closure/event counts.

### 4. P1 — Positive settlement durable event/row semantics are under-asserted

The focal regression proves the positive `/settle-payment` response reaches `PAID` with the expected amount, but it does not explicitly assert the promised durable exactly-once settlement payment row/event metadata before moving on.

Required repair:

- after positive settlement, assert exact payment-row delta, exact `SETTLE_PAYMENT` financial-event delta, actor/request/hotel metadata and retry zero-side-effect behavior.

### 5. P1 — Extra-charge failure-path atomicity is still weaker than the contract requires

The new negative fixture sends `amount_cents=0`, which is rejected by input validation before the D1 business operation. This does not prove rollback/atomicity when the charge statement/trigger/audit batch enters the authoritative write path and one component fails.

Required repair:

- add a deterministic write-boundary failure or equivalent injected DB failure proving zero charge row, unchanged booking/invoice total and zero financial event;
- do not describe pre-validation rejection alone as proof of multi-write rollback.

## Evidence claim correction

`CF-I06-INVARIANTS.md` currently marks `INV-TENANT-001`, `INV-RBAC-001` and the complete CF-I06 evidence set as PROVEN. Those claims are stronger than the executable evidence above and must be corrected until the missing tests pass.

## Scope / boundary

- No Human Gate is required.
- Preserve accepted CF-I05 and accepted portions of CF-I06 REWORK-2.
- Do not start CF-I07 before CF-I06 PASS.
- No production deployment, remote D1, real hotel data, paid resource or cutover action is authorized.

## REWORK-3 exit criteria

CF-I06 may return to Independent Critic only when:

1. close-cash exact winner is based on `changes=1` or a server-only operation token and same-client-request-id race passes;
2. second-tenant object isolation test proves real cross-tenant read/write denial with zero side effects;
3. forbidden/unknown role financial write denial is executable and side-effect-free;
4. positive settle-payment proves exact durable payment/event metadata and retry semantics;
5. extra-charge authoritative write-boundary failure proves complete rollback;
6. invariant/evidence files contain no overclaim or required UNPROVEN item;
7. fresh artifact A + orchestration-only boundary B are published and execution stops for Independent Critic.
