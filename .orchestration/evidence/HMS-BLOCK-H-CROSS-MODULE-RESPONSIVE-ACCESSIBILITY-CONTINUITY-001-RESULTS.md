# Block H — Cross-module Responsive, Accessibility & Continuity Results

Task: `HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001`
Authorized base: `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`
Artifact candidate: exact commit is recorded by the immediate orchestration-only Boundary B and Issue #54.
Environment: local synthetic fixtures only; no staging, production or real hotel data.

## Bounded hardening

- `apps/web/src/components/ui/dropdown-menu.tsx`: when no forward/backward document focus target exists after a menu closes, Tab/Shift+Tab wraps to the opposite end of focusable document controls. It no longer returns focus to the trigger and traps keyboard users in the menu.
- `apps/web/src/features/reception/ReceptionPage.tsx`: starting a new Check-in resets the prior task's step and local fields, preventing stale values from carrying into a different Booking/Stay. The existing dirty-task close guard and server lifecycle remain unchanged.
- Browser runners were corrected to use supported routes, exact accepted locale/profile and isolated API interception. No API, Worker, domain, schema, migration, business policy or capability code changed.

## Requirement → surface → executable evidence

| Requirement | Surface/evidence | Result and evidence classification |
|---|---|---|
| H-01 shell, capability and route continuity | `scripts/cf-web-arch-browser.playwright.js`; `scripts/cf-i08-browser-regression.sh`; `scripts/cf-i07-browser-regression.sh` | PASS. Local Worker/D1-authorized mobile Reception→Housekeeping→Rooms, desktop Reports, SPA navigation without reload, direct route/query preservation, Back/Forward, server-denied Reports/Users paths. |
| H-02 Reception Case and lifecycle conflict | `scripts/p0-1-integrated-browser.sh`; `scripts/p0-1-arrival-integrated.playwright.js`; `scripts/p0-1-arrival-browser.playwright.js` | PASS. Worker/D1 mutation at 1280×900 and 375×812: canonical 409, refreshed authoritative state, BLOCKING guard, NON_BLOCKING advisory, successful retry, next Case, durable booking/room/event/invoice assertions. Synthetic UI task entry/focus/Escape/context at all five exact H viewports. |
| H-03 Booking Account, F-account only | `scripts/cf-f0-09-extra-charge-idempotency-integrated.sh`; `scripts/cf-f0-09-extra-charge-idempotency.playwright.js`; accepted CF-I06 Account D1 evidence inherited from base | PASS. Worker/D1 response-loss recovery after reload, same-token replay, altered-payload 409, tenant/capability denial, atomic audit failure, mobile same-token retry and exact invoice/charge/ledger assertions. Charge submit control reachability and overflow checked at all five exact H viewports. No Cash route/workflow was opened or exercised; no Cash-containing CF-I06 browser runner was executed. |
| H-04 Room/Housekeeping/Maintenance dimensions | `npm run test:cf-i05`; `npm run test:cf-i05-browser` | PASS. Executing D1 and Worker/D1-backed browser mutations preserve Occupancy/Housekeeping/Maintenance/Service/Readiness; correct next task, tenant isolation, maintenance transition and conflict behavior. Browser viewport matrix uses all five exact H sizes. |
| H-05 Guest context failure/retry | `scripts/cf-block-g-guest-context-browser.sh` | PASS, explicitly synthetic UI mock: one booking-context 503 then success; selected guest/current stay retained, error not represented as empty history, retry succeeds; all five exact H viewports. Tenant API evidence is separately in CF-I03/04 executing-D1 regressions. |
| H-06 Reports date/state/error behavior | `scripts/cf-i08-regression.sh`; `scripts/cf-i08-browser-regression.sh`; CF-I08 executing-D1 tests | PASS. Actual local Worker/D1 reports, exact selected ranges, invalid date error, cents/state/zero-safe arithmetic. Reports controls exercised at all five exact H viewports. |
| H-07 User admin and capability-safe actions | `npm run test:cf-i07`; `npm run test:cf-i07-browser` | PASS. Worker/D1 authorized mutations, no-op/audit and downgrade evidence; browser details/create/deactivate, focus-safe cancel, synthetic UI 409/retry, server-denied route. Admin controls exercised at all five exact H viewports. |
| H-08 Network control-plane/aggregates | CF-I07/08 Worker/D1 and browser regressions | PASS. Two configured synthetic hotel D1s, independently reconciled Network values, plan mutation and report ranges; all five exact H viewports; unavailable-binding and capability denial remain server-authoritative. |
| H-09 delayed/out-of-order reads | CF-I05 browser stale board sequence; Guest context browser; reception failure/retry runner | PASS with attribution: CF-I05 verifies an older response cannot replace the newer board/filter/search/selection and one injected refresh 503 remains visible until retry. Guest context 503→retry is synthetic. Reception conflict/retry uses real Worker/D1; client interception is labeled synthetic when used. |
| H-10 responsive operation | H-02..H-08 browser runners named above | PASS for material controls at exact `1280×900`, `768×812`, `375×812`, `375×600`, `844×390`. Every matrix asserts page width/no horizontal overflow and the relevant controls; task/focus behavior is asserted in the applicable flow. Screenshots are diagnostic only. |
| H-11 keyboard/focus/accessibility | P0.1 Reception browser; CF-I05; CF-I07; isolated Dropdown menu exercise | PASS. Check-in/Housekeeping/User task entry and return focus, Escape/cancel, menu arrows and Tab exit to another document control, keyboard Edit activation and focus-safe cancellation. Accessible names, status/error roles and task semantics asserted. |
| H-12 Worker/D1 versus synthetic evidence | H runner classifications above; `.hms-local/p0-1-ZSWzyh/api.log`; runner D1 assertions | PASS for successful integration claims. P0.1, F0.8, F0.9, Wave12, CF-I05, CF-I07 and CF-I08 use local Worker/D1. Guest 503 and selected stale/failure controls are explicitly labeled synthetic. All runners reported cleanup before terminal PASS. |
| H-13 build/budget/scope/artifact | commands below; changed-path audit | PASS for validation/budgets/scope. Publication boundary and Independent Critic are pending and intentionally are not represented as completed here. |

