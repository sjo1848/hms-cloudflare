# Block H — Scenario Inventory and Requirement → Evidence Matrix

Task: `HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001`
Base: `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`
Branch: `impl/hms-block-h-cross-module-hardening`
Authority: Issue #54, Controller comment `5956017495`.

## Exact route, API, capability and evidence inventory

| Surface | Route / frontend owner | Existing authoritative API and capability | Existing evidence / gaps H must address |
|---|---|---|---|
| Shell | `/bookings`, `/rooms`, `/housekeeping`, `/billing`, `/guests`, `/reports`, `/users`, `/network`; `AppShell.tsx`, `navigation.ts`, `router.tsx`, `capabilities.tsx` | `/api/v1/auth/me`; server auth/membership and centralized capability authority | `cf-web-arch-browser.playwright.js` covers SPA route transitions and Back on part of the nav, not full Forward/context continuity. H adds cross-route assertions without client permission truth. |
| Reception | `/bookings`; ReceptionPage, CheckInTask, useReceptionWorkspace | `/api/v1/front-desk/board`, `/bookings`, `/availability`, existing C lifecycle/command routes with server capabilities | P0.1 and product-flow runners prove Worker/D1 flow but not the complete responsive/history matrix. |
| Rooms | `/rooms`; RoomsPage | `/api/v1/rooms`, room state/readiness/sellability and existing authorized E routes | D Results; `cf-ux-rooms-guests-browser.playwright.js` delayed detail is mock-driven. Do not infer availability from status. |
| Housekeeping/Maintenance | `/housekeeping`; HousekeepingPage/workspace/API | existing `/api/v1/housekeeping...` commands, central capability and operational D1 | CF-I05 browser and executing D1 prove stale-board protection and lifecycle; add cross-route return/context assertions. |
| Booking Account | contextual `/billing`; BillingWorkspace | `/api/v1/bookings/:id/account`, charges and payment routes; F-account capabilities | F0.9 extra-charge integration and CF-I06 D1 tests; do not execute the combined browser script that also tests Cash. |
| Guests | `/guests`; GuestsPage | `/api/v1/guests`, `/api/v1/bookings?limit=100`; `guests.read/write`, `bookings.read` | H's G guest browser covers synthetic context-read failure/retry, not D1. Keep attribution explicit. |
| Reports | `/reports`; ReportsPage/OperationalReportsPage | analytics KPI/revenue/occupancy APIs; `analytics.kpis.read`, `reports.revenue.read`, `reports.occupancy.read` | CF-I08 executing D1 and G browser. Preserve server date/state/cents semantics and selected range on retry/history. |
| Hotel users | `/users`; UsersPage/OperationalUsersPage | `/api/v1/users`, role/deactivation routes; `users.read/write/delete`; CONTROL_DB memberships/audit | CF-I07 executing Worker/D1; G dialog keyboard/synthetic 409 browser. Denied requests must have correct seeded actor and zero side effects. |
| Network | `/network`; NetworkPage | `/api/v1/hotels`, plan mutation, `/api/v1/hotels/network-kpis`; server `saas.hotels.read/write`, allow-listed operational D1 | CF-I07/I08 Worker/D1 and G browser; must fail truthfully on configured-store unavailability, not return partial success. |

## Frozen scenario matrix

