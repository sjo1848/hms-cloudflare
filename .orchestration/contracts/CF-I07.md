# TASK CONTRACT — CF-I07

TASK ID: `CF-I07`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / SECURITY + ADMIN WAVE`  
STATUS: `READY / AUTHORIZED AFTER CF-I06 PASS`

## OBJECTIVE

Migrate and integrate the accepted HMS user-management, RBAC, audit, hotel/control-plane and network-administration capabilities to the Cloudflare target while preserving source security semantics, tenant isolation, material admin workflow, operational traceability and responsive UX.

This increment is the primary security/cross-tenant boundary. Product behavior may be technically adapted to Cloudflare Access + CONTROL_DB + per-hotel D1, but authorization semantics, auditability, tenant identity and material user/admin workflows may not be weakened or replaced by frontend-only assumptions.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md`, `.orchestration/STATUS.json`.
- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Source user UX: `frontend/src/features/users/UsersPage.tsx`, user create drawer/service and route guards.
- Source hotel/network UX: `frontend/src/features/dashboard/HotelNetworkPage.tsx`, hotel service, feature flags and route guards.
- Source auth/security/admin handlers and OpenAPI contracts.
- Accepted target foundation through CF-I06 PASS artifact `0004990ba60b0349776de139cd04dfc2f30eaa6d`.
- Binding architecture decisions: Cloudflare Access perimeter, CONTROL_DB membership/routing, one operational D1 per hotel, source parity-first.
- `.orchestration/INVARIANTS.md` and `.orchestration/PRECRITIC-GATE.md`.

## APPLICABLE LEARNED INVARIANTS

Mandatory unless explicitly justified N/A:

- `INV-ATOMIC-001`
- `INV-AUDIT-001`
- `INV-DOMAIN-001`
- `INV-TENANT-001`
- `INV-RBAC-001`
- `INV-PARITY-001`
- `INV-ENUM-001`
- `INV-ORDER-001` where user/audit/network ordering is material
- `INV-UX-001`
- `INV-RESP-001`
- `INV-EVID-001`
- `INV-STATE-001`
- `INV-SCOPE-001`

`INV-MONEY-001` applies only where CF-I07 network/admin surfaces expose or aggregate already-accepted financial values; it does not authorize new financial mutation semantics.

## SCOPE

### 1. Identity / memberships / users

Implement source-equivalent management behavior using Cloudflare Access identity + CONTROL_DB memberships rather than recreating password authentication.

At minimum:

- list tenant users/memberships visible to authorized admin;
- create/invite/register an access-backed membership only through an explicit backend admin operation compatible with the target Access model;
- supported roles map to canonical target capability semantics;
- delete/deactivate membership/account access according to source intent without silently deleting unrelated identity history;
- unknown roles fail closed;
- prevent unauthorized self-escalation or cross-tenant role assignment;
- backend never accepts a client-supplied operational database binding as authority.

If source password-specific fields/actions have no Cloudflare Access equivalent, document them as an intentional technical adaptation rather than emulating passwords inside HMS.

### 2. RBAC / capability enforcement

Centralize and verify capability semantics so migrated modules do not drift into independent contradictory role maps.

At minimum cover accepted capabilities used by:

- inventory/rooms/guests/bookings/lifecycle;
- housekeeping/maintenance;
- billing/cash closure;
- user management;
- hotel/network administration;
- audit read access.

Acceptance:

- backend capability evaluation is authoritative;
- unknown role = deny;
- role changes take effect deterministically on subsequent requests;
- role downgrade cannot retain stale elevated mutation rights;
- cross-tenant identity/membership combinations fail closed;
- frontend route/action visibility reflects backend capabilities but is not security authority.

### 3. Audit / security events

Provide an admin-readable audit surface backed by durable authoritative events already produced by migrated increments plus CF-I07 membership/admin mutations.

At minimum:

- actor subject;
- request/trace id;
- hotel/tenant id;
- action/event type;
- target object or contextual details where applicable;
- timestamp;
- deterministic newest-first ordering unless source defines otherwise.

User/hotel/role mutations must produce exactly one audit event on success and zero on rejected/stale/unauthorized failure.

Do not silently merge unrelated event tables if doing so loses provenance. A normalized read model is acceptable if source records remain authoritative and traceable.

### 4. Hotels / control plane

Implement the source-equivalent hotel/network administrative capability compatible with target physical D1 isolation.

At minimum:

- list configured hotels/properties visible to authorized network admin;
- create/register a hotel control-plane record only when a valid configured operational binding strategy exists;
- enable/disable membership/routing state according to accepted target architecture;
- expose property identity/name/address and plan/feature metadata required by source admin UX where representable;
- plan tier / feature-flag mutation only if source contract supports it and target semantics are explicitly mapped;
- no arbitrary binding names from client input may create access to undeclared Worker bindings;
- cross-hotel admin reads/writes require explicit network-level capability, not ordinary hotel membership.

