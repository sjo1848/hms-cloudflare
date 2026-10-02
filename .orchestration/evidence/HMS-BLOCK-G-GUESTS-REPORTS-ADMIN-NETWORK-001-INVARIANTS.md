# Block G Invariant Mapping

Task: `HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001`
Authorized base: `d9ff3325709633d7760dd236977b90f582b1b144`
Status at admission: all registry invariants classified; final evidence status remains `PENDING_IMPLEMENTATION` until implementation and validation.

| Invariant | Classification | Rationale / acceptance evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Membership, plan and guest writes; exact conditional winners and zero-row/conflict behavior proven against executing D1. |
| INV-AUDIT-001 | APPLIES | Admin role/deactivation/plan events must correspond iff authorized state mutation wins; exact event count tests. Guest create retains existing audit requirements where contract defines them. |
| INV-DOMAIN-001 | APPLIES | Membership and hotel administration remain explicit commands, not generic CRUD; report/guest reads do not mutate domain state. |
| INV-TENANT-001 | APPLIES | Guest/report/membership hotel scope and independent network scope; two tenant fixtures and zero-side-effect denied writes. |
| INV-RBAC-001 | APPLIES | Server capability checks are authoritative; positive auth context and denied writes are directly tested. |
| INV-PARITY-001 | APPLIES | Source CF-I07/CF-I08 semantics and guest context contracts must remain intact; no silent role/report/guest expansion. |
| INV-ENUM-001 | APPLIES | Booking status spellings and CANCELLED/NO_SHOW report predicates must retain source semantic mapping across API/UI. |
| INV-UX-001 | APPLIES | Guests/reports/admin/network are distinct shell workspaces; loading/error/empty/recovery and selected context are user-visible. |
| INV-ORDER-001 | N/A | No operational queue priority or next-item selection changes. Guest stays retain existing date order; evidence will assert current descending check-in ordering. |
| INV-RESP-001 | APPLIES | Every material Block G workflow executes WIDE/COMPACT/NARROW, reduced-height and mobile landscape with controls/keyboard/focus. |
| INV-EVID-001 | APPLIES | Each handoff claim maps to executable API/D1/browser/gate evidence; pending external staging smoke remains explicitly external. |
| INV-LEGACY-001 | N/A | No backfill, synthesized records or legacy recovery records are created. |
| INV-MONEY-001 | APPLIES | Revenue/report/network totals are integer cents and remain read-only; no financial mutation. Exact cents and zero-safe math tests. |
| INV-STATE-001 | APPLIES | Artifact A and orchestration-only Boundary B record exact non-circular SHAs before Independent Critic. |
| INV-CF-I07-001 | APPLIES | Protected hotel/network/admin routes must use centralized capability authority; static role-bypass scan and API denials. |
| INV-CF-I07-002 | APPLIES | Same-role/plan no-op rejects or explicit no-op with zero audit; executing-D1 state/audit assertions. |
| INV-CF-I07-003 | APPLIES | Same identity performs same protected action before and after downgrade; allowed before, denied after, no side effects. |
| INV-CF-I07-004 | APPLIES | Any browser/integration runner owns process cleanup and verifies no process remains before PASS. |
| INV-CF-I08-001 | APPLIES | Report/network arithmetic uses exact integer cents and zero denominator → zero; independent fixtures. |
| INV-CF-I08-002 | APPLIES | Network aggregation uses server allow-list, all active configured stores, exact totals/ranking, truthful unavailable error. |
| INV-CF-I08-003 | APPLIES | Date range boundaries and booking-state filters stay explicit; same-day, invalid, empty, cancellation/no-show fixtures. |
| INV-CF-I08-004 | APPLIES | Expanded NO_SHOW state predicates re-audited across analytics, reports, guest context where it affects classifications, and related visible outputs. |
| INV-CF-I08-005 | APPLIES | Report defaults derive from one captured hotel date per request; tests for omitted/start-only/end-only; UI date continuity tested. |
| INV-SCOPE-001 | APPLIES | G only; no F-cash/H/production/real data/staging or other roadmap scope; diff and authorization audit. |

Final Pre-Critic must replace `PENDING_IMPLEMENTATION` with concrete executable evidence for every applicable row; no `UNPROVEN` may remain at publication.
