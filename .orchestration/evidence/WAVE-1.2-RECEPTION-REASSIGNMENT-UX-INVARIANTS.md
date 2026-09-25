# WAVE-1.2-RECEPTION-REASSIGNMENT-UX — Invariant Evidence

Artifact scope: Reception reassignment workflow UI plus the minimum backend
repair required by the real integrated flow. Reports and Users remain out of
scope.

## Contract and validation evidence

- Task Contract: `.orchestration/contracts/WAVE-1.2-RECEPTION-REASSIGNMENT-UX.md`.
- `npm run types:check`: PASS.
- `npm run check`: PASS — 21 files / 88 tests.
- `npm run web:build`: PASS — JS 283930 raw / 82492 gzip; CSS 33695 raw / 6683 gzip.
- `npm run architecture:fitness`: PASS — architecture, i18n coverage and Cloudflare budgets.
- `npm run test:cf-i04`: PASS — inherited D1/API lifecycle regression, including reassignment backend assertions.
- Targeted browser evidence: `scripts/cf-i04-browser-regression.mjs`, mock API fixture, PASS at 375, 390, 430, 768 and 1024px. It asserts short-reason rejection, 409 operational guidance, retry success, mobile/desktop interaction and checkout regression.
- Integrated success evidence: `WAVE12_BROWSER_MODE=success bash scripts/cf-wave12-reassignment-integrated.sh` PASS against a local Wrangler Worker/D1 and Vite preview at 375px. The browser exercised the real Reception UI and API: BLOCKING destination disabled, NON_BLOCKING advisory visible and selectable, repricing 30000 -> 36000, short reason rejected client-side, valid reassignment returned 200, and refresh showed room 102.
- Integrated conflict evidence: `WAVE12_BROWSER_MODE=conflict bash scripts/cf-wave12-reassignment-integrated.sh` PASS against a separate fresh local Worker/D1 session at 375px. A real concurrent admin mutation added BLOCKING maintenance to the selected destination; Reception received operational 409 guidance and D1 showed no booking, lifecycle or financial drift.
- Integrated D1 assertions: success persisted destination room/current total, invoice amount 36000 with paid truth 0/PENDING, old room DIRTY, destination OCCUPIED, historical inventory claims preserved, one REASSIGN and one PRICE_RECONCILIATION, and zero payment entries. Conflict preserved the stale booking and produced no lifecycle/financial events.
- The integrated run found and fixed a real duplicate `PRICE_RECONCILIATION` insert in `d1-lifecycle-repository.ts`; the duplicate caused a false 409 despite the intended operation. This is a minimal contract-required repair, not a new backend foundation.
- Global `ux-mobile-browser` Reports/Users workerd/Vite instability remains a shared/preexisting promotion finding and was not modified by this wave.

## Invariant matrix

| Invariant | Result | Evidence / rationale |
|---|---|---|
| INV-ATOMIC-001 | PASS | UI has no optimistic room mutation; success is shown only after the reassignment API resolves successfully. Real success/conflict sessions verified D1 persistence or zero drift respectively. |
| INV-AUDIT-001 | PASS | UI success copy is emitted only from a successful lifecycle response; integrated D1 showed exactly one REASSIGN and one PRICE_RECONCILIATION on success and none on conflict. |
| INV-DOMAIN-001 | PASS | The surface invokes the existing `reassign` lifecycle command only; no generic booking/room PATCH was added. |
| INV-TENANT-001 | PASS | Room availability, housekeeping state, hotel-local context and billing context are loaded through existing tenant-scoped API routes; no client-selected tenant/binding was introduced. |
| INV-RBAC-001 | PASS | UI visibility is a convenience for CHECKED_IN bookings; backend lifecycle authorization remains authoritative. No authorization bypass was added. |
| INV-PARITY-001 | PASS | Existing Reception selected-case/drawer workflow is preserved, with guest, room, stay, checkout, destination, reason, price and conflict context added in-place. |
| INV-ENUM-001 | PASS | API status/impact values are handled using canonical target values (`CHECKED_IN`, `Available`, `Maintenance`, `BLOCKING`, `NON_BLOCKING`) and localized display strings; no source literal is used as a target predicate. |
| INV-UX-001 | PASS | The checked-in Reception operation is available in the existing contextual surface, retains queue context, exposes eligibility and price impact, and provides success/conflict recovery. |
| INV-RESP-001 | PASS | The targeted mock browser executes material reassignment controls at 375, 390, 430, 768 and 1024px, including reason validation and conflict retry. |
| INV-EVID-001 | PASS | Mock and integrated browser evidence are explicitly separated. The integrated commands use real local Worker/D1 and Vite preview sessions, with post-browser D1 assertions. |
| INV-LEGACY-001 | N/A | No legacy record synthesis or recovery path is part of this UI increment. |
| INV-MONEY-001 | PASS | UI price estimates use integer cents and existing extra-charge totals; no payment entries or financial records are created or edited. Backend D11 remains unchanged. |
| INV-STATE-001 | PASS | Publication uses artifact commit A followed by orchestration-only boundary commit B recording A's exact SHA. |
| INV-ORDER-001 | N/A | No queue ranking or next-item selection changed. |
| INV-CF-I07-001..004 | N/A | No admin, network or audit authorization route changed. |
| INV-CF-I08-001..005 | N/A | Reports/analytics are explicitly out of scope and unchanged. |
| INV-SCOPE-001 | PASS | Diff is limited to Reception UI/API client behavior, targeted integrated browser runners, and the minimal duplicate-event repair required by the real workflow; no Reports/Users/D11 redesign. |

## Pre-Critic findings

1. The repository-wide browser gate remains blocked by the known shared/preexisting Reports/Users harness/runtime finding. This wave does not absorb or repair it.
2. A combined local Wrangler/Vite browser session was not stable after concurrent refresh traffic; separate fresh success and conflict sessions are the reproducible integrated evidence. No timeout inflation or blind retry was used.
3. Reception lacks `housekeeping.read`; the UI deliberately loads the selected room's maintenance case through the existing `maintenance.read` route, without expanding permissions.

No applicable invariant is `FAIL` or `UNPROVEN` for the scoped artifact.
