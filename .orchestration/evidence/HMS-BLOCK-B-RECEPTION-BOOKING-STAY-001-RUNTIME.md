# Block B Reception Runtime and Bundle Evidence

Task: `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001`
Execution base: clean B0 checkpoint `5a42c5e1a62191843335f3fd217fead62b3ef0b2`
Branch: `impl/hms-block-b-reception`
Fixture: `.hms-local/p0-1-block-b-final` (synthetic, isolated local D1)
Build: local production Vite, JS `index-D5zkUMf5.js`, CSS `index-BiR50jF5.css`; local Wrangler Worker and test-only 4,000 ms proxy hold on exactly `/rooms`, `/guests`, and `/reservation-creation-operations`.

## Accepted B0 finding

B0 Artifact A `5fa6289dfee2c165d6daa2d2ec360f73c0bc868f` / Boundary B `0a2b809097d73fd59865e75bb562eb3b6da4fea7` measured FCP ~260 ms, LCP ~758 ms, `/front-desk/board` complete ~1,085 ms, and first Reception Queue row ~2,928 ms. `/rooms`, `/guests`, and `/reservation-creation-operations` ran concurrently and completed around ~2,866 ms. The prior UI awaited all four in `Promise.all`; the ancillary reads were not needed to build board rows. The accepted classification was Reception critical-path coupling, not a demonstrated bundle parse/evaluation bottleneck. A separate JS evaluation CPU total was unavailable.

## Block B causal proof

Exact command: `bash scripts/cf-block-b-reception-local.sh .hms-local/p0-1-block-b-final`. The owned local Worker, proxy, Vite preview and browser process trees were stopped before the runner reported PASS. The durable machine log is `output/playwright/cf-block-b-reception-local.log`; the initial Queue image captured before ancillary completion is `output/playwright/block-b-queue-before-aux-settle.png`.

In the initial integrated browser navigation, Queue rows and controls were captured at 2,227 ms while all three auxiliary response timers were still unresolved. The screenshot visibly contains the Queue, three fixture rows, filters, search, refresh, and per-resource “Loading …” indicators. The response log reports:

| Request | Start | Complete | State at 2,227 ms screenshot |
|---|---:|---:|---|
| `/front-desk/board` | 759 ms | 2,018 ms | Complete; Queue rows available |
| `/rooms` | 732 ms | 4,999 ms | Pending |
| `/guests` | 742 ms | 6,021 ms | Pending |
| `/reservation-creation-operations` | 748 ms | 6,018 ms | Pending |

The same run's mark is `hms:reception-queue-ready` in `ReceptionPage.tsx`, scheduled on the next animation frame after board data is committed: DevTools observed 3,348 ms in a separate reload with the same local build/fixture/proxy and all auxiliary responses pending until 5,044–6,003 ms. This `requestAnimationFrame` mark is recorded as a commit/readiness marker, not as proof of first paint. `Promise.all` remains only in unrelated billing-context loading and other contextual operations; the queue's `load()` starts `loadAncillary()` without awaiting it and separately awaits `loadReceptionBoard()`.

The first Block B Artifact A Chrome DevTools trace at 1440×900 (CPU 1×, network unthrottled) reported FCP 2,360 ms and LCP 5,358 ms; these are retained as historical A1 observations, not the latest A2 result. Resource Timing showed `/front-desk/board` start 680 ms / complete 1,987 ms; `/rooms` 674 / 5,044 ms; `/guests` 676 / 6,003 ms; `/reservation-creation-operations` 678 / 6,001 ms. Thus FCP preceded every auxiliary completion. Chrome identified the LCP candidate as text in a `p.muted` node, with TTFB 5 ms and 5,353 ms render delay; the LCP event followed `/rooms` by ~314 ms. LCP is therefore reported separately and is not used as the Queue-ready criterion: the actual Queue screenshot and board-derived rows are available while auxiliary requests are pending. No CrUX/field data exists for this local URL.

Initial A1 before/after comparison (local lab; the Block B run deliberately held auxiliary responses. The latest exact A2 figures are in the following section. These are directional, not apples-to-apples latency claims):

| Signal | Accepted B0 | Block B observed | Interpretation |
|---|---:|---:|---|
| FCP | ~260 ms | 2,360 ms (historical A1 trace) | Both local synthetic runs; no absolute target or production inference. |
| LCP | ~758 ms | 5,358 ms (historical A1 trace) | The delayed local read changed the late LCP candidate; not the Queue gate. |
| Board completion | ~1,085 ms | 2,018 ms (A1 integrated) / 2,103 ms (A2 DevTools) / 2,439 ms (A2 integrated) | Board remained independent of ancillary responses. |
| Queue evidence | first row ~2,928 ms | A1 screenshot 2,227 ms; A2 screenshot 2,702 ms; A2 DevTools commit mark 3,755 ms | Screenshot proves visual Queue before all three ancillary responses. Marker is not mislabeled as first paint. |
| `/rooms` completion | ~2,866 ms | A1 4,999/5,044 ms; A2 5,246 ms integrated / 4,955 ms DevTools | Artificial 4 s response hold; pending at Queue screenshot. |
| `/guests` completion | ~2,866 ms | A1 6,021/6,003 ms; A2 6,397 ms integrated / 5,997 ms DevTools | Artificial hold; pending at Queue screenshot. |
| `/reservation-creation-operations` completion | ~2,866 ms | A1 6,018/6,001 ms; A2 6,393 ms integrated / 5,992 ms DevTools | Artificial hold; pending at Queue screenshot. |

