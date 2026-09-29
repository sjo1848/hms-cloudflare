# B0 Budget Policy Review — Result

Task: `HMS-B0-BUDGET-POLICY-REVIEW-001`  
Branch/base: `impl/hms-b0-bundle-headroom` / `3d40b82353ce747d9b79100e0d28e7f9348764fc`  
Environment: production Vite build served locally; Wrangler local Worker + isolated synthetic D1 fixture `.hms-local/p0-1-P7PawY`; desktop Chrome 1440×900. No real data.

## Checker and emitted-output facts

`scripts/check-cloudflare-budgets.mjs` reads direct children of `apps/web/dist/assets`, includes every `.js` and `.css` there, sums uncompressed bytes and Node `gzipSync` bytes per emitted file. It does not count HTML, JSON catalogs, fonts or images. The emitted build currently has one JS file and one CSS file, so the measured asset totals equal those file sizes; there is no dynamic chunk/route entry distinction in the current build.

| Metric | Current | Existing ceiling | Result |
|---|---:|---:|---|
| Aggregate emitted JS raw | 299,976 B | 300,000 B | PASS, 24 B headroom |
| Aggregate emitted JS gzip | 86,915 B | 100,000 B | PASS, 13,085 B headroom |
| Aggregate emitted CSS raw | 48,615 B | 50,000 B | PASS, 1,385 B headroom |
| Aggregate emitted CSS gzip | 9,193 B | 15,000 B | PASS, 5,807 B headroom |

Checker verdict: `npm run architecture:fitness` passed on this baseline. No checker, budget, build configuration or product source was changed during this review.

Production emission audit: `vitest`, `playwright`, `VITE_LOCAL_ACCEPTANCE_AUTH`, `LocalDevIdentitySelector`, seeded test identities and source-map markers were absent from the emitted JS. The string `hms-local-acceptance-profile` remains, but no local profile/identity or selector code was found beside it; treated as a non-material residual, not silently excluded.

Contributor audit remains as recorded in `HMS-B0-WEB-BUNDLE-HEADROOM-001-BASELINE.md`: 4,720 repeated bytes exist in source CSS, but only 290 exact duplicate bytes remain in emitted CSS; no safe small CSS cleanup recovers useful margin. The separate read-only JS reviewer found no safely removable production dead code. AppShell imports all seven feature routes statically; splitting routes would not reduce the checker’s aggregate raw metric. No architecture refactor is justified by the present measurement.

## Initial load — real local Worker/D1 browser evidence

The browser started from `about:blank` with no prior HMS tab/cache, navigated directly to `/bookings`, sent the synthetic reception membership headers, and waited for the Reception queue row (not `networkidle`). The script is retained as `HMS-B0-BUDGET-POLICY-REVIEW-001-initial-payload.playwright.js`. One isolated capture completed before the local Worker later terminated with Wrangler `Network connection lost` after earlier diagnostic sessions had overlapped; the isolated capture itself had no simultaneous browser session.

| Signal | Measured |
|---|---:|
| DOMContentLoaded | 108 ms |
| First Contentful Paint | 240 ms |
| Largest Contentful Paint samples | 240 ms, 676 ms |
| Long tasks | 89 ms (one observed) |
| Reception queue row ready | 3,605 ms from navigation start |
| Initial JS / CSS encoded body | 86,915 B / 9,193 B |
| Initial locale JSON encoded bodies | 7,238 B + 7,884 B |
| Initial compressed static bodies (JS+CSS+both catalogs+HTML gzip) | 111,494 B, including 264 B HTML gzip from the emitted artifact |

Observed API timings in that same capture: `/auth/me` 378 ms; `/front-desk/board` 351 ms; `/rooms` 2,396 ms; `/guests` 2,393 ms; `/reservation-creation-operations` 2,402 ms. These concurrent Worker/D1 calls are a plausible contributor to the 3,605 ms queue-ready signal. The browser also exposed the current Reception startup's simultaneous Rooms/Guests/reservation-operation reads; the pre-existing source has BillingWorkspace embedded on Reception and triggers billing/account reads, which is outside B0 and is already a Block B scope concern.

The fast paint metrics do not prove the operational workspace is ready quickly; the queue-ready signal is materially later in this local integrated scenario. No field network throttling or Lighthouse/DevTools CWV trace was obtained. Earlier multi-session diagnostic timings are explicitly excluded because multiple open sessions and periodic refreshes overloaded the same local Worker; one run ended in Wrangler `Network connection lost`. That harness contamination does not erase the isolated 3.605 s measurement, but local emulator latency cannot be generalized to deployed Cloudflare.

## Six-condition disposition

| # | Condition | Result |
|---|---|---|
| 1 | Raw checker is aggregate output, not initial payload | PASS |
| 2 | No material dev/test leakage in production assets | PASS; non-material localStorage key disclosed above |
| 3 | No small safe optimization recovers practical margin | PASS, based on emitted/source audit above |
| 4 | Both gzip ceilings remain passing | PASS |
| 5 | Representative initial load has no material problem | **UNPROVEN / CONCERN**: paint is quick, but integrated Reception queue readiness was 3.605 s with several concurrent initial API reads; field behavior not measured |
| 6 | Raw ceiling adjustment alone does not change product/architecture | PASS as a bounded tooling/evidence change, but adjustment is not authorized while #5 is unresolved |

## Gate

`BUNDLE_BUDGET_POLICY_GATE_REQUIRED`

The provisional raw growth ceilings were **not applied**. Current thresholds remain JS raw/gzip `300,000/100,000 B`, CSS raw/gzip `50,000/15,000 B`. Block B has **not** started. Controller review is needed specifically to classify the integrated first-load evidence and determine whether further representative measurement or an in-scope Block B improvement should precede a raw-budget policy adjustment. This is not a claim that local Worker timing represents production performance.

No PR, merge, main, staging, deploy, production or real-data action occurred. The synthetic fixture received reads only from browser evidence; fixture creation is synthetic local test setup.
