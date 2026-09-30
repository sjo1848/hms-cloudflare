# HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001 — Invariant Classification

Candidate Artifact: pre-code contract package at base `044ad756b0081d2a54083ea89c782557e97a351f`  
Task Contract: `.orchestration/contracts/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001.md`  
Classification/evidence mapping frozen before product code; PASS is reserved for final Pre-Critic after implementation.

| Invariant | Applies? | Contract obligation / final evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Hold create/edit are conditional on exact room/hold and interval non-overlap, use server RETURNING winner; stale/overlap D1 and browser conflict prove zero unintended rows. Room metadata edit is not a lifecycle transition. |
| INV-AUDIT-001 | N/A | Existing room metadata/hold routes define no event/audit write contract; Block D adds no risk-event or audit mutation. If source inspection finds events are required, do not invent them: classify blocker. |
| INV-DOMAIN-001 | APPLIES | No generic room status/state update. Source/diff audit plus attempts to submit lifecycle dimensions through metadata API remain rejected/ignored by existing validation; no Housekeeping/Maintenance commands appear in Rooms. |
| INV-TENANT-001 | APPLIES | Existing binding/membership selects operational D1; worker tests for two hotels and foreign IDs/holds show denial/no cross-tenant reads or drift. |
| INV-RBAC-001 | APPLIES | Server `rooms.*`, `bookings.read`, `guests.read`, `maintenance.read` remain authority; test permitted and denied request per relevant reads/writes, controls refresh on capability change. |
| INV-PARITY-001 | APPLIES | Source room workflows/state meanings and holds types/ranges mapped into unchanged APIs; positive/negative dimension, interval and hold cases. |
| INV-ENUM-001 | APPLIES | Assert exact API serialized Occupancy/HK/Maintenance/Service/readiness/sellability values across D1→API→UI; unknown/legacy values render UNRESOLVED and never map by label. |
| INV-UX-001 | APPLIES | Existing Rooms workflow before/after map plus real browser inspection/search/select/hold/metadata; no silent Housekeeping or Maintenance redesign. |
| INV-ORDER-001 | N/A | No queue priority or next-item policy is defined for the Rooms inventory board; preserve deterministic existing numeric `room_number` ordering and do not add ranking. |
| INV-RESP-001 | APPLIES | Run material room selection, hold and available filter actions at every contracted width; screenshots are not sufficient. |
| INV-EVID-001 | APPLIES | Claims tied to exact test IDs, Worker/D1 logs and browser assertions; label mocks; distinguish existing C evidence from fresh D evidence. |
| INV-LEGACY-001 | APPLIES | Legacy `rooms.status`, unknown nulls, contradictory dimensions and unmatched maintenance fail closed; no legacy inference to READY/SELLABLE. Assert unresolved fixtures. |
| INV-MONEY-001 | APPLIES | Room rate remains a nonnegative safe integer in cents; API form boundary and round-trip test; no float formatting or financial mutation. |
| INV-STATE-001 | APPLIES | Freeze this contract before code; final substantive Artifact A before evidence/orchestration Boundary B; exact head/status checks; separate Critic; reconcile closure metadata after verdict. |
| INV-CF-I07-001 | APPLIES | UI reads App Shell capability context only; API uses central `hasCapability`; architecture/source scan proves no role-name bypass. |
| INV-CF-I07-002 | N/A | No admin/network role or event/audit mutation is introduced; current room/hold routes have no semantic audit no-op contract. |
| INV-CF-I07-003 | N/A | No role/plan downgrade operation is part of Room workflows. Capability refresh is UI visibility only and has separate authorization tests. |
| INV-CF-I07-004 | APPLIES | Every integrated Worker/Vite/browser runner owns and proves process-tree cleanup before PASS. |
| INV-CF-I08-001 | N/A | No report arithmetic/KPI/denominator is implemented; rates are treated under INV-MONEY-001. |
| INV-CF-I08-002 | N/A | No network aggregation or cross-hotel summary. Tenant data stays one selected hotel D1. |
| INV-CF-I08-003 | N/A | No report semantics or report date aggregation. User-selected range is covered under INV-CF-I08-005 and D-03. |
| INV-CF-I08-004 | APPLIES | Room state filters and predicates consume canonical target enums; explicit cross-layer tests prove `OCCUPIED`, `DIRTY`, `BLOCKING`, `OUT_OF_ORDER`, and `UNRESOLVED` are not mistaken for source/legacy spellings. |
| INV-CF-I08-005 | APPLIES | Explicit user-supplied ISO `[start,end)` avoids browser-clock defaults; equality/edge behavior is deterministic. Query, selection, reload and Back/Forward continuity are browser-tested. |
| INV-SCOPE-001 | APPLIES | Diff audit limited to Block D Room workspace, its read model/tests/i18n/browser evidence and orchestration; no E–H workflows or real data. |

All 24 registry entries are classified. The final invariant evidence replaces the candidate artifact reference with Artifact A and marks applicable rows PASS only after executable evidence exists.
