# CF-I07 — External Independent Critic

Artifact A: `5ed90137b2b58d69f16cca088b014153bf52eb4a`  
Canonical remote after publication correction: `c87b6258f5431d873909a806bee647278a2328c7`  
Verdict: **REWORK-1**  
Human Gate: **NONE**  
Diagnosis: `CONTROL_PLANE_BINDING_ALIAS + RBAC_CANON_DRIFT + ADMIN_MUTATION_STALE_AUDIT + AUDIT_SCOPE_GAP + PLAN_ENUM_PARITY + UX_RESPONSIVE_GAP + INHERITED_REGRESSION_UNPROVEN`

## Accepted foundation to preserve

- Cloudflare Access remains the authentication perimeter; HMS does not recreate password authentication.
- Hotel memberships and the separate network membership are represented in CONTROL_DB.
- A centralized target capability module was introduced and inventory/bookings/housekeeping/billing were moved toward it.
- Undeclared Worker/D1 binding names are rejected.
- User create, role change and deactivate operations exist as explicit backend operations.
- Network analytics is truthfully deferred to CF-I08 rather than fabricated.
- Artifact A is substantive and all commits after A currently change orchestration metadata only; no CF-I08/product scope drift occurred.

## Blocking findings

### 1. P1 — A network admin can register two hotels against the same operational D1

Target architecture and the CF-I07 contract require one operational D1 per hotel. `control_hotels.operational_binding` is not unique, and `POST /hotels` only checks that the supplied binding is one of the server-configured names. It does not reject a binding already owned by another active hotel.

The target Network UI also defaults the create form to `HOTEL_SECOND_DB`, which is already used by the seeded second hotel. A new property can therefore be registered as a distinct hotel while routing to another hotel's operational database.

This breaks physical tenant isolation even though arbitrary/undeclared bindings are rejected.

Required repair:

- make active hotel → operational binding assignment injective/one-to-one at the authoritative control-plane boundary (schema constraint, binding registry, or equivalent safe operation);
- reject reuse of an already-assigned operational binding with zero metadata/audit side effects;
- add deterministic regression: hotel C + Hotel B binding must fail, Hotel B data remains inaccessible through hotel C;
- UI must not offer an already-consumed binding as a valid new-hotel choice.

### 2. P1 — Central RBAC matrix is not source-canonical and introduces an actual privilege escalation

The accepted source capability canon grants `receptionist` `billing.balance.read` and `billing.invoice.read`, but **not** `billing.invoices.read`. Target `ROLE_CAPABILITIES.receptionist` grants `billing.invoices.read`; the target `/invoices` route uses that capability, so a receptionist can list all invoices when the source role cannot.

The target also omits source capabilities such as `audit.events.read` for `ops`, while adding target-only or differently named capability groupings without an explicit approved semantic mapping. `saas_admin` is assigned `audit.events.read` in the target even though the source canon defines its capabilities as `saas.hotels.read/write` only.

Required repair:

- derive and test the target role/capability matrix against `docs/validation/rbac-canon-v1.json` / generated source capability canon;
- preserve exact accepted source permissions except explicit Cloudflare-specific adaptations documented as decisions;
- add per-role positive/negative API tests, including receptionist denial for `/invoices` and ops positive audit read;
- unknown role remains deny-all.

### 3. P1 — RBAC is not actually centralized across migrated modules; lifecycle retains a contradictory local map

`apps/api/src/routes/lifecycle.ts` still owns a separate local role→capability table and does not consume the new central capability map. CF-I07 explicitly required centralized semantics across inventory, bookings/lifecycle, housekeeping and billing.

More materially, the source canon has `bookings.checkout.override` only for admin. The target lifecycle checkout accepts `pending-approved` for admin, ops and receptionist through the same generic `bookings.write` local rule; no source-equivalent checkout-override capability is enforced.

Required repair:

- lifecycle and every accepted migrated route must use the single central capability authority;
- map `bookings.checkout.override` (and any other source canonical capability such as room-status authority) explicitly;
- prove receptionist/ops cannot execute the source admin-only pending-balance checkout override while admin can;
- add a static test that changed backend route modules do not reintroduce independent role maps.

### 4. P1 — Role change and deactivate can report stale success and write false/duplicate audit events

`PATCH /users/:subject/role` and `DELETE /users/:subject` pre-read membership state, then perform an unconditional mutation plus unconditional audit in a D1 batch. The operation never verifies that the conditional business mutation changed exactly one row relative to the state it read.

Concurrent example:

1. requests A and B both read role `receptionist`;
2. A changes to `ops` and audits `receptionist → ops`;
3. B changes to `housekeeping` but can still audit `receptionist → housekeeping` even though the authoritative previous role was `ops`.

Concurrent deactivate has the same class: the loser can update zero rows yet still insert an audit event and return success.

Hotel plan mutation has the same stale-pre-read/audit class and must be swept as part of this repair.

Required repair:

- exact conditional mutation (`old role/version/active state` or server operation token) must prove the caller won;
- audit must be in the same logical write and exist iff that exact mutation succeeded;
- deterministic role-change race and duplicate-deactivate race: one exact authoritative transition per operation, truthful from/to metadata, rejected loser produces zero audit;
- apply the same check to hotel plan/admin mutations where stale pre-read state is used.

### 5. P1 — Shared Access identity mapping can be modified by a hotel-local admin across tenant boundaries

`POST /users` performs `INSERT ... ON CONFLICT(access_subject) DO UPDATE SET email=excluded.email, active=1` on the global `access_identity_mappings` table before inserting a tenant membership.

