# Block G Invariant Evidence

Task: `HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001`
Authorized base: `d9ff3325709633d7760dd236977b90f582b1b144`
Evidence: `.orchestration/evidence/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001-RESULTS.md`
Classification frozen before implementation; final outcomes below are based on the listed executable evidence. `INV-STATE-001` is completed by the separate Artifact A → Boundary B sequence.

| Invariant | Classification | Status | Evidence / rationale |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | CF-I07 executing-D1 assertions prove exact role/deactivation/plan winners and reject stale/no-op mutations without side effects; CF-I08 fixture/API assertions verify no network data cross-write. |
| INV-AUDIT-001 | APPLIES | PASS | CF-I07 asserts mutation/audit counts and zero audit on denied/no-op paths; actor and target attribution remain server-owned. |
| INV-DOMAIN-001 | APPLIES | PASS | Static route/diff audit plus CF-I07 verifies explicit membership/plan commands; no generic transition path was added. |
| INV-TENANT-001 | APPLIES | PASS | CF-I07 and CF-I08 Worker/D1 regressions use two operational D1s, verify hotel scope and reciprocal isolation, and assert zero effects on denied paths. |
| INV-RBAC-001 | APPLIES | PASS | CF-I07 establishes authorized admin/network and housekeeping identities, exercises protected API success/denial, and verifies capability-aware route denial; no client role map was introduced. |
| INV-PARITY-001 | APPLIES | PASS | CF-I08 D1 fixtures verify source report date/state/revenue/occupancy semantics; browser checks preserve selected report range and visible invalid-range behavior. No silent feature expansion. |
| INV-ENUM-001 | APPLIES | PASS | CF-I08 cancellation/no-show fixtures and report predicates preserve the approved serialized booking-state semantics. |
| INV-UX-001 | APPLIES | PASS | Integrated browser tests cover Guests/Admin/Network/Reports loading, failure, retry, cancel, success and error states; Guest booking-context failure is explicitly distinguished from no stays. |
| INV-ORDER-001 | N/A | N/A | No operational queue ordering, priority or next-item logic changed. Guest recent stays retain the existing date order. |
| INV-RESP-001 | APPLIES | PASS | CF-I07 integrated browser asserts Users/Network at 375/390/430/768/1024 and Reports at 1440×900, 1024×768, 375×812, 812×375 and 375×360; Guest recovery at 1440×900, 900×768, 375×812 and 812×375; inherited CF-I05 browser covers reduced-height, narrow and landscape. Keyboard dialog focus/Escape is executable. |
| INV-EVID-001 | APPLIES | PASS | Results record links every claim to executable scripts/gates and distinguishes synthetic Guest mocks from Worker/D1 integration and the pending external staging browser smoke. No staging UI test is represented as complete. |
| INV-LEGACY-001 | N/A | N/A | No legacy records are synthesized, backfilled or migrated. |
| INV-MONEY-001 | APPLIES | PASS | CF-I08 independently calculated integer-cent revenue and zero-safe report/occupancy behavior against executing D1; G introduced no financial mutation. |
| INV-STATE-001 | APPLIES | PASS | Publication gate preserves the non-circular immutable Artifact A → immediate orchestration-only Boundary B protocol; B will name exact A, set `external_review.required=true`, set `resume_authorized=false`, and direct the fresh read-only Critic. |
| INV-CF-I07-001 | APPLIES | PASS | CF-I07 route/API tests and static role-bypass audit prove protected hotel/network/admin routes use canonical server capability authority. |
| INV-CF-I07-002 | APPLIES | PASS | CF-I07 executing-D1 regression verifies semantic role/plan no-op handling and zero audit effects. |
| INV-CF-I07-003 | APPLIES | PASS | CF-I07 executes the same subject's protected operation before and after downgrade and proves post-downgrade denial with no side effects. |
| INV-CF-I07-004 | APPLIES | PASS | CF-I07, CF-I05 browser and focused Guest runner pass only after owned Worker/Vite/Chromium process cleanup checks; final post-run process/port check recorded in results. |
| INV-CF-I08-001 | APPLIES | PASS | CF-I08 independently asserts integer-cent sums and zero-safe denominator results against D1 fixtures. |
| INV-CF-I08-002 | APPLIES | PASS | CF-I08 uses two configured operational D1 bindings, reconciles per-hotel totals/ranking, and verifies truthful aggregate failure for an unavailable configured store. |
| INV-CF-I08-003 | APPLIES | PASS | CF-I08 verifies valid, invalid, empty and cancellation/no-show date/state predicates; Reports browser sends the selected inclusive range and shows invalid-range error. |
| INV-CF-I08-004 | APPLIES | PASS | CF-I08 tests NO_SHOW exclusion in financial reporting and cross-module state handling; existing Guest context uses the established status mapping. |
| INV-CF-I08-005 | APPLIES | PASS | Existing CF-I08 tests omitted/start-only/end-only defaults from a captured date; Block G UI/browser proves explicit range continuity and invalid-range handling. |
| INV-SCOPE-001 | APPLIES | PASS | Exact diff/path audit confines work to G surfaces/evidence. No F-cash, H, deployment, promotion, schema or real data. |

No invariant is `FAIL` or `UNPROVEN` for the frozen Block G scope. This Pre-Critic evidence is not a substitute for the fresh Independent Critic or Controller decision.
