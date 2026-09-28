# F0.10 Server-owned Capabilities — Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md`

## Pre-implementation gate

1. **Contract completeness — PASS.** F0.10 is an approved Foundation increment. Exact response scopes, UI surface inventory, acceptance/evidence, forbidden changes and all 24 invariant classifications are fixed before implementation. Fermat (separate read-only GPT-6 Luna Medium Contract Reviewer) found no `ROADMAP_BLOCKER` or product/security ambiguity.
2. **Authority/parity — PASS.** Server `ROLE_CAPABILITIES` plus `hasCapability` remains sole authority. This increment exposes exact existing sets; it will not add/remove grants, rename roles, accept a browser claim, or change Access, membership, hotel selection or network authority. Hotel and network sets remain disjoint in the API response.
3. **Backend enforcement — PASS preflight.** Existing routes evaluate active membership/network role on the server. UI visibility is strictly presentational. Acceptance requires a proven authenticated allowed/denied route, same-subject allowed-before/denied-after downgrade, and zero side effects for denied writes.
4. **Tenant/network scope — PASS preflight.** Hotel capabilities derive only from the currently authorized membership selected by middleware; network capabilities derive separately from active network membership. Two configured hotel bindings plus network-only/dual contexts are required in integrated evidence; unknown/unmembered hotel grants nothing.
5. **Concurrency/freshness — PASS preflight.** No stale UI context may survive identity or hotel switch; request ordering must reject an old delayed `/auth/me` response. Backend must ignore any client-side capability cache and continue checking current membership on every protected request.
6. **UX/responsive — PASS preflight.** This is visibility adaptation, not a workflow redesign. Browser proof must assert real menu/action visibility, direct-route denial, keyboard traversal and task entry at desktop 1280×900 and mobile 375×844.
7. **Migration/data — PASS preflight.** No schema or real data mutation is in scope. Downgrade changes only a disposable synthetic CONTROL_DB fixture (or the existing authorized synthetic membership operation if the test proves the same invariant); no customer/remote/staging/prod data.
8. **Validation/scope — REQUIRED before artifact.** Full F0.10 API/client tests, role parity, route/security audit, relevant regressions, types/build/fitness/budget/query plans and dry-runs; capture exact commands, status, evidence, and verify runner-owned process cleanup. No Blocks A–H or F0.11 generalized cache layer.
9. **Invariant evidence — REQUIRED before artifact.** Each of the 24 contract dispositions must be upgraded to `PASS` with direct evidence or retain justified `N/A`; no applicable item may remain `UNPROVEN`.
10. **Publication — REQUIRED.** Freeze substantive Artifact A and orchestration-only Boundary B with exact A SHA. A fresh independent RBAC Critic reviews exact A+B; implementer does not self-approve.

## Outcome

`PRE-CRITIC: PASS FOR CONTRACT FREEZE / IMPLEMENTATION MAY BEGIN`

This is a pre-implementation admission check, not implementation validation, Independent Critic, F0.10 Development Gate, or aggregate Foundation 0 PASS. No product code has been changed for F0.10 at this point.
