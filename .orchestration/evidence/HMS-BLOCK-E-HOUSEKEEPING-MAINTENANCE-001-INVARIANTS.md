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

To be completed before Artifact A; every APPLIES row must be `PASS` with concrete evidence. Any applicable `UNPROVEN` blocks publication.
