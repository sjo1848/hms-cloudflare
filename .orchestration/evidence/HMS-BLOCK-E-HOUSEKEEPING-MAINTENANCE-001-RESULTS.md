# Block E — Housekeeping + Maintenance — Validation Results

Status: **implementation and local evidence complete; Artifact A/Boundary/Independent Critic are the next required sequence**. This record does not claim Controller acceptance.

## Authority, policy and scope

- Frozen contract: `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`, base `3f06c7b52b8c5f57754e705071b7cee6a5668d05`.
- Current Controller instruction: Issue #51, latest `CONTROLLER_DECISION: RESUME`; CSS raw ceiling only changed `55,000 → 60,000 B` in resolution 002. JS raw `350,000 B`, JS gzip `100,000 B`, CSS gzip `15,000 B` remain unchanged. Earlier JS gate, CSS gate and reproducibility records remain unmodified.
- No schema/migration, capability, lifecycle, role map, route, or financial contract was added. No Blocks F–H, real data, promotion, PR, merge, main, staging, deploy or production action.

## Implemented result

Housekeeping stays within its existing workspace and API contracts. The queue exposes distinct operational state, attention, maintenance impact, derived readiness, bounded event history and affected confirmed-booking risk; task actions preserve the existing state-transition and capability rules. UI and messages retain per-room draft scope, task/queue context and authoritative refresh behavior.

The concurrency repair found during final D1 validation is bounded to the existing maintenance commands. D1 batch statements now independently gate event insertion against the exact committed room version and maintenance-case identity/state, with at most one event per room/event type/version. Opening an already-open case also gates the room update itself, so the losing duplicate cannot partially change room state before conflict. This preserves the frozen command and lifecycle semantics.

Reusable root-cause rule was added to `INV-ATOMIC-001` and `INV-AUDIT-001`: D1 continues later batch statements after a zero-row conditional write, and concurrent losers may observe the same resulting version; dependent audit SQL must guard identity/state and per-version uniqueness itself.

## Validation evidence

| Command / evidence | Result |
|---|---|
| `npm run check` | PASS — Vitest 35 files / 175 tests; TypeScript project build passed. |
| `npm run types:check` | PASS — API and web Wrangler generated types current. |
| `npm run web:build` | PASS — production Vite build. |
| `npm run architecture:fitness` | PASS — architecture fitness I/II, i18n coverage (25 files), and all four Cloudflare budgets. |
| `npm run test:d1-query-plan` | PASS — arrival `idx_bookings_status`, checkout `idx_bookings_status_checkout`, inventory keyed. |
| `npm run test:cf-i05` | PASS — local Worker + migrated synthetic control/hotel D1; tenant routing, capabilities, state transitions, maintenance history/risk, duplicate-zero-drift, concurrency exact-winner/event count, stale identity/ABA and cleanup. |
| `npm run test:cf-i05-browser` | PASS — local Worker/D1 + Vite + Playwright controls; selection/mutations, visible history/risk, capability and tenant behavior, refresh error/retry, deep links/reload/Back/Forward, keyboard/focus and responsive dimensions. Exactly one injected board 503 is expected; no other API failures. Screenshot: `output/playwright/cf-i05-integrated-housekeeping.png` (supporting evidence only). |
| `npm run wrangler:dry-run` | PASS — API upload 317.84 KiB / 65.65 KiB gzip; web 7 assets read; no deploy. |
| `git diff --check` | PASS before final evidence authoring; repeat after evidence/orchestration changes. |
| `rg 'createHousekeepingRoutes\\(' apps/api/src/index.ts` | PASS — one existing `/api/v1` mount. |

Browser matrix executed controls at WIDE `1366×900`, reduced-height `1280×600`, COMPACT `900×700`, NARROW `390×844`, narrow-small `320×700`, and mobile landscape `844×390`. Each viewport asserted no horizontal overflow. The local-only synthetic developer identity switcher was hidden by injected test CSS at phone widths; production has no such chrome. Keyboard task focus wrap, Escape close, and focus restoration passed. Browser date-query direct navigation, reload, Back and Forward returned the expected dates. Failed refresh retained search, filter and selected queue item; retry recovered the board.

## Bundle baseline → result → delta

Build output, after Controller-authorized ceiling resolutions:

| Asset | Baseline B | Result B | Delta B | Delta % | Active ceiling |
|---|---:|---:|---:|---:|---:|
| JS raw | 329,618 | 334,104 | +4,486 | +1.361% | 350,000 |
| JS gzip (`check-cloudflare-budgets.mjs`) | 93,456 | 94,364 | +908 | +0.972% | 100,000 |
| CSS raw | 54,297 | 55,652 | +1,355 | +2.496% | 60,000 |
| CSS gzip (`check-cloudflare-budgets.mjs`) | 10,138 | 10,384 | +246 | +2.427% | 15,000 |
| Aggregate raw (JS + CSS) | 383,915 | 389,756 | +5,841 | +1.521% | informational |
| Aggregate gzip (sum of canonical JS/CSS measures) | 103,594 | 104,748 | +1,154 | +1.114% | informational |

Initial/entry payload includes the HTML entry (`dist/index.html`: 364 B raw / 266 B from `gzip -n -9`): `384,279 → 390,120 B raw`, delta `+5,841 B` (`+1.520%`); `103,860 → 105,014 B gzip`, delta `+1,154 B` (`+1.111%`). The entry JS and CSS are the complete initial assets; no lazy chunks were emitted. Raw values are development growth guardrails, not performance targets. All ceilings pass; no further policy change is requested.

## Claim boundary

This is synthetic local validation, not live traffic or production behavior. Browser timing is not claimed as a performance target. Worker/API evidence does not substitute for the visible-browser assertions above. Fresh independent Critic and Controller review remain pending and are not represented as PASS in this file.
