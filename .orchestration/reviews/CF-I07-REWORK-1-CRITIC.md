# CF-I07 REWORK-1 — External Independent Critic

Artifact A: `0a1698995e4f4d36e86a0b88c19f06932469fde7`  
Boundary B: `de2279e984da1ad0fc3cc78de877d7900b31e64a`  
Verdict: **REWORK-2**  
Human Gate: **NONE**  
Diagnosis: `NETWORK_AUDIT_RBAC_BYPASS + NOOP_AUDIT_FALSE_EVENT + DOWNGRADE_EVIDENCE_FALSE_POSITIVE + ADMIN_BROWSER_EVIDENCE_GAP + RUNNER_LIFECYCLE_DEFECT`

## Accepted repairs to preserve

REWORK-1 materially fixed the following prior findings and they must not regress:

- active hotel -> operational D1 ownership is protected by a unique partial index;
- configured binding reuse is rejected and unconfigured bindings still fail closed;
- source-sensitive receptionist invoice-list denial is restored;
- ops can read audit again;
- lifecycle consumes the central capability helper and pending-approved checkout requires `bookings.checkout.override`;
- shared Access identity mappings are compatibility-checked rather than rewritten/reactivated by tenant-local user creation;
- tenant audit reads combine control-plane and operational provenance and ordinary hotel admins no longer receive `hotel_id IS NULL` control events;
- plan tiers are constrained to `BASIC | PRO | ENTERPRISE` in migration/API/UI;
- responsive User detail and Network plan controls are exercised at all contracted widths;
- A -> B publication boundary is clean and B changes only `STATE.md` / `STATUS.json`.

## Blocking findings

### 1. P1 — `saas_admin` bypasses the canonical capability matrix for audit reads

The source RBAC canon grants `saas_admin` only `saas.hotels.read` and `saas.hotels.write`. Target `ROLE_CAPABILITIES` now correctly reflects that, but the request middleware explicitly permits network-only identities to enter `/audit/events`, and the admin route then grants audit access when `networkRole === "saas_admin"` without evaluating `audit.events.read`.

This recreates the exact class CF-I07 was supposed to remove: a direct role-name exception bypasses the centralized capability authority and grants a source-noncanonical permission.

Required repair:

- every protected admin/audit route must resolve through the canonical capability authority;
- remove the `saas_admin` audit shortcut unless an approved source/product decision adds that capability (none exists);
- add a deterministic `saas_admin` audit-read denial test while preserving `/hotels` positive access;
- static/pre-Critic check must reject protected route authorization implemented by direct role-name shortcut outside the capability authority.

### 2. P1 — semantic no-op role/plan updates can still emit false audit events

Role update reads the current role, then executes `UPDATE ... SET role=? WHERE ... role=?` and audits when `changes()=1`. If requested role equals the current role, the predicate still matches the authoritative row and can be counted as an update, producing `USER_ROLE_CHANGE` with `from == to` despite no semantic change.

Hotel plan update has the same pattern and can produce `HOTEL_PLAN_CHANGE` with identical old/new plan.

This violates `INV-AUDIT-001` and the CF-I07 requirement that audit truthfully represent successful logical mutations exactly once.

Required repair:

- reject or explicitly no-op same-role and same-plan requests before/inside the authoritative write boundary with zero audit event;
- add repeated same-role and same-plan deterministic regressions asserting zero extra events and unchanged state;
- preserve stale/concurrent old-value guards for genuinely competing mutations.

### 3. P1 — the claimed role-downgrade regression does not prove stale elevated rights disappear

Evidence claims `downgrade then privileged write denied`, but the focal script creates `subject-new` as receptionist, changes it to ops, and then attempts a user-admin mutation. Both receptionist and ops already lack `users.write`, so the denial does not prove that an identity which previously possessed an elevated capability loses it after downgrade.

Required repair:

- create/provision a test subject with an elevated role that can successfully execute a privileged operation;
- downgrade that same subject to a lower role;
- on a subsequent request with the same Access subject, prove the formerly allowed operation is denied and produces zero business/audit side effects;
- assert the new membership role is the one used, not cached/stale authority.

### 4. P1 — contracted cross-tenant membership-object mutation is not directly proven

The contract explicitly requires tenant-A admin cannot mutate tenant-B membership by object id. The focal script proves Access-identity rewrite protection and network authorization, but does not issue role/deactivate mutation from hotel A against a subject that exists only as an active hotel-B membership and then assert both tenant membership/audit states remain unchanged.

