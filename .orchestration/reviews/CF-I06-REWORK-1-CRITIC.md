# CF-I06 REWORK-1 — External Independent Critic

Artifact A: `291ee7ae60ddd3c0abec8ff6b921666f3e86e76f`  
Boundary B: `8989df5239b97eff436d6a6b63d9dd2973ce250b`  
Verdict: **REWORK-2**  
Human Gate: **NONE**  
Diagnosis: `ROUTE_SHADOWING_DEFECT + FINANCIAL_ATOMICITY_EVIDENCE_DEFECT + RESPONSIVE_EVIDENCE_DEFECT + REQUIRED_REGRESSION_UNPROVEN`

## Accepted repairs

The following REWORK-1 repairs are materially present and should be preserved:

- payment-history ordering is newest-first;
- target `TRANSFER` is classified as non-cash in the new snapshot helper;
- first-shift opening derives from earliest payment when no prior closure exists;
- payment creation guards first-invoice creation with the requested amount;
- balance/close-cash UX is now present;
- browser includes width 390 and typed overpay/stale-close errors;
- publication boundary B is orchestration-only and points exactly to artifact A.

## Blocking findings

### 1. P1 — Canonical financial routes are duplicated and shadowed

`apps/api/src/routes/billing.ts` contains multiple registrations for the same canonical method/path, including repeated `POST /billing/close-cash` and repeated `GET /billing/balance`, plus uncontracted `/billing/balance-v2` and `/billing/close-cash-v2` variants.

This makes the effective runtime semantics dependent on router registration/match behavior instead of one canonical implementation. It also leaves old and new financial semantics in the same production route module.

Required repair:

- exactly one handler per canonical method/path;
- remove temporary/v2 product endpoints unless explicitly part of the source contract;
- add a deterministic route-uniqueness/static test so duplicate method/path registration blocks publication.

### 2. P1 — At least one duplicated close-cash implementation still has false-success / duplicate-audit risk

One registered `POST /billing/close-cash` implementation performs the conditional closure insert, then separately queries `cash_closures` by `opening_time`, and then inserts audit outside the same authoritative conditional batch. A losing concurrent request can observe the winner's closure and can no longer prove that *its own* insert won the transition.

Even if another duplicate handler is the one currently matched by Hono, keeping this implementation on the same canonical route is unacceptable under `INV-ATOMIC-001` and `INV-AUDIT-001`.

Required repair:

- one canonical close-cash handler only;
- exact winner must be proven by that request's conditional write result (`changes()=1` or equivalent operation token);
- closure + financial event must commit as one logical operation, with loser producing no audit/event;
- deterministic concurrent close regression must assert one 2xx, one conflict, exactly one closure, exactly one closure event, and matching request/actor metadata.

### 3. P1 — Conflicting opening-boundary semantics remain in duplicate implementations

The file contains both `received_at >= opening` and `received_at > opening` variants. For first-shift semantics where `opening` can equal the earliest unclosed payment timestamp, `>` excludes that first payment while `>=` includes it. The accepted source semantics use the inclusive opening boundary for the shift summary.

Required repair: one canonical inclusive rule, shared by balance and close-cash, with a fixture where a payment timestamp equals opening time.

### 4. P1 — Contracted responsive evidence is still insufficient

The browser harness enumerates 375/390/430/768/1024 but the per-width loop only checks horizontal overflow and selected booking state. The material charge/payment/close-cash actions are executed once after the loop, effectively at the final viewport.

`INV-RESP-001` and the CF-I06 contract require material financial controls to be exercised at each contracted width where the workflow is reachable.

Required repair:

- execute the material financial workflow or a deterministic representative action/validation path at every contracted width;
- prove success/error controls remain operable, not only that the shell does not overflow;
- keep a separate integrated success close-cash browser path as well as stale/error path.

### 5. P1 — Positive `/settle-payment` semantics remain unproven

The focal regression calls `/settle-payment` only after the invoice is already settled and expects conflict. It does not prove that an unsettled booking settles exactly the current remaining amount, creates exactly one payment entry/event, and reaches exact PAID state without overpayment.

Required repair: deterministic positive settle-payment fixture plus retry/stale rejection and exact DB/event assertions.

### 6. P1 — Tenant/RBAC evidence remains incomplete

The focal regression proves an unknown hotel is denied, but the contract requires a real cross-tenant object attempt with zero side effects and a forbidden/unknown-role financial access test. Those are not equivalent to unknown hotel denial.

Required repair:

- second tenant/hotel fixture with a real booking/invoice/payment/closure identity;
- cross-tenant reads/writes denied without existence leakage or side effects;
- forbidden role and unknown role backend denial for relevant billing reads/writes.

### 7. P1 — Extra-charge failure-path atomicity remains unproven

Success-path trigger behavior is covered, but the contract explicitly requires a partial-failure/zero-row path proving `extra_charges` and `bookings.total_cents` cannot diverge. No deterministic failure injection or equivalent rejected-write assertion is present.

Required repair: add an adversarial failure path that proves zero charge row / unchanged booking total / zero financial event on rejected operation.

### 8. P1 — Required inherited regressions are explicitly still UNPROVEN

The Pre-Critic evidence states that the CF-I03/04/05 local harness process-lock path remains `UNPROVEN` as a fresh rerun. REWORK-1 explicitly required obtaining actual PASS rather than waiving the runner problem. The active CF-I06 contract also requires inherited regressions.

`UNPROVEN` cannot satisfy the publication gate.

Required repair: fix/isolate the runner lifecycle and obtain fresh executable PASS for required inherited CF-I03/04/05 regressions, or narrow the contract only through an explicit authority decision (none exists).

### 9. P1 — Evidence claims exceed the executable proof

`CF-I06-PRECRITIC-GATE.md` says technical evidence is complete while simultaneously marking required inherited reruns UNPROVEN. It also describes browser coverage at all widths even though the material actions are not executed per width.

Required repair: evidence must match executable proof exactly before artifact publication.

## Scope / boundary

- No CF-I07 product work should begin.
- No Human Gate is required; these are routine correctness/evidence repairs.
- Preserve accepted CF-I05 and accepted portions of CF-I06 REWORK-1.
- No production, remote D1, real hotel data, paid resource or cutover action is authorized.

## REWORK-2 exit criteria

CF-I06 may return to Independent Critic only when:

1. canonical billing routes are unique and temporary/v2 duplicates are removed;
2. one authoritative close-cash implementation proves exact winner + exactly-once audit atomically;
3. opening boundary semantics are single-source and inclusive;
4. positive settle-payment, cross-tenant, forbidden-role, extra-charge failure and exact closure-event tests pass;
5. browser executes material financial interaction at 375/390/430/768/1024 and proves both success and stale/error close-cash paths;
6. required inherited CF-I03/04/05 regressions have fresh PASS evidence;
7. all invariant/evidence files contain no required FAIL/UNPROVEN or overclaim;
8. a fresh artifact A and orchestration-only boundary B are published and execution stops for Independent Critic.