Creating a real remote D1 database, paid resource or production binding is outside CF-I07 and is a Human Gate if it incurs cost or irreversible external provisioning. Local/configured test bindings may be used for evidence.

### 5. Network administration UX

Preserve material source workflow rather than the exact visual system.

Users:

- list/search users;
- display username/identity and role;
- create user/membership flow;
- explicit delete/deactivate confirmation;
- mobile detail sheet/focused workflow with sensible focus return;
- typed loading/error/empty/success states.

Hotel/network:

- list/filter properties;
- property detail/drill-down;
- create/register property workflow where authorized and technically representable;
- plan/feature administration if supported by target contract;
- clear distinction between current hotel operations and network-level administration.

Do not absorb CF-I08 reporting/analytics implementation merely because the source HotelNetworkPage displays aggregate KPIs. CF-I07 may preserve the administrative shell/property list and clearly defer report analytics to CF-I08 if those metrics depend on the reporting wave. Any such split must preserve navigation and avoid false data.

### 6. Responsive / accessibility

Execute material user/admin workflows at 375/390/430/768/1024 where the source route is available.

At minimum prove:

- user search/list;
- open user detail on mobile;
- create membership/user success and validation/error;
- delete/deactivate confirmation and focus return;
- forbidden route/action behavior;
- hotel/property selection/admin action at representative mobile and desktop widths;
- no horizontal overflow for material admin surfaces.

## SECURITY / TENANT ACCEPTANCE MATRIX

| Capability | Required acceptance |
|---|---|
| User list | current authorized tenant only unless explicit network capability |
| Create membership | exact tenant + role, no cross-tenant/self-escalation |
| Delete/deactivate | exact membership target; no unrelated identity/history deletion |
| Role change | authorized admin only; stale elevated permission disappears |
| Unknown role | backend deny |
| Cross-tenant object | no existence leak or mutation without explicit network capability |
| Audit | actor/request/hotel/action/time durable; success exactly once, deny zero |
| Hotel list/admin | explicit network-level authorization |
| Binding routing | only server-configured bindings may resolve |
| Frontend guards | UX only; backend remains authoritative |

## REQUIRED ADVERSARIAL TESTS

At minimum:

- housekeeping/receptionist role cannot perform user-admin mutation unless source explicitly grants it;
- unknown role cannot read/write protected admin surface;
- tenant-A admin cannot mutate tenant-B membership by object id;
- network admin positive cross-hotel operation is separately proven when source capability requires it;
- stale/duplicate delete or role-change attempt does not produce duplicate audit events;
- role downgrade followed by privileged mutation is denied;
- client-supplied/unknown operational binding cannot route to an undeclared database;
- user-create duplicate identity/membership path fails deterministically without partial state;
- membership creation + audit atomicity;
- delete/deactivate + audit atomicity;
- audit newest-first deterministic ordering;
- frontend forbidden route/action cannot substitute for backend denial;
- browser workflows at contracted widths;
- full inherited CF-I03/04/05/06 regressions.

## EVIDENCE / PRE-CRITIC

Before publication:

- create `.orchestration/evidence/CF-I07-INVARIANTS.md`;
- create `.orchestration/evidence/CF-I07-PRECRITIC-GATE.md`;
- create an explicit source→target RBAC/capability matrix;
- create an explicit source→target identity/auth adaptation note for Cloudflare Access;
- run unit/type/build/Wrangler checks;
- run fresh inherited CF-I03/04/05/06 regressions;
- run deterministic security/tenant/admin focal regression;
- run responsive browser regression;
- run route-uniqueness/static registration checks for changed admin/API surfaces;
- no applicable invariant may remain FAIL/UNPROVEN.

Publication uses `INV-STATE-001`:

1. substantive artifact A;
2. orchestration-only boundary B pointing exactly to A with `external_review.required=true`, `resume_authorized=false`;
3. stop for Independent Critic.

## FORBIDDEN ACTIONS

- CF-I08 reporting/analytics completion beyond the minimal admin shell/data needed to preserve navigation.
- CF-I09 migration rehearsal/cutover/readiness work.
- production deployment, remote D1 creation/mutation, real hotel migration or cutover.
- paid Cloudflare transition without Human Gate.
- recreating password authentication inside HMS merely to mimic the source when Cloudflare Access is the approved perimeter.
- frontend-only authorization.
- arbitrary client-selected D1 binding resolution.
- self-PASS.

## DONE WHEN

A coherent CF-I07 artifact preserves source user/admin workflow and target Cloudflare Access semantics, centralizes backend RBAC, proves cross-tenant and network-level authorization, produces exactly-once audit for admin mutations, preserves configured binding isolation, provides responsive user/network admin UX, passes all inherited and focal security regressions, satisfies all applicable invariants, publishes A+B, and stops for Independent Critic.