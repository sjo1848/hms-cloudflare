# F0.10 Independent Critic — Artifact A5 + Boundary B5

## Frozen pair

- Branch: `impl/hms-foundation-0`
- Artifact A5: `2e0fb984022b48a7dbeca5f4417dd2fae895fc97`
- Boundary B5: this orchestration-only commit; exact SHA supplied with review request.
- Historical reviews remain immutable: Tesla returned `REWORK` on A2+B2 (mobile Network controls unproven); Harvey returned `REWORK` on A3+B3 (no-write UI `/auth/me` identity assertion missing); Zeno returned `REWORK` on A4+B4 (desktop no-write case actually mobile). See the three prior exact-pair review files.
- Reviewer must be fresh, read-only, and distinct from implementation, Pre-Critic, Tesla, Harvey and Zeno. Requested model/effort: GPT-6 Luna Medium.

## Scope / evidence

Evidence-only F0.10 repair. No product source or schema changes in A5.

- Current contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001.md`
- Current Pre-Critic + execution record: `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001-PRECRITIC.md`
- Complete invariant matrix and validation: `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md`
- Exact historical Zeno verdict/disposition: `.orchestration/evidence/HMS-F0-10-INDEPENDENT-CRITIC-A4-B4.md`
- Integrated output/result: `output/playwright/f0-10-capabilities-integrated-result.json`, `.log`
- No-write desktop/mobile screenshots and runner: `output/playwright/f0-10-network-no-write-keyboard.png`, `f0-10-network-no-write-mobile-keyboard.png`, `scripts/cf-f0-10-capabilities.playwright.js`, `scripts/cf-f0-10-capabilities-integrated.sh`

## Adversarial mandate

Inspect actual runner order: the desktop viewport must be set immediately before the no-write desktop case; the mobile viewport must be separately set immediately before its case. Confirm result widths derive from `page.viewportSize()`, not hardcoded claims. Independently inspect PNG headers/hashes: desktop width 1280, mobile width 375, different SHA-256. Verify local Ops identity, App Shell Hotel Sur, actual `/auth/me` payload at both widths, keyboard/DOM/plan, real POST 403 and D1 denied hotel count zero, and that only hotel-list GET is synthetic. Confirm screenshot content matches the reported role/width; check A5+B5 identity, historical reviews, corrected previous overclaim, all invariant/Pre-Critic claims, process cleanup wording, and absence of product/schema scope drift.

## Verdict

`PENDING`