Required repair:

- add real hotel-B membership fixture;
- tenant-A admin attempts role change and deactivate by that subject id and receives non-leaking denial/not-found;
- assert hotel-B membership remains unchanged and neither hotel receives an admin audit side effect.

### 5. P1 — required browser/admin journeys remain under-proven

The browser loop now exercises search/detail open-close for Users and plan mutation for Network at every width, but the contract also requires create validation/error, delete/deactivate confirmation and focus return, and forbidden route/action behavior. Creation success is executed only at width 375; deactivation/confirmation and forbidden behavior are not executed.

The target also has a concrete focus hazard: direct card `Deactivate` does not capture that button as the opener before the async operation, so focus restoration can target a stale previous detail opener or nothing. Role update in an open detail also reloads the list without synchronizing `selectedUser`, allowing the controlled role select to display stale role state after a successful mutation.

Required repair:

- browser proof for create success + validation/error;
- explicit deactivate confirmation journey and deterministic focus-return assertion from the actual triggering control;
- role-change UI must reflect the committed role immediately after success;
- forbidden route/action UX plus backend denial must be exercised;
- material User admin controls must have representative executable coverage across the contracted responsive widths, not only shell/detail reachability.

### 6. P1 — CF-I07 focal runner leaks its Worker process

`scripts/cf-i07-regression.sh` ends with `worker_pid=""` before exit without killing the Worker. Because the EXIT trap only kills when `worker_pid` is non-empty, a successful focal run can leave Wrangler running. This is the same class of runner-lifecycle problem that previously caused inherited regression locks and makes sequential fresh regression evidence unreliable/flaky.

Required repair:

- explicitly terminate the Worker/process tree before clearing the PID or let the EXIT trap own cleanup;
- add/execute the complete CF-I07 + inherited CF-I03/04/05/06 sequence in a clean lifecycle with terminal PASS from every required runner;
- no owned local Worker/Vite process may remain after a successful script.

### 7. P1 — evidence overclaims centralized/canonical authorization and completed responsive proof

`CF-I07-INVARIANTS.md` marks `INV-RBAC-001`, `INV-RESP-001` and `INV-EVID-001` PASS while the audit role shortcut bypasses the capability matrix and the browser omissions above remain. `docs/cf-i07-security-admin-parity.md` also contradicts itself: its table says `saas_admin` has audit read, while its following paragraph says `saas_admin` is limited to network hotel read/write.

Required repair:

- make the source -> target capability matrix exact and internally consistent;
- remove unused/noncanonical authorization aliases or explicitly map them without changing effective permissions;
- evidence claims must match executable proof exactly;
- no applicable invariant may remain FAIL/UNPROVEN before republishing.

## Reusable root causes to promote before republish

1. A centralized capability map is not authoritative if protected routes can bypass it with direct role-name checks or middleware exceptions.
2. Audit represents semantic business mutations, not matched SQL rows; same-value/no-op updates must not produce change events.
3. A role-downgrade test must prove `allowed before -> denied after` for the same subject and same privileged operation.
4. Regression scripts that claim PASS must clean up their owned processes; leaked workers invalidate clean sequential evidence.

Promote these into the durable invariant registry / Pre-Critic Gate during REWORK-2.

## Scope / boundary

- No CF-I08 work may begin.
- No Human Gate is required; these are routine security/correctness/evidence repairs.
- Preserve accepted CF-I01–CF-I06 guarantees and the accepted portions of CF-I07 REWORK-1 above.
- No production deployment, remote D1 mutation, real hotel migration, paid resource or cutover is authorized.

## REWORK-2 exit criteria

CF-I07 may return to Independent Critic only when:

1. `saas_admin` audit access follows the source capability canon and no direct role shortcut bypasses central RBAC;
2. same-role/same-plan requests produce zero false audit events;
3. real elevated-role downgrade proves allowed-before/denied-after with zero stale authority;
4. tenant-A admin cannot mutate tenant-B membership object by id and zero cross-tenant audit side effects are proven;
5. User admin browser evidence covers validation/error, confirmation, actual focus return, committed role state and forbidden behavior with responsive material controls;
6. focal runner and all inherited runners cleanly terminate and emit fresh PASS;
7. invariant/parity/Pre-Critic evidence contains no overclaim or contradiction;
8. reusable root causes above are promoted into the harness;
9. fresh substantive artifact A + orchestration-only boundary B are published and execution stops for Independent Critic.
