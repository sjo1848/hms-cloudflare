# Block A — Durable Invariant Evidence

Task: `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001`
Branch: `impl/hms-block-a-shell`
Validation basis: disposable local Worker/D1 and local Vite dev/preview only; no real/customer data.

## Registry classification and evidence

| Invariant | Status | Evidence / rationale |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business conditional mutation, multi-entity transaction, or domain operation was added. Same-subject role changes used only disposable local control-plane fixtures, and their durable effects are counted by the integrated runner. |
| INV-AUDIT-001 | N/A | No product audit/event write path changed. Integrated fixture role-audit counts are checked only to ensure fixture setup/cleanup consistency. |
| INV-DOMAIN-001 | N/A | No booking, room, housekeeping, maintenance, payment, settlement or other domain transition was modified. |
| INV-TENANT-001 | PASS | `/auth/me` hotel/user switch checked against real local Worker responses for two synthetic hotels; out-of-order authority response regression passes in F0.10 browser test. Unmembered hotel remains 403; no target hotel data mutation. Receipts: `output/playwright/block-a-shell-integrated.log`, `output/playwright/f0-10-capabilities-integrated.log`, `output/playwright/f0-10-capabilities-integrated-result.json`. |
| INV-RBAC-001 | PASS | Shell visibility and direct-route guards use effective capability arrays from server `/auth/me`, with no client role map. Same synthetic subject had `/rooms` allowed 200, was downgraded by authorized local fixture, then denied 403; nav/direct route updated and failed business request was not replayed. F0.10 also proves denied writes at desktop/mobile against real Worker; backend authorization was not changed. |
| INV-PARITY-001 | N/A | No source-domain field, validation rule, state transition or workflow is migrated by this shell/navigation increment. |
| INV-ENUM-001 | N/A | No business enum or state predicate changed. |
| INV-UX-001 | PASS | Frozen route inventory and context grouping remain the same seven module destinations; Reception query/hash state, direct route/reload and Back/Forward behavior pass in integrated browser evidence. Module workflows remain owned by existing modules. |
| INV-ORDER-001 | N/A | No operational queue/list ranking, synthetic work item or next-item selection changed. |
| INV-RESP-001 | PASS | Browser interacted at WIDE 1440×900, COMPACT 1024×700 and NARROW 390×844; mobile primary/More nav, Escape and focus restoration pass. Inherited F0.10 authorization flow also verifies 1280×900 and 375×844. Screenshots: `output/playwright/block-a-wide-1440-reception.png`, `block-a-compact-1024.png`, `block-a-narrow-390-reception.png`, `block-a-narrow-390-more.png`, and `block-a-built-*`. |
| INV-EVID-001 | PASS | Dev-browser evidence is backed by real local Worker/D1; built-browser routes API requests to the same local Worker without response mocks. Unit navigation tests are separately identified (3/3). The first parallel full-suite attempt hit D1 timeouts under worker contention; serial full suite then completed 34/34 files, 171/171 tests. No timeout is represented as PASS. |
| INV-LEGACY-001 | N/A | No legacy migration, import, backfill, ownership or historical case handling changed. |
| INV-MONEY-001 | N/A | No amounts, charges, payments, invoices, balances, cash or financial operations changed. |
| INV-STATE-001 | PASS | Frozen Task Contract and admission/rework contracts precede their implementation; Artifact A contains product/tests/canonical evidence, followed by orchestration-only Boundary B naming exact A and disabling resume while external Controller review is required. |
| INV-CF-I07-001 | N/A | No admin/network/audit route handler or authorization implementation changed. Existing API authority is exercised without altering its role/capability policy. |
| INV-CF-I07-002 | N/A | No admin mutation semantics changed. |
| INV-CF-I07-003 | PASS | Same synthetic subject and same protected Rooms read operation: 200 before fixture role downgrade, 403 after; shell capability state refreshed from `/auth/me`; exactly one denied business call and no replay. F0.10 integrated regression also passed. |
| INV-CF-I07-004 | PASS | `scripts/cf-f0-10-capabilities-integrated.sh` owns Worker, Vite dev, Vite preview and Playwright process trees and verifies them stopped before terminal PASS. Both final integrated runs exited 0. |
| INV-CF-I08-001 | N/A | No reporting arithmetic or KPI calculation changed. |
| INV-CF-I08-002 | N/A | No network aggregation/query or store-binding logic changed; only capability-aware route presentation is in scope. |
| INV-CF-I08-003 | N/A | No report date/state query semantics changed. |
| INV-CF-I08-004 | N/A | No domain-state expansion or cross-module predicate changed. |
| INV-CF-I08-005 | N/A | No report clock/default date or cross-surface report mutation changed. |
| INV-SCOPE-001 | PASS | Diff inventory contains only shell/navigation/router/client capability invalidation, localization, focused tests, browser runner/evidence and authorized budget-preserving Terser target options. No API/domain/schema/migration, Blocks B–H, real data, PR, merge, protected branch, staging, deploy or production action. |

## Fresh execution receipts

- Full serial regression: `npm run typecheck && npx vitest run --maxWorkers=1` — PASS, 34 files / 171 tests.
- `npm run types:check` — PASS.
- `npm run web:build` — PASS; JS 299,976 raw / 86,915 gzip bytes; CSS 48,615 raw / 9,193 gzip bytes. JS raw headroom is 24 bytes; no budget ceiling changed.
- `npm run architecture:fitness` — PASS (architecture, i18n coverage and unchanged Cloudflare budgets).
- `npm run test:d1-query-plan` — PASS.
- `npm run wrangler:dry-run` — API and web dry-runs PASS; no deployment.
- `bash scripts/cf-f0-10-capabilities-integrated.sh` — PASS; F0.10 plus Block A dev and minified bundle against disposable local D1 + real local Worker; D1 fixture/effect and owned-process cleanup assertions PASS.
- `git diff --check` — PASS before artifact publication.
