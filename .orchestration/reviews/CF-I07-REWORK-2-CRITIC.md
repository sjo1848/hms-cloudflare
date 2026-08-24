# CF-I07 REWORK-2 — External Independent Critic

Audited artifact A: `87cf6c953e24b9374644f53c636c4d5a8574bea7`  
Publication boundary B: `cc13528a8809861aa17011251de6f60466019995`  
Verdict: **REWORK-3**  
Human Gate: **NONE**

## Summary

REWORK-2 materially repairs the prior security/admin defects. The backend fixes for canonical RBAC, `saas_admin` audit denial, semantic no-op role/plan handling, real allowed-before/denied-after downgrade, tenant-A→tenant-B object denial, exclusive hotel→D1 binding ownership, Access identity compatibility, plan enum parity and tenant audit provenance are accepted and must be preserved.

CF-I07 cannot receive PASS yet because the artifact still overclaims browser/authorization evidence and does not satisfy its own process-cleanup invariant. The remaining work is evidence/runner closure, not a product-intent or architecture decision.

## Accepted repairs to preserve

1. `/audit/events` no longer has a network-role shortcut; a `saas_admin` without hotel membership cannot enter the route and receives 403.
2. `USER_ROLE_CHANGE` rejects same-role requests before mutation/audit.
3. `HOTEL_PLAN_CHANGE` rejects same-plan requests before mutation/audit.
4. The focal runner proves a real elevated transition: the same subject can create a user while `admin`, is downgraded to `ops`, and is then denied the same privileged create operation.
5. Tenant-A attempts to role-change/deactivate a subject that exists only in tenant B return 404; final tenant-B role/active state remains unchanged and tenant-A audit count for that target remains zero.
6. Runner cleanup no longer deliberately clears the PID before cleanup; owned-process teardown is at least attempted.
7. Fresh inherited CF-I03/04/05/06 PASS is recorded in artifact evidence.
8. Boundary B is orchestration-only and points exactly to A.

## Blocking findings

### 1. Browser forbidden-RBAC evidence uses an invalid fixture

`scripts/cf-i07-browser-regression.playwright.js` switches to headers for `subject-hk` and calls `/users`, then expects the text `No authorized hotel membership`.

But `scripts/cf-i07-browser-regression.sh` seeds only `subject-a` and `subject-network`; it does **not** create an Access identity mapping or `hotel_memberships` row for `subject-hk`.

Therefore the browser proof exercises **missing membership/authz context**, not an authenticated `housekeeping` membership denied by `users.read`. It cannot satisfy the contract's forbidden route/action evidence or `INV-RBAC-001`.

Required repair:
- seed `subject-hk` with active hotel-A `housekeeping` membership in the browser fixture;
- visit `/users` as that subject;
- assert the backend capability denial surfaced by the UI (403 from the protected admin API), while proving the membership itself is valid/selected;
- keep the separate focal housekeeping denied-write assertion.

### 2. Pre-Critic responsive/UX evidence is stronger than the browser script

`CF-I07-PRECRITIC-GATE.md` claims the browser executes `create success/error, detail open/close, confirmation/focus return, committed role control, forbidden UX and Network plan control at 375/390/430/768/1024`.

The executable script does not prove that claim:

- create success occurs only once, at 375;
- duplicate failure is mostly checked through direct `fetch` status, not an asserted user-visible validation/error state;
- deactivation confirmation + focus return occurs only once after the width loop, when the viewport is 1024;
- the role `<select>` is never changed and no committed role value is asserted in browser;
- forbidden UX uses the invalid no-membership fixture described above.

This violates `INV-EVID-001`, and the contract explicitly requires create validation/error, delete/deactivate confirmation + focus return, forbidden behavior and responsive material journeys.

Required repair:
- make each claimed browser behavior correspond to an explicit assertion;
- use deterministic unique subjects or reset state so success/error evidence is unambiguous;
- assert a visible validation/error message, not only a direct API status;
- execute and assert a role change through the UI and confirm the committed value after reload/refetch;
- exercise deactivation confirmation/focus return at least on a contracted mobile width and a representative desktop width, or narrow the evidence claim if the contract does not require every width;
- use a valid housekeeping membership for forbidden UX;
- rewrite Pre-Critic/invariant evidence to exactly match the executable coverage.

### 3. `INV-CF-I07-004` process cleanup is still UNPROVEN

The promoted invariant requires terminal PASS only after the owned process tree is terminated and explicitly requires a post-run process check.

`scripts/cf-i07-regression.sh` now calls `cleanup`, but cleanup performs `pkill/kill` and immediately clears `worker_pid`; it does not `wait`, poll `kill -0`, or otherwise assert that the Worker/process tree is actually gone before printing PASS.

Required repair:
- terminate the owned process tree;
- `wait`/poll until the owned PID/process group is gone (bounded timeout is fine);
- fail the regression if an owned Worker remains;
- only then emit the terminal PASS marker.

Apply the same standard to any browser runner whose evidence claims owned-process cleanup.

### 4. Same-plan zero-audit evidence should be exact

The API guard makes same-plan requests return 409 before the batch, which is semantically correct. However `INV-CF-I07-002` requires exact audit counts, and the focal runner does not directly assert the durable count of `HOTEL_PLAN_CHANGE` events after the repeated same-plan request.

Required repair:
- add a CONTROL_DB assertion proving exactly one `HOTEL_PLAN_CHANGE` for the successful transition and zero additional event for the repeated same-plan request.

## REWORK-3 exit criteria

1. Preserve all accepted REWORK-1/2 backend/security fixes.
2. Browser fixture contains a real active housekeeping membership and proves capability denial rather than missing membership.
3. Browser evidence explicitly asserts user-visible create error/validation, committed role change, deactivation confirmation/focus return and forbidden UX with coverage consistent with the contract and evidence wording.
4. Evidence files are weakened or expanded so `INV-RESP-001` and `INV-EVID-001` match exactly what runs.
5. Regression process cleanup includes a verifiable post-termination check before terminal PASS.
6. Exact same-plan audit count is asserted in CONTROL_DB.
7. Fresh focal + CF-I03/04/05/06 + browser + type/build/Wrangler checks pass from a clean sequence.
8. Publish fresh artifact A plus orchestration-only boundary B and stop for Independent Critic.
9. Do not begin CF-I08 until CF-I07 PASS.

## Reusable root cause

Authorization evidence is valid only when all authentication/membership prerequisites for the claimed role are positively established. A denial caused by missing identity, missing membership, routing failure or another earlier guard cannot be presented as proof that the intended capability check denied the request.
