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

## Execution disposition

- First syntax check caught a duplicate local declaration and was corrected before integrated execution. The first integrated attempt then reached the browser but failed in the terminal PNG hash step because `node:crypto` was imported in the preceding, separate Node process. The import was moved into the correct process; no result from that failed command was counted as PASS.
- Final `bash scripts/cf-f0-10-capabilities-integrated.sh`: PASS. Runtime viewport records are `1280x900:PASS` and `375x844:PASS`; PNG headers are desktop width 1280 / height 1034 and mobile width 375 / height 1209, with different SHA-256 digests. These values are derived from `page.viewportSize()` and saved images, not hardcoded labels.
- Both no-write cases assert local Ops profile and actual Worker `/auth/me`; DOM absence, readable plan, 40-tab exclusion, real denied POST 403, D1 zero denied hotel rows. Authorized keyboard case passes at both widths. Only hotel-list GET is synthetic. No product/schema changes; owned process trees verified stopped; tempdir retained.
- Machine evidence: `output/playwright/f0-10-capabilities-integrated-result.json`, `.log`, desktop/mobile no-write PNGs. A4+B4 `REWORK` remains historical; A5+B5 needs a fresh critic.
