# Block E — Housekeeping + Maintenance — Validation Results

Status: **A2+B2 fresh Independent Critic returned bounded REWORK; E-11 stale-response repair and replacement A/B review are in progress**. The A1+B1 and A2+B2 reviewer records are preserved separately at `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-INDEPENDENT-CRITIC-A-B.md` and `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-INDEPENDENT-CRITIC-A2-B2.md`. This record does not claim Controller acceptance.

## Authority, policy and scope

- Frozen parent contract: `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`, base `3f06c7b52b8c5f57754e705071b7cee6a5668d05`.
- Bounded critic repair contract: `.orchestration/contracts/HMS-BLOCK-E-REPAIR-CRITIC-AB-001.md`, frozen before repair code.
- E-11 stale board response repair contract: `.orchestration/contracts/HMS-BLOCK-E-REPAIR-STALE-BOARD-RESPONSE-001.md`, admitted/frozen before its browser assertion and bounded Refresh-control adjustment.
- Current Controller instruction: Issue #51, latest `CONTROLLER_DECISION: RESUME`; CSS raw ceiling only changed `55,000 → 60,000 B` in resolution 002. JS raw `350,000 B`, JS gzip `100,000 B`, CSS gzip `15,000 B` remain unchanged. Earlier JS gate, CSS gate and reproducibility records remain unmodified.
- No schema/migration, capability, lifecycle, role map, endpoint or financial contract was added. No Blocks F–H, real data, promotion, PR, merge, main, staging, deploy or production action.

## Result and bounded critic repairs

Housekeeping stays within its existing workspace and API contracts. The queue exposes distinct operational state, attention, maintenance impact, derived readiness, bounded event history and affected confirmed-booking risk; task actions preserve the existing state-transition and capability rules. UI and messages retain per-room draft scope, task/queue context and authoritative refresh behavior.

The D1 concurrency repair makes event inserts independently verify the committed room version, exact maintenance-case identity/state, and uniqueness per room/event-type/version. Opening an already-open case gates the room update itself, so a duplicate cannot partially advance the room. Legacy `/dirty` recovery now also guards case insertion against an existing resolution event at the expected room version. An executing-D1 race from a synthetic legacy MAINTENANCE room proves one `200`, one `409`, exactly one resolved attributed case/event and one room version transition; the loser has no extra case, event or state drift.

The existing board read model now returns its latest existing case per room, preferring the active OPEN case and otherwise the newest RESOLVED case. The selected case summary and event trace remain visible after resolution; no old events are changed. Focused open NON_BLOCKING cases now expose the existing escalation endpoint with the existing minimum-note validation. After escalation, the UI refreshes authoritative case/impact/history data. The action is absent for resolved cases and remains server-capability-authorized.

The fresh A2+B2 Independent Critic confirmed those product repairs and identified one remaining E-11 evidence gap: no deterministic browser test proved that a late older board response cannot replace a newer one. The bounded follow-up keeps the existing Refresh button available while a read is loading (it remains locked during mutations) so the operator can request a newer read through the actual UI. The integrated browser then holds an older Worker/D1 board response for `2099-01-01`, triggers and awaits a newer current-date refresh, establishes search/filter/selected-case context, releases the older response, and asserts the newest date and operational context remain visible with loading cleared. Exact-pair review and final metadata reconciliation are still pending.

Reusable D1 batch root-cause rules are recorded in `.orchestration/INVARIANTS.md` under `INV-ATOMIC-001` and `INV-AUDIT-001`.

## Validation evidence

