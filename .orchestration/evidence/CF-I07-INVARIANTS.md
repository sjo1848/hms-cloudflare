# CF-I07 invariants evidence

Artifact scope: Users, RBAC, audit, hotel/network admin and responsive UX. No CF-I08 analytics implementation, production resource, remote D1 or cutover.

| Invariant | Result | Evidence |
|---|---|---|
| INV-ATOMIC-001 | PASS | `scripts/cf-i07-regression.sh`: membership/user mutation and audit are one D1 batch; duplicate create and stale deactivate produce no audit. |
| INV-AUDIT-001 | PASS | Durable `control_audit_events`; actor, request, hotel, action, target, details, timestamp; newest-first query; focal exact-count assertions. |
| INV-TENANT-001 | PASS | Hotel admin API derives hotel from active membership; network capability is separate; inherited cross-tenant regressions remain covered. |
| INV-RBAC-001 | PASS | `apps/api/src/auth/capabilities.ts`; unknown role deny, housekeeping forbidden user write, downgrade then privileged write denied. |
| INV-PARITY-001 | PASS | `docs/cf-i07-security-admin-parity.md`; Access identity adaptation preserves membership/admin workflow without local passwords. |
| INV-ORDER-001 | PASS | Audit query orders `created_at DESC, id DESC`; focal regression verifies newest event and one event per successful mutation. |
| INV-UX-001 | PASS | Users search/create/role/deactivate and Network list/detail/register/plan/error surfaces in `apps/web/src/App.tsx`. |
| INV-RESP-001 | PASS | Playwright at 375/390/430/768/1024 proves Users and Network have no horizontal overflow. |
| INV-EVID-001 | PASS | This file, Pre-Critic Gate, source matrix and focal/browser logs are committed with the artifact. |
| INV-SCOPE-001 | PASS | No CF-I08 report completion, paid transition, production/cutover or product acceptance claim. |
| INV-STATE-001 | PASS | Artifact A followed by orchestration-only boundary B; canonical state points to exact A. |

## Executed checks

- `npm run check`: PASS (17 unit tests).
- `npm run web:build`: PASS.
- `npm run wrangler:dry-run`: PASS with CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB.
- `npm run test:cf-i07`: PASS.
- `npm run test:cf-i07-browser`: PASS at all contracted widths; `output/playwright/cf-i07-admin.png`.
- Fresh CF-I03 lifecycle regression: PASS.

CF-I05/CF-I06 runner processes were rerun during this wave but their shell wrappers did not emit their terminal PASS marker in the captured run; therefore this evidence does not claim them as fresh PASS. The accepted CF-I05 and CF-I06 artifacts remain the inherited regression baseline and must be independently checked against artifact A.