This closes the causal acceptance: Queue visual readiness no longer waits for those reads. The partial-load runner additionally injected HTTP 503 for all three endpoints, independently retried them, and refreshed the board while selected Queue/Case context remained visible (`output/playwright/cf-block-b-reception-partial.log`). The workspace runner proves a stale overlapping board result cannot replace the newer result (`oldResultIgnored:true`).

### Trace export limitation

Chrome DevTools MCP tools were available and exercised (`navigate_page`, `performance_start_trace`, `performance_stop_trace`, `evaluate_script`, request listing and LCP insight analysis). Raw trace export to this isolated worktree was denied because `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-b-reception` is not among the MCP server's configured filesystem roots. No trace was written into the separate `hms-foundation-0` worktree. The DevTools summary/insight and timestamped Playwright screenshot + request log are retained as the inspectable evidence. Do not claim a raw `.json.gz` trace artifact exists.

## Exact final rework trace and latest integrated timing

After both bounded repairs (WIDE filter legibility and reassignment success-notice ordering), Chrome DevTools `performance_start_trace(autoStop=true,reload=true)` was run on the exact production Vite build, local synthetic Worker/D1 and test-only 4,000 ms hold on the three ancillary reads, at 1440×900, CPU 1×, network unthrottled. The trace summary plus Resource Timing are recorded here; DevTools raw trace file export is not claimed.

- FCP: `244 ms`. The final JS entry request was about `82 ms` and the CSS entry request about `69 ms` in Chrome’s Network Dependency Tree. The trace summary does not expose a defensible standalone script parse/evaluation CPU total, so none is claimed; the approved B0 investigation found no material bundle parse/evaluation bottleneck.
- LCP: `1,666 ms`, text `p.muted`, TTFB `5 ms`, render delay `1,661 ms`; no CrUX/field data.
- `/front-desk/board`: start `623 ms`, response end `2,103 ms` in Resource Timing.
- `/rooms`: start `616 ms`, response end `4,955 ms`.
- `/guests`: start `618 ms`, response end `5,997 ms`.
- `/reservation-creation-operations`: start `620 ms`, response end `5,992 ms`.
- `hms:reception-queue-ready` animation-frame/commit mark: `3,755 ms`; this is explicitly not a first-paint measurement.
- Latest integrated runner captured visible Queue at `2,702 ms` while all three auxiliary responses were pending. In that run `/front-desk/board` completed at `2,439 ms`; rooms/guests/recovery completed at `5,246`/`6,397`/`6,393 ms`. The image is `output/playwright/block-b-queue-before-aux-settle.png` and the timing/assertion output is `output/playwright/cf-block-b-reception-workspace.log`.

Therefore FCP, board response, and the actual integrated Queue screenshot precede every auxiliary response. Auxiliary requests start concurrently. The longest trace request path includes `/rooms` because that response was deliberately held; it does not gate the visual Queue. Bundle/layout/notice bounded rework did not restore a four-request visual gate. The one run of the integrated local runner that saw a malformed board response ended in a Wrangler loopback error; it was rerun against a newly materialized isolated fixture and passed, with owned processes stopped. Do not treat localhost values as an absolute target or production prediction.

## Bundle baseline → result → delta

Baseline is the B0 measurement in `.orchestration/evidence/HMS-B0-WEB-BUNDLE-HEADROOM-001-BASELINE.md`; result is the final Block B `npm run web:build` plus active `scripts/check-cloudflare-budgets.mjs`. One JS entry and one CSS entry are emitted, so per-type aggregate and initial/entry payload coincide.

| Metric | Baseline | Result | Delta bytes | Delta % |
|---|---:|---:|---:|---:|
| JS raw aggregate / entry | 299,976 B | 306,733 B | +6,757 B | +2.25% |
| JS gzip aggregate / entry | 86,915 B | 88,540 B | +1,625 B | +1.87% |
| CSS raw aggregate / entry | 48,615 B | 52,127 B | +3,512 B | +7.22% |
| CSS gzip aggregate / entry | 9,193 B | 9,664 B | +471 B | +5.12% |
| JS + CSS raw aggregate / initial entry payload | 348,591 B | 358,860 B | +10,269 B | +2.95% |
| JS + CSS gzip aggregate / initial entry payload | 96,108 B | 98,204 B | +2,096 B | +2.18% |

The active ceilings are JS raw `330,000 B`, JS gzip `100,000 B`, CSS raw `55,000 B`, CSS gzip `15,000 B`. The raw ceilings are development growth guardrails, not performance targets. `npm run architecture:fitness` passed with the checker active.

## Limits

All runtime evidence is local synthetic Worker/D1, local production Vite and a test-only response proxy. Artificial response delay proves dependency independence; it is not an estimate of Cloudflare production latency. DevTools' late LCP observation is retained and explained rather than conflated with the earlier Queue screenshot/readiness. No production/field Core Web Vitals claim is made.
