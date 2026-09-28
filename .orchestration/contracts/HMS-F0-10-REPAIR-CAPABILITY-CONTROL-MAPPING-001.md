# Task Contract — F0.10 capability-to-control mapping repair

Task ID: `HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001`
Parent: `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md`
Status: `FROZEN BEFORE REPAIR`
Authority: approved F0.10 contract, existing `ROLE_CAPABILITIES`/`hasCapability`, actual route guards, `.orchestration/INVARIANTS.md`.
Scope: visibility-only alignment between each already-rendered protected UI operation and the exact existing server guard. No backend/auth/grant/schema/workflow changes.

## Finding and acceptance

Read-only F0.10 surface audit found controls whose visibility did not match the route capability, plus incomplete gating in Housekeeping, Rooms, Users and Network. Reports uses two separately guarded requests and must only expose its combined page to roles that can read both datasets. Exact existing route guards are authoritative; this repair does not modify them.

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Exact control-to-route capability mapping | Reception, Rooms, Guests, Housekeeping, Billing, Users, Network, Reports | Every existing mutation/action is hidden unless the corresponding route guard capability is present; read-only UI uses the exact read capabilities actually requested | static route/control map + render/browser assertions |
| Reports complete-data boundary | Reports navigation/page | Page is visible only if both `reports.revenue.read` and `reports.occupancy.read` are present because both requests are required by its current `Promise.all` | existing canonical role matrix + route guard tests and browser nav checks |
| Current read source truth | Billing | Invoice/payment, booking, extra-charge and cash controls are shown only when their actual read/write guards permit the request; no role grants change | API route mapping + capability/context tests |
| Existing behavior/server authority | all listed surfaces | No route guard, capability set, operation semantics or write payload changes; hidden controls do not replace API denial | diff audit, existing route tests, integrated Worker/D1 |
| Invariant preservation | task-wide | all registry dispositions below have evidence or remain justified `N/A`; no applicable item unproven | task invariant evidence |

## Exact mapping to preserve

- Reception queue `bookings.read`; create booking, booking PATCH/edit and lifecycle commands use the current route guard `bookings.write`; embedded guest creation uses `guests.write`. (The parent F0.10 example `lifecycle.write` does not match the actual `apps/api/src/routes/lifecycle.ts` guard and is not used to create a frontend-only grant.)
- Rooms read `rooms.read`; create/edit/holds use `rooms.write`.
- Guests read `guests.read`; create `guests.write`.
- Housekeeping board `housekeeping.read`; start/finish `housekeeping.write`; create maintenance `maintenance.report`; resolve `maintenance.resolve`.
- Reports requires both `reports.revenue.read` and `reports.occupancy.read` for its current combined page.
- Users list `users.read`; create/role update `users.write`; deactivation `users.delete`.
- Network list `saas.hotels.read`; register/plan update `saas.hotels.write`.
- Billing: booking list `bookings.read`; invoice/payment read `billing.invoice.read`; extra-charge list `bookings.extra_charges.read`; extra charge create `bookings.extra_charges.write`; payment write and booking edits use their actual route guard `bookings.update` / `bookings.write`; cash balance `billing.balance.read`; cash close `billing.close_cash.write`.

No capability is inferred from role name; all UI checks use server-provided sets. A control with ambiguous/unmapped guard remains hidden and is reported rather than guessed.

## Existing authentication boundary clarification

An authenticated identity with network membership but no selected hotel receives an empty `hotel` capability set and its separate network set (covered by the network-only API case). An identity with neither an authorized hotel membership nor network membership remains denied by the existing `/api/v1/*` middleware, including `/auth/me` (403). This F0.10 presentation task does not broaden that boundary. Unknown role attached to an authorized membership remains an empty capability set and is covered separately.

## Invariant classifications (all 24)

| Invariant | Classification | Reason/evidence obligation |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business operation or multi-write mutation is changed. |
| INV-AUDIT-001 | APPLIES | Direct denied-write checks preserve exact room/audit state; visibility does not create events. |
| INV-DOMAIN-001 | N/A | No domain transition implementation or route changes. |
| INV-TENANT-001 | APPLIES | Selected hotel membership remains sole hotel scope; two-hotel and unmembered evidence reruns. |
| INV-RBAC-001 | APPLIES | Exact capability visibility plus server-side before/after allowed/denied proof. |
| INV-PARITY-001 | N/A | No source workflow semantics or grants are changed. |
| INV-ENUM-001 | N/A | No enum serialization or predicates change. |
| INV-UX-001 | APPLIES | Controls are hidden only; verify normal accessible workflow remains available to permitted roles. |
| INV-ORDER-001 | N/A | No queue priority/selection changes. |
| INV-RESP-001 | APPLIES | Capability controls/navigation are exercised at desktop 1280×900 and mobile 375×844. |
| INV-EVID-001 | APPLIES | Claims must point to API guard inventory, tests, integrated browser and D1 snapshots. |
| INV-LEGACY-001 | N/A | No legacy synthesis or backfill. |
| INV-MONEY-001 | N/A | Financial operation semantics unchanged; any forbidden-path check asserts zero financial drift. |
| INV-STATE-001 | APPLIES | Replacement immutable A and exact orchestration-only B required for fresh critic. |
| INV-CF-I07-001 | APPLIES | No route-local role checks; static scan and protected admin/network route regression. |
| INV-CF-I07-002 | N/A | No admin mutation semantics change; role mutation is only isolated synthetic test setup. |
| INV-CF-I07-003 | APPLIES | Same subject same room-create operation succeeds before and is denied after downgrade; zero denied write/audit. |
| INV-CF-I07-004 | APPLIES | Integrated runner owns and proves cleanup of Worker/Vite/Playwright. |
| INV-CF-I08-001 | N/A | Report arithmetic is unchanged. |
| INV-CF-I08-002 | N/A | Network fanout/binding/aggregation behavior is unchanged. |
| INV-CF-I08-003 | N/A | Report date and state predicates are unchanged. |
| INV-CF-I08-004 | N/A | No booking/room status predicates change. |
| INV-CF-I08-005 | N/A | No clock defaults or cross-surface continuity behavior change. |
| INV-SCOPE-001 | APPLIES | Repair limited to F0.10 presentation mapping; no F0.11 shared refresh abstraction, grants, backend, data or other waves. |

## Validation and forbidden scope

Rerun F0.10 API tests, applicable unit/integration tests, types, build/budget/architecture/query plans/Wrangler dry-runs, relevant CF-I03–I07 serial regressions, integrated local Worker/two-hotel D1/Vite browser at desktop/mobile, direct denied write and zero side-effect snapshots, process cleanup, diff/status/scope audits. No real data; no migration; no Blocks A–H; no PR/push/merge/main/staging/deploy/production.

## Process note

The first narrow Housekeeping visibility guard was applied immediately after the read-only audit and before this repair contract was frozen. It is retained transparently as part of the bounded repair, is not treated as accepted evidence, and will be fully revalidated against this frozen contract before publication. No other repair edits are authorized before this contract and its Pre-Critic record.
