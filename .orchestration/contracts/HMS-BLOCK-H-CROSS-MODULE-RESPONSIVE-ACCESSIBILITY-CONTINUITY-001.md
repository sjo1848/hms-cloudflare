# HMS Block H — Cross-Module Responsive, Accessibility & Continuity

Status: `FROZEN BEFORE HARDENING`
Task ID: `HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001`
Authorized base: `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`
Branch/worktree: `impl/hms-block-h-cross-module-hardening` / `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-h-cross-module-hardening`
Authority: Issue #54, Controller comment `5956017495` (`CONTROLLER_DECISION: START_BLOCK_H`); Block G PASS is confirmed in Issue #53.

## Objective

Harden the accepted A–G product journeys as an integrated system. Verify that people can complete the existing supported journeys across responsive layouts, keyboard/focus, browser history and route context, transient loading/failure/retry, delayed/out-of-order reads and canonical conflicts. Use local synthetic fixtures and the real local Worker/D1 where an integration claim is made. Add no new business behavior or domain truth.

## Authorized scope and boundaries

Included surfaces: App Shell/navigation/capability context; Reception Queue and Booking/Stay Case; existing Reservation and lifecycle tasks; Rooms; Housekeeping and Maintenance presentation/actions already authorized in E; Booking Account/Folio, existing charges and payments; Guests; Reports; hotel-user administration; Network. Cross-module journeys may traverse these surfaces only through existing routes, capabilities, API contracts and lifecycle semantics.

Explicitly excluded: F-cash, Cash/close/handoff/reconciliation workflows, Block I or any later block, authenticated staging smoke, staging/deploy/promotion, production, real hotel data, main, PR/merge, and new product/policy/domain/API/schema/migration behavior. Do not visit or assert a Cash workflow as accepted behavior. The staging browser issue remains a separate external harness blocker in Issue #52.

No backend, API, domain or schema change is expected. If a scenario requires a new backend/domain contract, product rule, material architecture change, or breach of an active bundle ceiling, stop and record the applicable gate. Repair only bounded technical/UI/evidence defects that remain inside accepted contracts.

## Exact product/test inventory at the authorized base

| Area | Product surfaces and routes | Existing executable evidence / known boundary |
|---|---|---|
| A — Shell/context | `apps/web/src/app/{AppShell,navigation,router,capabilities}.tsx/ts`; `/bookings`, `/rooms`, `/housekeeping`, `/guests`, `/reports`, `/users`, `/network` | Block A shell tests; `scripts/cf-web-arch-browser.playwright.js` covers SPA navigation and mobile Back but not Forward or context restoration across all modules. Capabilities originate at `/api/v1/auth/me`. |
| B — Reception | `apps/web/src/features/reception/{ReceptionPage,CheckInTask,useReceptionWorkspace,model,queue}.tsx/ts`; `/bookings` and supported task/context links | `scripts/p0-1-integrated-browser.sh`, `scripts/p0-1-arrival-integrated.playwright.js`, `scripts/cf-product-flow-regression.sh`; real local Worker/D1 lifecycle proof exists, but broad product-flow browser coverage is narrow/mobile-focused. |
| C — Reservation/lifecycle | Reception focused tasks; booking/lifecycle/inventory APIs | `scripts/cf-f0-08-reservation-recovery-integrated.sh`, `scripts/cf-wave12-reassignment-integrated.sh`, `scripts/cf-block-c-checkout.playwright.js` where present, `scripts/cf-product-flow-regression.sh`; preserve all existing semantics and conflict handling. |
| D — Rooms | `apps/web/src/features/rooms/RoomsPage.tsx`; `/rooms` | Block D Results and `scripts/cf-ux-rooms-guests-browser.playwright.js`; delayed detail response is synthetic in that browser runner; executing-D1 coverage remains separate. |
| E — Housekeeping/Maintenance | `apps/web/src/features/housekeeping/HousekeepingPage.tsx`, workspace/model/API; `/housekeeping` | `scripts/cf-i05-browser-regression.sh` exercises responsive/history/stale board refresh; executing Worker/D1 lifecycle tests cover state dimensions and audit. |
| F-account only | `apps/web/src/features/billing/BillingWorkspace.tsx`; contextual `/billing` | `scripts/cf-f0-09-extra-charge-idempotency-integrated.sh` plus CF-I06 executing-D1 tests cover account/ledger mutations. The combined CF-I06 browser journey enters Cash and is excluded from H; do not run or claim it as an H scenario. |
| G — Guests/Reports/Admin/Network | feature routes `/guests`, `/reports`, `/users`, `/network` and their accepted APIs | `scripts/cf-block-g-guest-context-browser.sh`, `scripts/cf-i07-browser-regression.sh`, `scripts/cf-i08-regression.sh`, CF-I07/08 executing Worker/D1 coverage. Guest 503→retry and admin UI 409 browser paths deliberately use synthetic responses; label separately from integrated evidence. |

