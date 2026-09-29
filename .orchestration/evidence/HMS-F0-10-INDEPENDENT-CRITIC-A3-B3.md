# F0.10 Independent Critic — Artifact A3 + Boundary B3

## Frozen pair

- Branch: `impl/hms-foundation-0`
- Artifact A3: `15835e28de8b6d3a7b069c65a197bd937a9596f5`
- Boundary B3: this orchestration-only commit; request supplies its exact SHA.
- Prior A2+B2 `3b4a9ea687e6ddc7a184b8cb3b13cc5e2f5d006f` + `a6bdd79576d37de6b5f9ad78becc8ae806d85ef4` remains immutable with Tesla's `REWORK`.
- Scope: close F0.10-IC-04 evidence gap only. No product source/schema changes in A3.
- Reviewer must be genuinely fresh, read-only, and separate from implementation, Pre-Critic, Lagrange, and Tesla. Requested model/effort: GPT-6 Luna Medium.

## Finding under review

Tesla found mobile Network keyboard and DOM behavior unproven: prior Network keyboard assertions ran only at 1280×900, while the later 375×844 assertions were on Rooms. A3 adds explicit authorized and unauthorized Network checks at both viewports.

## Evidence map

- Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001.md`
- Pre-Critic and execution disposition: `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001-PRECRITIC.md`
- Full F0.10 invariant evidence: `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md`
- Historical Tesla verdict and bounded repair record: `.orchestration/evidence/HMS-F0-10-INDEPENDENT-CRITIC-A2-B2.md`
- Integrated result/log: `output/playwright/f0-10-capabilities-integrated-result.json` and `.log`
- Mobile screenshots: `output/playwright/f0-10-network-admin-mobile-keyboard.png`, `f0-10-network-no-write-mobile-keyboard.png`
- Runner and assertions: `scripts/cf-f0-10-capabilities.playwright.js`, `scripts/cf-f0-10-capabilities-integrated.sh`

## Required adversarial review

Verify the exact A3/B3 blobs and SHA relationship; all prior A2 findings remain historically distinguished; allowed `saas_admin` reaches registration and plan selector by keyboard at desktop and mobile; hotel member without network write has neither control in DOM, cannot tab to either at both viewports, and can still read the plan; `/auth/me` and forbidden POST are real local Worker/D1 while only the no-write hotel-list GET is synthetic; both denied POSTs return 403 and D1 records zero denied hotels; mobile screenshots are actually mobile; fixture, cleanup and scope claims are accurate; invariant and Pre-Critic records are complete; no product/schema changes, unsupported PASS or architecture blocker.

## Verdict

`REWORK — Medium`

Reviewer: Harvey, fresh separate read-only GPT-6 Luna Medium; exact A3 `15835e28de8b6d3a7b069c65a197bd937a9596f5` + B3 `be82c603aa6a24a902be2039f7e72e26400508d9`.

- Finding F0.10-IC-05: the no-write browser check did not explicitly assert that the app's actual `/auth/me` response was HTTP 200 for the expected subject, hotel and capability context before treating the UI's missing controls as authorization evidence. Add this assertion at both desktop and mobile checks.
- Other mobile keyboard/DOM behavior, screenshots, direct POST 403 and zero denied D1 rows were supported. The synthetic hotel-list GET is clearly scoped. Runner establishes owned process termination (not removal of its temporary directory).
- No `ROADMAP_BLOCKER`; no architecture contradiction. Foundation 0 completion is not authorized.

Repair contract/pre-critic are frozen in the following bounded increment. A3+B3 remain immutable with this verdict.
