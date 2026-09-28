# Task Contract — HMS-F0-06-REPAIR-CANONICAL-PRICING-SNAPSHOT-001

Status: `AUTHORIZED BOUNDED TECHNICAL REWORK UNDER F0.6`  
Parent: `.orchestration/contracts/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001.md`  
Independent Critic finding: `F0.6-IC-01 HIGH`  
Scope: capture and guard the exact existing operational pricing-segment set for synthetic active-stay classification/activation. No real-data access.

## Objective and bounded remedy

Close the gap where F0.6 snapshots account/inventory/room state but omits already-canonical `booking_pricing_segments`, even though F0.5 quote projection consumes them. The F0.6 manifest must snapshot those rows exactly. Any pre-existing canonical segments make that candidate held as `ORPHAN_OR_CONFLICT` with blocker `CANONICAL_PRICING_SEGMENTS_PRESENT`; F0.6 must not append another set over them. At activation, a new forward migration guard must compare the exact current segment set with the staged source snapshot inside the same D1 batch transaction.

This is a safety refinement of F0.6's existing exact-source-snapshot requirement, not a product-policy decision. Existing F0.5 segments remain canonical and immutable.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Snapshot canonical pricing inputs. | F0.6 source/manifest types, local fixture reader and executing-D1 tests. | Include all segment identity, interval, rate, room/rate version, segment version, operation token, actor/hotel/request and timestamp fields in stable source digest. | Manifest digest changes for a changed segment set; exact source fixture. |
| Do not re-bootstrap a stay already represented by canonical segments. | F0.6 classifier. | Any nonempty canonical segment set is held as `ORPHAN_OR_CONFLICT`, includes blocker, has no activation candidate segments, and cannot activate. | Executing-D1 presegmented stay test; zero bootstrap segment/event/financial mutations. |
| Fail closed if canonical segments change after shadow staging. | **PROPOSED NEW FORWARD SURFACE:** `apps/api/schema/hotel-migrations/0027_active_stay_bootstrap_segment_snapshot_guard.sql`. | Before `SHADOWED → ACTIVATING`, compare exact multiset/set fields and cardinality from current D1 against persisted source JSON; added, missing, changed or substituted segment rejects the same atomic batch. | Executing-D1 stale segment insertion test, including restored booking pricing version/token/update timestamp to isolate the exact-set guard; zero activation drift. |
| Preserve F0.5 quote/account semantics. | Existing `pricing-segments.ts`, F0.5 write guard and D11. | No changes to operational quote selection, segment mutability, booking totals, invoices, charges or payments. | F0.5/F0.4 tests, D11 4/4, full Foundation CI and integrated remaining-interval browser regression. |

## Invariant mapping

| Invariant | Applies? | Repair acceptance/evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Exact canonical-segment snapshot checked inside activation transaction; stale set rejects before canonical bootstrap write. |
| INV-AUDIT-001 | APPLIES | Rejected existing/stale segment paths create no bootstrap canonical segments or side events. |
| INV-DOMAIN-001 | APPLIES | Existing segments remain the canonical pricing domain; F0.6 does not layer another pricing mutation over them. |
| INV-TENANT-001 | APPLIES | Segment set is scoped by the booking ID inside the selected hotel D1; retain two-D1 isolation tests. |
| INV-RBAC-001 | N/A | No product HTTP/API capability surface. |
| INV-PARITY-001 | APPLIES | Current pricing projection remains sole existing canonical source; no historical inference or overwrite. |
| INV-ENUM-001 | APPLIES | No enum/value set changes. |
| INV-UX-001 | N/A | No UI change. |
| INV-ORDER-001 | N/A | No queue ordering change. |
| INV-RESP-001 | N/A | No responsive surface change. |
| INV-EVID-001 | APPLIES | Critic finding maps to targeted executing-D1 regression and exact migration guard. |
| INV-LEGACY-001 | APPLIES | Existing canonical segments cause a held conflict; no automatic reinterpretation. |
| INV-MONEY-001 | APPLIES | Exact booking/account/payment snapshots remain unchanged on rejected/stale paths. |
| INV-STATE-001 | APPLIES | New immutable Artifact A2 then orchestration-only Boundary B2, exact pair critic. |
| INV-CF-I07-001 | N/A | No admin/network authorization changes. |
| INV-CF-I07-002 | N/A | No admin mutations. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated runners retain owned-temp cleanup; verify after final browser run. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No analytics date/series. |
| INV-CF-I08-004 | N/A | No room/booking statuses changed. |
| INV-CF-I08-005 | N/A | No operational date predicate introduced. |
| INV-SCOPE-001 | APPLIES | Repair only F0.6 canonical pricing input coverage; no real data, Blocks A–H, PR, merge, staging or deploy. |

## Prohibited

- No edit to migration 0026 or any earlier migration; 0027 is forward-only.
- No mutation of F0.5 segments except disposable synthetic executing-D1 fixtures.
- No new status/class beyond the frozen five F0.6 classes.
- No booking, invoice, charge, payment, inventory, lifecycle or room mutation to resolve a finding.
- No real/customer D1 access, cutover, PR, push, merge, staging, deploy, production or Blocks A–H.

## Validation and boundary

Run targeted F0.6 executing-D1 tests, full `npm run check`, `npm run types:check`, web build, architecture/budgets, D1 query plans, clean Wrangler hotel migration chains through 0027, API/Web/staging SPA dry-runs, CF-I03–06 and `scripts/cf-wave12-reassignment-integrated.sh`. Update F0.3 cumulative schema/migration digest fixtures if the additive migration changes those hashes, preserving all behavior assertions. Refresh invariant/Pre-Critic evidence, publish new Artifact A2 and orchestration-only Boundary B2, then require a fresh Independent Critic on exact A2+B2 before resuming Foundation 0.
