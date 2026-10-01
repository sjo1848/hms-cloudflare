# HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001 — Invariant Evidence

Artifact candidate: pending inclusion in immutable Block F Artifact A.
Task Contract: `.orchestration/contracts/HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001.md`
Pre-Critic gate: `.orchestration/evidence/HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001-PRECRITIC.md`

This bounded repair changes only the browser regression's wait predicate. All registry invariants are classified for this increment.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No business mutation or transaction code changed. Parent CF-I06 D1 regression remains passing. | |
| INV-AUDIT-001 | N/A | N/A | No event/audit behavior changed. | |
| INV-DOMAIN-001 | N/A | N/A | No domain/API behavior changed. | |
| INV-TENANT-001 | N/A | N/A | No tenant routing or object scope changed; integrated synthetic run retains the existing hotel-a fixture. | |
| INV-RBAC-001 | N/A | N/A | No authorization code or capability behavior changed. | |
| INV-PARITY-001 | N/A | N/A | No source/target domain semantics changed. | |
| INV-ENUM-001 | N/A | N/A | No enum or state representation changed. | |
| INV-UX-001 | APPLIES | PASS | Browser regression waits for and asserts actual focus on `.reception-case-title` after browser Back; full integrated journey passes. | Evidence: `scripts/cf-i06-browser-regression.playwright.js`, `output/playwright/cf-i06-browser.log`. |
| INV-ORDER-001 | N/A | N/A | No operational ranking/next-item behavior changed. | |
| INV-RESP-001 | N/A | N/A | No responsive implementation/assertion changed; parent run repeats all contracted viewport interactions and overflow checks. | |
| INV-EVID-001 | APPLIES | PASS | A prior immediate assertion exposed a scheduling race; the bounded contract records the cause and the replacement runner waits on the exact focus predicate with timeout. Integrated runner now passes and verifies cleanup before PASS. | Results record and runner logs. |
| INV-LEGACY-001 | N/A | N/A | No legacy recovery or synthesized record behavior changed. | |
| INV-MONEY-001 | N/A | N/A | No financial mutation implementation changed; parent exact cents/replay/rejection D1 regression passes. | |
| INV-STATE-001 | APPLIES | PASS | Repair will be included in substantive Artifact A and exact A recorded by immediate orchestration-only Boundary B. | Canonical state is created after A exists. |
| INV-CF-I07-001 | N/A | N/A | No admin/network/capability authority is in scope. | |
| INV-CF-I07-002 | N/A | N/A | No role/plan no-op operation is in scope. | |
| INV-CF-I07-003 | N/A | N/A | No role downgrade is in scope. | |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/cf-i06-browser-regression.sh` waits for the recursively owned Worker/Vite/Playwright process tree to terminate and verifies it before terminal PASS. | Final browser regression exit 0; no branch-owned Worker/Vite process remains. |
| INV-CF-I08-001 | N/A | N/A | No analytics or reporting behavior changed. | |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changed. | |
| INV-CF-I08-003 | N/A | N/A | No report range/state predicates changed. | |
| INV-CF-I08-004 | N/A | N/A | No expanded state predicates changed. | |
| INV-CF-I08-005 | N/A | N/A | No date defaults or cross-module report continuity changed. | |
| INV-SCOPE-001 | APPLIES | PASS | Diff for this bounded repair changes only its contract, invariant/Pre-Critic evidence, browser focus wait and parent evidence metadata; no next-block scope. | Scope audit in parent Results. |

## Publication decision

- [x] Every registry invariant is classified.
- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Focused integrated browser regression passed after the wait correction.
- [x] Process cleanup is verified before PASS.
- [x] This is not an Independent Critic verdict or Block F Controller PASS.
