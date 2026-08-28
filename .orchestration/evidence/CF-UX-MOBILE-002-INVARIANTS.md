# CF-UX-MOBILE-002 — Invariant Evidence

Validation target: `2170b711a87b4ce7ba8b30ac472481049c0e9de0`
Task Contract: `.orchestration/contracts/CF-UX-MOBILE-002.md`
Pre-Critic receipt: `.orchestration/PRECRITIC-CF-UX-MOBILE-002-PR13.md`
Foundation CI: `33137425712` — PASS
Browser CI: `33137425715` — PASS
Browser evidence artifact: `9672578298`, digest `sha256:a3582bb73100e7b731a280145494c3703f171dc9b88ca9eac9ad20b500320476`

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Accepted payment/idempotency base + Foundation CI; PR13 changes no API/migration transaction logic. | Inherited invariant, not reimplemented here. |
| INV-AUDIT-001 | APPLIES | PASS | Existing audit/RBAC implementation unchanged; Foundation CI PASS. | PR13 is web presentation + browser evidence only. |
| INV-DOMAIN-001 | APPLIES | PASS | Existing domain transitions unchanged; Foundation CI PASS. | No domain/API mutation implementation changed. |
| INV-TENANT-001 | APPLIES | PASS | Real local API browser journey uses exact seeded membership subjects; tenant routing implementation unchanged. | Reports/Users run as admin for hotel-a; network uses network identity. |
| INV-RBAC-001 | APPLIES | PASS | Exact admin/network identities are exercised through real API membership lookup; no RBAC code changed. | Browser CI PASS. |
| INV-PARITY-001 | APPLIES | PASS | Contracted Reports/Users/Network workflows plus previously integrated Rooms/Guests and Housekeeping remain in the integrated regression wrapper. | HMS Elite workflow intent preserved. |
| INV-RESP-001 | APPLIES | PASS | Reports/Users/Network interactions run at 375/390/430/1366 with no-overflow assertions. | Browser CI `33137425715`. |
| INV-EVID-001 | APPLIES | PASS | Immutable target + two PASS CI runs + retained artifact digest. | Evidence-only commit is distinct from validation target. |
| INV-LEGACY-001 | APPLIES | PASS | Foundation/browser regression suite passes; no legacy endpoint/schema removal in PR13. | |
| INV-MONEY-001 | APPLIES | PASS | Accepted payment idempotency work remains unchanged and covered by Foundation/integrated regressions. | PR13 adds no money logic. |
| INV-STATE-001 | APPLIES | PASS | Validation target is explicitly frozen as `2170b711...`; evidence points to it rather than to itself. | |
| INV-SCOPE-001 | APPLIES | PASS | PR13 application change is limited to UI state recovery; test/evidence changes are bounded to UX validation. No API/D1/auth/deploy product change. | |

## PR13 mutation inventory

- Existing Network plan mutation is exercised against the real local API for its successful path.
- A bounded browser-only 409 response is injected solely for the rejected-plan path.
- On rejected PATCH, `Network` now restores the authoritative property object instead of leaving an optimistic unaccepted plan visible.
- No API mutation semantics, schema, D1 migration or RBAC implementation changed.

## Evidence claim audit

| Surface / claim | Evidence | Classification |
|---|---|---|
| Reports loading/error/retry/zero-data/success | `cf-ux-admin-browser.playwright.js` | real local API + bounded request delay |
| Users loading/search-empty/details | `cf-ux-admin-browser.playwright.js` | real local API + bounded request delay |
| Network loading/filter-empty/plan success/409 rollback/analytics | `cf-ux-admin-browser.playwright.js` | real local API; 409 negative-path injection only |
| Responsive behavior at 375/390/430/1366 | `cf-ux-admin-browser.playwright.js` | browser CI PASS |
| Integrated regression preservation | `cf-i05-browser-regression.sh` | browser CI PASS |
| Type/build/test preservation | Foundation CI `33137425712` | CI PASS |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN at the Pre-Critic boundary.
- [x] Full Task Contract scope is preserved.
- [x] Technical CI gates are PASS on the exact validation target.
- [x] Tenant and RBAC are explicitly `APPLIES`.
- [x] No intermediate deploy occurred.
- [ ] Independent Critic verdict pending.
