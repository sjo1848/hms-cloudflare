# Block C — frozen requirement/evidence matrix

This is the pre-implementation evidence plan at exact base fc2daa783b8ef361e39e6945dbdfe2bfe6345b98. Planned runner paths are proposed test/evidence files, not existing evidence.

| Requirement | Surface | Acceptance | Planned executable evidence |
|---|---|---|---|
| Progressive new reservation | Reception task UI; existing guest/availability/reservation APIs | Search/select guest; capability-gated guest creation; dates, availability, room/rate, notes, review and authoritative result | Component tests + scripts/cf-block-c-reception-workflows.playwright.js against local Worker/D1; verify created booking, inventory claims, pricing segment and operation identity |
| F0.8 identity/recovery | Existing token operation API and recovery list | Exact retry retains token/payload; altered request gets a new token; incomplete saved guest remains truthful | apps/api/src/modules/bookings/reservation-creation.executing-d1.test.ts + integrated exact-token/recovery browser assertions and final D1 checks |
| Edit reservation | Case-launched task; existing PATCH/availability | CONFIRMED only, no generic status path; availability checked; draft remains on conflict; authoritative refreshed Case on success | New component/hook tests + local Worker/D1 edit success, overlap/hold 409, denied capability, reload/history |
| Check-in | Existing CheckInTask + POST check-in | Current checklist, authoritative readiness, BLOCKING vs NON_BLOCKING, 409 refresh/retry, accepted next-priority behavior | apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts + scripts/p0-1-integrated-browser.sh + new focused-task journey at all viewport classes |
| Reassignment | Case task + current quote/command | Exact remaining interval and quote token; only remaining segments/claims change; no consumed-night/charge/payment rewrite; 409 discards stale quote and requotes | apps/api/src/modules/lifecycle/reassignment-interval.executing-d1.test.ts + scripts/cf-wave12-reassignment-integrated.sh + new focused task browser assertions |
| Checkout | Case task + checkout/account APIs | Server decides settlement; capability-gated override only; required confirmations; atomic turnover; no false success; response-loss outcome recoverable | Check-in concurrency/settlement executing-D1 tests + F0.7 integrated evidence runner as applicable + new local Worker/D1 focused task and exact account/room/claim/event assertions |
| Task/context/history | Reception URL/workspace/App Shell | Deep link/reload, query/hash, lane/search, selected booking, scroll, app Back and browser Back/Forward preserve Queue→Case→Task order | New Playwright assertions plus scripts/cf-block-b-reception-workspace.playwright.js, links and capability-refresh regression |
| Accessibility/responsive | Task semantic surfaces/CSS | WIDE, COMPACT, NARROW, 1280×600, 844×390, focus/keyboard, dirty discard, safe area and reduced visual viewport; no clipped CTA/overflow | Browser geometry + interaction assertions; screenshots only as supporting diagnostics |
| Budget | Vite entry chunks and active checker | No ceiling change; report raw/gzip and entry/initial bytes as baseline→result→delta/% | npm run web:build, npm run architecture:fitness / active budget gate; capture generated asset byte report |
| Deferred workflows | Inventory only | No Extension/No-show/Late Arrival control is introduced without full contract/capability/lifecycle authority | Static path/route/capability inventory and scope audit |

## Pre-existing evidence limits to preserve

- F0.8 D1/API proves same-token replay and staged recovery, but existing browser evidence does not itself simulate a real transport response drop at each boundary.
- Legacy broad product-flow browser runner was not previously a passing proof because its npm Playwright dependency was unavailable. Do not claim it passed unless repaired and rerun.
- Mock Check-in browser evidence does not prove Worker/API/D1 authority; use it only for interaction assertions.
- Existing integrated reassign/check-in/checkout evidence exercises old task presentation; it does not prove Block C route/history/focus/task-return acceptance.
- Screenshots are not behavioral proof. For every mutation assert API result and final D1/business/event state.
- For visual viewport, report an automated reduced-viewport simulation accurately; do not claim physical OS keyboard testing without such a device.
