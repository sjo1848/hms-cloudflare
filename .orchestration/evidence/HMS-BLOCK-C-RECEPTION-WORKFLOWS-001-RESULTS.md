# Block C Reception transactional workflows — results

Task Contract: `.orchestration/contracts/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001.md`

Frozen pre-code checkpoint: `a52f1a9f13a0355f8f7b4ff142d913d91acc5072`

Implementation branch/base: `impl/hms-block-c-reception-workflows` from B5 `fc2daa783b8ef361e39e6945dbdfe2bfe6345b98`
Runtime/data boundary: local synthetic Worker + D1 only.

## Product result

Reception now follows `Queue → Booking/Stay Case → Focused Task → authoritative result → Case/Queue`. New Reservation, Edit Reservation, Reassignment, and Checkout are task-addressable through Reception query state. Check-in retains its approved centered Dialog/full-screen mobile task behavior. Task return and mutation refresh preserve booking identity and Queue lane/search/filter context; the frozen Block B contract/inventory remain unchanged.

- **New Reservation:** progressive guest/date, room/notes, and review steps; uses existing guest and staged reservation-operation APIs. Existing operation identity is retained for replay/recovery; incomplete guest-created operations remain visible and recoverable. No compound cross-store transaction was added.
- **Edit Reservation:** focused two-step edit/review. Availability is presented as a snapshot and revalidated by the existing server command. The task remains available through authoritative board refresh and retains the Case on errors/conflicts.
- **Check-in:** preserves the approved four-stage lifecycle task, readiness rules, blocking/advisory maintenance distinction, server mutation and authoritative refresh. It returns to the current Case/Queue and restores priority selection.
- **Reassignment:** focused from the Case; preserves the existing server quote and interval semantics `[effective_date, original checkout)`, segmented remaining-stay price and version checks. A stale quote receives 409, refreshes the Case/board, disables newly blocked rooms and keeps the task open for recovery.
- **Checkout:** focused task uses server settlement/capability checks and required handoff acknowledgements. A successful local mutation refreshes to CheckedOut, VACANT + DIRTY, while maintenance/service dimensions and the unpaid invoice ledger remain authoritative and unchanged.
- **Extension, No-show, Late Arrival:** `DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT`; the frozen source inventory contains no complete command + capability + lifecycle contract for these workflows.

Task cancellation now uses the shared native Dialog pattern as an Alert Dialog. It preserves a draft on “Keep editing,” clears it only on explicit discard, traps Tab focus, starts focus at the safe action, supports Escape, and does not use browser-native confirmation. Query/history Back and capability refresh remain context-aware; permissions continue to come from `/auth/me` and backend authorization.

## Reception runtime critical path

`load()` starts ancillary reads independently, awaits `/front-desk/board`, and publishes the Queue from that response. `/rooms`, `/guests`, and `/reservation-creation-operations` update their own partial state and retry/error indicators; they do not gate Queue readiness. Request epochs prevent stale responses from overwriting newer board/selection state.

Final synthetic Worker/D1 production-preview regression: `output/playwright/cf-block-b-reception-workspace.log`.

| Event | Relative time in this run |
|---|---:|
| `/rooms` starts | 792 ms |
| `/guests` starts | 797 ms |
| `/reservation-creation-operations` starts | 799 ms |
| `/front-desk/board` starts | 801 ms |
| `/front-desk/board` returns | 2,289 ms |
| Queue DOM ready | 2,601 ms |
| Queue screenshot captured | 2,728 ms |
| `/rooms` returns | 5,293 ms |
| `/guests` returns | 6,297 ms |
| `/reservation-creation-operations` returns | 6,397 ms |

The screenshot was captured while all three auxiliary requests were still pending. This run therefore verifies causal independence; the localhost timings are observations, not absolute targets. The accepted B0 Chrome DevTools trace remains the before evidence: Queue-ready ~2,928 ms, board ~1,085 ms, auxiliary reads ~2.16 s, FCP ~260 ms, LCP ~758 ms. The Block C Playwright trace did not collect new FCP/LCP values, so none are claimed as after measurements. Its observed Queue-ready (~2,601 ms) is from a different run/harness and is not used to claim a controlled timing improvement.

Partial-load/refresh, stale overlapping board response, direct link/reload, browser Back/Forward, application Check-in Back, lane/search/filter/origin/hash continuity, stale authorization refresh, and WIDE/COMPACT/NARROW/landscape Queue and Case behavior passed in the same Block B regression runner.

## Integrated workflow evidence

