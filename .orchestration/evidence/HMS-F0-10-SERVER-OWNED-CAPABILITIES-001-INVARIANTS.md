# F0.10 — Server-owned capabilities: invariant evidence

Task Contracts: `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md` and `.orchestration/contracts/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001.md`
Pre-Critic: `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-PRECRITIC.md` and `.orchestration/evidence/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001-PRECRITIC.md`
Evidence scope: synthetic local Worker, disposable CONTROL_DB/HOTEL_DEMO_DB/HOTEL_SECOND_DB, Vite, and desktop/mobile browser only. No remote binding, real data, migration, or deployment.

| Invariant | Classification | Status | Evidence |
|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No product business mutation or multi-write command changed. The admin role downgrade is existing isolated test setup/control-plane functionality and its two audit rows are asserted. |
| INV-AUDIT-001 | APPLIES | PASS | Integrated same-subject admin room creation before downgrade returns 201; the same operation after downgrade returns 403; D1 asserts the two expected `USER_ROLE_CHANGE` audits and zero denied room insertion. Existing admin/audit code is unchanged. |
| INV-DOMAIN-001 | N/A | N/A | No domain transition, route handler, state mutation, or command semantics changed. |
| INV-TENANT-001 | APPLIES | PASS | API tests cover selected hotel and network-only contexts; integrated Worker uses two separately bound local hotel D1s, confirms network-only hotel API denial and unmembered hotel denial, and verifies per-hotel data isolation. Runner result: `output/playwright/f0-10-capabilities-integrated-result.json`. |
| INV-RBAC-001 | APPLIES | PASS | `apps/api/src/auth/capabilities.test.ts` checks canonical sets and unknown-role empty set; `apps/api/src/index.test.ts` checks every canonical role, network-only scope, unknown role and fully unmembered 403. Integrated browser proves exact UI visibility, same-subject before/after downgrade and direct denied write with zero D1 effect. CF-I07 PASS. |
| INV-PARITY-001 | N/A | N/A | No source workflow, backend capability set, permission grant or business behavior is changed; UI visibility consumes the server's existing exact capability set. |
| INV-ENUM-001 | N/A | N/A | No domain enum, serialization or state predicate changed. Unknown role is not interpreted as a new role and receives an empty capability set. |
| INV-UX-001 | APPLIES | PASS | Browser exercises permitted admin, receptionist, operations and housekeeping actions, plus navigation and protected controls; Network registration and plan editor are absent from DOM without `saas.hotels.write`, while selected plan remains readable. Desktop 1280×900 and mobile 375×844 are asserted. |
| INV-ORDER-001 | N/A | N/A | Queue order, priority, selection and next-case behavior are untouched. |
| INV-RESP-001 | APPLIES | PASS | Actual integrated browser checks desktop 1280×900 and mobile 375×844, including mobile navigation, role visibility, keyboard tab order and horizontal overflow. Network write controls are keyboard reachable for `saas_admin` and absent/non-focusable for an ops hotel member. |
| INV-EVID-001 | APPLIES | PASS | Claims map to the API tests, the local Worker/D1/Vite browser runner and result JSON, 33-file/168-test suite, CF-I03–I07 regression outputs, types/build/fitness/query-plan/Wrangler commands below. For the no-network-write selected-property UI assertion only, the hotel-list GET is a labeled synthetic browser response because no canonical network role has read without write; `/auth/me` and denied POST still use real Worker/D1. Screenshots are supplementary. |
| INV-LEGACY-001 | N/A | N/A | No historical source rows or identities are synthesized, merged or backfilled. |
| INV-MONEY-001 | N/A | N/A | No amount, charge, invoice, payment, cash or settlement semantics changed. Billing controls are hidden by exact existing capability sets; backend guards remain authoritative. CF-I06 PASS. |
| INV-STATE-001 | APPLIES | PASS AFTER A+B+INDEPENDENT CRITIC | Required publication is non-circular: substantive Artifact A, orchestration-only Boundary B naming its exact SHA, then a genuinely separate Critic. This row's final status is completed only after those exact commits and external review. |
| INV-CF-I07-001 | APPLIES | PASS | Frontend consumes `/auth/me` capability arrays; it contains no second role-to-capability authority. Canonical `ROLE_CAPABILITIES`/`hasCapability` remain the API source of truth. `npm run test:cf-i07` PASS. |
| INV-CF-I07-002 | N/A | N/A | No admin mutation implementation or no-op semantics changed. Synthetic role downgrade is pre-existing and tested solely to prove freshness. |
| INV-CF-I07-003 | APPLIES | PASS | Browser creates a room as the same subject while admin (`201`), changes only its fixture membership role, repeats the identical room-create operation as receptionist (`403`); D1 shows one allowed room, zero denied rooms, final receptionist role and exactly two role audit events. |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/cf-f0-10-capabilities-integrated.sh` owns disposable Wrangler state and its Worker/Vite/browser process trees, verifies termination before printing PASS. Final result JSON records that check. Pre-existing host processes were not touched. |
| INV-CF-I08-001 | N/A | N/A | No revenue, occupancy, currency arithmetic or report query changed. |
| INV-CF-I08-002 | N/A | N/A | No network metrics fan-out, binding allow-list or aggregation changed. |
| INV-CF-I08-003 | N/A | N/A | No reporting dates or booking-state predicates changed. |
| INV-CF-I08-004 | N/A | N/A | No booking/room state predicate changed. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/default date or cross-surface continuity changed. |
| INV-SCOPE-001 | APPLIES | PASS | Diff is limited to `/auth/me` descriptive capability arrays, frontend navigation/action visibility, API/UI tests and local evidence. Bounded repair also removes only the unused Network capability data attribute and CSS-only visibility rule after conditional DOM rendering. No role grants, guards, migrations, product workflows, real data, PR, push, merge, Block A–H, or promotion. |

## Validation evidence

- `npm run check`: PASS — 33 test files, 168 tests.
- `npm run types:check`: PASS.
- `npm run web:build`: PASS — after final bounded repair JS raw 299,947 bytes / 300,000 ceiling (53-byte headroom); gzip 86,258; CSS raw 43,399; gzip 8,383.
- `npm run architecture:fitness`: PASS — architecture I/II, i18n and budgets.
- `npm run test:d1-query-plan`: PASS — arrival/checkout and keyed inventory plans.
- `npm run wrangler:dry-run`: PASS for API and web Workers; dry-run only.
- `npm run test:cf-i03`: PASS — CF-I03 + CF-I04 lifecycle D1/API.
- `npm run test:cf-i05`: PASS — Housekeeping + Maintenance D1/API.
- `npm run test:cf-i06`: PASS — billing, integer cents and cash closure.
- `npm run test:cf-i07`: PASS — RBAC, users, audit and network.
- `bash -n scripts/cf-f0-10-capabilities-integrated.sh`; `node --check scripts/cf-f0-10-capabilities.playwright.js`: PASS.
- `bash scripts/cf-f0-10-capabilities-integrated.sh`: PASS — real local Worker + two disposable hotel D1 bindings + Vite/browser; desktop/mobile, dual/network-only scopes, admin→receptionist same-subject downgrade, hidden actions, network-write DOM/keyboard exclusion, authorized keyboard access, direct denial, response ordering, authoritative D1 snapshots and owned-process cleanup. For the no-network-write selected-property detail only, a synthetic hotel-list GET is intercepted; `/auth/me`, membership/capability and denied network POST use real local Worker/D1. Exact output is in `output/playwright/f0-10-capabilities-integrated-result.json` and `.log`.
- `git diff --check`: PASS.

## Disclosed validation corrections

- A test initially expected an identity with *no hotel and no network membership* to receive `/auth/me` 200. Existing `/api/v1/*` middleware intentionally denies that unmembered identity with 403. No authorization boundary was broadened: the test now asserts the existing 403; the network-only API case separately proves hotel capabilities are empty while network capabilities remain scoped. The task contract records this existing boundary explicitly.
- Earlier iterations of the new browser runner had selector/navigation assertion defects; selectors/navigation were corrected and the final integrated run above passed. One earlier CF-I05 attempt overlapped a browser run and failed without a diagnostic assertion; CF-I05 was isolated, rerun serially, and passed. No timeout increase or retry was used to claim success.

## Publication boundary

- [x] All contract/invariant evidence and actual outputs are present; no applicable item is marked FAIL/UNPROVEN.
- [ ] Freeze exact Artifact A, then orchestration-only Boundary B and receive fresh Independent Critic review. Codex does not self-declare substantive F0.10 PASS.
