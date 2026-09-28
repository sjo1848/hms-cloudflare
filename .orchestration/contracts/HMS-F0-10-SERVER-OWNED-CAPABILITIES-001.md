# Task Contract — F0.10 Server-owned Capabilities

Task ID: `HMS-F0-10-SERVER-OWNED-CAPABILITIES-001`
Parent: `.orchestration/contracts/HMS-FOUNDATION-0-START-001.md`
Status: `FROZEN BEFORE IMPLEMENTATION`
Dependency: F0.2; F0.9 exact A+B Independent Critic PASS is recorded at `.orchestration/evidence/HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001-INDEPENDENT-CRITIC-A-B.md`.
Authority: `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` §F0.10; Master, Traceability Matrix, Test/Evidence Matrix, Repository Surface Audit; `.orchestration/INVARIANTS.md`; `.orchestration/PRECRITIC-GATE.md`.
Scope: additive capability exposure and presentation-only visibility from the existing canonical role map. Synthetic/local evidence only. No schema migration is planned.

## Objective and security boundary

Expose the effective capabilities already granted by canonical server authority, scoped separately to the currently selected hotel membership and active network membership. Use that server payload to present only the navigation entries and in-page controls the current operator may use. The UI payload is never authorization: every API request continues to evaluate current identity/membership/role on the server, and unknown roles fail closed.

Do not change `ROLE_CAPABILITIES`, role grants, membership selection, authentication, tenant topology, network identity, or any route's backend authorization policy. Any discovery that requires changing an approved grant/authority boundary is a stop condition, not an implementation detail.

## Verified current surfaces

- `apps/api/src/auth/capabilities.ts`: sole `ROLE_CAPABILITIES` mapping and `hasCapability`; unknown role returns false.
- `apps/api/src/auth/membership.ts` and `apps/api/src/index.ts`: active hotel membership selection, operational binding and separately resolved active network role; `/api/v1/auth/me` currently returns hotel and network role names but no capability arrays.
- API consumers: `apps/api/src/routes/{inventory,bookings,front-desk,lifecycle,housekeeping,billing,admin,analytics}.ts`; hotel checks use membership role and network checks use network role.
- Shell: `apps/web/src/app/AppShell.tsx`, `navigation.ts`, `router.tsx`; current navigation is unconditional and shell fetches `/auth/me` only for hotel label.
- UI consumers: Reception, Rooms, Guests, Housekeeping, Reports, Users, Network and embedded Billing surfaces. Exact entries/control mapping must derive only from the canonical server capability names, not a browser-side role map.
- Client: `apps/web/src/api/client.ts`; local dev identity and selected hotel are mutable. AppShell increments `identityVersion` on local identity change.

## Response contract (fixed for this increment)

Extend the existing `/api/v1/auth/me` JSON additively with:

```json
{
  "capabilities": {
    "hotel": ["..."],
    "network": ["..."]
  }
}
```

- `hotel` is the sorted effective set for the selected active hotel membership only; it is `[]` when no hotel membership is selected or its role is unknown.
- `network` is the sorted effective set for the independently authenticated active network role only; it is `[]` when absent or unknown.
- Never union network grants into hotel grants or infer a hotel from a network identity.
- Values come directly from the existing server-owned `ROLE_CAPABILITIES`; no second role/capability mapping is permitted in the UI.
- Existing `/auth/me` keys and `/api/v1` behavior remain compatible. This response is descriptive, not a credential/claim, and cannot authorize a route or mutation.

## Requirement → surface → acceptance → evidence

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Effective capability payload | `capabilities.ts`, `/auth/me` | Exact current role set, sorted; unknown/no membership yields empty set; hotel and network scopes stay separate | API tests for every canonical role, unknown role, no membership, network-only and dual membership |
| No capability drift | Central map + route consumers | API payload exactly matches `ROLE_CAPABILITIES`; no new grants, missing grants, client role map, or role-name authorization shortcut | Exact role-set equality tests; static scan/route uniqueness; existing protected-route regressions |
| UI visibility | `AppShell`, navigation/router and currently exposed in-page controls across Reception, Rooms, Guests, Housekeeping, Billing, Reports, Users and Network | Navigation/action visibility derives from capability arrays; in-page read/write controls use the appropriate existing capability; no role-name tests in frontend | Browser matrix for admin, ops, receptionist, housekeeping, saas_admin; hidden controls asserted with keyboard and responsive execution |
| Direct route/API enforcement | Existing API guards and router | Hiding a page/control never replaces backend enforcement; direct URL or direct request remains denied for an authenticated active but unauthorized identity | Local Worker request against protected API with correct identity/membership/routing; assert denial guard and zero business/audit drift |
| Downgrade freshness | `/auth/me`, client identity/context lifecycle | Same subject's previously allowed protected request is denied after its active role is downgraded; old `/auth/me` response cannot restore stale visibility after identity/hotel switch or arrive out of order | Same-subject before/downgrade/after integrated D1/API test; controlled delayed response browser test |
| Tenant/network scope | membership middleware, `/auth/me`, network route | Hotel capability set follows selected membership; foreign/unmembered hotel has no set; network-only capabilities never imply operational hotel membership/access | Two configured hotels, same identity selecting each membership, network-only and dual-role fixtures, zero cross-tenant reads/writes |
| Migration and recovery boundary | no migration | No persistent capability cache, grant table, role-map rewrite, or schema/data mutation | Migration diff empty; local evidence demonstrates only synthetic fixture role updates for downgrade case |

