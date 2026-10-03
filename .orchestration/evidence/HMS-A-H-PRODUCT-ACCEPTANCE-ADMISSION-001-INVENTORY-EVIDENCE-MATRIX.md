# A–H Candidate Inventory, Change Audit and Product Acceptance Evidence Matrix

Task: `HMS-A-H-PRODUCT-ACCEPTANCE-ADMISSION-001`
Canonical coordination: Issue #56.
Accepted H source: `106b4e98faceaf53a1a0e69650124fff863a9157`.
Deployed staging base: `074804329f487c2cfb0a9e5123f1f90b1a0e0252`.

## 1. Remote lineage proof

Read-only remote refs were verified with `git ls-remote`:

| Ref | Remote SHA | Meaning |
|---|---|---|
| `acceptance/staging` | `074804329f487c2cfb0a9e5123f1f90b1a0e0252` | Current deployed staging source checkpoint per Issue #52 |
| `impl/hms-block-h-cross-module-hardening` | `106b4e98faceaf53a1a0e69650124fff863a9157` | Accepted Block H normalized closure; Issue #54 Controller PASS |

`git merge-base(staging,H) = 074804329f487c2cfb0a9e5123f1f90b1a0e0252`; `git rev-list --left-right --count staging...H = 0 12`; staging is an ancestor. A pure fast-forward to H is mechanically possible. No branch was moved in this admission. Future target is H SHA itself, not a Product Acceptance metadata commit.

## 2. Every intervening commit classification

| Commit | Subject | Classification | Audit disposition |
|---|---|---|---|
| `d2afef78e8f04f5bfce52ff424535620e4dc817d` | `docs: record blocked staging smoke handoff` | Staging orchestration/evidence | Records migration/deploy verification and blocked authenticated smoke; no product change. |
| `c88401b992157d12a0613533dfa4e4ddc0e5c657` | `docs: classify staging smoke as external blocker` | Staging orchestration metadata | Controller-classified test-harness limitation; no product change. |
| `d9ff3325709633d7760dd236977b90f582b1b144` | `docs: authorize Block G after technical staging deploy` | G authorization metadata | Records G authorization after staging technical pass; no product change. |
| `74be2f2c8bf37b3aecb3f7cc3929d451238a1e07` | `docs: freeze Block G contract and admission evidence` | Accepted G contract/evidence/orchestration | Task Contract, inventory, invariant evidence, Pre-Critic; no product change. |
| `66d43fd28d16fd6379b23c22e73d74578533fe57` | `feat: complete Block G Guests Reports admin and Network` | Accepted G product + tests/evidence | Controller-accepted Artifact A; web Guests, user admin and i18n changes plus G browser/regression harness and evidence. No API/domain/schema/migration/config/package changes. |
| `c62fd472ac3aca634373147be6eb1dd77f01ef6a` | `docs: set Block G independent critic boundary` | Accepted G orchestration boundary | Exact G review boundary; no product change. |
| `493c431b38362fba9e6371f184b2d4649ed492e1` | `docs: discharge Block G critic metadata condition` | G metadata-only condition discharge | No product change. |
| `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd` | `docs: record Block G Controller PASS` | G Controller closure metadata | Issue #54 confirms G PASS and H authorization; no product change. |
| `3f3b91fd307beb9a9f67f1113067667fc0f48f9f` | `docs: freeze Block H contract and admission evidence` | Accepted H contract/evidence/orchestration | H admission artifacts; no product change. |
| `1f4a7f863989792551e78873b4d5bc8ef3cf3bff` | `feat: complete Block H cross-module hardening` | Accepted H product + tests/evidence | Controller-accepted H Artifact A; DropdownMenu keyboard focus and Reception Check-in local-state reset, regression runners, screenshots/logs/results. |
| `e45c69bcb4c0e9b59281fd565d60fe8ad9b70649` | `docs: freeze Block H critic boundary` | Accepted H orchestration boundary | Exact A+B handoff; no product change. |
| `106b4e98faceaf53a1a0e69650124fff863a9157` | `docs: discharge Block H critic conditions` | Accepted H evidence/orchestration normalization | Controller-disclosed runtime wording and exact review closure; no product change. |