## Runtime/tooling limitation retained

The P0.1 browser/Worker/D1 flow passed end-to-end using Wrangler 4.146.0 with identical repository config/schema/dependency bytes and no package/lock change. The unchanged local Wrangler 4.125.0 crashed twice in Miniflare `ProxyController2.emitErrorEvent`: one occurrence after the Check-in 409 and one during initial concurrent reads before Queue-ready. Both failed runs are retained, not counted as PASS. The latter exact evidence is `output/playwright/h-wrangler-4.125-crash-api.log`, `output/playwright/h-wrangler-4.125-crash-web.log`, and `output/playwright/h-wrangler-4.125-crash-debug.log`. This is classified as a local runtime version differential with root cause and product attribution unproven; no dependency upgrade is proposed or made. Separate toolchain maintenance is tracked in Issue #55. CF-I07's expanded five-viewport browser run also had one response-wait timeout for the Network plan action; its diagnostic rerun passed all five viewports and the mutation assertions.

## Final validation

- `npm run check`: PASS — TypeScript project build and Vitest, 35 files / 176 tests.
- `npm run types:check`: PASS — API and Web Wrangler generated types are current.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS — architecture I/II, i18n coverage and budget checker.
- `npm run test:d1-query-plan`: PASS — arrival/check-out indexes and keyed inventory access.
- `npm run wrangler:dry-run`: PASS — API Worker and Web Worker, no deployment.
- Executing-D1/Worker regressions: CF-I03, CF-I04, CF-I05, CF-I07, CF-I08, F0.8 recovery, Wave12 reassignment and F0.9 account idempotency PASS. P0.1 is PASS on Wrangler 4.146.0; both Wrangler 4.125.0 runtime crashes remain recorded as failed runs.
- Browser evidence: P0.1, CF-I05, CF-I07, CF-I08, Guest context, F0.8, F0.9, Wave12 and shell continuity as classified in the table.
- Final `git diff --check`, route/scope review, process-tree check and exact A/B ancestry are completed before the external review boundary.

## Bundle baseline → result → delta

Exact-base baseline from accepted Block G product-identical source: JS raw/gzip `339914/95371 B`; CSS raw/gzip `57024/10564 B`.

| Measure | Baseline | H result | Delta bytes | Delta % |
|---|---:|---:|---:|---:|
| JS raw (entry) | 339914 | 339979 | +65 | +0.0191% |
| JS gzip (entry) | 95371 | 95395 | +24 | +0.0252% |
| CSS raw (entry) | 57024 | 57024 | 0 | 0.0000% |
| CSS gzip (entry) | 10564 | 10564 | 0 | 0.0000% |
| Aggregate raw | 396938 | 397003 | +65 | +0.0164% |
| Aggregate gzip | 105935 | 105959 | +24 | +0.0227% |

Only one initial JS entry and one CSS entry are emitted; initial/entry payload equals the values above. Ceilings remain JS raw/gzip `350000/100000 B`, CSS raw/gzip `60000/15000 B`; all pass. `scripts/check-cloudflare-budgets.mjs` remains enabled and unchanged.

## Scope and publication boundary

Changed product code is limited to the shared DropdownMenu keyboard focus behavior and Reception Check-in task state reset. Other changed files are existing regression/browser harnesses and this task's evidence/orchestration. No backend/domain/schema/migration, budgets, F-cash, Block I+, staging, deploy, production, real data, main, PR or merge work occurred.

Artifact A, orchestration-only Boundary B and a fresh separate read-only Independent Critic are the next required method steps. This file does not declare Block H PASS or Controller acceptance.
