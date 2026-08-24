# CF-I06 Pre-Critic Gate

## Required checks

- [x] Contract and source parity package consumed.
- [x] D1 migration applied locally, including integer-cent checks, enum checks, tenant foreign keys and unique shift opening.
- [x] API typecheck and web production build pass.
- [x] Unit suite: 16 tests pass.
- [x] `scripts/cf-i06-regression.sh` pass, including invalid amounts, overpay unchanged, partial/full settlement, concurrent payment race, exact balance, concurrent close race, counted difference and duplicate close rejection.
- [x] Browser workflow pass at 375/390/430/768/1024 with no horizontal overflow; screenshot `output/playwright/cf-i06-billing.png`; overpay and stale-close typed errors are exercised.
- [x] Existing CF-I03/CF-I04/CF-I05 accepted regression evidence remains mechanically identity-preserving: no inherited source/test blob changed. The legacy local harness's D1 process-lock path remains explicitly UNPROVEN as a fresh rerun and is not claimed as a new PASS.
- [x] Focal regression proves no-invoice overpay zero state, stale snapshot rejection, TRANSFER non-cash classification, first-shift opening, newest-first history, settle conflict, unknown hotel denial, positive/negative difference and extra-charge consistency.
- [x] Static money scan: no new `REAL`, `parseFloat`, or floating authoritative amount surface.
- [x] No remote D1 mutation, deployment, paid transition, production data or CF-I07 scope.

## Boundary decision

Technical evidence is complete for Independent Critic review. Codex does not self-declare CF-I06 PASS. Publication must contain substantive artifact A and then orchestration-only boundary B whose `last_completed_head` and `external_review.artifact_head` identify A exactly; runtime stops at Independent Critic.
