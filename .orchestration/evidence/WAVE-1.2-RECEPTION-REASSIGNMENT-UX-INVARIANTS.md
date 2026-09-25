# WAVE-1.2-RECEPTION-REASSIGNMENT-UX — Invariant Evidence

Artifact scope: Reception reassignment UI only. Backend reassignment, D11,
Reports and Users are inherited or explicitly out of scope.

## Contract and validation evidence

- Task Contract: `.orchestration/contracts/WAVE-1.2-RECEPTION-REASSIGNMENT-UX.md`.
- `npm run types:check`: PASS.
- `npm run check`: PASS — 21 files / 88 tests.
- `npm run web:build`: PASS — JS 283482 raw / 82310 gzip; CSS 33695 raw / 6683 gzip.
- `npm run architecture:fitness`: PASS — architecture, i18n coverage and Cloudflare budgets.
- `npm run test:cf-i04`: PASS — inherited D1/API lifecycle regression, including reassignment backend assertions.
- Targeted browser evidence: `scripts/cf-i04-browser-regression.mjs`, mock API fixture, PASS at 375, 390, 430, 768 and 1024px. It asserts short-reason rejection, 409 operational guidance, retry success, mobile/desktop interaction and checkout regression. This is mock-browser evidence, not integrated production-API evidence.
- Global `ux-mobile-browser` Reports/Users workerd/Vite instability remains a shared/preexisting promotion finding and was not modified by this wave.

## Invariant matrix

| Invariant | Result | Evidence / rationale |
|---|---|---|
| INV-ATOMIC-001 | PASS | UI has no optimistic room mutation; success is shown only after the reassignment API resolves successfully. 409 preserves the surface and refreshes context. Backend atomicity is inherited from Wave 1.1. |
| INV-AUDIT-001 | PASS | UI success copy is emitted only from a successful lifecycle response; conflict/error paths do not claim audit success. Backend event behavior is covered by CF-I04. |
| INV-DOMAIN-001 | PASS | The surface invokes the existing `reassign` lifecycle command only; no generic booking/room PATCH was added. |
| INV-TENANT-001 | PASS | Room availability, housekeeping state, hotel-local context and billing context are loaded through existing tenant-scoped API routes; no client-selected tenant/binding was introduced. |
| INV-RBAC-001 | PASS | UI visibility is a convenience for CHECKED_IN bookings; backend lifecycle authorization remains authoritative. No authorization bypass was added. |
| INV-PARITY-001 | PASS | Existing Reception selected-case/drawer workflow is preserved, with guest, room, stay, checkout, destination, reason, price and conflict context added in-place. |
| INV-ENUM-001 | PASS | API status/impact values are handled using canonical target values (`CHECKED_IN`, `Available`, `Maintenance`, `BLOCKING`, `NON_BLOCKING`) and localized display strings; no source literal is used as a target predicate. |
| INV-UX-001 | PASS | The checked-in Reception operation is available in the existing contextual surface, retains queue context, exposes eligibility and price impact, and provides success/conflict recovery. |
| INV-RESP-001 | PASS | The targeted mock browser executes material reassignment controls at 375, 390, 430, 768 and 1024px, including reason validation and conflict retry. |
| INV-EVID-001 | PASS | Mock-browser evidence is explicitly labeled as mock; no claim of integrated API browser completion is made. Build/test claims map to executable commands above. |
| INV-LEGACY-001 | N/A | No legacy record synthesis or recovery path is part of this UI increment. |
| INV-MONEY-001 | PASS | UI price estimates use integer cents and existing extra-charge totals; no payment entries or financial records are created or edited. Backend D11 remains unchanged. |
| INV-STATE-001 | PASS | Publication uses artifact commit A followed by orchestration-only boundary commit B recording A's exact SHA. |
| INV-ORDER-001 | N/A | No queue ranking or next-item selection changed. |
| INV-CF-I07-001..004 | N/A | No admin, network or audit authorization route changed. |
| INV-CF-I08-001..005 | N/A | Reports/analytics are explicitly out of scope and unchanged. |
| INV-SCOPE-001 | PASS | Diff is limited to Reception UI/API client/types/styles/i18n, targeted browser fixture, task contract and evidence; no Reports/Users/D11/backend domain redesign. |

## Pre-Critic findings

1. The repository-wide browser gate remains blocked by the known shared/preexisting Reports/Users harness/runtime finding. This wave does not absorb or repair it.
2. The targeted browser proof uses a mock API fixture. It proves UI state/interaction behavior, not integrated D1/API deployment behavior; inherited CF-I04 proves the backend reassignment contract separately.

No applicable invariant is `FAIL` or `UNPROVEN` for the scoped artifact.