| ID | Requirement | Expected surface / journey | Acceptance | Evidence planned |
|---|---|---|---|---|
| H-01 | Shell route and capability continuity | App Shell → direct route → reload → Back → Forward across Reception, Rooms, Housekeeping, Account, Guests, Reports, Users and Network | URL/state/identity stay canonical; route capability follows current server response; application Back returns to the originating case when supplied by existing contract | Existing app-shell tests plus H-level browser navigation assertions; `/auth/me` and route capture; server capability/API tests remain separate. |
| H-02 | Reception lifecycle and authoritative conflict | Queue → selected Booking/Stay Case → check-in → Rooms/Housekeeping context → return | Existing BLOCKING/NON_BLOCKING semantics; canonical 409 has visible recovery and authoritative refresh; no stale success; case identity, lane/filter/search and focus restored | `p0-1-integrated-browser.sh` local Worker/D1 plus lifecycle executing-D1 tests; browser path under each viewport group. |
| H-03 | Booking Account continuity, F-account only | Case → contextual Account → existing charge/payment → return/reload | Account remains Booking/Stay-grain; same operation retry is duplicate-safe; Cash never opened/tested; case context/focus restored | `cf-f0-09-extra-charge-idempotency-integrated.sh`; CF-I06 executing-D1 only for payment race/idempotency (not its combined Cash browser). |
| H-04 | Room and service dimensions survive E actions | Rooms ↔ Housekeeping/Maintenance task ↔ Rooms | Occupancy, Housekeeping, Maintenance, Service and derived Readiness remain separate and truthful | CF-I05 executing D1 plus `cf-i05-browser-regression.sh`; verify durable state against authoritative reads. |
| H-05 | Guest booking context survives failure | Guests list/detail → context error → retry → return | Error is not labeled as empty stay history; selection/search/filter/context retained | `cf-block-g-guest-context-browser.sh` synthetic HTTP 503/retry explicitly; real tenant-scoped API/D1 read evidence is cited separately. |
| H-06 | Reports date/state/read retry continuity | Reports → range edit/refresh → Back/Forward | Current range and server-derived values retained; invalid range/error/retry truthful; cents/date/state remain backend-authoritative | `cf-i08-regression.sh` executing Worker + D1; existing CF-I08 browser runner and H navigation assertions. |
| H-07 | User admin capability-safe task | Shell/Users → role/deactivation task → cancel/success/denial → return | Server-owned capability, no role-name UI bypass, correct denial; safe initial focus, keyboard cancel, focus return, exact audit | `cf-i07-regression.sh` Worker/D1 plus G admin browser; explicit distinction synthetic UI 409 vs canonical D1 cases. |
| H-08 | Network control-plane and aggregate continuity | Network → hotel select/date refresh → return | Exact allow-listed hotels/metrics; multi-hotel totals/ranking; unavailable configured D1 fails truthfully | CF-I07/I08 executing Worker plus CONTROL_DB and two configured local D1s; `cf-i08-browser-regression.sh` where available. |
| H-09 | Delayed/out-of-order reads | Reception board, Housekeeping board, Rooms detail, Guest context and Reports refresh | Older completion cannot overwrite newer selection/data; error/retry does not erase authoritative prior context | Reuse CF-I05 stale board Worker/D1 proof; add H browser race assertion for route/selection boundary; identify mock-controlled responses as synthetic. |
| H-10 | Responsive operation, not shell-only | Each H-02..H-09 critical journey at WIDE 1280×900, COMPACT 768×812, NARROW 375×812, reduced-height 375×600, landscape 844×390 | Material action remains reachable, internal scroll works, page has no unintended horizontal overflow, selected case/filter/date preserved | Existing per-module runners plus H viewport matrix evidence; no screenshot-only PASS. |
| H-11 | Keyboard/focus/accessibility | Shell menus, forms, case tasks, account, user dialog and route return | Accessible names/status/error semantics; visible keyboard focus; Tab/Shift+Tab where scoped; initial/return focus; Escape where supported; no focus loss after back/forward | Browser assertions + Lighthouse accessibility audit as supplemental; manual DOM/a11y snapshots and focus assertions; screenshots diagnostic only. |
| H-12 | Integrated Worker/D1 vs synthetic truth | All claimed local transactional journeys | Actual local Worker/D1 is used where the row claims integration; synthetic mocked errors/conflicts are never described as backend proof; owned processes terminate | Runner logs, exact fixture/D1 queries, browser request classification and post-run process cleanup. |
| H-13 | Budget/scope/artifact | Production build and artifact boundary | Ceilings unchanged; baseline→result bytes/% for JS/CSS raw/gzip, aggregate and initial/entry; no Cash/schema/staging/production/main/merge | `npm run check`, `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, API/Web Wrangler dry-runs, scope/route audit, final Pre-Critic. |

## Viewport and evidence attribution

Responsive set: WIDE `1280×900`; COMPACT `768×812`; NARROW `375×812`; reduced height `375×600`; landscape `844×390`. A single module's test does not prove these conditions for another module. Evidence records must identify route, viewport, journey and evidence type (`integrated Worker/D1`, `API/D1`, `synthetic browser`, `static`, or `diagnostic screenshot`).

## Known base gaps

- No existing single end-to-end H runner covers all eligible modules.
- Existing browser suites split viewport coverage by module; F-account browser evidence co-runs Cash and cannot be used as an H test.
- `cf-web-arch-browser.playwright.js` checks part of nav continuity and Back, but not Forward plus context restoration across the whole accepted A–G path.
- Guest 503→retry and admin 409 UI browser cases are synthetic; the authoritative API/D1 regressions are independent evidence.
- Existing module-level stale-read tests do not prove that an obsolete completion cannot replace cross-route current context.
- Issue #52 authenticated staging smoke remains externally blocked before browser discovery; it is not H local/synthetic evidence.
