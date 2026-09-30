# HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001 — Invariant Evidence

Artifact candidate: substantive Block D change set at base `044ad756b0081d2a54083ea89c782557e97a351f` (exact Artifact A SHA will be recorded by Boundary B)
Task Contract: `.orchestration/contracts/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Result evidence: `.orchestration/evidence/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001-RESULTS.md`

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Room/hold conditional and interval-conflict cases in `room-state-route.executing-d1.test.ts`; hold success, overlap 409, stale edit and zero unintended writes; metadata is not lifecycle. | No new mutation contract. |
| INV-AUDIT-001 | N/A | N/A | Frozen API inventory and route diff. | Existing room metadata/hold commands define no event/audit write contract; Block D adds no risk event. |
| INV-DOMAIN-001 | APPLIES | PASS | Room create/edit validation and round-trip tests; four independent dimensions; no housekeeping/maintenance write controls or route calls in `RoomsPage.tsx`. | No scalar lifecycle mutation. |
| INV-TENANT-001 | APPLIES | PASS | Executing-D1 room route test creates two hotel D1s and verifies each room projection stays inside its selected hotel; foreign room/hold cases deny/no drift. | Existing binding/membership path retained. |
| INV-RBAC-001 | APPLIES | PASS | Central `hasCapability` in inventory routes; authenticated room-read denial, hold/metadata denied write zero drift; test-only active `rooms.read`-without-search membership proves base GET 200 and ranged GET 403; capability-aware controls and range omission on UI downgrade. | Temporary test capability mapping is removed in `afterEach`; production role matrix is unchanged. |
| INV-PARITY-001 | APPLIES | PASS | Frozen source/workflow inventory, unchanged canonical dimensions/holds, interval predicate and range/hold boundaries in executing-D1 assertions. | No new domain semantics. |
| INV-ENUM-001 | APPLIES | PASS | D1/API assertions cover VACANT, READY, BLOCKING/NON_BLOCKING, service, derived readiness and unresolved; UI has explicit UNKNOWN/UNRESOLVED filtering and rendering. | No legacy label maps unknown state to ready. |
| INV-UX-001 | APPLIES | PASS | Browser case/board, filters, selected-room context, bookings link, capability profile and Block E affordance audit recorded in Results. | Existing workflows remain in scope only as compatible links/read surfaces. |
| INV-ORDER-001 | N/A | N/A | Inventory query and UI preserve room number order. | No queue priority or next-item policy exists on the Rooms inventory board. |
| INV-RESP-001 | APPLIES | PASS | Live Playwright checks at WIDE, COMPACT, NARROW, reduced-height and landscape; no horizontal overflow; narrow case-only navigation and landscape detail internal scrolling documented in Results. | Checks execute at contracted dimensions. |
| INV-EVID-001 | APPLIES | PASS | Results record maps each validation claim to exact suite/command/browser assertions and labels integrated/API-D1/browser evidence. | Screenshots alone are not used as PASS evidence. |
| INV-LEGACY-001 | APPLIES | PASS | D1 read model tests retain unresolved/null and legacy maintenance as unresolved; interval fails closed for unknown service/maintenance; no `rooms.status` readiness inference. | Explicit unresolved filter added. |
| INV-MONEY-001 | APPLIES | PASS | Room rate validation rejects negative/non-safe values and preserves integer cents across metadata writes. | No financial mutation or float money arithmetic. |
| INV-STATE-001 | APPLIES | PASS | Frozen pre-code contract package at commit `b6a2426512b5224fdf2385214701715417c855db`; final Artifact A precedes orchestration-only Boundary B; exact SHAs to be persisted at B. | This evidence does not claim Independent Critic approval. |
| INV-CF-I07-001 | APPLIES | PASS | UI derives controls only from App Shell `CapabilitiesContext`; API imports centralized `hasCapability`; architecture fitness passes. | No local role-name authorization map. |
| INV-CF-I07-002 | N/A | N/A | Diff and route inventory. | No admin/network or event/audit mutation. |
| INV-CF-I07-003 | N/A | N/A | Diff and frozen inventory. | No role/plan downgrade operation is introduced. |
| INV-CF-I07-004 | APPLIES | PASS | Full serial Vitest suite and local Wrangler/Vite runtime; runners completed successfully. | No background runner is claimed as a completed test result. |
| INV-CF-I08-001 | N/A | N/A | Scope diff. | No reporting/KPI arithmetic. |
| INV-CF-I08-002 | N/A | N/A | Tenant D1 route tests. | No network aggregation; each selected hotel reads its own D1. |
| INV-CF-I08-003 | N/A | N/A | Scope diff. | No report date aggregation. |
| INV-CF-I08-004 | APPLIES | PASS | Room API tests and board exercise canonical OCCUPIED/READY/DIRTY/BLOCKING/OUT_OF_ORDER/UNKNOWN values without treating legacy spellings as canonical. | UNKNOWN remains distinguishable. |
| INV-CF-I08-005 | APPLIES | PASS | Explicit ISO `[start,end)` boundary/invalid/hold/inventory tests; URL filters, deep link/reload, browser history and range context assertions in Results. | No browser-clock default range. |
| INV-SCOPE-001 | APPLIES | PASS | `git diff --name-status` scope audit and frozen Task Contract; no migration, Block E workflow, or real-data operation. | Blocks E–H remain unauthorized. |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Create room metadata | Existing `POST /rooms`, unique room-number constraint and validated integer-cent rate. | Conflict/validation error; no malformed room is accepted. | No event contract in existing route. | Executing-D1 creates once, duplicate 409, negative rate 400. |
| Edit room metadata | Existing `PATCH /rooms/:id`, limited to number/type/rate. | Not found/conflict/error; dimension/version fields do not change. | No event contract in existing route. | D1 test verifies changed metadata with operational dimensions/version preserved and invalid rate zero drift. |
| Create hold | Existing conditional hold insert / conflict guard for exact room and half-open interval. | Overlap returns 409 with no extra hold. | Existing command has no new audit event contract. | D1 overlap 409 and success plus browser synthetic CRUD evidence. |
| Edit hold | Existing conditional update for exact hold/room and interval. | Stale/missing/overlap returns conflict/not found, no unintended row changes. | Existing command has no new audit event contract. | D1 stale/conflict and successful edit assertion. |
| Delete hold | Existing delete for exact room/hold identity. | Missing row is not reported as a successful different hold mutation. | Existing command has no new audit event contract. | D1 delete then query verifies absence. |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Canonical dimensions/readiness and interval sellability are derived independently | `room-state-route.executing-d1.test.ts`; `domain.test.ts`; `inventory.ts`; `domain.ts` | API-D1 + unit + static |
| Tenant and capabilities remain authoritative | executing-D1 route suite, `auth/capabilities.test.ts`, route centralized guard inspection | API-D1 + unit + static |
| Responsive board/case and continuity work | Results viewport/history/focus assertions | integrated browser |
| No Block E workflow is exposed | Browser capability surface and source diff audit | integrated browser + static |
| Current bundle is within unchanged budgets | architecture fitness output and build asset measurements in Results | production build + gate |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Full Task Contract validation passed for the authorized local synthetic Block D increment.
- [x] Scope audit passed.
- [x] Artifact A must be followed by exact orchestration-only Boundary B.
- [x] External review is required; Codex does not self-approve substantive PASS.