### Material file classification

- **Accepted G product:** `apps/web/public/i18n/{en,es-AR}.json`; `apps/web/src/features/guests/GuestsPage.tsx`; `apps/web/src/features/users/OperationalUsersPage.tsx`; `apps/web/src/features/users/users-operational.css`; `apps/web/src/i18n/index.tsx`; `apps/web/src/i18n/message-key.ts`; `apps/web/src/i18n/locales/{en,es-AR}/{guests,users}.ts`.
- **Accepted H product/hardening:** `apps/web/src/components/ui/dropdown-menu.tsx`; `apps/web/src/features/reception/ReceptionPage.tsx`.
- **Accepted tests/evidence:** `scripts/cf-block-g-guest-context-browser.sh`, `scripts/cf-block-g-guest-context.playwright.js`, and the changed G/H browser/regression runners under `scripts/`; `output/playwright/**` captures/logs modified by accepted G or added under H. These are diagnostic/executable evidence, not new production behavior.
- **Orchestration metadata/evidence:** `.orchestration/STATE.md`, `.orchestration/STATUS.json`, accepted G/H contracts, matrices, invariant and Pre-Critic records, Results, and `.orchestration/evidence/HMS-STAGING-PHASE5-001.md`.
- **Unexpected/unreviewed:** none found. The exhaustive machine-derived path list is appended below by category; total staging→H diff is 74 paths.

Exact H acceptance authority: Issue #54 comment `5963443020`, final `CONTROLLER_VERDICT: PASS_BLOCK_H`, accepts H A/B and normalized HEAD `106b4e98...`; the Controller explicitly states the changed B→H normalization is evidence/orchestration-only. G PASS is recorded in the H state and Issue #54 authority chain. No Product Acceptance result is inferred from those development verdicts.

## 3. Surface and capability inventory for authenticated acceptance

| Area | Accepted user surface and route | Authoritative integration boundary | Scope rule |
|---|---|---|---|
| A — Access/shell/context | Cloudflare Access → app shell; direct route/deep-link/reload; desktop nav and mobile nav | Access assertion → API `/api/v1/auth/me`; server-owned hotel capabilities | Access remains fail-closed; no local-auth bypass or role-map invention. |
| B — Reception | `/bookings` Reception Attention/Arrivals/In-house/Departures/Reservations; queue search/filter; selected Booking/Stay Case | `/api/v1/front-desk/board`, booking/lifecycle and independent auxiliary reads | Verify queue/case context and case return; no Cash in Reception. |
| C — Reservation/lifecycle | Focused New Reservation, Edit Reservation and existing Check-in, reassignment, checkout tasks from Case | Existing reservation operation recovery, lifecycle commands, room inventory/readiness, authoritative Account quote/settlement | Use only supported capabilities/contracts. No invented extension/no-show/late-arrival. Any write uses synthetic staging fixture only after separate authorization. |
| D — Rooms | `/rooms`: occupancy, housekeeping, maintenance impact, service, readiness, sellability/context | Existing inventory/availability and related operation APIs | Display dimensions independently; no generic CRUD or unsupported HK/Maintenance action. |
| E — Housekeeping/Maintenance | `/housekeeping`: task queue/history and Maintenance Case/impact states | Existing housekeeping/maintenance transitions, audit and room state | Exercise only accepted actions/capabilities; preserve room dimensions and contextual Booking/Stay impact. |
| F — Booking Account | `/billing` contextual Booking/Stay Account, charges, payments/history and retry | Existing Account/billing APIs, idempotent operation identities and D1 ledger | F-account only. **F-cash/OD-1, Cash totals/close/session are excluded.** |
| G — Guests | `/guests`: search, select, guest Booking/Stay history/context and retry | Guest and booking reads, tenant-scoped operational D1 | Context error must not look like empty history. |
| G — Reports | `/reports`: date range, occupancy/revenue, loading/error/empty/retry | Reports API, operational D1 and integer-cent/source-state semantics | Validate displayed values/date context; don't substitute screenshot-only evidence. |
| G — Hotel administration | `/users`: user/membership views, capability-aware actions and denial | Central server capabilities and CONTROL_DB | Do not mutate existing privileged accounts during smoke; any synthetic membership write requires explicit future test authorization. |
| G — Network | `/network`: configured hotel list/plan/metrics/range | Network capability, CONTROL_DB registry and configured hotel D1 reads | No policy/plan/tenant configuration changes in admission; no cross-tenant write. |
| H — integrated continuity | A–G routes/deep links; task return, application Back, browser Back/Forward, refresh and context | Accepted H route/history and state handling | Keep read-only vs synthetic/mock vs Worker/D1 claims clearly labeled. |

