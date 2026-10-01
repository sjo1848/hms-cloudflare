# Block E Bounded Repair — Invariant Mapping

Repair Contract: `.orchestration/contracts/HMS-BLOCK-E-REPAIR-READMODEL-UX-EVIDENCE-001.md`. Parent's complete 24-invariant classification remains binding; this table maps the repair-specific proof.

| Invariant | Applies? | Repair proof required |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Read model is read-only; existing exact-case/version D1 commands remain guarded. Existing duplicate/concurrent/stale K1→K2/ABA tests rerun. |
| INV-AUDIT-001 | APPLIES | History output is a projection of persisted exact event IDs/case IDs/actor/request/time; read creates no event; command event counts remain exact. |
| INV-DOMAIN-001 | APPLIES | Only existing HK/maintenance commands and impact values; no generic state path. Unit/API/browser checks prove selected transition and denied invalid action. |
| INV-TENANT-001 | APPLIES | Two active memberships and two independent local D1s with same entity IDs/different facts; board/history/risk isolation and write routing asserted on both DBs. |
| INV-RBAC-001 | APPLIES | Existing central capabilities; positive supported roles and a fully authenticated receptionist negative read/write path with exact unchanged business/event counts. |
| INV-PARITY-001 | APPLIES | Exact remaining-interval risk, state-preserving resolution, current 008/V11 impact semantics and source queue ranking. |
| INV-ENUM-001 | APPLIES | Both impact values, normalized booking status predicates and visible translated state semantics are covered. |
| INV-UX-001 | APPLIES | Case facts, event history, impact selector, risk, refresh/failure and context are visible and usable in browser. |
| INV-ORDER-001 | APPLIES | Independent known-ID fixture proves queue priority and stable order/next task. |
| INV-RESP-001 | APPLIES | Executed browser at wide/compact/narrow/reduced-height/landscape; keyboard trap/escape/restore and critical controls reachable. |
| INV-EVID-001 | APPLIES | Every result claim ties to named test/log/URL/DB assertion/build metric; reviewers' concerns are dispositioned. |
| INV-LEGACY-001 | APPLIES | Existing legacy maintenance resolution test remains green with actor/hotel/time/reason and durable case/event. |
| INV-MONEY-001 | N/A | No money operation. |
| INV-STATE-001 | APPLIES | Final substantive Artifact A → orchestration-only Boundary B with exact SHA, then separate Critic and closure. |
| INV-CF-I07-001 | N/A | No admin/audit/network route. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Browser/API runners verify their owned process groups are gone before PASS. |
| INV-CF-I08-001 | N/A | No analytics/reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No reports. |
| INV-CF-I08-004 | APPLIES | CONFIRMED vs CHECKED_IN/CANCELLED and stay interval predicates are asserted against D1 and visible queue/context. |
| INV-CF-I08-005 | N/A | No reporting-date semantics; board date is already an explicit request parameter. |
| INV-SCOPE-001 | APPLIES | Exact diff audit shows only Block E surfaces, tests, evidence and authorized JS raw checker limit; no F–H or forbidden operation. |

All APPLIES statuses stay `PENDING` until executable evidence is complete.
