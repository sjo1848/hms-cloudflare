# Block F Account/Finance — Results and Evidence

Task Contract: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Bounded recovery clarification: `.orchestration/contracts/HMS-BLOCK-F-REPAIR-PAYMENT-RECOVERY-001.md`
Base: `39ee0a2b38e7205b8e041e792e16ee469c996241`
Branch: `impl/hms-block-f-account-finance-cash`
Mode: local synthetic fixtures only.

## Delivered F-account surfaces

- Reception Booking/Stay Case exposes its existing account entry only when server-provided `billing.read` and `bookings.read` capabilities are present. The link carries the selected `booking_id` and a validated `/bookings` return target with query/hash. Browser Back and application return restore the selected Case and focus.
- Contextual Billing preselects the exact Booking/Stay, suppresses the redundant selector and Cash panel, shows total/paid/remaining/credit separately, and provides the existing account, charge and payment workflows. The legacy direct `/billing` route retains its selector and Cash surface.
- Payment operation identity and exact payload are persisted in session storage before submission. An unresolved operation remains locked to the original Booking/Stay and can only be explicitly replayed with the same token and payload. The existing POST route now checks the booking-scoped operation identity before current-balance validation, so an exact completed final-payment replay remains safe; changed payloads conflict. No new endpoint, capability, schema, settlement rule or Cash semantics were added.
- The test-only Worker seam is gated by `LOCAL_DEV_AUTH=true`; it commits a synthetic payment and returns 502 to model response loss. Production behavior does not include the seam.
- Existing F0.9 Extra Charge operation identity, recovery and D11 reconciliation remain in place. Existing F0.7 checkout settlement code is unchanged.
- Contextual return links now use the approved navigation and visible focus styling. Both English and Argentine Spanish payment-recovery messages are present in source and the runtime catalogs.

## Runtime and functional evidence

| Claim | Evidence |
|---|---|
| Exact operation retry after response loss/reload creates one payment row | `npm run test:cf-i06-browser`; integrated Worker + migrated local D1; POST commits then returns synthetic 502; a separate GET observes the committed row; reload restores the saved operation; explicit same-token retry completes and D1 payment count remains exactly one. `output/playwright/api.log`, `output/playwright/cf-i06-browser.log`. |
| Payment/charge/Receivables constraints and Cash regression | `npm run test:cf-i06` → `CF-I06 billing/atomic cents/closure regression PASS`; tests exact cents, booking-scoped operation identity, final-payment replay, changed-payload/overpay rejection, zero-effect capability denial, and existing stale/successful Cash closure behavior. Cash product code is unchanged. |
| Account remains Booking/Stay scoped and contextual | Browser direct `/billing?booking_id=...`, reload, selector absence, Cash-panel absence, validated Reception return, application Back and browser Back focus restoration. Browser uses synthetic `cf-i06` Booking in `hotel-a`. |
| Responsive and keyboard/focus behavior | Integrated browser assertions at 375, 390, 430, 768, 1024 and 1280 px; zero horizontal overflow. Contextual Account additionally executes WIDE 1280×900, COMPACT 768×812, NARROW 375×812, reduced-height 375×600 and landscape 844×390. Keyboard Tab reaches the payment-method control with `:focus-visible`; app/browser Back restore Case focus. |
| Diagnostic screenshots | `output/playwright/cf-i06-account-wide.png`, `-compact.png`, `-narrow.png`, `-reduced-height.png`, `-landscape.png`; `output/playwright/cf-i06-billing.png`. Assertions, not screenshots, determine test result. |
| Process ownership | `scripts/cf-i06-browser-regression.sh` terminates and verifies its owned Worker/Vite/Playwright process tree before printing PASS; successful-run API and web logs are retained in `output/playwright/`. |

The first final browser rerun exposed a race in the test assertion: it checked focus immediately after Case content appeared, before the existing `requestAnimationFrame` focus restoration. The bounded evidence-only repair was frozen in `.orchestration/contracts/HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001.md`; the runner now waits up to five seconds for the exact focus predicate and remains failing if it never arrives. The complete browser journey passed after this correction. No product behavior changed for this repair. Its all-24 invariant mapping and Pre-Critic are recorded at `HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001-{INVARIANTS,PRECRITIC}.md`.

All browser data is local synthetic fixture data; no real hotel data or environment was used.

## Validation record

- `npm run check`: PASS — TypeScript and full repository suite, 35 test files / 175 tests.
- `npm run test:i18n`: PASS — 4 tests; English/Spanish JSON catalog parity.
- `npm run types:check`: PASS — API and Web Wrangler types are up to date.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS — architecture I/II, i18n coverage and bundle budget checker.
- `npm run test:d1-query-plan`: PASS — arrival/checkout indexes and keyed inventory contract.
- `npm run test:cf-i06`: PASS — local Worker + executing D1 financial regression.
- `npm run test:cf-i06-browser`: PASS — integrated Worker + D1 + Vite browser regression, recovery, responsive controls, Cash regression, contextual routing and focus.
- `npm run wrangler:dry-run`: PASS — API Worker and Web assets; no deployment.
- `node --check scripts/cf-i06-browser-regression.playwright.js`, `bash -n scripts/cf-i06-browser-regression.sh`, `git diff --check`: PASS.
- Route/capability audit: existing canonical billing capability helpers and unique payment method/path are retained; no capability grant or Cash/API boundary changed.
- Forbidden-scope audit: F-cash code and G–H untouched; no schema, PR, merge, main, staging, deploy, production, real data or promotion action.

## Bundle baseline → result → delta

Baseline is the clean exact Block F base `39ee0a2b38e7205b8e041e792e16ee469c996241`; result is the final production build. Percent is relative to baseline.

| Metric | Baseline | Result | Delta | Delta % | Ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw | 334638 B | 338266 B | +3628 B | +1.084% | 350000 B |
| JS gzip | 94467 B | 95036 B | +569 B | +0.602% | 100000 B |
| CSS raw | 55652 B | 56587 B | +935 B | +1.680% | 60000 B |
| CSS gzip | 10384 B | 10490 B | +106 B | +1.021% | 15000 B |
| Aggregate raw (JS + CSS) | 390290 B | 394853 B | +4563 B | +1.169% | — |
| Aggregate gzip (JS + CSS) | 104851 B | 105526 B | +675 B | +0.644% | — |
| Initial/entry raw (HTML + JS + CSS) | 390654 B | 395217 B | +4563 B | +1.168% | — |
| Initial/entry gzip | 105117 B | 105790 B | +673 B | +0.640% | — |

All active ceilings pass; no budget policy changed. Runtime evidence is the integrated synthetic Worker/D1/Vite browser record above; no localhost duration is represented as a production performance target.

## Scope and handoff status

F-account is implemented and locally validated under the frozen contract. F-cash remains excluded because OD-1 requires its separate real-hotel ownership Product Acceptance/Human Gate; this artifact does not claim full Block F completion. Blocks G–H remain unauthorized. A fresh external Independent Critic has not yet reviewed Artifact A + Boundary B; no substantive PASS is self-declared.