## 4. Requirement → surface → acceptance → evidence

| ID | Requirement | Expected surface | Acceptance for the eventual authenticated staging run | Evidence to retain |
|---|---|---|---|---|
| PA-SM-01 | Access/login | Access challenge and staging URL | Anonymous root/API remain non-2xx (expected 302); login with allowed Cloudflare account-member identity; protected app loads; no bypass. Record identity class and app/policy ID, never token/cookie. | Workflow/Access policy snapshot, HTTP status, browser route, timestamp and run SHA. |
| PA-SM-02 | Shell/capability navigation | App shell and nav at all contracted widths | `/api/v1/auth/me` establishes intended hotel/membership/capabilities; only permitted routes/actions visible; direct denied route remains denied. | Sanitized identity/capability evidence, route/API status, browser assertions. |
| PA-SM-03 | Reception and Case | `/bookings` queue/search/filter/Booking-Stay Case | Queue and case populate; selected booking, guest, room, date, state/readiness, attention and account context are coherent; auxiliary partial failure/retry does not falsely clear queue/context. | Authenticated browser assertions plus API/Worker response IDs; any synthetic failure labeled. |
| PA-SM-04 | New/Edit Reservation | Focused reservation tasks launched from Case | Existing guest selection/search, approved guest create, date/availability/room/rate review, create/recovery and edit/conflict path behave per accepted contract; reload/cancel retains safe context. | Browser path, operation IDs, authoritative response/D1 before-after only if separately authorized. |
| PA-SM-05 | Check-in | Reception focused task | Readiness and BLOCKING vs NON_BLOCKING maintenance semantics hold; conflict refresh is authoritative; successful transition returns to correct next Case. | Browser and API evidence; if a state transition is unavailable in fixture mark NOT EXERCISED, never simulate success. |
| PA-SM-06 | Reassignment / checkout | Case task → authoritative result → Case | Remaining-stay quote/conflict protection holds; checkout requires server settlement, zero remaining due where required, and results in accepted VACANT+DIRTY while maintenance/service remain unchanged. | Exact quote/version and API results; D1 assertions only if explicitly authorized and synthetic. |
| PA-SM-07 | Rooms | `/rooms` desktop/compact/mobile | Independent room dimensions/readiness/sellability and booking/guest/maintenance context agree with authoritative state; no action crosses E boundary. | UI + API read evidence and viewport/control assertions. |
| PA-SM-08 | Housekeeping/Maintenance | `/housekeeping` queue/task/history and case | Authorized task and maintenance impact/status render; existing domain transitions and conflict/retry preserve state/audit. | UI/API evidence; writes only with explicit synthetic-test authorization. |
| PA-SM-09 | Booking Account | `/billing` from selected Booking/Stay | Authoritative balance/charges/payment history; approved charge/payment retry identity does not duplicate; return restores source Case. Cash is not opened. | UI/API and exact operation identity; D1 ledger proof only if separately authorized. |
| PA-SM-10 | Guests | `/guests` | Search/selection/Booking-Stay history; context read failure and retry preserve selection and never claim false empty history. | UI/API evidence; any injected failures explicitly synthetic. |
| PA-SM-11 | Reports | `/reports` | Date/state filters, integer-cent totals, zero/empty and errors agree with source semantics; current filters survive refresh/navigation. | UI plus read-only API values reconciled against fixture. |
| PA-SM-12 | Hotel Admin | `/users` | Correct server capability controls reachability; protected denial stays fail-closed; no user/membership is changed by default smoke. | Browser/API read/denial evidence; synthetic write only if separately authorized. |
| PA-SM-13 | Network | `/network` | Authorized network view and configured D1 aggregation are complete; unavailable binding/error is truthful; no plan or registry mutation. | Browser/API read result, configured-binding IDs redacted as needed. |
| PA-SM-14 | Navigation/continuity | Cross-module direct links, reload, app Back, browser Back/Forward | Lane/search/filter/selected booking/date and scroll/focus context are retained according to each accepted contract; browser navigation does not create duplicate task entries or stale capability state. | Browser history/URL/focus assertions and exact viewport. |
| PA-SM-15 | Responsive/accessibility | `1280×900` WIDE, `768×812` COMPACT, `375×812` NARROW, `375×600` reduced height, `844×390` mobile landscape | Execute material controls (not shell reachability only); no unintended horizontal overflow; critical controls reachable; keyboard-visible focus, labels, task focus/return and Escape/Tab semantics work. | Executable browser assertions; screenshots diagnostic only. |
| PA-SM-16 | Recovery/data truth | Loading, error, retry, stale/out-of-order read and canonical conflict | No stale/partial result overwrites newer authoritative state; no false mutation success; retry preserves exact operation where required. | Network/browser traces and API/D1 state only under separate authorization. |
| PA-SM-17 | Build/deploy identity | Existing staging workflow | deployed source SHA exactly H; API/Web Worker version/revision recorded; migrations, seed-preservation and Access checks pass; no surprise generated config. | Workflow/run URL, commit SHA, worker revision IDs, read-only migration status, seed marker hashes. |

