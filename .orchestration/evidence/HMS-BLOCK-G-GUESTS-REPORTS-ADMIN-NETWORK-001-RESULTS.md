# Block G — Results and Evidence

Task Contract: `.orchestration/contracts/HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001.md`
Authorized base: `d9ff3325709633d7760dd236977b90f582b1b144`
Branch: `impl/hms-block-g-guests-reports-admin-network`

## Implemented scope

- Guests retain any prior authoritative stay context when the related bookings read fails, expose an unavailable/retry state, disable context-derived filters while unavailable, and never label a failed read as “no stays”. A focused real-Chromium test covers synthetic 503 → retry success at WIDE 1440×900, COMPACT 900×768, NARROW 375×812 and mobile landscape 812×375. Its booking API is deliberately mocked; this is not claimed as Worker/D1 integration.
- Hotel-user deactivation uses a focused native modal dialog with explicit cancel/confirm actions, safe initial focus, Escape cancellation, visible 409 conflict recovery with retry, focus return to a connected control and translated English/Spanish runtime labels. The visible UI 409 recovery is deliberately synthetic; executing-D1 mutation/conflict/audit proof remains in CF-I07. Existing server mutation/capability contracts remain authoritative.
- Integrated admin/network/reports browser regression exercises actual local Worker + D1 APIs. Membership create/duplicate rejection/role change/reload/deactivate, capability-aware route denial, Network plan changes (HTTP 200) and Reports revenue/occupancy requests (HTTP 200 with exact selected date range) execute across responsive viewports. Reports also displays an invalid date-range error.
- CF-I08 fixture now names the room insert columns explicitly so the executing-D1 fixture remains valid against the current expanded Rooms schema. No product schema/API change.

## Validation

| Gate | Result |
|---|---|
| `npm run check` | PASS — 35 files, 176 tests; includes executing-D1 suites. Duration 116.07 s. |
| `npm run types:check` | PASS — API and Web Wrangler generated-type checks, Wrangler 4.125.0. |
| `npm run web:build` | PASS. |
| `npm run architecture:fitness` | PASS — Architecture I/II, i18n coverage, bundle checker. |
| `npm run test:d1-query-plan` | PASS — arrival/status indexes, checkout index and keyed inventory plan. |
| `npm run test:cf-i07` | PASS — executing Worker/D1 RBAC, users, audit and network regression. |
| `bash scripts/cf-i08-regression.sh` | PASS — executing Worker/D1 analytics/reports and multi-hotel regression. |
| `npm run test:cf-i07-browser` | PASS — integrated local Worker/D1/Vite/Chromium; final run additionally asserts dialog focus and Escape. |
| `bash scripts/cf-block-g-guest-context-browser.sh` | PASS — real Chromium with explicitly synthetic mocked API failure/recovery. |
| `npm run test:cf-i05-browser` | PASS — inherited integrated regression, including queue ordering, tenant isolation, responsive behavior, failed refresh recovery, direct date links, reload, Back/Forward and focus restoration. |
| `npm run wrangler:dry-run` | PASS — API and Web dry-runs only; no deployment. |
| `git diff --check` | PASS at final scope review. |

No test claims authenticated staging browser execution. Issue #52 remains open solely for that external harness smoke.

## Bundle baseline → result → delta

Baseline: exact authorized base G production build, measured before implementation. Result: final G candidate production build. Percent is relative to baseline.

| Metric | Baseline | Result | Delta bytes | Delta % | Active ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw | 338,266 B | 339,914 B | +1,648 B | +0.487% | 350,000 B |
| JS gzip | 95,036 B | 95,371 B | +335 B | +0.352% | 100,000 B |
| CSS raw | 56,587 B | 57,024 B | +437 B | +0.772% | 60,000 B |
| CSS gzip | 10,490 B | 10,564 B | +74 B | +0.705% | 15,000 B |
| Aggregate raw (JS + CSS) | 394,853 B | 396,938 B | +2,085 B | +0.528% | — |
| Aggregate gzip (JS + CSS) | 105,526 B | 105,935 B | +409 B | +0.388% | — |
| Initial/entry raw (HTML + entry JS + CSS) | 395,217 B | 397,302 B | +2,085 B | +0.528% | — |
| Initial/entry gzip | 105,790 B | 106,201 B | +411 B | +0.389% | — |

The build has one JS and one CSS entry chunk. The entry payload is measured as the emitted HTML plus those entry assets; current emitted `index.html` gzip is 266 B. All raw/gzip ceilings pass unchanged. No localhost time is represented as a production target.

## Scope audit

Only Guests, Reports, hotel-user administration, Network, their translations/styles, focused/integrated regression scripts, and Block G evidence/orchestration are in scope. No F-cash, Block H, new schema/domain contract, staging action, production/main/PR/merge action or real hotel data was used. The pending authenticated staging smoke remains the separately classified external test-harness blocker and is not silently marked complete.
