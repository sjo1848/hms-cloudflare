# CF-UX-MOBILE-002 PR13 — Fresh Critic REWORK-1

Verdict: **REWORK**

Reviewed immutable implementation artifact: `2170b711a87b4ce7ba8b30ac472481049c0e9de0`.
Reviewed against: `.orchestration/contracts/CF-UX-MOBILE-002.md`, Pre-Critic receipt, invariant evidence, Foundation CI `33137425712`, Browser CI `33137425715`, and the exact PR diff.

## Runtime independence disclosure

Codex review capacity is exhausted. Per `.orchestration/MULTIAGENT-EXECUTION.md`, the Critic phase was restarted as a fresh logically separated review from contract + immutable diff + executable evidence; it did not inherit the Implementer conclusion as an assumption. This is not represented as a separate Codex/subagent review.

## Finding 1 — P1 evidence/contract gap: Users actions can regress while the active gate stays green

CF-UX-MOBILE-002 explicitly requires `Reports, Users and Network: responsive presentation, states, actions and accessibility` and requires browser evidence on the named surfaces.

At artifact `2170b711...`, `cf-ux-mobile-browser-ci.mjs` executes the new `cf-ux-admin-browser.playwright.js`, not the older CF-I07 admin journey. The new Users journey proves loading, search-empty and details open/close, but does not exercise the material user actions already present in the product: create membership, visible failure/retry, role update and deactivation. Therefore the active browser gate can PASS while those actions are broken.

Required REWORK:
- Exercise create membership through the real local API at the contracted widths.
- Exercise a user-visible failure and Retry without replacing successful API data.
- Exercise role update and deactivation.
- Keep exact seeded identity/RBAC boundaries and no-overflow checks.

## Finding 2 — P2 evidence gap: Network error exposes Retry but the journey does not prove recovery

The Network 409 path correctly proves optimistic plan rollback, but the UI also presents a Retry action after the failure. The current harness never clicks it. Extend the same bounded journey to prove Retry clears/reloads the authoritative network state.

## Disposition

Routine bounded REWORK. No Human Gate. Do not merge or deploy. After repair, run Foundation + browser CI on a new immutable validation target, rebuild the Pre-Critic evidence against that target, and perform a fresh Critic review.
