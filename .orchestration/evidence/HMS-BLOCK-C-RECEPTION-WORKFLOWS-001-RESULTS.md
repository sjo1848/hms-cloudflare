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

## Independent Critic REWORK and bounded disposition

Fresh separate read-only Independent Critic reviewed initial Artifact A `3e0ea41a53b471993cc60f1f0421b0237ef54055` + Boundary B `e83154dfd0e549fa494e8c90754afe70acd0f9f4`. Verdict: `REWORK`; no `ROADMAP_BLOCKER`. Exact report: `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INDEPENDENT-CRITIC-A-B.md`.

The two MEDIUM findings were repaired under the frozen bounded contract `.orchestration/contracts/HMS-BLOCK-C-REPAIR-HISTORY-FOCUS-001.md`:

- App-opened task close now traverses its own task entry. Direct deep-linked task close replaces its task URL with its existing Case/Queue context. The task-entry marker survives dirty-draft guard navigation.
- Reassignment and Checkout task headings accept programmatic focus; the initial-focus effect retries when direct-link Case restoration completes.
- Bounded self-adversarial browser QA also found browser Forward restored Case content without restoring focus. Each Reception history entry now retains its destination and relevant Booking identity, so Queue, Case and task focus follows that exact entry without focusing on ordinary search/filter edits.

Fresh local Worker/D1/browser Reassignment run passes the exact focus/history assertions: initial Reassignment task focus, cancel to Case, browser Back to Queue without reopening the cancelled task, browser Forward to Case with Case heading focused, and direct task deep-link close preserving `booking_id`. It also reruns successful remaining-stay repricing and the stale 409 path. Exit code 0; runner verified its Worker/Vite/browser trees stopped. See `output/playwright/block-c-reassignment-integrated.log`.

Checkout entry focus was asserted in the checkout browser script. Its final re-execution on reused local synthetic fixtures consistently completed the checkout POST with HTTP 200 and authoritative CheckedOut refresh, then the local Wrangler runtime disconnected during later room/invoice reads; no run is claimed as a complete re-execution. The successful full Worker/D1 checkout report committed in initial Artifact A remains valid for the unchanged settlement/room mutation path; the final full Vitest suite also reruns executing-D1 settlement checks. The bounded changes to checkout are heading focus and shared browser-history handling. No local real/customer data was involved.

## Integrated workflow evidence

- `output/playwright/f0-08-reservation-recovery.log`: local Worker/D1 staged creation, guest creation, operation identity, incomplete GUEST_CREATED recovery, replay/retry, same guest recovery, mobile creation, dirty draft keep/discard, and responsive focused-task geometry (including 1280×600, 900×700, 390×844, 320×700 and 844×390). Runner completed with owned process cleanup.
- `output/playwright/f0-11-reception-integrated-desktop.log` and `...-mobile.log`: real PATCH + authoritative board refresh, task dirty-draft keep/discard, Alert Dialog keyboard initial focus/Tab wrap, and real check-in + refreshed CheckedIn result. Viewports 1280×900 and 375×812; Queue lane/search/next selected Case preserved; no page errors.
- `output/playwright/block-c-reassignment-integrated.log`: fresh real Worker/D1 successful remaining-interval repricing and quote validation, stale 409 recovery with refreshed authoritative room state, initial focus, cancel/Back/Forward without task reopen, Case-focus restore, and direct deep-link return; desktop success and mobile conflict; D1 assertions preserve consumed nights, event/financial effects, room states and payment ledger; exit 0 and process cleanup verified.
- `output/playwright/block-c-checkout-integrated.log` is the complete Worker/D1 checkout run from initial Artifact A: dirty checkout draft keep/discard, server-authorized checkout and authoritative CheckedOut refresh at WIDE 1280×900, reduced-height 1280×600, COMPACT 900×700, NARROW 390×844 and mobile landscape 844×390. D1 verifies VACANT + DIRTY, maintenance NON_BLOCKING unchanged, service IN_SERVICE unchanged, invoice 36,000 cents and paid 0 (no fabricated settlement). During bounded REWORK, the task-entry focus assertion passed and checkout returned HTTP 200 with authoritative refresh, but subsequent local Wrangler room/invoice reads disconnected; these incomplete reruns are disclosed and not represented as full PASS. One successful checkout mutation per attempted synthetic fixture; no real data.
- `output/playwright/cf-block-b-reception-workspace.log`, `cf-block-b-reception-links.log`, `cf-block-b-reception-invalid-link.log`, `cf-block-b-reception-partial.log`, `cf-block-b-billing-denied.log`: Queue critical path and stale-response guard; WIDE 1280×600/1280×900, COMPACT 900×700/768×1024, NARROW 390×844/320×700, landscape 844×390; keyboard focus/scroll restoration; direct links, reload, browser history, capability denial/refresh, partial auxiliary errors and independent retries.

Block B accepted screenshots remain in `output/playwright/block-b-*.png`. Block C focused-task screenshots are in `output/playwright/block-c-*.png` and F0.8/F0.11 workflow screenshots. These are supporting evidence; the integrated Worker/D1 checks above are the functional proof.

## Validation

- Final post-REWORK Vitest serial: **35 files / 175 tests passed** (`npm run check`, `vitest run --maxWorkers=2`). Includes executing-D1 pricing/reassignment interval, checkout settlement, check-in concurrency, staged reservation operation, authorization and audit rollback tests.
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
| JS raw / entry | 306,733 B | 321,619 B | +14,886 B | +4.852% | 330,000 B |
| JS gzip / entry | 88,540 B | 91,486 B | +2,946 B | +3.327% | 100,000 B |
| CSS raw / entry | 52,127 B | 54,937 B | +2,810 B | +5.391% | 55,000 B |
| CSS gzip / entry | 9,664 B | 10,119 B | +455 B | +4.708% | 15,000 B |
| Aggregate raw | 358,860 B | 376,556 B | +17,696 B | +4.931% | per-asset ceilings above |
| Aggregate gzip | 98,204 B | 101,605 B | +3,401 B | +3.463% | per-asset ceilings above |

All ceilings are unchanged. CSS raw has 63 B remaining; JS raw has 8,381 B remaining. Relative to initial Artifact A build, the bounded focus/history correction adds 1,289 JS raw bytes (+0.402%) and 288 JS gzip bytes (+0.316%); CSS is unchanged. The raw values remain development growth guardrails, not performance targets. No size-based performance claim is made; causal loading evidence is recorded above.

## Scope and review boundary

No Worker API, D1 schema, capability contract, lifecycle meaning, unrelated module, or budget policy changed. No Blocks D–H began. No PR, push, merge, main, staging, deploy, production or real-data action occurred. Extension, No-show and Late Arrival remain deferred as recorded above.

This report and the appended invariant/Pre-Critic results are evidence only. The initial A+B pair received Independent Critic REWORK and its findings are repaired. Freeze this replacement substantive implementation as Artifact A2, create orchestration-only Boundary B2 with exact A2 identity, then run a fresh separate read-only Independent Critic on that exact pair. No PASS is self-declared here.
