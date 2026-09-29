# Block A — Separate Internal Adversarial QA Review

Task: `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001`
Reviewer: Noether, separate read-only QA reviewer (GPT-6 Luna Medium).
Role: internal pre-publication QA; **not** the Independent Critic or a Development Gate verdict.

## Findings and disposition

1. **Unknown nested paths were accepted by route prefixes.** Repaired to exact canonical route matching; unit and browser evidence now assert unknown `/rooms/...` and `/bookings/...` paths are Not Found.
2. **Fragment URLs retained the hash without scrolling to the target.** Repaired history restoration to resolve a present fragment after async render. Integrated browser performs actual hash navigation and Back/Forward; target geometry reports `targetTop=0` at `scrollY=2400`, while an ordinary saved scroll position restores from 789 to 789.
3. **Older architecture evidence was not a receipt for the final bundle.** Replaced by the durable current-run log `output/playwright/block-a-final-architecture-fitness.log`. It records exact final output, including the 24-byte JS raw budget margin.
4. **Keyboard/accessibility and reduced-height mobile evidence was incomplete.** Added executable COMPACT Tab traversal through all seven destinations, current-page semantics, named NARROW links, and a 390×560 reduced-height drawer test for overflow, keyboard access to all secondary destinations, and Escape/focus restoration.

All findings were addressed within Block A. The reviewer made no edits and did not run the final tests; the implementer reran the affected browser evidence and the full serial validation recorded in the Pre-Critic and invariant evidence.

## Scope and residual risk

No capability model, backend authorization, API, schema, migration or domain behavior changed. Main residual risk is bundle headroom: JS raw `299,976 / 300,000` bytes (24 bytes remaining). The configured budget was not weakened. This is a risk to monitor, not a failed gate.

Evidence: `output/playwright/block-a-shell-integrated-result.json`, `output/playwright/block-a-shell-integrated.log`, `output/playwright/block-a-built-integrated.log`, and `output/playwright/block-a-final-architecture-fitness.log`.
