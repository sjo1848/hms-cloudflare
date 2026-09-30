# Block C bounded repair — task history and initial focus

Task: `HMS-BLOCK-C-REPAIR-HISTORY-FOCUS-001`
Base pair: Artifact A `3e0ea41a53b471993cc60f1f0421b0237ef54055` + Boundary B `e83154dfd0e549fa494e8c90754afe70acd0f9f4`
Branch: `impl/hms-block-c-reception-workflows`
Mode: ordinary technical REWORK within the already authorized Block C contract.

## Critic findings being repaired

1. `returnToCase()` pushes a duplicate Case/Queue history entry when a focused task is cancelled or completed. Application Back then browser Back can reopen the discarded task.
2. The shared initial-focus selector attempts to focus task headings, but Reassignment and Checkout headings lack `tabIndex`; focus remains on the body after their trigger disappears.
3. The targeted browser regression also found that browser Forward restores the Case URL/content but leaves focus on `body`. This is within the same frozen focus/context requirement and is included in this bounded repair.

No `ROADMAP_BLOCKER` or new product policy was found. No API, capability, lifecycle, backend, schema, budget, or domain behavior changes are authorized by this repair.

## Bounded requirements and acceptance

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Task closes without duplicate history | Reception `openTask`, cancel/complete `returnToCase`, popstate | App-opened task closes by traversing its own history entry; a direct task deep link falls back to replacing task URL with Case/Queue; browser Back/Forward restores URL, Case focus and context coherently; dirty discard guard is preserved | Focused browser automation: open → cancel/discard → browser Back must not reopen task; Forward restores the expected Case and Case focus; direct deep-link cancel remains in Reception; existing Queue/Case context retained |
| Reassignment and Checkout focus | Reception focused-task heading DOM | Both task headings are programmatically focusable and receive focus after Case restoration/render; focus returns to Case after close and history traversal | Browser `document.activeElement` assertions on task entry, close and Back/Forward; keyboard smoke for both tasks |
| Original Block C semantics remain | Existing transactional workflows | No mutation/API semantics change; keep Task Contract validations and all applicable invariant evidence valid | TypeScript, targeted UI tests, integrated Worker/D1 reassignment and checkout regressions; diff/scope audit |

## Registry invariant classification for this repair

| Invariant | Classification | Rationale / acceptance |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation code; verify existing transaction regressions remain passing. |
| INV-AUDIT-001 | N/A | No event/audit path changes. |
| INV-DOMAIN-001 | N/A | No domain transition change. |
| INV-TENANT-001 | N/A | No tenant-scoped API or data access change. |
| INV-RBAC-001 | N/A | No permission or capability behavior change. |
| INV-PARITY-001 | N/A | No source/domain semantics change. |
| INV-ENUM-001 | N/A | No enum or state representation change. |
| INV-UX-001 | APPLIES | Preserve Task → Case/Queue navigation and focus through cancel, success, browser navigation and direct URL. |
| INV-ORDER-001 | APPLIES | Preserve Queue lane/search/filter and selected item during history traversal; assert context in browser evidence. |
| INV-RESP-001 | APPLIES | Validate task heading focus and return across wide, compact, narrow and reduced-height task modes where these forms render. |
| INV-EVID-001 | APPLIES | Critic findings map to exact executable browser assertions; distinguish targeted evidence from the full original suite. |
| INV-LEGACY-001 | N/A | No legacy/backfill recovery. |
| INV-MONEY-001 | N/A | No money or financial mutation change. |
| INV-STATE-001 | APPLIES | Publish repaired substantive Artifact A then metadata-only Boundary B with exact A identity and fresh exact-pair Critic. |
| INV-CF-I07-001 | N/A | No admin/network/audit routes. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No downgrade flow. |
| INV-CF-I07-004 | APPLIES | Integrated test runners must clean up owned processes before PASS. |
| INV-CF-I08-001 | N/A | No analytics arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No new enum/status (No-show remains deferred). |
| INV-CF-I08-005 | N/A | No analytics/report default date behavior. |
| INV-SCOPE-001 | APPLIES | Restrict code to Reception task history/focus and directly supporting tests/evidence; no D–H work. |

## Forbidden changes

No refactor beyond these defects; no change to budgets, backend/API/schema, capabilities, lifecycle, pricing/settlement, other modules, or Block D–H. No PR, push, merge, main, staging, deploy, production, or real data.

## Verification / publication

Run targeted history/focus browser assertions, relevant unit/integration tests, TypeScript and `git diff --check`, plus the exact Worker/D1 reassignment and checkout regressions if the integrated harness permits. Preserve existing broad Block C validation claims only as inherited evidence for unchanged blobs; rerun any validation whose source or evidence is changed. Update the invariant evidence and Pre-Critic with exact changed-surface results. Freeze replacement Artifact A; create orchestration-only Boundary B; obtain a fresh separate read-only Independent Critic on that replacement pair. Do not self-approve substantive PASS.