## Navigation and visible-control mapping

The implementation must first inventory rendered protected navigation and actions in the named actual feature roots, then apply this minimum route map without expanding product capability:

| Surface | Capability requirement for visibility |
|---|---|
| Reception/bookings | `bookings.read` |
| Rooms | `rooms.read` |
| Guests | `guests.read` |
| Housekeeping | `housekeeping.read` |
| Reports | any existing report read capability actually consumed by the page; do not invent a new permission |
| Users | `users.read` |
| Network | `saas.hotels.read` |
| Embedded booking account/billing reads | `billing.read`, `billing.balance.read`, `billing.invoice.read`, or the specific existing read capability used by that control |

For buttons/forms already rendered in these surfaces, hide unavailable operations using the exact existing write capability that protects their backend route (for example `rooms.write`, `guests.write`, `bookings.write`/`bookings.update`, `lifecycle.write`, `housekeeping.write`, `maintenance.report`/`maintenance.resolve`, `bookings.extra_charges.write`, `billing.write`, `users.write`/`users.delete`, `saas.hotels.write`). Do not add permissions or change backend guard semantics. If a control cannot be mapped unambiguously to an existing server guard, keep the backend denial and record the control as a finding; do not guess a new grant.

The UI treatment is hidden for unavailable primary navigation and operations; no disabled control with a custom permission explanation is required. A direct URL remains routable but renders the ordinary authoritative API denial/error state and does not expose protected data.

## Freshness, caching and concurrency

- Capability context is keyed by identity subject plus selected hotel (network membership is separately represented). On identity/hotel change, invalidate old capabilities immediately and fetch the new `/auth/me` context.
- A monotonically increasing request identity or cancellation prevents older `/auth/me` responses from overwriting a newer identity/hotel context.
- No role/capability value sent by the browser is trusted by the API. No long-lived cache, TTL policy, push channel or realtime infrastructure is introduced.
- Backend middleware continues loading active membership/current role for every API request; tests prove that UI state is not used by the server authorization decision.

## Invariant classifications (all 24)

| Invariant | Classification | Rationale/evidence required |
|---|---|---|
| INV-ATOMIC-001 | N/A | No new conditional business aggregate or multi-row mutation; role downgrade is a synthetic fixture setup, not a product command under test. |
| INV-AUDIT-001 | N/A | No new risk-relevant product mutation/event is introduced; denied requests assert zero existing business/audit drift. |
| INV-DOMAIN-001 | N/A | No domain transition/write API is changed. |
| INV-TENANT-001 | APPLIES | Selected membership is sole hotel scope; prove two-hotel selection and foreign/unmembered fail-closed behavior. |
| INV-RBAC-001 | APPLIES | UI is presentation only; every backend guard remains authoritative; unknown role empty/fail-closed. |
| INV-PARITY-001 | APPLIES | Preserve exact existing canonical role→capability meaning; no weak defaults or grants. |
| INV-ENUM-001 | APPLIES | Role names are capability-map keys; preserve exact canonical key/value semantics through API/UI serialization and sorted sets. |
| INV-UX-001 | APPLIES | Do not redesign workflows; hide only inaccessible navigation/actions and preserve accessible/available interaction. |
| INV-ORDER-001 | N/A | No operational queue order/next-case rule changes. |
| INV-RESP-001 | APPLIES | Browser proves protected nav/actions at contracted desktop and mobile sizes, not shell render alone. |
| INV-EVID-001 | APPLIES | Every capability, RBAC, browser and D1 claim links to executable evidence and exact identity/role fixture. |
| INV-LEGACY-001 | N/A | No historical record synthesis or recovery. |
| INV-MONEY-001 | N/A | No financial arithmetic or mutation; only zero-drift assertions for denied control paths where fixtures involve data. |
| INV-STATE-001 | APPLIES | Substantive F0.10 artifact requires exact Artifact A, orchestration-only Boundary B and independent RBAC Critic. |
| INV-CF-I07-001 | APPLIES | Protected admin/network/audit routes must use centralized `hasCapability`; changed scope gets static/direct-route audit. |
| INV-CF-I07-002 | N/A | No role/plan/admin mutation semantics are changed; downgrade fixture is test setup only. |
| INV-CF-I07-003 | APPLIES | Same subject and same protected operation succeeds before synthetic role downgrade and is denied after, with zero side effects. |
| INV-CF-I07-004 | APPLIES | Integrated local Worker/browser runner must clean and verify only its owned process trees before PASS. |
| INV-CF-I08-001 | N/A | Report arithmetic is unchanged. |
| INV-CF-I08-002 | N/A | Network data aggregation/binding is unchanged; only current network capability exposure and existing-route denial are tested. |
| INV-CF-I08-003 | N/A | Report date/state query semantics are unchanged. |
| INV-CF-I08-004 | N/A | No booking/room state values change. |
| INV-CF-I08-005 | N/A | No report clock/default/continuity semantics change. |
| INV-SCOPE-001 | APPLIES | Only server capability exposure and presentation visibility/freshness; no Blocks A–H, real data, auth topology, grant changes or F0.11 shared refresh abstraction. |

