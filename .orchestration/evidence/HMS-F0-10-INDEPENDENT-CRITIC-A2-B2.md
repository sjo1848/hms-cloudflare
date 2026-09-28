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

`PENDING`
