# CF-UX-MOBILE-002 — Invariant Evidence

Validation target after Critic REWORK-1: `e88a3a855581498154aaa0d782750e5cc8b97b46`
Task Contract: `.orchestration/contracts/CF-UX-MOBILE-002.md`
Pre-Critic receipt: `.orchestration/PRECRITIC-CF-UX-MOBILE-002-PR13.md`
Foundation CI: `33137698493` — PASS
Browser CI: `33137698486` — PASS
Browser artifact: `9672681117`, digest `sha256:8d486b474da4cf165435a6a93cfb80379c507511d861b86f5e0b42192bc7f422`

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Accepted payment/idempotency base + Foundation CI; PR13 changes no API/migration transaction logic. | Inherited invariant. |
| INV-AUDIT-001 | APPLIES | PASS | Existing audit implementation unchanged; Foundation CI PASS. | User/Network UI invokes existing audited endpoints. |
| INV-DOMAIN-001 | APPLIES | PASS | Existing domain transitions unchanged; Foundation CI PASS. | No domain/API implementation change. |
| INV-TENANT-001 | APPLIES | PASS | Exact seeded hotel-admin and network identities run through real local API membership lookup. | Tenant routing unchanged. |
| INV-RBAC-001 | APPLIES | PASS | Admin membership actions and network SaaS-admin actions execute under their exact identities. | No RBAC implementation change. |
| INV-PARITY-001 | APPLIES | PASS | Reports/Users/Network material workflows are exercised; earlier Rooms/Guests and Housekeeping regressions remain in wrapper. | HMS Elite intent preserved. |
| INV-RESP-001 | APPLIES | PASS | Material actions run at 375/390/430/1366 with no-overflow assertions. | Browser CI PASS. |
| INV-EVID-001 | APPLIES | PASS | Exact immutable target + two PASS CI runs + retained browser digest + persisted REWORK history. | |
| INV-LEGACY-001 | APPLIES | PASS | Users create/duplicate-error/retry/role/deactivate and Network plan/retry now execute in active wrapper; Foundation/browser CI PASS. | Addresses Critic REWORK-1. |
| INV-MONEY-001 | APPLIES | PASS | Accepted payment idempotency work remains unchanged and covered by integrated base/Foundation suite. | PR13 adds no financial logic. |
| INV-STATE-001 | APPLIES | PASS | Rejected Network plan restores authoritative selected property; successful mutations remain API-authoritative. | Browser CI proves 409 rollback at all widths. |
| INV-SCOPE-001 | APPLIES | PASS | PR13 product change is web UX/state only; no API/D1/auth/deploy product change. | |

## PR13 mutation inventory

- Users: existing membership create/role/deactivate endpoints are exercised against real local API; duplicate create provides real visible failure/retry evidence.
- Network: existing plan PATCH is exercised against real local API for success. A bounded browser-only 409 is injected for the rejected path; UI restores the authoritative plan and Retry reloads network state.
- Reports: read-only real API series with bounded transport delay solely to make loading observable.
- No schema/API/RBAC/auth semantics are changed.

## Publication decision

- [x] Critic REWORK-1 findings are covered by executable evidence.
- [x] No applicable invariant is FAIL or UNPROVEN at the new Pre-Critic boundary.
- [x] Foundation and browser CI PASS on `e88a3a855...`.
- [x] No intermediate deployment occurred.
- [ ] Fresh post-REWORK Independent Critic pending.