A hotel admin provisioning an already-known Access subject can therefore rewrite that subject's global email and reactivate the identity mapping, affecting other hotel memberships. Tenant-local membership administration must not mutate shared identity truth owned by another tenant merely because the subject already exists.

Required repair:

- treat existing Access identity mapping as shared authoritative identity: verify compatibility rather than rewriting global email/active state from a hotel-local request;
- new identity provisioning may create a mapping only under an explicit safe rule;
- cross-tenant fixture: hotel A cannot change the existing subject/email/active state used by hotel B while creating a local membership;
- rejected mismatch leaves membership, identity and audit unchanged.

### 6. P1 — Audit read surface does not satisfy the contract and leaks global-null control events to hotel admins

`GET /audit/events` reads only `control_audit_events`. It does not expose the accepted authoritative operational audit/event data already produced by lifecycle, housekeeping/maintenance and billing in the hotel's operational D1, despite the CF-I07 contract requiring an admin-readable audit surface backed by migrated events plus CF-I07 mutations.

The same query returns `hotel_id IS NULL` control events to every hotel admin. Network hotel-create/plan events are currently written with `hotel_id = NULL`, so hotel admins can see global/network control-plane events that are not tenant-scoped.

Required repair:

- define a provenance-preserving audit read model that includes tenant operational events required by the contract and CF-I07 control events;
- hotel-scoped audit must not include unrelated global/network events;
- if network-level audit is required, expose it only under explicit network capability with deliberate scope;
- deterministic two-hotel audit fixture proves no cross-tenant/global leakage and deterministic newest-first ordering across the read model.

### 7. P1 — Plan tier domain is not source-equivalent

Source schema constrains plan tiers to `BASIC | PRO | ENTERPRISE` with default `BASIC`. Target `hotel_admin_metadata` defaults to `FREE`, the Network UI offers `FREE | PRO | ENTERPRISE`, and backend plan update accepts any non-empty string.

This violates `INV-ENUM-001` / `INV-PARITY-001` and can persist states the accepted source never permits.

Required repair:

- preserve `BASIC | PRO | ENTERPRISE` or document/approve an explicit semantic mapping before changing product meaning;
- add DB/API validation and positive/negative tests;
- correct existing local target default/fixture/UI values accordingly.

### 8. P1 — Users/Network responsive and workflow evidence is materially below the contract

The browser script checks overflow at all five widths but executes user creation only at 375 and network detail/plan change only at 375. It does not execute the contracted material admin workflow at each required width.

The target Users UI also replaced the accepted mobile detail-sheet/focus-return/delete-confirmation workflow with simple cards and `window.confirm`; it omits the `admin` role from the create-role choices even though the source create flow includes it.

Required repair:

- preserve source material mobile detail + explicit confirmation + focus-return semantics (visual implementation may differ);
- create flow exposes all accepted tenant roles, including admin, subject to backend authority;
- browser executes user search/list/detail/create/validation-error/deactivate-confirmation/focus-return/forbidden behavior at the contracted widths as required;
- network list/detail/admin action gets representative mobile + desktop execution and each contracted width exercises material controls, not only overflow.

### 9. P1 — Required inherited CF-I05/CF-I06 regressions remain UNPROVEN

CF-I07 contract explicitly requires fresh inherited CF-I03/04/05/06 regressions. Artifact evidence states CF-I05/CF-I06 wrapper runs did not emit their terminal PASS markers. Under the binding Pre-Critic rule, interrupted/ambiguous execution is `UNPROVEN`, not PASS.

Required repair: isolate/fix the runner lifecycle and obtain fresh executable PASS for CF-I03/04/05/06 before republishing.

### 10. P1 — Evidence overclaims PASS

`CF-I07-PRECRITIC-GATE.md` declares tenant/binding isolation, atomic audit and responsive UX PASS, while the implementation/test evidence above does not satisfy those claims. `CF-I07-INVARIANTS.md` marks `INV-RESP-001`, `INV-RBAC-001`, `INV-TENANT-001`, `INV-ATOMIC-001`, `INV-AUDIT-001` and `INV-EVID-001` PASS despite missing or contradictory executable proof.

Required repair: evidence must be rewritten only after the executable requirements are actually proven. No required inherited runner may remain UNPROVEN.

## Publication / scope

- No Human Gate is required; all findings are implementation/evidence defects inside the authorized CF-I07 objective.
- Preserve accepted CF-I01–CF-I06 product behavior.
- Do not begin CF-I08 until CF-I07 receives Independent Critic PASS.
- No production deployment, remote D1 creation, paid resource, real-data migration or cutover.
- Fresh publication must use a clean artifact A + orchestration-only boundary B pointing exactly to A; avoid a post-boundary SHA correction cycle.

## REWORK-1 exit criteria

CF-I07 may return to Independent Critic only when all of the following are true:

1. each active hotel has an exclusive configured operational D1 binding and binding reuse is rejected;
2. source-canonical capability matrix is restored and every migrated backend route uses the centralized authority;
3. admin-only checkout override and representative role matrix are proven;
4. user role/deactivate and hotel admin mutations have exact-winner + exactly-once truthful audit semantics under concurrency;
5. tenant-local user management cannot rewrite another tenant's shared Access identity mapping;
6. tenant audit read model preserves operational/control provenance and has no cross-tenant/global leakage;
7. plan tiers are source-equivalent and validated across DB/API/UI;
8. responsive Users/Network workflow meets the contract, including mobile detail/confirmation/focus return and accepted roles;
9. fresh CF-I03/04/05/06 inherited regressions all emit PASS;
10. invariant/Pre-Critic evidence contains no required FAIL/UNPROVEN/overclaim;
11. fresh artifact A + one orchestration-only boundary B are remote and execution stops for Independent Critic.