Full route/API/capability source inventory and accepted behavior are in `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-INVENTORY-EVIDENCE-MATRIX.md`.

## Invariants and acceptance

The 24 registry invariants are classified in `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-INVARIANTS.md`. Applicable rules include: authoritative server capability and tenant routing; no false/stale success; exact audit/event pairing; domain lifecycle authority; source/enum parity; Room dimensions remain independent; Booking Account remains distinct from Cash; responsive operations remain usable; and no evidence claim stronger than its actual integrated/synthetic proof.

Acceptance is requirement-to-surface-to-executable-evidence in the frozen matrix. At minimum it covers:

1. Shell and direct deep links: current route, identity/hotel/capabilities survive reload, browser Back and Forward, and application Back without stale identity/capability state restoring unauthorized navigation.
2. Reception/Case ↔ lifecycle/Rooms/Housekeeping: run an authorized local Worker/D1 path; canonical BLOCKING vs NON_BLOCKING behavior remains unchanged; a real conflict returns the existing typed 409, refreshes authoritative state, does not report success, and preserves case/lane/filter/search/selection/context/focus on recovery.
3. Reception Case ↔ Booking Account: prove an existing Account charge/payment journey and authoritative return context using only F-account; do not enter or test Cash. Same-operation retry must not duplicate ledger rows where that behavior is part of the existing contract.
4. Rooms ↔ Housekeeping/Maintenance: displayed Occupancy, Housekeeping, Maintenance, Service and derived Readiness remain independently coherent after supported E actions; no maintenance state overwrites housekeeping state.
5. Guests context: selected guest and prior authoritative context survive a context-read error/retry. Mocked UI behavior is expressly identified as synthetic; executing-D1 read/tenant proof is separate.
6. Reports/Admin/Network: date/state/cents and multi-hotel values match independently authored Worker/D1 fixtures; denied capability paths and mutation/audit behavior remain server-authoritative; configured-store failure is not represented as a partial-success aggregate.
7. Race/recovery: older delayed reads cannot overwrite newer data; refresh/error/retry preserves navigable context; conflict evidence identifies the authoritative response and durable state.
8. Responsive/accessibility: exercise WIDE `1280×900`, COMPACT `768×812`, NARROW `375×812`, reduced-height `375×600`, and landscape `844×390` on each contracted critical journey. Assert reachable controls, no unintended horizontal page overflow, usable scroll, keyboard-visible focus, labels/status semantics, task/dialog focus entry/return, and Escape/Tab paths where supported. Screenshots are diagnostic only.
9. Build/bundle: run required full tests, Worker/API/Web type checks, production build, architecture/i18n/budget gates, relevant query-plan and Worker/D1 regressions, Wrangler dry-runs, `git diff --check`, route/scope audit. Compare exact-base baseline to final result as bytes and percent for JS/CSS raw and gzip, aggregate raw/gzip, and initial/entry payload when measurable. Never increase ceilings.

Every runner must clean up owned Worker/Vite/browser processes and verify they are gone before PASS. API/D1, integrated Worker/D1/browser, synthetic browser and static checks must be attributed separately.

## Bundle policy

Active ceilings are JS raw/gzip `350000/100000 B`, CSS raw/gzip `60000/15000 B`. No increase is authorized. The accepted G baseline from the product-identical A at this base is JS `339914/95371 B`, CSS `57024/10564 B`; H will freshly reproduce the exact-base build before hardening and record entry/aggregate metrics. Any active ceiling breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`.

## Publication method

Freeze this Task Contract, exact scenario inventory/evidence matrix, all 24 invariant classifications and admission Pre-Critic before hardening. After bounded hardening, run full integrated validation and the final Pre-Critic/invariant evidence. Create immutable substantive Artifact A, then immediate orchestration-only Boundary B naming exact A; request a fresh separate read-only Independent Critic on exact A+B. Reconcile state only after the verdict and await Controller review on Issue #54. Publish only the dedicated H branch as directed by the canonical Issue; do not self-PASS.

## Stop conditions

Stop only for `ROADMAP_BLOCKER`, new product/authority policy, material architecture change, a new backend/domain contract, real hotel data, promotion/staging, or `BUNDLE_BUDGET_GATE_REQUIRED`. Issue #52's external authenticated staging harness blocker is not an H blocker. F-cash remains excluded while OD-1 is pending. Block I and later blocks are not authorized.
