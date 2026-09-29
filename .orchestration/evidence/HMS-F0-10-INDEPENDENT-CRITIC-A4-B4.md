# F0.10 Independent Critic — Artifact A4 + Boundary B4

## Frozen pair

- Branch: `impl/hms-foundation-0`
- Artifact A4: `ba2ff62daf48616ad84700c684adf4cd5d70733e`
- Boundary B4: this orchestration-only commit; exact SHA is supplied with the review assignment.
- Prior exact-pair verdicts remain historical: Tesla returned `REWORK` for mobile Network evidence on A2+B2; Harvey returned `REWORK` for missing no-write `/auth/me` context on A3+B3. See their immutable pair records.
- Reviewer must be genuinely fresh/read-only and distinct from implementation, Pre-Critic, Tesla, and Harvey. Requested effort GPT-6 Luna Medium.

## Scope and evidence

Review F0.10 server-owned capabilities, bounded through evidence-only repairs. A4 changes browser test/evidence/orchestration only; no product source or schema changes.

- Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-AUTH-CONTEXT-001.md`
- Pre-Critic and actual execution disposition: `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-AUTH-CONTEXT-001-PRECRITIC.md`
- All 24 invariant mappings and validation: `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md`
- Prior Harvey verdict/disposition: `.orchestration/evidence/HMS-F0-10-INDEPENDENT-CRITIC-A3-B3.md`
- Actual local integrated result/log: `output/playwright/f0-10-capabilities-integrated-result.json` and `.log`
- Screenshots: `output/playwright/f0-10-network-admin-mobile-keyboard.png`, `f0-10-network-no-write-keyboard.png`, `f0-10-network-no-write-mobile-keyboard.png`
- Runner: `scripts/cf-f0-10-capabilities.playwright.js` and `scripts/cf-f0-10-capabilities-integrated.sh`

## Adversarial checks

Verify both Network viewports are truthful and distinct: desktop 1280×900 is explicitly restored before no-write case; mobile is 375×844. Authorized network writer reaches register and plan controls by keyboard at both sizes. No-write case shows local Ops profile, App Shell selected Hotel Sur, and actual unmocked `/auth/me` context at each width: status 200, expected subject/hotel/role, hotel capability and empty network capability. Then verify DOM absence, read-only plan, 40-tab exclusion, actual POST 403 at both sizes and D1 denied hotel count zero. Confirm only hotel-list GET is synthetic; the screenshots expose any analytics denial. Check A4/B4 exact parent relationship, the A3/B3 and A2/B2 verdict histories, initial runner-race disclosures, all invariants/Pre-Critic, cleanup wording (processes stopped; tempdir retained), and no unsupported/global PASS or scope drift.

## Verdict

`REWORK — Medium`

Reviewer: Zeno, fresh separate read-only GPT-6 Luna Medium; exact A4 `ba2ff62daf48616ad84700c684adf4cd5d70733e` + B4 `10ff54deaf2b2ae612544c7817f4ac8a67425099`.

- No-write desktop checks and screenshot were actually at 375px: viewport restoration had been placed before the authorized mobile case, not immediately before the no-write desktop case. The runner hardcoded `1280x900:PASS`; both no-write image hashes matched and both image widths were 375. Therefore responsive no-write evidence was incomplete and the Pre-Critic/invariant statement claiming both passed was incorrect.
- Auth context was properly asserted and other identity, synthetic GET scope, 403/D1 zero-effect, authorized writer viewports, process-termination claim, no-product scope, A4/B4 relationship, and prior verdict histories were supported.
- No `ROADMAP_BLOCKER`; no architecture contradiction. Foundation 0 completion is not authorized.

Bounded viewport-evidence repair contract/Pre-Critic are frozen before repair. A4+B4 remain immutable with `REWORK`.

## Bounded repair disposition (does not rewrite this verdict)

- Contract `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001.md` and Pre-Critic were frozen before runner changes.
- The desktop viewport is now set immediately before the no-write desktop navigation and `page.viewportSize()` is asserted/recorded; mobile has a separate explicit 375×844 setup/assertion. The result does not hardcode width labels.
- The integrated Node runner reads PNG headers: no-write desktop 1280×1034; mobile 375×1209; hashes differ. Actual local Worker/D1/Vite checks pass with correct Ops identity, `/auth/me`, DOM/tab, plan and denied writes.
- Initial A5 runner attempts caught a duplicate declaration and then a `node:crypto` import in a different Node process; both were corrected before the final terminal PASS. Failed attempts are not counted as evidence.
- The previous A4 responsive overclaim is corrected in A5 invariant evidence, but A4+B4 remain historical `REWORK`. Replacement A5+B5 requires a fresh Independent Critic distinct from Tesla, Harvey and Zeno.
