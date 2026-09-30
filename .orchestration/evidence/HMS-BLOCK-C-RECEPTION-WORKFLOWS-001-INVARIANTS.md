# Block C invariant map

Classification is frozen before implementation. Every current registry invariant is listed; evidence is a required acceptance mapping, not a claim of implementation PASS yet.

| Invariant | Classification | Acceptance/evidence mapping |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | No optimistic lifecycle success; duplicates blocked; conflict/uncertainty reconciled with exact authoritative booking/account and D1 assertions. |
| INV-AUDIT-001 | APPLIES | UI reports success only after authoritative command result; executing-D1 checks exact event iff transition won. |
| INV-DOMAIN-001 | APPLIES | Existing reservation and lifecycle commands only; no generic CRUD or invented transition. |
| INV-TENANT-001 | APPLIES | All data from hotel-scoped existing APIs; local Worker/D1 test proves wrong-tenant/unauthorized path has zero effects where relevant. |
| INV-RBAC-001 | APPLIES | Server-owned capabilities control visibility; API guards authoritative; capability denial/refresh remains fail-closed and zero-write. |
| INV-PARITY-001 | APPLIES | Preserve F0.8, P0.1, F0.4/.5, F0.7 and approved C lifecycle/domain semantics; source parity contract and regression evidence. |
| INV-ENUM-001 | APPLIES | Preserve serialized status vs semantic state predicates for booking/room/readiness/maintenance. |
| INV-UX-001 | APPLIES | Every in-scope operation is a focused task from Booking/Stay Case and returns context. |
| INV-ORDER-001 | APPLIES | Queue lane/search/filter and accepted next-priority selection survive all tasks; deterministic Block B regression. |
| INV-RESP-001 | APPLIES | Execute every supported workflow at WIDE/COMPACT/NARROW and reduced-height/landscape; reachable controls and assertions. |
| INV-EVID-001 | APPLIES | Each claim points to exact test/API/Worker/D1/browser output; mocks and screenshots labeled as such; report response-loss limits. |
| INV-LEGACY-001 | N/A | No legacy migration/backfill or legacy record synthesis; F0.8 operation recovery is current command identity, covered by INV-ATOMIC/DOMAIN. |
| INV-MONEY-001 | APPLIES | Integer cents; no payment fabrication or whole-stay repricing; segmented remaining pricing and checkout ledger truth preserved. |
| INV-STATE-001 | APPLIES | Freeze substantive Artifact A then orchestration-only Boundary B, exact identity, non-circular handoff and separate Critic. |
| INV-CF-I07-001 | N/A | No protected admin/network/audit route or capability helper change. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No downgrade flow. |
| INV-CF-I07-004 | APPLIES | Integrated browser runners own and positively terminate Worker/Vite/browser processes before PASS. |
| INV-CF-I08-001 | N/A | No analytics arithmetic/report behavior. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No new status enum; no-show remains deferred. |
| INV-CF-I08-005 | N/A | No analytics/report date defaults. |
| INV-SCOPE-001 | APPLIES | Diff/route audit restricts changes to Reception transactional task UX, tests and evidence; C–H and unrelated modules remain untouched. |

At final Pre-Critic, applicable entries must be marked PASS with concrete evidence or artifact publication is blocked. N/A rationales remain bounded to this Task Contract.
