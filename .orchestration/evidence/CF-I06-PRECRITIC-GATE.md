# CF-I06 Pre-Critic Gate

## Required checks

- [x] Contract and source parity package consumed.
- [x] D1 migration applied locally, including integer-cent checks, enum checks, tenant foreign keys and unique shift opening.
- [x] API typecheck and web production build pass.
- [x] Unit suite: 17 tests pass, including static canonical billing route uniqueness and no v2 endpoint.
- [x] `scripts/cf-i06-regression.sh` pass, including invalid/rejected charge atomicity, no-invoice overpay, partial/full settlement, positive `/settle-payment`, concurrent payment race, exact balance, inclusive opening, concurrent close race, counted difference, duplicate close rejection and exactly one correlated closure event.
- [x] Browser workflow pass at 375/390/430/768/1024 with no horizontal overflow; each width executes charge plus payment; screenshot `output/playwright/cf-i06-billing.png`; overpay, stale-close and successful close are exercised.
- [x] Fresh inherited runners pass: `scripts/cf-i03-regression.sh` reports CF-I03 + CF-I04 PASS and `scripts/cf-i05-regression.sh` reports CF-I05 PASS. CF-I05 serializes only local D1 inspection around a local Worker restart.
- [x] Focal regression proves no-invoice overpay zero state, stale snapshot rejection, TRANSFER non-cash classification, first-shift opening, newest-first history, positive settle and settled conflict, unknown hotel plus cross-tenant binding denial, forbidden/unknown role denial, positive/negative difference and rejected extra-charge consistency.
- [x] Static money scan: no new `REAL`, `parseFloat`, or floating authoritative amount surface; canonical billing route scan has no duplicate registrations or v2 paths.
- [x] No remote D1 mutation, deployment, paid transition, production data or CF-I07 scope.

## Boundary decision

Technical evidence is complete for Independent Critic review. Codex does not self-declare CF-I06 PASS. Publication must contain substantive artifact A and then orchestration-only boundary B whose `last_completed_head` and `external_review.artifact_head` identify A exactly; runtime stops at Independent Critic.