| Command / evidence | Result |
|---|---|
| `npm run check` | PASS — Vitest 35 files / 175 tests; TypeScript project build passed. |
| `npm run types:check` | PASS — API and web Wrangler generated types current. |
| `npm run web:build` | PASS — production Vite build. |
| `npm run architecture:fitness` | PASS — architecture fitness I/II, i18n coverage (25 files), and all four Cloudflare budgets. |
| `npm run test:d1-query-plan` | PASS — arrival `idx_bookings_status`, checkout `idx_bookings_status_checkout`, inventory keyed. |
| `npm run test:cf-i05` | PASS — local Worker + migrated synthetic control/hotel D1; tenant routing, capabilities, state transitions, maintenance history/risk, duplicate-zero-drift, concurrent same-case resolve, concurrent legacy recovery exact-winner/no-drift, stale identity/ABA and cleanup. |
| `npm run test:cf-i05-browser` | PASS — local Worker/D1 + Vite + Playwright controls; deterministic out-of-order board GETs (older `2099-01-01` released after newer `2026-10-01` response); newest date, search, filter, selected room and cleared loading remain after stale response; selected resolved-case facts/history; focused advisory escalation validation and successful authoritative refresh; mutation, risk, capability and tenant behavior; refresh error/retry; deep links/reload/Back/Forward; keyboard/focus and responsive dimensions. Exactly one injected board 503 is expected; no other API failures. Screenshot: `output/playwright/cf-i05-integrated-housekeeping.png` (supporting evidence only). |
| `npm run wrangler:dry-run` | PASS — API upload 318.53 KiB / 65.76 KiB gzip; web 7 assets read; no deploy. |
| `git diff --check` | PASS after implementation/evidence changes. |
| `rg 'createHousekeepingRoutes\\(' apps/api/src/index.ts` | PASS — one existing `/api/v1` mount. |

Browser matrix executed controls at WIDE `1280×900`, reduced-height `1280×600`, COMPACT `900×700`, NARROW `390×844`, narrow-small `320×700`, and mobile landscape `844×390`. Each viewport asserted no horizontal overflow. The local-only synthetic developer identity switcher was hidden by injected test CSS at phone widths; production has no such chrome. Keyboard task focus wrap, Escape close, and focus restoration passed. Browser date-query direct navigation, reload, Back and Forward returned expected dates. Failed refresh retained search, filter and selected queue item; retry recovered the board. The browser asserted resolved case history remains visible after authoritative refresh and escalation history/impact are present after the existing endpoint succeeds.

## Bundle baseline → result → delta

Production build and canonical budget checker, under Controller-approved ceilings:

| Asset | Baseline B | Result B | Delta B | Delta % | Active ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw | 329,618 | 334,638 | +5,020 | +1.523% | 350,000 |
| JS gzip (`check-cloudflare-budgets.mjs`) | 93,456 | 94,467 | +1,011 | +1.082% | 100,000 |
| CSS raw | 54,297 | 55,652 | +1,355 | +2.496% | 60,000 |
| CSS gzip (`check-cloudflare-budgets.mjs`) | 10,138 | 10,384 | +246 | +2.427% | 15,000 |
| Aggregate raw (JS + CSS) | 383,915 | 390,290 | +6,375 | +1.660% | informational |
| Aggregate gzip (sum of canonical JS/CSS measures) | 103,594 | 104,851 | +1,257 | +1.213% | informational |

After the E-11 Refresh affordance, final clean build/canonical checker measures are JS `334,638 B raw / 94,467 B gzip`, CSS `55,652 B raw / 10,384 B gzip`. JS raw delta is `+5,020 B` (`+1.523%`); CSS raw `+1,355 B` (`+2.496%`); CSS gzip `+246 B` (`+2.427%`). Initial/entry payload includes the HTML entry (`dist/index.html`: 364 B raw / 266 B from `gzip -n -9`): `384,279 → 390,654 B raw`, delta `+6,375 B` (`+1.659%`); `103,860 → 105,117 B gzip`, delta `+1,257 B` (`+1.210%`). The entry JS and CSS are the complete initial assets; no lazy chunks were emitted. Raw values are development growth guardrails, not performance targets. All current ceilings pass; no further policy change is requested.

## Claim boundary

This is synthetic local validation, not live traffic or production behavior. Browser timing is not claimed as a performance target. Worker/API evidence does not substitute for the visible-browser assertions above. The A2+B2 reviewer verdict remains historical `REWORK`; the replacement Artifact A and Boundary B still require their own fresh separate Independent Critic. No substantive PASS or Controller acceptance is self-declared.