### Mutating acceptance scenarios — separate authorization required

Reservation create/edit, check-in, reassignment, checkout, housekeeping/maintenance commands, charges/payments, and admin writes can modify remote D1. They are described here as future acceptance coverage, **not performed or authorized now**. Before execution, the Controller decision must identify the allowed synthetic fixture/tenant, operations, intended row/event deltas, idempotency keys, evidence reads, and whether supported cleanup is permitted. No direct SQL, fixture reset/reseed, Cash transaction, or real data. If authorization is read-only only, mark those mutations NOT RUN and do not claim full authenticated Product Acceptance.

## 5. Prior Issue #52 blocker disposition

Issue #52 remains owner of the deployed A–F-account technical result and historical authenticated-smoke context. It records `STAGING_DEPLOYED_TECHNICALLY_VERIFIED_UI_SMOKE_PENDING`; run `36968916971` succeeded on exact source `074804...`; both hotels advanced migrations `0019–0030` once; fixture/financial preservation and anonymous Access probes passed. The previous `node_repl` error prevented browser discovery/navigation at that time.

Now the Chrome DevTools MCP `navigate_page` and `evaluate_script` tools are available and operate; this browser can reach the Cloudflare Access sign-in page. Anonymous web and API status are both `302`. No authenticated session was present and no protected app route was opened, so **the A–F authenticated smoke remains pending**. The old tool-init blocker is no longer reproduced on the current browser path; the remaining constraint is availability of an allowed Access identity/session and a separately authorized staging smoke after promotion. This does not justify bypassing Access or treating the smoke as passed.

## Exhaustive staging→H changed-path manifest

