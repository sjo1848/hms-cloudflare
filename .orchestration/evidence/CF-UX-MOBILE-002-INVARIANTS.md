# CF-UX-MOBILE-002 — Invariant Evidence

Validation target (implementation/test artifact): 85ea9a7e90b35bb18f349b632fe3899138cd04b5
Evidence boundary: traceability-only commit whose parent is the validation target above; exact evidence-commit SHA is the resulting branch head.
Task Contract: .orchestration/contracts/CF-UX-MOBILE-002.md
Pre-Critic receipt: .orchestration/PRECRITIC-GATE.md

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No business mutation implementation; browser requests are mocked. | |
| INV-AUDIT-001 | N/A | N/A | No audit/event implementation. | |
| INV-DOMAIN-001 | N/A | N/A | No domain transition implementation. | |
| INV-TENANT-001 | APPLIES | PASS | Contract classification and unchanged tenant routing/API behavior. | UI-only rework; no tenant implementation change. |
| INV-RBAC-001 | APPLIES | PASS | Contract classification and unchanged RBAC implementation/capability boundaries. | UI-only rework; no RBAC implementation change. |
| INV-PARITY-001 | APPLIES | PASS | CF-UX-MOBILE-002 contract and preserved Rooms/Guests, Housekeeping, Reports, Users and Network workflows. | |
| INV-RESP-001 | APPLIES | PENDING | Admin browser harness exercises Reports, Users and Network at 375/390/430/1366; final CI rerun pending after fixture fix. | |
| INV-EVID-001 | APPLIES | PENDING | Integrated workflow is wired to execute and upload the full browser artifact; final CI rerun pending. | |
| INV-LEGACY-001 | N/A | N/A | No legacy behavior changed. | |
| INV-MONEY-001 | N/A | N/A | No financial behavior. | |
| INV-STATE-001 | APPLIES | PASS | Validation target is the implementation/test artifact and evidence remains a separate traceability commit. | Avoids self-referential commit claims. |
| INV-SCOPE-001 | APPLIES | PASS | Traceability diff is restricted to orchestration records; app/API/D1/RBAC/deploy untouched. | |

## Mandatory mutation inventory

No business mutation is implemented by this traceability rework. Mocked POSTs exercise UI handling only and are labeled mockApi: true.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Room selection and stale-response isolation | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Hold form success/reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Guest retry, selection and form reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Responsive controls at contracted widths | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Reports loading/error/empty/retry/success | cf-ux-admin-browser.playwright.js | local browser fixture |
| Users search/detail/empty states | cf-ux-admin-browser.playwright.js | local browser fixture |
| Network selection/plan update/analytics | cf-ux-admin-browser.playwright.js | local browser fixture |
| No API changes | Artifact A diff scope audit | static |

## Publication decision

- [ ] No applicable invariant is FAIL or UNPROVEN; final CI pending.
- [x] Full Task Contract scope is preserved.
- [x] Scope audit passed.
- [x] Validation target is explicit in the synchronized STATUS record.
- [x] Tenant and RBAC are explicitly `APPLIES`.
- [ ] CI rerun after the fixture correction is pending.
- [x] Evidence boundary is distinct and transparent.
- [x] External review is required and Codex does not self-approve PASS.
