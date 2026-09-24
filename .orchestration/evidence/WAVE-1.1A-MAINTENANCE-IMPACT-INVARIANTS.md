# WAVE-1.1A-MAINTENANCE-IMPACT — Invariant Evidence

Artifact candidate: substantive Wave 1.1a artifact commit containing this evidence; exact SHA is recorded by the following orchestration-only publication boundary.
Task Contract: `.orchestration/contracts/WAVE-1.1A-MAINTENANCE-IMPACT.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Contract authority: `origin/analysis/operational-flow-definition-v11` (read-only)

The artifact scope is limited to maintenance impact, maintenance transitions,
capabilities, sellability filtering, migration compatibility and regression
evidence. Reports, Users, reassignment, billing and deployment are excluded.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `scripts/cf-i05-regression.sh`: duplicate open, concurrent start/finish/resolve, K1→K2 stale resolve, and invalid SQL transition all assert conflict/rollback, final room/case state and zero stale event. Route batches verify the event after the guarded writes. | The stale case identity is correlated by case ID, room ID and OPEN status. |
| INV-AUDIT-001 | APPLIES | PASS | Same regression asserts one event for each winning race and zero event for the stale K1 attempt and trigger rollback; event rows include actor, hotel and request ID. | Failed or stale maintenance commands do not publish a success event. |
| INV-DOMAIN-001 | APPLIES | PASS | Maintenance changes are exposed through explicit report/escalate/resolve commands; direct invalid room/event transition is rejected by the migration trigger and the regression asserts the transaction rolled back. | No generic maintenance status PATCH was added. |
| INV-TENANT-001 | APPLIES | PASS | `apps/api/src/routing.test.ts` and `apps/api/src/auth/membership.test.ts` fail closed for unknown/non-member hotel bindings; CF-I05 regression sends an authenticated hotel-a request, rejects the same subject against hotel-b with 403, and asserts hotel-a room state/event count is unchanged. | Operational D1 is selected from authoritative membership context. |
| INV-RBAC-001 | APPLIES | PASS | `apps/api/src/auth/capabilities.test.ts` covers admin/ops/housekeeping read/report/resolve, receptionist read/report-only, saas_admin and unknown denial; CF-I05 regression asserts receptionist read, report and resolve requests return 403. | Backend route checks use the central capability authority. |
| INV-PARITY-001 | APPLIES | PASS | V11 docs 05/07/16/19/20 were mapped in the Task Contract; migration preserves existing rows, backfills open cases protecting MAINTENANCE as BLOCKING, preserves OCCUPIED, leaves future reservations untouched, and `room-availability.ts` blocks only open BLOCKING cases. CF-I05 covers the positive/negative state rules. | No automatic cancel, reassignment or guest move was added. |
| INV-ENUM-001 | APPLIES | PASS | Migration CHECK and API model accept only `NON_BLOCKING`/`BLOCKING`; `caseView` returns the canonical values and the regression asserts both values plus escalation. | DB, domain, API and read model use the same semantic literals. |
| INV-UX-001 | APPLIES | PASS | Existing housekeeping browser flow remains green through the maintenance surface; the only UI change explicitly sends the compatibility-preserving BLOCKING impact for the existing “create and block” action. | No new workflow redesign was introduced. |
| INV-RESP-001 | N/A | N/A | This wave adds no new responsive UI or contracted mobile journey. | Inherited browser evidence remains separately recorded; the shared Reports runner finding remains a promotion blocker. |
| INV-EVID-001 | APPLIES | PASS | This table maps each material claim to migration source, route source, unit tests, CF-I05 D1/API regression, CF-I06 regression or browser evidence; the Reports failure is recorded as shared/external rather than hidden. | Claims are not upgraded from API evidence to browser evidence. |
| INV-LEGACY-001 | APPLIES | PASS | CF-I05 legacy `MAINTENANCE` recovery asserts tenant-local room state, `reported_by_user_id`, resolver, `return_status=DIRTY` and exactly one resolve event; migration backfill is an explicit SQL CASE keyed to current room state. | Synthesized legacy recovery retains current actor/time/provenance. |
| INV-MONEY-001 | N/A | N/A | No invoice, payment, charge, amount or settlement mutation is in this wave. | D11/CF-I06 regression remains green. |
| INV-STATE-001 | APPLIES | PASS | This evidence is committed with the artifact candidate, followed by an orchestration-only boundary commit that records the exact artifact SHA, sets `external_review.required=true` and `resume_authorized=false`. | Non-circular publication is required; Codex does not self-approve the artifact. |
| INV-ORDER-001 | N/A | N/A | Maintenance impact does not rank or select operational queue items. | Housekeeping ordering remains inherited CF-I05 scope. |
| INV-CF-I07-001 | N/A | N/A | No admin, audit or network route is changed. | — |
| INV-CF-I07-002 | N/A | N/A | No role/plan mutation is changed. | — |
| INV-CF-I07-003 | N/A | N/A | No role downgrade operation is changed. | — |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/cf-i05-regression.sh` owns worker cleanup via trap and performs the existing terminal regression cleanup; the runner exits only after its worker is stopped. | Runner behavior is inherited and re-executed PASS. |
| INV-CF-I08-001 | N/A | N/A | Reports/analytics are explicitly outside this wave. | The shared Reports browser finding is not modified here. |
| INV-CF-I08-002 | N/A | N/A | No network analytics aggregation is changed. | — |
| INV-CF-I08-003 | N/A | N/A | No report date/state query is changed. | — |
| INV-CF-I08-004 | N/A | N/A | No reporting state predicate is changed. | — |
| INV-CF-I08-005 | N/A | N/A | No report default date or cross-surface report continuity is changed. | — |
| INV-SCOPE-001 | APPLIES | PASS | `git diff e0b8363..e40f28c` is limited to one forward migration, maintenance routes/capabilities/readiness, the existing housekeeping payload, regression fixture/assertions and typed maintenance model. No reassignment, Reports, Users, staging or deployment changes exist. | Next reassignment wave remains separate. |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Open maintenance | Room status update plus case insert guarded by room state and unique open-room index | Batch rolls back or post-batch event/case verification returns 409 | One `MAINTENANCE_OPEN` event only for the winning operation | CF-I05: NON_BLOCKING, BLOCKING, duplicate, OCCUPIED and invalid reason |
| Escalate | Room update and exact `OPEN`/`NON_BLOCKING` case update for the same room/case | Conflict; no successful escalation event | One `MAINTENANCE_ESCALATE` event on success | CF-I05: escalation changes AVAILABLE room to MAINTENANCE |
| Resolve | Exact open case plus room state transition; legacy MAINTENANCE recovery creates a tenant-local case in the same batch | Conflict/rollback; stale K1 cannot resolve current K2 | One `MAINTENANCE_RESOLVE` event on success; stale/invalid paths produce none | CF-I05: occupied resolve, legacy resolve, concurrent resolve, ABA and trigger rollback |

