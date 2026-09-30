# B0 Runtime Load Investigation

Task: `HMS-B0-RUNTIME-LOAD-INVESTIGATION-001`  
Base/artifact still under review: `5fa6289dfee2c165d6daa2d2ec360f73c0bc868f`  
Branch: `impl/hms-b0-bundle-headroom`  
Environment: isolated synthetic D1 fixture `.hms-local/p0-1-P7PawY`, local Wrangler API, production Vite build, Chrome DevTools MCP, desktop 1440×900. No real data.  
Investigation only: no source, schema, build, checker, or budget changes; Block B did not start.

## Browser and asset evidence

The Chrome DevTools MCP tools were available and exercised: `navigate_page` opened `/bookings`; `performance_start_trace` and `performance_stop_trace` recorded the reload. One clean initial navigation was measured before later DevTools focus events triggered the app's existing focus refresh. The results below use that navigation's first API request set and first queue render.

| Signal | Result |
|---|---:|
| Emitted JS | 299,976 B decoded; 86,915 B encoded/gzip |
| JS resource timing | started 103 ms; 67 ms duration |
| Emitted CSS | 48,615 B decoded; 9,193 B encoded/gzip |
| CSS resource timing | started 106 ms; 32 ms duration |
| First Contentful Paint | 260 ms |
| LCP | 758 ms; trace breakdown TTFB 15 ms, render delay 744 ms |
| First Reception queue row and queue loading state cleared | 2,928 ms from navigation start |
| CrUX / field CWV | no data available |

The earlier isolated B0 capture recorded FCP 240 ms, LCP samples 240/676 ms, and one 89 ms long task. Neither trace attributes the queue delay to bundle parsing/evaluation. The DevTools summary does not expose a separate V8 parse/evaluation CPU total, so that submeasurement remains unproven. The loaded JS transfer and paint timings are small relative to the queue delay; the investigation does not identify bundle load/parse/evaluation as its material cause. These are local lab results, not deployed performance claims.

## Request timeline and dependency

The Chrome Performance Resource Timing capture (milliseconds from navigation start) showed:

| Request | Start | Duration | Approx. completion |
|---|---:|---:|---:|
| `/api/v1/auth/me` (shell) | 237 | 405 | 642 |
| `/api/v1/front-desk/board` | 700 | 385 | 1,085 |
| `/api/v1/rooms` | 701 | 2,165 | 2,866 |
| `/api/v1/guests` | 704 | 2,163 | 2,867 |
| `/api/v1/reservation-creation-operations` | 706 | 2,161 | 2,867 |
| `/api/v1/auth/me` (Billing workspace) | 710 | 2,155 | 2,865 |
| First queue row visible | — | — | 2,928 |

The three Reception reads start within 6 ms of each other: they are concurrent, not serial with one another. `loadReceptionQueue()` awaits all four reads with `Promise.all` (`apps/web/src/features/reception/reception-api.ts:5-13`). The hook only stores the returned board and ancillary lists after that promise resolves, then clears initial `loading` in `finally` (`useReceptionWorkspace.ts:73-79,106-110`). Thus the board response was available about 1.84 seconds before the queue row appeared, but slow ancillary reads still gated queue rendering.

The visible queue row is derived from the board's booking, lane, room status, and maintenance fields (`ReceptionPage.tsx:223-240`). Rooms and guests populate creation/edit selection controls, and recoverable operations populate reservation recovery UI; they are not fields used to produce the already-returned queue rows. This establishes an initial-fetch dependency wider than the minimum data for the queue itself. It is a material fetching/readiness architecture finding, not a broad refactor authorization.

Billing's additional `/auth/me` and `/billing/balance` requests run alongside Reception startup. The later `/bookings?limit=100` then invoice/payments/extra-charges chain is downstream of Billing's booking selection. Those Billing reads were not required for the first queue row; they were not attributed as the queue gate.

## Worker and D1/query observations

Local Wrangler request spans for the same endpoint family put the `/rooms`, `/guests`, and `/reservation-creation-operations` Worker requests around 1.52–1.53 s in one sampled refresh. Their associated local D1 child spans included repeated control-plane membership and network-role lookups plus the endpoint query, at roughly 0.39–0.50 s per D1 operation. The room query includes correlated booking/maintenance counts; guest and recovery queries are simpler. These spans are from Miniflare's local D1 and must not be generalized to Cloudflare production.

In the browser capture, those three endpoint requests each took about 2.16 s end to end. The local Worker/D1 observations therefore attribute a large share of the wait to backend/local D1 work, with additional local Worker/transport overhead. Since `front-desk/board` completed in 385 ms while the other three responses took over 2.1 s, the UI's all-results gate converts their backend delay into queue delay. No query changes or optimization were attempted.

## Gate disposition

- Existing raw/gzip ceilings remain JS `300,000/100,000 B`, CSS `50,000/15,000 B`.
- No baseline/delta for a budget change was created because the conditional policy-review criteria did not all pass.
- Policy-review condition 5 remains **FAIL / UNPROVEN** for the requested no-material-initial-load test: a material queue readiness delay and unnecessary ancillary-read gating were observed locally. Fast paint and absent field data do not erase this operational signal.
- Finding: **`B0_RUNTIME_LOAD_GATE_REQUIRED`**. Controller classification is required before changing budgets, changing the queue-loading dependency, or starting Block B. No broad refactor is authorized by this investigation.

## Evidence sources

- Existing B0 contract and policy criteria: `.orchestration/contracts/HMS-B0-WEB-BUNDLE-HEADROOM-001.md`, `.orchestration/contracts/HMS-B0-BUDGET-POLICY-REVIEW-001.md`.
- Prior isolated baseline and gate: `.orchestration/evidence/HMS-B0-WEB-BUNDLE-HEADROOM-001-BASELINE.md`, `.orchestration/evidence/HMS-B0-BUDGET-POLICY-REVIEW-001-RESULT.md`.
- Browser executable used for the earlier isolated metrics: `.orchestration/evidence/HMS-B0-BUDGET-POLICY-REVIEW-001-initial-payload.playwright.js`.
- This run's evidence: Chrome DevTools navigation, Performance trace, resource timings and request list; Wrangler Local Explorer read-only span query; source inspection of the cited frontend files.