- `output/playwright/f0-08-reservation-recovery.log`: local Worker/D1 staged creation, guest creation, operation identity, incomplete GUEST_CREATED recovery, replay/retry, same guest recovery, mobile creation, dirty draft keep/discard, and responsive focused-task geometry (including 1280×600, 900×700, 390×844, 320×700 and 844×390). Runner completed with owned process cleanup.
- `output/playwright/f0-11-reception-integrated-desktop.log` and `...-mobile.log`: real PATCH + authoritative board refresh, task dirty-draft keep/discard, Alert Dialog keyboard initial focus/Tab wrap, and real check-in + refreshed CheckedIn result. Viewports 1280×900 and 375×812; Queue lane/search/next selected Case preserved; no page errors.
- `output/playwright/block-c-reassignment-integrated.log`: real Worker/D1 successful remaining-interval repricing and quote validation, plus stale 409 recovery with refreshed authoritative room state; desktop success and mobile conflict; D1 assertions preserve consumed nights, event/financial effects, room states and payment ledger.
- `output/playwright/block-c-checkout-integrated.log`: dirty checkout draft keep/discard, server-authorized checkout and authoritative CheckedOut refresh; WIDE 1280×900, reduced-height 1280×600, COMPACT 900×700, NARROW 390×844 and mobile landscape 844×390. D1 verifies VACANT + DIRTY, maintenance NON_BLOCKING unchanged, service IN_SERVICE unchanged, invoice 36,000 cents and paid 0 (no fabricated settlement). One checkout mutation; lane/search/booking context retained.
- `output/playwright/cf-block-b-reception-workspace.log`, `cf-block-b-reception-links.log`, `cf-block-b-reception-invalid-link.log`, `cf-block-b-reception-partial.log`, `cf-block-b-billing-denied.log`: Queue critical path and stale-response guard; WIDE 1280×600/1280×900, COMPACT 900×700/768×1024, NARROW 390×844/320×700, landscape 844×390; keyboard focus/scroll restoration; direct links, reload, browser history, capability denial/refresh, partial auxiliary errors and independent retries.

Block B accepted screenshots remain in `output/playwright/block-b-*.png`. Block C focused-task screenshots are in `output/playwright/block-c-*.png` and F0.8/F0.11 workflow screenshots. These are supporting evidence; the integrated Worker/D1 checks above are the functional proof.

## Validation

- Full Vitest serial: **35 files / 175 tests passed** (`npx vitest run --maxWorkers=1 --testTimeout=60000`). Includes executing-D1 pricing/reassignment interval, checkout settlement, check-in concurrency, staged reservation operation, authorization and audit rollback tests.
- TypeScript application check: `npm run typecheck` **PASS**.
- Worker/Web generated types: `npm run types:check` **PASS**.
- Production Web build: `npm run web:build` **PASS**.
- Architecture, i18n coverage and bundle gate: `npm run architecture:fitness` **PASS**; i18n unit tests **4/4 PASS**; coverage **25 files PASS**.
- D1 query plans: `npm run test:d1-query-plan` **PASS** (`idx_bookings_status`, `idx_bookings_status_checkout`, keyed inventory).
- Wrangler API and Web dry-runs: `npm run wrangler:dry-run` **PASS**; both exited in `--dry-run` mode; no deployment occurred.
- `git diff --check`: **PASS**.
- Local runner process ownership/cleanup was verified by each integrated shell runner. No real/customer data, external environment or production service was used.

## Bundle baseline → result → delta

Baseline is the accepted Block B entry bundle supplied in the authorization. Result is the final Vite production build, checked by `scripts/check-cloudflare-budgets.mjs`. The initial/entry payload consists of the single JS entry plus its CSS asset.

| Asset | Baseline | Result | Delta bytes | Delta % | Active ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw / entry | 306,733 B | 320,330 B | +13,597 B | +4.433% | 330,000 B |
| JS gzip / entry | 88,540 B | 91,198 B | +2,658 B | +3.002% | 100,000 B |
| CSS raw / entry | 52,127 B | 54,937 B | +2,810 B | +5.391% | 55,000 B |
| CSS gzip / entry | 9,664 B | 10,119 B | +455 B | +4.708% | 15,000 B |
| Aggregate raw | 358,860 B | 375,267 B | +16,407 B | +4.572% | per-asset ceilings above |
| Aggregate gzip | 98,204 B | 101,317 B | +3,113 B | +3.170% | per-asset ceilings above |

All ceilings are unchanged. CSS raw has 63 B remaining; JS raw has 9,670 B remaining. The raw values remain development growth guardrails, not performance targets. No size-based performance claim is made; causal loading evidence is recorded above.

## Scope and review boundary

No Worker API, D1 schema, capability contract, lifecycle meaning, unrelated module, or budget policy changed. No Blocks D–H began. No PR, push, merge, main, staging, deploy, production or real-data action occurred. Extension, No-show and Late Arrival remain deferred as recorded above.

This report and the appended invariant/Pre-Critic results are evidence only. Freeze the substantive implementation as Artifact A, create orchestration-only Boundary B with exact A identity, then run a fresh separate read-only Independent Critic on that exact pair. No PASS is self-declared here.