## Pre-Critic claim audit

| Claim | Evidence | Classification |
|---|---|---|
| V11 impact/state semantics are implemented | `0020_maintenance_impact.sql`, `housekeeping.ts`, CF-I05 exact API/D1 assertions | API-D1 + immutable source |
| Existing MAINTENANCE protection is not weakened | migration CASE maps open case whose current room is MAINTENANCE to BLOCKING; migration applies successfully in CF-I05/CF-I06 environments | immutable SQL + migration execution |
| Future reservations are not automatically moved | no booking mutation in the wave; only shared advance-sale predicate excludes BLOCKING rooms; diff/scope audit | static/domain |
| Tenant and capability boundaries fail closed | capability unit tests, routing/membership tests, CF-I05 denied requests and unchanged D1 state | unit + API-D1 |
| Housekeeping browser remains healthy | `CI_BROWSER_STANDARD=1 bash scripts/cf-i05-browser-regression.sh` reaches and passes housekeeping before shared Reports failure | integrated browser, partial gate |
| Global browser promotion is green | **Not claimed**; Reports/workerd finding remains open and external/shared | explicitly not proven |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN for the Wave 1.1a artifact scope.
- [x] Task Contract validation, targeted regression and full local foundation validation passed.
- [x] Scope audit passed; reassignment remains a separate wave.
- [x] Artifact A and orchestration-only boundary B use the non-circular publication protocol.
- [x] External review is required; Codex does not self-approve substantive PASS.