Total unique changed paths: 74. Each path is classified below; no omitted or unreviewed material path was found.

- `.orchestration/STATE.md` — Orchestration metadata.
- `.orchestration/STATUS.json` — Orchestration metadata.
- `.orchestration/contracts/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/contracts/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001-INVARIANTS.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001-INVENTORY-EVIDENCE-MATRIX.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001-PRECRITIC.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001-RESULTS.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-ADMISSION-PRECRITIC.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-FINAL-PRECRITIC.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-INVARIANTS.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-INVENTORY-EVIDENCE-MATRIX.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-RESULTS.md` — Accepted contract/evidence/orchestration record.
- `.orchestration/evidence/HMS-STAGING-PHASE5-001.md` — Accepted contract/evidence/orchestration record.
- `apps/web/public/i18n/en.json` — Accepted Block G web/i18n product.
- `apps/web/public/i18n/es-AR.json` — Accepted Block G web/i18n product.
- `apps/web/src/components/ui/dropdown-menu.tsx` — Accepted Block H product/hardening.
- `apps/web/src/features/guests/GuestsPage.tsx` — Accepted Block G web/i18n product.
- `apps/web/src/features/reception/ReceptionPage.tsx` — Accepted Block H product/hardening.
- `apps/web/src/features/users/OperationalUsersPage.tsx` — Accepted Block G web/i18n product.
- `apps/web/src/features/users/users-operational.css` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/index.tsx` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/locales/en/guests.ts` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/locales/en/users.ts` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/locales/es-AR/guests.ts` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/locales/es-AR/users.ts` — Accepted Block G web/i18n product.
- `apps/web/src/i18n/message-key.ts` — Accepted Block G web/i18n product.
- `output/playwright/cf-i05-integrated-housekeeping.png` — Accepted Block G/H test output/evidence.
- `output/playwright/cf-i07-admin.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-cf-i05-integrated-housekeeping.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-cf-i07-admin.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-cf-i08-integrated.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f0-08-reception-recovery-mobile.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f0-08-reservation-recovery.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f0-09-extra-charge-idempotency.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f0-09-final-d1.json` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f04-reassignment-desktop-success.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f04-reassignment-mobile-conflict.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-f05-reassignment-authoritative-quote-desktop.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-p0-1-arrival-desktop.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-p0-1-arrival-mobile.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-p0-1-checkin-desktop-task.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-p0-1-checkin-mobile-task.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-p0-1-worker-api.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-blocking.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-conflict.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-dialog.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-nonblocking-advisory.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-reception.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-desktop-success-return.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-blocking-conflict-detail.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-blocking-conflict.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-drawer.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-nonblocking-advisory.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-reception.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-ux-ui-checkin-mobile-success-return.png` — Accepted Block G/H test output/evidence.
- `output/playwright/h-wave12-reassignment-integrated.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-wrangler-4.125-crash-api.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-wrangler-4.125-crash-debug.log` — Accepted Block G/H test output/evidence.
- `output/playwright/h-wrangler-4.125-crash-web.log` — Accepted Block G/H test output/evidence.
- `scripts/cf-block-g-guest-context-browser.sh` — Accepted Block G/H regression/test harness.
- `scripts/cf-block-g-guest-context.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-f0-09-extra-charge-idempotency.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-i03-regression.sh` — Accepted Block G/H regression/test harness.
- `scripts/cf-i05-browser-regression.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-i07-browser-regression.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-i08-browser-regression.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-i08-browser-regression.sh` — Accepted Block G/H regression/test harness.
- `scripts/cf-i08-regression.sh` — Accepted Block G/H regression/test harness.
- `scripts/cf-ux-rooms-guests-browser.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/cf-web-arch-browser.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/p0-1-arrival-browser.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/p0-1-arrival-integrated.playwright.js` — Accepted Block G/H regression/test harness.
- `scripts/p0-1-integrated-browser.sh` — Accepted Block G/H regression/test harness.
