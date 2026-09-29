# HMS-F0-11-CRITIC-CONDITIONS-EVIDENCE-REPAIR-001 — Invariant Evidence

Artifact candidate: replacement F0.11 Artifact A2 (published after this evidence is frozen)
Task Contract: `.orchestration/contracts/HMS-F0-11-CRITIC-CONDITIONS-EVIDENCE-REPAIR-001.md`
Product-repair contract: `.orchestration/contracts/HMS-F0-11-HOUSEKEEPING-REFRESH-CONTINUITY-002.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No backend writes or mutation winner changes; mock failed-refresh recovery and the unchanged local Worker/D1 representative flow are distinguished. | UI cannot claim a refresh that failed. |
| INV-AUDIT-001 | N/A | N/A | Source diff contains no event/audit mutation. | No audit implementation changed. |
| INV-DOMAIN-001 | N/A | N/A | Source diff is limited to Housekeeping refresh rendering/disabled controls and build compression; no state transition changes. | |
| INV-TENANT-001 | N/A | N/A | No routing or tenant boundary changes; integrated local fixtures use configured tenant header/binding. | |
| INV-RBAC-001 | N/A | N/A | No authorization change. CF-I03–I06 run on isolated local stores. | Regression only. |
| INV-PARITY-001 | N/A | N/A | No source workflow behavior changed. | |
| INV-ENUM-001 | N/A | N/A | No enum mapping/predicate changed. | |
| INV-UX-001 | APPLIES | PASS | `scripts/cf-f0-11-refresh-races.playwright.js`: retained date `2026-09-28`, Ready filter, `STANDARD` search, Room 800 selection and `scrollY`; retained Room 712 after failed post-action read and explicit recovery. | `output/playwright/f0-11-refresh-races.log`; mock only. |
| INV-ORDER-001 | APPLIES | PASS | Known assertion `Next task` Room 713→712 and after recovery 712→713. | Expected identities are literal fixture values, not target-derived order. |
| INV-RESP-001 | APPLIES | PASS | Integrated Reception Worker/D1 at 375×812 and 1280×900; built/minified Rooms Worker/D1 at the same widths. | Logs and screenshots are named in integrated evidence. |
| INV-EVID-001 | APPLIES | PASS | Integrated, mock, build/budget, D1 query-plan, and regressions are separated and individually named in `HMS-F0-11-AUTHORITATIVE-REFRESH-001-INTEGRATED.md`. | Reused-fixture 409 is explicitly not counted as PASS. |
| INV-LEGACY-001 | N/A | N/A | No synthesized historical record behavior. | |
| INV-MONEY-001 | N/A | N/A | No financial mutation/arithmetic; Billing read races only in mock evidence. Full D11/F0.9 tests remain green under `npm run check`; no claim of financial behavior change. | |
| INV-STATE-001 | APPLIES | PASS | This evidence and code/tests are committed in immutable Artifact A2; separate orchestration-only B3 records its exact full SHA, review lock and reviewer action. | Reviewer verdict is not self-issued. |
| INV-CF-I07-001 | N/A | N/A | No admin/network/audit route authorization changes. | |
| INV-CF-I07-002 | N/A | N/A | No admin mutations. | |
| INV-CF-I07-003 | N/A | N/A | No role downgrade. | |
| INV-CF-I07-004 | APPLIES | PASS | F0.11 integrated browser and regression runner completion markers report owned Worker/Vite/process cleanup; no owned service was left by the final runs. | Existing unrelated long-lived local services were not killed or claimed as runner-owned. |
| INV-CF-I08-001 | N/A | N/A | Reports/analytics are out of scope. | |
| INV-CF-I08-002 | N/A | N/A | No network aggregation. | |
| INV-CF-I08-003 | N/A | N/A | No report date semantics. | |
| INV-CF-I08-004 | N/A | N/A | No report state enum changes. | |
| INV-CF-I08-005 | N/A | N/A | No report clock/continuity changes. | |
| INV-SCOPE-001 | APPLIES | PASS | Artifact A2 includes only F0.11 contract/evidence repair, the demonstrated Housekeeping continuity correction, and permitted Vite compression setting. F0.9/P0.1 unrelated working-tree edits remain excluded. | Stage audit before commit. |

## Mutation inventory

No state-changing business operation was added or modified. The integrated browser executes the existing synthetic reception check-in and room-create operations strictly as representative authoritative-refresh evidence; their backend contracts are unchanged. The check-in's existing Worker/D1 status and event evidence is recorded in the original integrated section. F0.11 changes only read reconciliation and UI continuity.

## Claim → evidence audit

| Claim | Evidence | Classification |
|---|---|---|
| JS/CSS ceilings pass with exact raw/gzip values | `npm run web:build`, `npm run architecture:fitness`; `f0-11-web-build.log`, `f0-11-architecture-budgets.log` | Build/static budget |
| Rooms retains selected identity while present and clears it when removed | F0.11 mock browser script/log | Mock |
| Housekeeping refresh preserves task context/scroll and ordered next behavior; failed reread does not advance | F0.11 mock browser script/log | Mock |
| Reception integrated mutation converges to persisted Worker/D1 state at mobile/desktop, with no page/console errors | paired local Worker/D1/Vite Playwright logs and read-only D1 evidence | Integrated |
| Built/minified production bundle performs a D1-backed room create/read at both viewports | final built local runner/browser logs | Integrated |
| Required inherited regression set passes | CF-I03–I06 logs | Local/synthetic regression |
| No real/remote data or promotion operation occurred | runner commands and fixture paths; no remote binding or deployment command | Scope audit |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Full F0.11 bounded-repair validation passed.
- [x] Scope audit passed; unrelated changes excluded.
- [x] Exact A2/B3 boundary is used; new Independent Critic disposition remains pending.
- [x] No Foundation 0 aggregate PASS is claimed.
