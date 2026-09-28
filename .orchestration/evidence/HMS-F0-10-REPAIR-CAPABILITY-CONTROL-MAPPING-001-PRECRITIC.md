# F0.10 capability-to-control mapping repair — Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001.md`

1. **Scope/contract — PASS for bounded repair admission.** F0.10 expressly requires exact existing route-capability mapping across named UI surfaces. The repair only gates presentation; no role grants, APIs, data, workflows or schema changes.
2. **Authority/parity — PASS.** API route guards and `ROLE_CAPABILITIES` are the authorities. Frontend consumes `/auth/me`; no duplicate role map or capability inference is permitted. Identified code-to-route mismatches will use the route’s actual guard, not alter the guard. In particular `lifecycle.ts` currently guards check-in/reassignment/checkout with `bookings.write`, notwithstanding the parent contract’s illustrative `lifecycle.write` example.
3. **Reports — PASS with fixed current behavior.** Reports currently loads revenue and occupancy together. The page is shown only to identities holding both exact read capabilities; no partial-data product decision or route change is introduced.
4. **Tenant/RBAC — PASS preflight.** Existing integrated D1 proof must remain: two hotel bindings, same subject scoped separately by selected hotel, unmembered hotel 403, network-only hotel API 403, same-subject privileged operation succeeds before downgrade and same operation is denied after with zero business/audit effect.
5. **Accessibility/responsive — REQUIRED.** Hidden controls must be absent from keyboard navigation and tested at 1280×900 and 375×844. Existing allowed task entry must remain usable; no disabled-control redesign.
6. **Invariants — PASS for admission.** All 24 registry invariants are explicitly classified in the frozen contract. Applicable items require fresh proof; the one narrow Housekeeping guard applied before freeze is disclosed and must pass the same final validation.
7. **No migration/data — PASS.** Disposable local D1 fixture only; no real data, schema change, or remote environment.
8. **Evidence honesty — REQUIRED.** An unchanged API guard means only visible-control alignment is claimed. Do not claim all-role browser proof unless every canonical role has direct fixture coverage; cite exact test role coverage.
9. **Publication — REQUIRED.** Generate invariant evidence after full validation, freeze replacement artifact A, orchestration-only boundary B, obtain a fresh separate F0.10 RBAC Independent Critic; do not self-approve Development Gate.

## Outcome

`PRE-CRITIC: PASS FOR BOUNDED REPAIR CONTRACT / IMPLEMENTATION MAY CONTINUE`

This admits only the capability/control mapping repair; it is not F0.10 acceptance or Foundation 0 completion.

## Final Pre-Critic Gate — post-implementation

1. **Contract/scope — PASS.** The repair contract now also records the existing distinction: network-only identity receives empty hotel capabilities; identity with neither hotel nor network membership is denied by the current protected middleware (403). No auth scope was broadened to satisfy a test.
2. **Route/control mapping — PASS.** Static audit maps each visible operation to its actual backend guard; no route guard, `ROLE_CAPABILITIES` grant, or role mutation behavior changed. Reports visibility requires both current data reads. Unknown roles render no privileged controls.
3. **RBAC/tenant — PASS.** Integrated local Worker/two-D1 proof confirms separate scopes, unmembered hotel 403, network-only hotel denial, same-subject room-create 201 as admin then 403 as receptionist, zero denied room row, final role receptionist, and exactly two role-audit rows. CF-I07 PASS.
4. **Staleness — PASS.** Browser delays an earlier admin `/auth/me` response until after receptionist context applies; releasing the stale response does not restore the hidden admin control. Identity change clears old visibility before new lookup.
5. **Accessible/responsive controls — PASS.** The browser performs navigation and material controls at desktop 1280×900 and mobile 375×844. It verifies room/user/cash actions hidden under the tested receptionist permissions, permitted housekeeping action visible, mobile navigation and no horizontal overflow.
6. **Backend authority — PASS.** The presentation layer consumes only server-provided capability arrays. Existing route enforcement remains authoritative; direct denied mutation returns 403 with no D1 write. No client-supplied capability is trusted.
7. **Regressions/platform — PASS.** `npm run check` (33 files/168 tests), `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, and serial `npm run test:cf-i03`, `test:cf-i05`, `test:cf-i06`, `test:cf-i07` all completed PASS. Cloudflare JS raw is 299,981/300,000 bytes. Wrangler was dry-run only.
8. **Integrated evidence/cleanup — PASS.** `bash scripts/cf-f0-10-capabilities-integrated.sh` passed against real local Worker and disposable D1s, with Vite/browser assertions; output JSON/log and screenshots are under `output/playwright/`. The runner verified its owned Worker/Vite/browser process trees stopped before its PASS marker. No unrelated existing process was terminated.
9. **Invariant evidence — PASS.** `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md` maps all 24 registry invariants, with evidence for each APPLIES and scoped rationale for N/A.
10. **Finding transparency.** The unaffiliated/no-membership test initially assumed `/auth/me` 200; the existing middleware returns 403. The test now asserts the preserved boundary. Earlier browser harness selector/navigation defects were corrected and the final integrated run passed. One overlapping CF-I05 attempt failed; the isolated final serial rerun passed. No arbitrary sleep, timeout inflation, or green-only retry was introduced.
11. **Publication remains independent.** Artifact A and orchestration-only Boundary B must be frozen before a separate Independent Critic can review. This Pre-Critic does not self-approve F0.10 or Foundation 0.

`FINAL PRE-CRITIC: PASS — eligible to freeze Artifact A and request Independent Critic`
