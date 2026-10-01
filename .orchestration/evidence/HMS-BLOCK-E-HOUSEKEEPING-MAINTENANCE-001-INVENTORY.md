# Block E — Exact Surface and Contract Inventory

Frozen before product code at base `3f06c7b52b8c5f57754e705071b7cee6a5668d05`. Task Contract: `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`.

## Product surfaces

| Surface | Exact implementation | Current behavior / contract |
|---|---|---|
| Housekeeping workspace | `apps/web/src/features/housekeeping/HousekeepingPage.tsx` | Search/date/refresh/status counters; ranked room queue; selected room; inline clean/report/resolve controls; departure and open-case summary; mobile focused task. |
| Workspace state | `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts` | Board load, request id stale guard, queue/filter/selection, per-room drafts, action→authoritative reload, next actionable task, mobile focus/return. |
| Queue/domain presentation | `apps/web/src/features/housekeeping/model.ts` | Legacy room-status mapping, semantic booking status normalization, priority rank, checked-in departure blocker, orphan departure, filtering and deterministic room-number tiebreak. |
| API client/types | `apps/web/src/features/housekeeping/housekeeping-api.ts`, `model.ts` | Existing board GET and typed POST helper; current response includes rooms/departures/open maintenance case. |
| Workspace styles | `apps/web/src/features/housekeeping/housekeeping-operational.css` | Queue filter controls, capability-aware control hiding, shared shell responsive behavior. |
| Translation | `apps/web/src/i18n/` Housekeeping keys in locale catalogs/generated types | Housekeeping/status/priority labels and accessible names. Exact changed catalogs are determined by use of existing key coverage; no untranslated hardcoded user text. |
| API route | `apps/api/src/routes/housekeeping.ts` | Existing list/board/open case reads; guarded cleaning start/finish; open/escalate/resolve maintenance and legacy resolve; D1 batch/event guards. |
| Capability authority | `apps/api/src/auth/capabilities.ts` | admin/ops/housekeeping: HK read/write and maintenance read/report/resolve; receptionist: maintenance read/report but no HK write or resolve; `saas_admin` has no tenant maintenance authority. Do not change. |
| Room read model | `apps/api/src/modules/room-state/domain.ts` and Housekeeping route mapper | Canonical dimensions/readiness; legacy status remains compatibility only. |
| Durable facts | `rooms`, `maintenance_cases`, `housekeeping_events`, `bookings`; `0009_housekeeping_maintenance.sql`, `0020_maintenance_impact.sql`, Foundation room-state migrations | One open maintenance case per room; event actor/request/hotel/time; existing versioned conditional writes. No new migration. |
| Existing regression/evidence | `scripts/cf-i05-regression.sh`, `scripts/cf-i05-browser-regression.sh`, `scripts/cf-i05-browser-regression.playwright.js`, Housekeeping API/unit tests, `apps/api/src/auth/capabilities.test.ts` | Synthetic D1/API and integrated browser workflows exist; rerun current code and do not rely on historical pass alone. |

## API/capability matrix

| Method/path | Capability | Existing meaning |
|---|---|---|
| GET `/api/v1/housekeeping/dirty` | `housekeeping.read` | DIRTY/CLEANING rooms. |
| GET `/api/v1/housekeeping/board?date=` | `housekeeping.read` | Eligible rooms, departure context, open cases. Contract permits additive, bounded same-tenant history and confirmed-booking risk facts only. |
| GET `/api/v1/housekeeping/:id/maintenance` | `maintenance.read` | Exact room's open case. |
| POST `/api/v1/housekeeping/:id/start` | `housekeeping.write` | Guarded DIRTY→CLEANING. |
| POST `/api/v1/housekeeping/:id/finish` | `housekeeping.write` | Guarded CLEANING→READY/compatible physical status. |
| POST `/api/v1/housekeeping/:id/maintenance` | `maintenance.report` | Open one case with existing impact/priority/reason/assignee validation. |
| POST `.../:case_id/escalate` | `maintenance.report` | Existing NON_BLOCKING→BLOCKING transition. |
| POST `.../:case_id/resolve` | `maintenance.resolve` | Resolve exact open case preserving existing room dimensions. |
| POST `/api/v1/housekeeping/:id/dirty` | `maintenance.resolve` | Existing explicit resolve/legacy recovery to DIRTY. |

## Source/domain workflows

1. discover/rank eligible cleaning tasks and departures;
2. select room/case and inspect physical state/impact/booking risk/history;
3. start or finish cleaning with authoritative guarded write;
4. report maintenance with current impact/priority/reason/owner rules;
5. escalate existing advisory case under current one-way semantics;
6. resolve exact case and return room to state determined by existing domain rule;
7. refresh after success/conflict, retaining safe selected context and per-case draft isolation.

No new action is introduced by this inventory. Browser confirms each included action remains capability-visible and server-authorized.
