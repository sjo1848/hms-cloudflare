# F0.10 Independent Critic — replacement Artifact A2 + Boundary B2

## Review request

- Work branch: `impl/hms-foundation-0`
- Artifact A2 (immutable implementation/evidence): `3b4a9ea687e6ddc7a184b8cb3b13cc5e2f5d006f`
- Boundary B2: this orchestration-only commit; its exact SHA is supplied with the review request and recorded by the subsequent orchestration transition.
- Prior A1/B1: `be92a5750c9be4b1b112bbd9980a8b34fc83d42a` + `d224b69ac0c2fa0c8d427d6dab3dc8cd30ae4cbe`, verdict `REWORK` from Lagrange. That verdict remains immutable and is not being rewritten.
- Scope: F0.10 Server-owned Capabilities, with bounded Network write DOM/keyboard repair.
- Reviewer must be fresh and separate from implementation, Pre-Critic, and prior A1/B1 Critic; read-only.
- Requested effort: Luna Medium; escalate only if actual review difficulty warrants.

## Findings-to-evidence map

- **F0.10-IC-01 (High):** `NetworkPage.tsx` now reads `CapabilitiesContext.network` and only renders registration and plan-update select when `saas.hotels.write` is present. Without write scope, those controls are absent from the DOM and plan remains readable as text. The obsolete network data attribute/CSS-only rule is removed. Browser tests include authorized and hotel-member/no-network-write direct `/network` contexts plus a real denied Worker POST. For the no-write selected-property UI state only, the hotel-list GET is a labeled synthetic response: current role matrix has no network read-only role. `/auth/me`, membership/capability, and mutation denial are real local Worker/D1.
- **F0.10-IC-02 (Medium):** Playwright tab traversal reaches the authorized register/plan controls; 40 Tab steps in the unauthorized selected-property view cannot focus them. Desktop 1280×900 and mobile 375×844 are part of the integrated run. A supplementary keyboard-state screenshot is present.
- **F0.10-IC-03 (Medium):** Exact A2 includes the invariant map with `INV-STATE-001` explicitly conditional on exact A2+B2 and this independent verdict. This is the non-circular publication rule: the verdict cannot be embedded in A2 or known while B2 is formed. After the exact verdict, a follow-up orchestration-only B3 will record the verdict/SHA and set this evidence row to `PASS`; no product blob changes after review. Please assess whether this exact sequence satisfies the gate.

## Evidence to inspect

- `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md`
- `.orchestration/contracts/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001.md`
- `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-WRITES-KEYBOARD-001.md`
- `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md`
- `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-WRITES-KEYBOARD-001-PRECRITIC.md`
- `.orchestration/evidence/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001-PRECRITIC.md`
- `output/playwright/f0-10-capabilities-integrated-result.json` and `.log`
- `scripts/cf-f0-10-capabilities.playwright.js` and integrated shell runner

Adversarially verify exact route-to-control scope, API authority, hotel/network separation, unknown and no-membership behavior, same-subject downgrade and stale response, direct-route visibility, DOM absence/tab-order proof, synthetic-vs-real claim honesty, all invariant dispositions, full validation and cleanup, scope, and JS budget (299,947/300,000 raw). B2 must be orchestration-only and point to A2 exactly. Look for residual `ROADMAP_BLOCKER`, architecture contradiction, unsupported claim or unmet prior finding.

Permitted verdict: `PASS`, `PASS_WITH_CONDITIONS`, or `REWORK`; list severity and concrete evidence. Do not modify files. Codex has not self-declared F0.10 or aggregate Foundation PASS.

## Verdict

`REWORK`

Reviewer: Tesla, fresh separate read-only Independent Critic, GPT-6 Luna Medium. Exact reviewed pair: A2 `3b4a9ea687e6ddc7a184b8cb3b13cc5e2f5d006f` + B2 `a6bdd79576d37de6b5f9ad78becc8ae806d85ef4`. Review did not modify files.

### Finding

- **Medium — F0.10-IC-04 responsive Network keyboard proof is incomplete.** Existing browser assertions prove authorized and unauthorized Network control/tab behavior at desktop 1280×900. The viewport changes to mobile 375×844 only after leaving Network for Rooms; therefore Network keyboard/accessibility at mobile is unproven. Add explicit 375×844 assertions for both authorized network writer and unauthorized hotel member, including DOM absence and forbidden-control tab exclusion for the latter. No architecture blocker.

### Confirmed resolved / accepted

- IC-01 is resolved at desktop: server-owned `saas.hotels.write` conditionally renders register and plan editor; the plan stays readable in the no-write state. The no-write selected-property hotel-list GET is explicitly synthetic; `/auth/me` and denied POST use the local Worker.
- IC-02 desktop keyboard checks now prove authorized access and unauthorized DOM/tab exclusion.
- The exact A2→B2→critic→orchestration-only B3 sequence for finalizing INV-STATE-001 is compliant and requires no additional review for that metadata-only update, provided product blobs remain unchanged.
- Same-subject downgrade, stale response, backend authority, tenant scope, other evidence claims, budget and exact B2 orchestration-only contents were supported. No ROADMAP_BLOCKER or architecture contradiction.

A2+B2 remain immutable with REWORK. A3+B3 and a fresh separate review are required after the mobile assertions are added; F0.10 and Foundation 0 remain open.

## Bounded repair disposition (does not rewrite this verdict)

- Contract `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001.md` and its Pre-Critic were frozen before modifying the browser runner.
- The first attempt failed because the test inspected the authorized mobile DOM before `/auth/me` resolved. The runner now waits on the real 200 response and rendered control, without arbitrary sleeps or expanded timeout. This was classified as test synchronization, not an application defect; product code was not changed.
- Fresh real local Worker/two-D1/Vite integrated run passes the authorized and unauthorized Network keyboard/DOM requirements at 1280×900 and 375×844. The direct forbidden POST returns 403 at both viewports; D1 has zero denied effect; owned processes are stopped.
- Detailed output and mobile screenshots are in `output/playwright/f0-10-capabilities-integrated-result.json`, `.log`, `f0-10-network-admin-mobile-keyboard.png`, and `f0-10-network-no-write-mobile-keyboard.png`.
- A2+B2's historical `REWORK` remains. Replacement A3+B3 must receive a fresh independent review before F0.10 can close.
