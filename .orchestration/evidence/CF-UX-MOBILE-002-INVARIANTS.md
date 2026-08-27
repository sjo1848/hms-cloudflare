# CF-UX-MOBILE-002 — Invariant Evidence

Artifact candidate: artifact commit A (resolved before publication)
Task Contract: .orchestration/contracts/CF-UX-MOBILE-002.md
Pre-Critic gate: .orchestration/PRECRITIC-GATE.md

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | No business mutation implementation; browser requests are mocked. | |
| INV-AUDIT-001 | N/A | N/A | No audit/event implementation. | |
| INV-DOMAIN-001 | N/A | N/A | No domain transition implementation. | |
| INV-TENANT-001 | N/A | N/A | No tenant routing change; fixture headers are local mock only. | |
| INV-RBAC-001 | N/A | N/A | No backend capability change. | |
| INV-PARITY-001 | APPLIES | PASS | Contract and unchanged Rooms/Guests API semantics. | |
| INV-RESP-001 | APPLIES | PASS | Browser script runs widths 375/430/768/1366 and asserts overflow plus controls. | |
| INV-EVID-001 | APPLIES | PASS | Workflow executes and uploads browser artifact. | |
| INV-LEGACY-001 | N/A | N/A | No legacy behavior changed. | |
| INV-MONEY-001 | N/A | N/A | No financial behavior. | |
| INV-STATE-001 | APPLIES | PASS | Artifact A and boundary B publication. | |
| INV-SCOPE-001 | APPLIES | PASS | Diff is browser evidence, workflow wiring and orchestration metadata; API untouched. | |

## Mandatory mutation inventory

No business mutation is implemented. Mocked POSTs only exercise UI handling and are labeled mockApi: true.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Room selection and stale-response isolation | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Hold form success/reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Guest retry, selection and form reset | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| Responsive controls at contracted widths | cf-ux-rooms-guests-browser.playwright.js | browser mock |
| No API changes | Artifact diff scope audit | static |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Full Task Contract validation passed.
- [x] Scope audit passed.
- [ ] Canonical state points to exact artifact (completed in boundary B).
- [x] External review is required and Codex does not self-approve PASS.
