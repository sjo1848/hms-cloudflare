# F0.11 Invariant Evidence — Authoritative Refresh and UI Continuity

Task Contract: `.orchestration/contracts/HMS-F0-11-AUTHORITATIVE-REFRESH-001.md`
Evidence is local/synthetic; mock evidence is explicitly distinguished from integrated Worker/D1 evidence. No real data, migration, promotion, or backend domain mutation was introduced by F0.11.

## Registry mapping

| Invariant | Disposition | Evidence / rationale |
|---|---|---|
| INV-ATOMIC-001 | PASS (UI-truthfulness scope only) | `scripts/cf-f0-11-refresh-races.playwright.js` verifies stale reads do not overwrite newer authoritative results; `scripts/cf-f0-11-reception-integrated.playwright.js` separately observes mutation 200 and authoritative board 200. Existing backend atomicity is unchanged and not re-certified. |
| INV-AUDIT-001 | N/A | No event/audit write path changed. Integrated check-in D1 inspection confirms its existing single CHECK_IN event only. |
| INV-DOMAIN-001 | N/A | No domain transition or API write was changed; implementation diff is frontend reads, request identity guards and minifier configuration only. |
| INV-TENANT-001 | PASS (no boundary expansion) | Integrated local Worker/D1 uses the explicitly configured synthetic Hotel Norte identity and tenant routing; F0.11 adds no cross-tenant identifier or route. Browser requests are scoped to the seeded hotel; source diff adds only the existing tenant-scoped booking detail read. |
| INV-RBAC-001 | N/A | No protected API/capability surface changed. |
| INV-PARITY-001 | N/A | No source capability or domain rule changed. |
| INV-ENUM-001 | N/A | No enum representation, mapping, predicate or filter changed. |
| INV-UX-001 | PASS | Targeted deferred-response browser scenarios exercise Reception selection, Rooms selection, Billing account identity and Housekeeping task retention/recovery; integrated Reception flow preserves lane/search and advances by existing queue priority. |
| INV-ORDER-001 | N/A | No queue ordering or priority rule changed. The integrated fixture asserts the existing next case `z-priority` after completing `a-next`; no order implementation was changed. |
| INV-RESP-001 | PASS | Integrated Reception Worker/D1 mutation exercises mobile 375×812 and desktop 1280×900. Built/minified Rooms local Worker/D1 browser evidence covers both widths. Deferred workspace race evidence covers 1280×900. |
| INV-EVID-001 | PASS | `output/playwright/f0-11-refresh-races.log` is MOCK ONLY; the mobile/desktop Reception logs and read-only synthetic D1 assertions are integrated Worker/D1; `output/playwright/f0-11-built-browser.log` is built/minified local Worker/D1 evidence. Claims remain scoped to those proofs. |
| INV-LEGACY-001 | N/A | No historical/synthetic recovery record creation behavior changed. |
| INV-MONEY-001 | PASS (read identity only) | Billing deferred browser assertions bind invoice/payment/charge reads to booking identity, discard late prior-booking results, clear stale account data on each subread failure and recover. Integrated Reception D1 assertion confirms invoice remains 36,000 cents, paid 0, PENDING, with zero payment entries after check-in. No financial arithmetic/write changed. |
| INV-STATE-001 | PASS at publication boundary | Artifact A will contain implementation/tests/evidence. A following orchestration-only Boundary B will identify exact A and require separate Independent Critic; no commit self-references its own SHA. |
| INV-CF-I07-001 | N/A | No admin/network/audit endpoint or authorization route changed. |
| INV-CF-I07-002 | N/A | No admin mutation changed. |
| INV-CF-I07-003 | N/A | No role downgrade changed. |
| INV-CF-I07-004 | PASS | Integrated local runners own Worker/Vite/Playwright process trees and emit PASS only after cleanup. `scripts/cf-f0-11-reception-local.sh` completed with explicit owned-process cleanup confirmation; built and mock runners likewise verify cleanup. |
| INV-CF-I08-001 | N/A | Reports/analytics are explicitly outside F0.11. |
| INV-CF-I08-002 | N/A | No network aggregation changed. |
| INV-CF-I08-003 | N/A | No reporting date/range semantics changed. |
| INV-CF-I08-004 | N/A | No report state enum changed. |
| INV-CF-I08-005 | N/A | No report clock defaults or cross-surface reporting continuity changed. |
| INV-SCOPE-001 | PASS | Diff audit: no API/schema/migration, Cash/Shift, Reports, Users, F0.12, Blocks A–H, real-data, or promotion changes. F0.11 frontend surfaces/build compression and local evidence harness only. `scripts/p0-1-seed-local.mjs` adds explicit existing room-dimension values to synthetic fixture setup (no product/schema behavior); retained to make the real local Worker/D1 evidence reproducible with current schema. |

## F0.11 execution evidence

- Full unit/integration/executing-D1 suite: 33 files / 168 tests PASS.
- TypeScript, production web build, architecture fitness, i18n and Cloudflare budgets PASS. Production JS is 299,982 / 300,000 raw bytes (18-byte headroom); gzip 86,293 bytes. This narrow margin is recorded, not waived.
- D1 critical query plans PASS.
- Explicit Wrangler dry-runs for API, web and staging SPA config PASS; no upload/deployment occurred.
- CF-I03 + CF-I04 lifecycle D1/API regression PASS; CF-I05 Housekeeping + Maintenance D1/API regression PASS; CF-I06 billing/atomic cents/closure regression PASS.
- `node --check` on all new F0.11 Playwright scripts and `bash -n` on F0.11 runners PASS.

## Pre-Critic determination

The initial fixed raw-JS budget concern was resolved without raising the ceiling: Terser uses existing `compress` settings with two passes and `pure_getters: true`; the production bundle executes through a built/minified local browser script against Worker/D1 at desktop and mobile widths. No concrete getter side effect has been identified in the current app surface; the built-browser evidence is the runtime smoke. The margin is only 18 bytes and remains a maintenance risk, not a reason to claim extra headroom.

Prior harness failures were test setup issues and were corrected without sleeps or timeout inflation: an old mutated synthetic fixture was replaced by a fresh seeded fixture; Playwright proxy routes now continue to the local Worker instead of leaving `route.fetch()` unfulfilled; the Reception runner waits on the UI's actual loading state; and locale is selected explicitly for deterministic evidence. They did not represent product failures.

No applicable invariant remains `UNPROVEN`. The exact commands and outcomes are included in the final Pre-Critic and orchestration state; source-specific reports remain the executable evidence.