## Explicit non-goals and stop conditions

No new or changed grants/roles, client-side authorization, duplicate frontend role map, auth boundary/topology, tenant routing, capability persistence/schema, generic permission framework, broad App Shell redesign, F0.11 cache/invalidation infrastructure, Blocks A–H, real data, PR/push/merge, main, staging, deploy, or production.

Stop and record a blocker if implementing the accepted capability payload/visibility requires changing the canonical role grants, Access/membership authority, network-vs-hotel security boundary, or another approved product/security policy. Routine test and UI defects are repaired autonomously.

## Validation / evidence required

- Contract reviewer no-blocker record; Task Contract and Pre-Critic frozen before code.
- All-role exact set API test derived from server `ROLE_CAPABILITIES`; do not maintain a second expected role map in frontend production code.
- Authenticated no-membership/unknown role, each hotel role, network-only and hotel+network API responses; exact sorted capability arrays and scope separation.
- Same-subject same-operation allowed→role downgrade→denied using disposable local CONTROL_DB, plus exact zero-effect snapshot; client role/capability context must refetch on switch.
- At least one denied authenticated write after proving identity/membership/hotel routing; assert no business or audit changes. Test direct protected URL/API separately from hidden nav.
- Real local Wrangler Worker + disposable CONTROL_DB and two HOTEL D1 bindings + Vite browser, minimum desktop 1280×900 and mobile 375×844. Exercise accessible and inaccessible nav/actions, network-only/dual context, hotel switch and delayed/out-of-order `/auth/me`; use keyboard navigation.
- `npm run check`, `npm run types:check`, `npm run web:build`, architecture fitness/i18n/budgets, D1 query plans, API/Web/staging-SPA Wrangler dry-runs only, route uniqueness/security regression, relevant CF-I03–I07 serial regressions, `git diff --check`, STATUS JSON parse, forbidden-scope audit, runner-owned process cleanup.
- Fresh `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-PRECRITIC.md` and `...-INVARIANTS.md`; immutable A+B exact boundary; separate Independent Critic with RBAC focus. Do not claim F0.10 or Foundation 0 PASS before its own Critic.

## Development Gate / recovery

Development Gate is met only when the API returns the exact server-owned scope-specific sets, visible navigation/actions are derived from them without duplicate role authority, backend direct-route enforcement is unchanged and proven, same-subject downgrade denies immediately, tenant/network scopes do not leak, and all applicable invariants have reproducible evidence. Fresh Independent Critic is required for the exact A+B. Human Gate is not required unless a canonical grant, authentication authority, tenant/network boundary, or product scope must change. Rollback is additive: revert response consumer/visibility while preserving API authorization; no data recovery or migration is expected. Foundation 0 remains open through F0.11 and F0.12.

## Contract review

Fermat (separate read-only GPT-6 Luna Medium Contract Reviewer) inspected the approved F0.10 contract, traceability/evidence matrices, invariant and Pre-Critic requirements, and actual auth, API and shell surfaces. The reviewer found no `ROADMAP_BLOCKER`; it confirmed the hotel/network capability scopes must remain separate and required explicit route/action scope, role-map parity, same-subject downgrade, direct API denial, zero side effects and stale-response tests. The response shape and hide treatment above are bounded contract details within the approved additive/presentation-only change; no role grant or security authority is changed.
