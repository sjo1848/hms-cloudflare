# CF-I06 REWORK-3 — External Independent Critic

Artifact A: `0004990ba60b0349776de139cd04dfc2f30eaa6d`  
Boundary B: `de0dbdc0ed92b60a5fd32faa184484c701711d08`  
Verdict: **PASS**  
Human Gate: **NONE**  
Diagnosis: `CF-I06_FINANCIAL_BOUNDARY_ACCEPTED`

## Independent review summary

CF-I06 REWORK-3 closes the remaining financial correctness and evidence defects without entering CF-I07 scope.

### Accepted guarantees

1. **Exact close-cash winner proof**
   - client `x-request-id` remains trace metadata only;
   - close ownership uses a server-generated `crypto.randomUUID()` operation token that is not derived from request input;
   - a same-client-request-id concurrent close fixture produces one success and one conflict;
   - exactly one closure and one trigger-generated `CASH_CLOSURE` event remain durable.

2. **Cash snapshot / money semantics**
   - one canonical `/billing/balance` and `/billing/close-cash` implementation remains;
   - shift summary and close use inclusive `received_at >= opening` semantics;
   - non-CASH includes `CARD` and `TRANSFER` according to source semantics;
   - financial values remain integer cents.

3. **Tenant isolation**
   - `HOTEL_DEMO_DB` and `HOTEL_SECOND_DB` are distinct configured operational D1 bindings;
   - hotel-a and hotel-b each contain real tenant-local financial objects;
   - bidirectional cross-tenant invoice/payment/extra-charge attempts return not-found semantics at the selected tenant database and leave final tenant-local counts unchanged;
   - unknown operational bindings still fail closed.

4. **RBAC**
   - forbidden `housekeeping` and unknown role financial writes are rejected by backend capability checks;
   - frontend visibility is not relied on as authorization.

5. **Settlement evidence**
   - partial payment followed by `/settle-payment` reaches exact PAID state with the current remaining amount;
   - durable payment count and one `SETTLE_PAYMENT` event are asserted with actor/request/hotel metadata;
   - already-settled retry/conflict path returns without an additional settlement event.

6. **Extra-charge rollback**
   - a local-test-only injected NOT NULL failure occurs inside the authoritative D1 charge+audit batch;
   - the regression proves the failed write does not leave an additional charge and the later exact financial state remains consistent, demonstrating batch rollback rather than only pre-validation rejection.

7. **UX / responsive evidence**
   - browser executes material charge and payment actions at 375/390/430/768/1024;
   - typed overpay, stale-close and successful close workflows are executed;
   - no horizontal overflow is accepted at the contracted widths.

8. **Regression / publication**
   - fresh CF-I03/CF-I04 and CF-I05 inherited runners are recorded PASS;
   - route uniqueness and no-v2 checks remain in the unit suite;
   - artifact A is followed by orchestration-only boundary B modifying only STATE/STATUS and pointing to exact A;
   - no remote D1, production data, paid resource, cutover or CF-I07 product work entered scope.

## Residual notes

- `x-request-id` may remain client-provided for trace correlation, but MUST NOT be reused as an authoritative ownership/version/idempotency token for state transitions. The server-only operation token pattern used here is accepted.
- Source `NoShow` booking/departure parity remains carry-forward debt for CF-I09 and is unrelated to CF-I06 PASS.

## Verdict

**PASS**. CF-I06 Billing is technically accepted. CF-I07 Users / RBAC / Audit / Hotel-Network administration may be authorized immediately under a fresh Task Contract. Technical PASS does not imply Human Product Acceptance or production release.