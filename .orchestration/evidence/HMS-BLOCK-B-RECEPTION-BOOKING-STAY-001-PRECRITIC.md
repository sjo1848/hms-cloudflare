# Pre-Critic Gate — HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001

Task Contract: `.orchestration/contracts/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001.md` (frozen before implementation; SHA256 is recorded in the recovery addendum). This is Codex's mandatory internal gate, not an Independent Critic verdict.

## Registry and scope

All 24 IDs currently present in `.orchestration/INVARIANTS.md` are classified in `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INVARIANTS.md`, with rationale and evidence. Contract prose says “all 25”, while its table and current registry each contain the same 24 IDs; this count typo is disclosed, with no missing current registry identity. All APPLIES invariants are PASS; other rows are justified N/A. No material product/API/schema/capability/lifecycle/finance contract changed. No C–H workflow or real data was started. The user-authorized scope is Reception presentation and read orchestration, with regression-only coverage of existing workflows.

## Adversarial acceptance and evidence

| Gate | Result | Evidence |
|---|---|---|
| Queue critical path | PASS: `/front-desk/board` alone populates Queue; the three ancillary reads begin independently and remain pending after Queue screenshot. Queue load does not await them through `Promise.all`. Independent partial error/retry and refresh/context behavior pass. | `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`; `block-b-queue-before-aux-settle.png`; `cf-block-b-reception-workspace.log`; `cf-block-b-reception-partial.log` |
| Queue semantics, ordering, stale responses | PASS: existing board rows/priority and operations preserved; deliberately nonlexical fixture order; old overlapping response ignored. | `cf-block-b-reception-workspace.log`; `queue.test.ts`; integrated Worker/D1 logs |
| Booking/Stay continuity and navigation | PASS: queue/case selection, filters, search, direct/deep links, reload, application Back, browser Back/Forward, capability refresh, focus and scroll restoration asserted. | `cf-block-b-reception-links.log`; `cf-block-b-capability-refresh.log`; workspace and partial logs |
| Responsive and interaction | PASS: WIDE 1280×600/900, COMPACT 900×700 and 768×1024, NARROW 390×844 and 320×700, landscape 844×390. Queue→Case model, working filters/search, action reachability, no overflow/occlusion, keyboard/focus, reduced-height and context continuity asserted. | `cf-block-b-reception-workspace.log`; 12 Queue/Case screenshots under `output/playwright/block-b-*` |
| Authorization and separation | PASS: server-owned `/auth/me` capability refresh; Billing compatibility route allow/deny and API 403. Reception does not embed Billing/Cash. | capability-refresh and Billing allow/deny logs; `INV-RBAC-001` evidence |
| Existing workflow regression | PASS: local synthetic Worker+D1 check-in, reassignment success/conflict and remaining-stay semantics, Housekeeping/Maintenance, Billing/atomic cents, RBAC/audit/network. These are regression-only. | `f0-11-reception-integrated-mobile.log`; `cf-wave12-reassignment-integrated.log`; `cf-i03`, `cf-i05`, `cf-i06`, `cf-i07` API and browser logs |
| Unit/integration, types/build/architecture/i18n/budget | PASS: `npm run check` (35 files / 174 tests), generated Worker/Web type check, production Vite build, architecture Fitness II, i18n, active bundle checker, query-plan inspection, Wrangler API/Web dry-runs. | `block-b-npm-check.log`, `block-b-types-check.log`, `block-b-web-build.log`, `block-b-architecture-fitness.log`, `block-b-d1-query-plan.log`, `block-b-wrangler-dry-run.log` |
| Runtime and bundle claims | PASS with limits disclosed: final-build Chrome DevTools trace summary and Resource Timing; initial Queue screenshot before three auxiliary responses finish; FCP/LCP reported separately. Raw DevTools trace export was denied by MCP filesystem-root allowlist and is not claimed. Synthetic local measurements only. Bundle records baseline→result→delta bytes/% for JS/CSS raw+gzip and initial/entry payload. | `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`; build and budget logs |
| Process ownership and hygiene | PASS: integrated runners verify owned local Worker/Vite/proxy/browser process trees stopped before PASS; final `git diff --check` PASS. | runner logs; final command recorded at publication |
| Mutation/invariant/scope audit | PASS: no new business mutation, schema, endpoint, capability, lifecycle, money, tenant or domain behavior; concrete invariant-to-evidence map in invariant record. | `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INVARIANTS.md`; changed-path audit; inherited regression logs |


