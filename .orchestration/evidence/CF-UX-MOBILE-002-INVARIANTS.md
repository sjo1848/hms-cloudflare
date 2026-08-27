# CF-UX-MOBILE-002 — Invariant Evidence

Artifact candidate: 821f9e03b2939684d5e38119999feb37c84d3dae
Task Contract: .orchestration/contracts/CF-UX-MOBILE-002.md
Pre-Critic gate: .orchestration/PRECRITIC-GATE.md

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No business mutation implementation; browser requests are mocked. | |
| INV-AUDIT-001 | N/A | N/A | No audit/event implementation. | |
| INV-DOMAIN-001 | N/A | N/A | No domain transition implementation. | |
| INV-TENANT-001 | N/A | N/A | No tenant routing change; fixture headers are local mock only. | |
| INV-RBAC-001 | N/A | N/A | No backend capability change. | |
| INV-PARITY-001 | APPLIES | PASS | CF-UX-MOBILE-002 contract and unchanged Rooms/Guests API semantics. | |
| INV-RESP-001 | APPLIES | PASS | cf-ux-rooms-guests-browser.playwright.js runs widths 375/430/768/1366 and asserts overflow plus material controls. | |
| INV-EVID-001 | APPLIES | PASS | ux-mobile-browser workflow executes and uploads the browser artifact. | |
| INV-LEGACY-001 | N/A | N/A | No legacy behavior changed. | |
| INV-MONEY-001 | N/A | N/A | No financial behavior. | |
| INV-STATE-001 | APPLIES | PASS | Artifact A 821f9e03b2939684d5e38119999feb37c84d3dae and boundary B are separate commits. | |
| INV-SCOPE-001 | APPLIES | PASS | Artifact diff is limited to browser evidence and workflow wiring; API untouched. | |

## Mandatory mutation inventory

No business mutation is implemented. Mocked POSTs exercise UI handling only and are labeled mockApi: true.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Room selection and stale-response isolation | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Hold form success/reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Guest retry, selection and form reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Responsive controls at contracted widths | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| No API changes | Artifact A diff scope audit | static |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Full Task Contract validation passed.
- [x] Scope audit passed.
- [x] Canonical state points to exact artifact in boundary B.
- [x] External review is required and Codex does not self-approve PASS.
