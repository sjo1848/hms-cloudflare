# F0.10 truthful Network viewport evidence — Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001.md`

1. **Finding fidelity — PASS.** Zeno's exact A4+B4 review found no-write assertions/screenshot were mobile despite a desktop label. The prior invariant and Pre-Critic claim must not be carried forward as fact.
2. **Bounded scope — PASS.** Correct viewport setup/assertions and generated evidence only; no product/schema changes.
3. **Actual viewport — REQUIRED.** Set desktop immediately before its own no-write case; set mobile immediately before the mobile case; read `page.viewportSize()` while each case is active and assert exact dimensions. Result widths are derived, not literals.
4. **Artifact validation — REQUIRED.** Parse PNG header dimensions in the runner's Node section; require width 1280 for desktop, 375 for mobile, and non-identical captures. Store dimensions/hashes in result output. Assertions fail closed.
5. **Identity/security — REQUIRED.** Keep the real Ops profile, app header context, actual `/auth/me`, denied POST and D1 zero-effect checks at both viewports. Only hotel-list GET remains synthetic.
6. **Invariant map — PASS for admission.** All 24 IDs classified in the frozen Task Contract; responsive/evidence/RBAC/tenant/process cleanup/scope are applicable with executable proof.
7. **Publication — REQUIRED.** Correct historical overclaim explicitly, freeze A5+B5, and use a fresh critic distinct from prior three. The A4+B4 `REWORK` remains historical. No F0.10 or Foundation 0 self-approval.

`PRE-CRITIC: PASS FOR BOUNDED EVIDENCE REPAIR ADMISSION`