## Independent review and bounded rework disposition

The first exact pair A `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B `903436fcb69e3e412db7a41aeaacde3a8cfa1504` received a fresh read-only Critic verdict `REWORK`, one MEDIUM finding: filter labels/counts collided in the WIDE 1280×600 Queue and that viewport lacked geometry/operation assertions. The disposition is preserved in `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INDEPENDENT-CRITIC-A-B.md`. Frozen repair contract `HMS-BLOCK-B-REPAIR-WIDE-QUEUE-FILTERS-001.md` changed desktop filters to two columns and proves all label/count bounds, height and Arrivals→All at exactly 1280×600.

A required Wave12 run initially timed out waiting for the reassignment success status after HTTP 200. The frozen bounded verification contract `HMS-BLOCK-B-REPAIR-REASSIGN-SUCCESS-NOTICE-001.md` was based on a mistaken first source read. A direct inspection of immutable Artifact A confirms `useReceptionWorkspace.ts` already sets the existing notice after `closeCase()` and authoritative `load()`; no product source change was needed or made for this check. A fresh isolated Worker+D1 integrated rerun passed, observing the existing message after HTTP 200 and board refresh; mobile stale conflict remains HTTP 409 and retains case context. The initial timeout remains recorded as a transient non-reproduced runner observation, not a claimed fixed source defect.

Final rework validation evidence is in `output/playwright/block-b-rework-final-*`, `block-b-rework-cf-i03.log` through `block-b-rework-cf-i07-browser.log`, `block-b-rework-f011-browser.log`, `block-b-rework-wave12.log`, the final `cf-block-b-*` logs, and original gates. One initial CF-I05 shell-chain attempt exited before writing a result; a direct full `npm run test:cf-i05` rerun completed PASS. One F0.11 call used a relative fixture path rejected by the runner's absolute-path contract; the same seeded local fixture was then passed by absolute path and the full runner passed. One Block B integration attempt received a Worker loopback error while its stale-response mock expected `items`; cleanup ran, and a fresh isolated fixture rerun passed all assertions. These retries are not counted as PASS; only the final completed rerun logs are.

The exact final production-build DevTools trace is summarized in `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`. Latest integrated screenshot and browser Resource Timing capture the Queue before all auxiliary reads settle. The runtime code path for Queue loading is unchanged by these repairs.

## Bundle baseline → result → delta

- JS raw/entry: 299,976 → 306,733 B; +6,757 B (+2.25%). Gzip: 86,915 → 88,540 B; +1,625 B (+1.87%).
- CSS raw/entry: 48,615 → 52,127 B; +3,512 B (+7.22%). Gzip: 9,193 → 9,664 B; +471 B (+5.12%).
- Aggregate raw initial payload: 348,591 → 358,860 B; +10,269 B (+2.95%). Aggregate gzip: 96,108 → 98,204 B; +2,096 B (+2.18%).
- Final result passes authorized ceilings JS 330,000/100,000 B raw/gzip and CSS 55,000/15,000 B raw/gzip. Raw values are development growth guardrails, not performance targets. Checker remains enabled.

## Disposition

Internal Pre-Critic gate: **PASS**. No applicable invariant is FAIL or UNPROVEN. Evidence does not claim that LCP equals Queue-ready, that the lab values are production timings, or that a raw DevTools trace file exists. Replacement Artifact A must be frozen before an orchestration-only Boundary B that records its exact SHA and blocks continuation for a fresh separate Independent Critic. The historical A+B REWORK is preserved. No self-approval is implied.
