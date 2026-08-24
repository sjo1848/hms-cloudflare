# CF-I07 invariants evidence

Artifact scope: Users, RBAC, audit, hotel/network admin and responsive UX. No CF-I08 analytics implementation, production resource, remote D1 or cutover.

| Invariant | Result | Evidence |
|---|---|---|
| INV-ATOMIC-001 | PASS | `scripts/cf-i07-regression.sh`: membership/user mutation and audit are one D1 batch; conditional role/deactivate/plan writes audit only when `changes()=1`; duplicate create and stale deactivate produce no audit. |
| INV-AUDIT-001 | PASS | Durable `control_audit_events` plus provenance-preserving operational lifecycle/housekeeping/financial reads; actor, request, hotel, action, target, details, timestamp; newest-first focal assertions. |
| INV-TENANT-001 | PASS | Hotel admin API derives hotel from active membership; network capability is separate; unique active binding index and focal reuse rejection preserve one-hotel-per-D1. |
| INV-RBAC-001 | PASS | `apps/api/src/auth/capabilities.ts` is the only role map; lifecycle consumes it; unknown role deny, receptionist invoice capability absent, ops audit positive, housekeeping forbidden user write, downgrade then privileged write denied. |
| INV-PARITY-001 | PASS | `docs/cf-i07-security-admin-parity.md`; Access identity adaptation preserves membership/admin workflow without local passwords. |
| INV-ORDER-001 | PASS | Audit query orders `created_at DESC, id DESC`; focal regression verifies newest event and one event per successful mutation. |
| INV-UX-001 | PASS | Users search/create/role/deactivate and Network list/detail/register/plan/error surfaces in `apps/web/src/App.tsx`. |
| INV-RESP-001 | PASS | Playwright at 375/390/430/768/1024 executes Users search/detail/open-close/focus and Network property selection/plan mutation at every width; no horizontal overflow. |
| INV-EVID-001 | PASS | This file, Pre-Critic Gate, source matrix and focal/browser logs are committed with the artifact. |
| INV-SCOPE-001 | PASS | No CF-I08 report completion, paid transition, production/cutover or product acceptance claim. |
| INV-STATE-001 | PASS | Artifact A followed by orchestration-only boundary B; canonical state points to exact A. |

## Executed checks

- `npm run check`: PASS (17 unit tests).
- `npm run web:build`: PASS.
- `npm run wrangler:dry-run`: PASS with CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB.
- `npm run test:cf-i07`: PASS.
- `npm run test:cf-i07-browser`: PASS at all contracted widths; `output/playwright/cf-i07-admin.png`.
- Fresh `npm run test:cf-i03`: PASS (`CF-I03 + CF-I04 lifecycle D1/API regression PASS`).
- Fresh `npm run test:cf-i05`: PASS (`CF-I05 Housekeeping + Maintenance D1/API regression PASS`).
- Fresh `npm run test:cf-i06`: PASS (`CF-I06 billing/atomic cents/closure regression PASS`).
