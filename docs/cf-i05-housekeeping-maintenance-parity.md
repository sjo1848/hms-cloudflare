# CF-I05 Housekeeping + Maintenance — Parity Matrix

Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`  
Target increment: `CF-I05`  
Contract: `.orchestration/contracts/CF-I05.md`

This matrix is the wave's implementation and self-critic checklist. The source HMS remains read-only reference.

| ID | Source evidence | Preserved target behavior | Validation evidence |
|---|---|---|---|
| J-06.1 | `housekeeping_service.rs::list_dirty_rooms`; `GET /housekeeping/dirty` | Dirty and in-progress rooms appear in the housekeeping queue with tenant-local room data | D1/API + browser |
| J-06.2 | `housekeeping_service.rs::get_board`; `HousekeepingPage`; `housekeepingQueue.ts` | Board includes eligible room statuses, turnover/departure context and open maintenance case context | API response assertions + browser |
| J-06.3 | `RoomStatus::can_transition_to`; `start_cleaning` | `DIRTY → CLEANING`, actor/request trace, invalid transition rejection | SQL/API regression |
| J-06.4 | `RoomStatus::can_transition_to`; `finish_cleaning` | `CLEANING → AVAILABLE`, actor/request trace, invalid transition rejection | SQL/API regression |
| J-06.5 | `MaintenanceService::open`; `MaintenanceCaseActions` | Reason 6–250, assignee 2–100, priority enum, one open case, room `MAINTENANCE`, reporter/time | API/UI validation + D1 |
| J-06.6 | `MaintenanceService::resolve`; `return_to_dirty` | Resolution note 6–250, resolver/time, exact case correlation, case `RESOLVED`, return `DIRTY` | API/UI + D1 + ABA |
| J-06.7 | `maintenance_workflow.rs` | Open/resolve operations are atomic; failed preconditions preserve room and case | adversarial D1 regression |
| J-06.8 | `maintenance_workflow.rs` legacy path | Existing maintenance room can be explicitly resolved with synthesized durable case | D1/API regression |
| J-06.9 | source RBAC canon | `admin`, `ops`, `housekeeping` may read/write; receptionist cannot | role/tenant security regression |
| J-06.10 | source audit service and P-17 | Each mutation retains actor, hotel, request ID and timestamp | D1 event assertions |
| J-06.11 | source housekeeping workspace + J-11 | `/housekeeping` action flow remains usable at 375/390/430/768/1024 | Playwright journey and screenshots |

## Explicit non-scope

CF-I05 does not implement billing, financial settlement, user/RBAC administration, hotel/network administration, reports, data migration, production deployment, paid resources or Product Acceptance.

## Executed evidence

The accelerated wave was validated as one coherent increment:

- `npm run check`: 16 existing API/auth/routing tests passed.
- `npm run web:build`: production Vite build passed (29 modules).
- `npm run test:cf-i03`: lifecycle D1/API regression passed.
- `npm run test:cf-i04`: lifecycle D1/API regression passed.
- `npm run test:cf-i05`: Housekeeping + Maintenance D1/API regression passed.
- `npm run test:cf-i05-browser`: committed integrated API+D1+Vite browser harness passed.
- `scripts/cf-i05-browser-regression.playwright.js`: reproducible Playwright journey for queue selection, `Siguiente tarea` mobile focus/open/close, Start cleaning, Finish cleaning, maintenance open/resolve, validation states, per-room draft isolation and per-width control interaction.
- `output/playwright/cf-i05-integrated-housekeeping.png`: diagnostic focused queue/workspace screenshot from the integrated run.
- Browser assertions confirmed `document.documentElement.scrollWidth === window.innerWidth` at 375/390/430/768/1024px, mobile focused-task dialog entry/close at 375/390/430, desktop workspace at 768/1024, real local API success for all four domain mutations, client-side blocking of short reason/resolution values, room-A draft isolation from room-B and room-A draft retention/reset semantics.

Adversarial coverage includes deterministic stale start/finish/resolve races with exact `200,409` outcomes and one event each, a K1-resolved → K2-open → stale-K1 resolve attempt proving MAINTENANCE/K2 OPEN/no stale event, invalid status transitions, short reason/resolution validation, duplicate open maintenance rejection, trigger-backed rollback, receptionist read/write denial, missing-room 404, actor/request/hotel event traceability, and legacy maintenance resolution through the explicit Dirty return path.

## Self-critic checklist

- [x] Source Housekeeping states and Maintenance workflow are represented without silent product expansion.
- [x] Backend authorization remains authoritative; receptionist is denied for both read and write.
- [x] Tenant selection remains control-plane membership plus the selected operational D1.
- [x] Room status changes and maintenance case/event writes are transactionally coupled to the exact case mutation; ABA re-entry cannot resolve a stale case.
- [x] Open maintenance is unique per room and resolution returns the room to Dirty.
- [x] API typed error/status behavior is preserved for invalid, conflicting, and missing-room operations.
- [x] UI preserves queue → selected room → focused workspace, mobile next-task behavior, board context, filters, actions and per-room maintenance drafts.
- [x] Integrated browser evidence is committed and its claims are backed by real local API/D1 responses; mocks are not used for the domain journey.
- [x] No CF-I06 scope, paid service, production cutover, or Human Gate decision was introduced.
