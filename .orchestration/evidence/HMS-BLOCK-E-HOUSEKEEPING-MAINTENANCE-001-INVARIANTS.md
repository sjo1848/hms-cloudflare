# Block E — Invariant Classification (Pre-code)

All 24 entries in `.orchestration/INVARIANTS.md` classified before product code. Task Contract: `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`. Status is pending final evidence unless N/A.

| Invariant | Applies? | Rationale / required proof |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Conditional room/case/event mutations; exact zero-row conflict and rollback, duplicate, stale-case replacement and ABA D1 assertions. |
| INV-AUDIT-001 | APPLIES | HK/maintenance events exist exactly iff winning mutation; actor/hotel/request/time, exact case correlation and zero event on failure. |
| INV-DOMAIN-001 | APPLIES | Only current explicit HK/maintenance commands; invalid transitions and generic CRUD bypass denied. |
| INV-TENANT-001 | APPLIES | All board/history/booking risk and writes use authenticated operational D1; real second-tenant denial/zero drift. |
| INV-RBAC-001 | APPLIES | Existing canonical server capabilities on reads and writes; seeded identity and membership proves denied write, no side effects. |
| INV-PARITY-001 | APPLIES | Source J-06.1–J-06.12 plus Block E/008 state, booking-risk and no-auto-move semantics. |
| INV-ENUM-001 | APPLIES | Source/target booking state normalization and canonical room/case/event enum meaning tested end to end. |
| INV-UX-001 | APPLIES | Queue, priority, next-task, focused task, validation, success/conflict and context remain operationally usable at contracted widths. |
| INV-ORDER-001 | APPLIES | Deterministic independent fixture verifies exact rank/next selected item, semantic status and tiebreak. |
| INV-RESP-001 | APPLIES | Executes task controls at wide/compact/narrow/reduced-height/landscape, keyboard and focus; no screenshot-only claim. |
| INV-EVID-001 | APPLIES | Every results claim names exact API/D1/test/browser/build artifact; no overclaim. |
| INV-LEGACY-001 | APPLIES | Explicit legacy maintenance recovery retains authenticated actor, hotel/time/provenance and durable case/event; never infer READY. |
| INV-MONEY-001 | N/A | No amounts, invoice, payment, settlement or finance mutation is in scope. |
| INV-STATE-001 | APPLIES | Immutable substantive Artifact A followed by orchestration-only Boundary B exact SHA; critic pair and closure references reconciled. |
| INV-CF-I07-001 | N/A | No admin/audit/network protected route is changed; existing audit read endpoint remains untouched. |
| INV-CF-I07-002 | N/A | No role/plan mutation is in scope. |
| INV-CF-I07-003 | N/A | No role downgrade is in scope. |
| INV-CF-I07-004 | APPLIES | Any runner starting Worker/Vite/browser owns and verifies full process cleanup before PASS. |
| INV-CF-I08-001 | N/A | No analytics/reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state predicates. Housekeeping board date remains its existing workflow parameter. |
| INV-CF-I08-004 | APPLIES | Booking target serialized state is normalized consistently before risk/order predicate; CHECKED_IN/CONFIRMED negative fixture. |
| INV-CF-I08-005 | N/A | No report date default or reporting cross-surface flow. |
| INV-SCOPE-001 | APPLIES | Diff and route audit exclude Blocks B/C/D/F–H, Finance, new state/contracts/schema/capabilities, production and real data. |

## Final evidence status

All applicable invariants passed before Artifact A. `N/A` rows remain outside the Block E surface.

| Invariant | Final status | Evidence |
|---|---|---|
| INV-ATOMIC-001 | PASS | `npm run test:cf-i05`: duplicate open returns 409 without room/version/case/event drift; concurrent resolve returns exactly one 200 and one 409 with one durable resolve event; stale K1/K2 and ABA assertions pass. D1 event SQL independently guards the exact room version, case identity/state and one event per room/type/version. |
| INV-AUDIT-001 | PASS | Same executing-D1 run asserts exact winner event count, actor, hotel, request ID, event type and case identity; duplicate and race loser produce no extra audit event. |
| INV-DOMAIN-001 | PASS | Existing Housekeeping command routes only; invalid source, duplicate, stale and unauthorized transitions reject. `rg 'createHousekeepingRoutes\\(' apps/api/src/index.ts` confirms a single `/api/v1` mount; no generic room mutation added. |
| INV-TENANT-001 | PASS | `npm run test:cf-i05` uses two independent local D1s with same IDs/different facts; Hotel B Worker mutation leaves Hotel A unchanged; cross-tenant and inactive membership deny without drift. |
| INV-RBAC-001 | PASS | Executing Worker/D1 regression asserts authorized housekeeping access and receptionist denial for protected actions with zero state/event drift; UI controls remain capability-driven. |
| INV-PARITY-001 | PASS | Frozen Task Contract E-01..E-14; CF-I05 fixtures prove existing source ordering, risk, no-auto-move, state-preserving resolution and invalid-action semantics. |
| INV-ENUM-001 | PASS | API + browser assert canonical `CONFIRMED` / `CHECKED_IN` target serialization, priority ordering, and negative cases for advisory/expired/cancelled bookings. |
| INV-UX-001 | PASS | Integrated browser asserts labels, queue ordering, focused task, validation, success, error/retry, selection/filter/search continuity and per-room draft isolation. |
| INV-ORDER-001 | PASS | API and browser use exact independent room IDs to verify risk/task priority and deterministic queue order (room 904 ahead of natural-number room 901). |
| INV-RESP-001 | PASS | `npm run test:cf-i05-browser` executes controls and asserts zero horizontal overflow at 1366×900, 1280×600, 900×700, 390×844, 320×700 and 844×390; keyboard focus wrap, Escape and restore pass. |
| INV-EVID-001 | PASS | This final record identifies exact commands, counts, outputs and limitations; browser screenshot is supplemental, not the acceptance proof. |
| INV-LEGACY-001 | PASS | CF-I05 D1 assertions prove attributed durable legacy case/event, resolved state, room transition and no inferred readiness. |
| INV-MONEY-001 | N/A | No financial data, amounts or mutations are changed by Block E. |
| INV-STATE-001 | PASS | Artifact A is the substantive implementation/evidence checkpoint; Boundary B is orchestration/evidence-only and identifies exact A; the fresh Independent Critic reviews the exact pair. |
| INV-CF-I07-001 | N/A | No protected admin/audit/network route changed. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | PASS | CF-I05 API/browser runners assert owned Wrangler/Vite/Playwright process cleanup before successful exit. |
| INV-CF-I08-001 | N/A | No analytics/reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state predicate changed. |
| INV-CF-I08-004 | PASS | Executing-D1 + browser fixtures assert target `CHECKED_IN`/`CONFIRMED` semantics and corresponding positive/negative queue/risk behavior. |
| INV-CF-I08-005 | N/A | No reporting date default or cross-surface report flow changed. |
| INV-SCOPE-001 | PASS | Scope audit: implementation changes only Housekeeping UI/API, i18n, focused CF-I05 tests/runners and invariant evidence; no schema, migration, capabilities, lifecycle, finance, Blocks F–H, promotion or real data. |

Artifact A is eligible for the mandatory fresh Independent Critic. No applicable invariant remains `UNPROVEN`.
