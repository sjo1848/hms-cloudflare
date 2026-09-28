# F0.7 Pricing ABA Repair — Independent Critic

Verdict: `PASS`

Reviewer: Hooke, separate read-only Independent Critic, GPT-6 Luna Medium. Exact immutable Artifact A2 `715e6a593e967f70ff9c6fd5adb2d2d4db3efd1a` and orchestration-only Boundary B2 `604b36d1b34eb7db342df2813613c784530ef7d7` were inspected via read-only Git. Reviewer made no edits and ran no tests.

## Review findings

- Checkout reads `bookings.pricing_version` with account state and binds it in the conditional booking update alongside booking amount and invoice/ledger snapshot fields. The supported pricing path appends immutable segments; migration `0025_segmented_stay_pricing.sql` advances booking version from segment version, and reassignment binds the prior version before appending.
- The executing-D1 ABA test interposes `10000 → 12500 → 10000` and advances version twice after checkout's snapshot; checkout loses and exact booking, room, inventory, invoice and event state remains unchanged. The interposition is direct synthetic SQL, not two supported repricing commands. Reviewer accepted it as isolating checkout compare-and-swap; supported monotonic version writes were verified separately. Do not describe this as an end-to-end repricing-command ABA test.
- Checkout guard binds invoice identity/status/amount/paid fields and ledger sum, checks current invoice consistency, VOIDED state and settlement predicate. Subsequent room, inventory, invoice and event writes depend on the winning checkout. Migration `0028_checkout_settlement_guard.sql` adds settlement/event snapshot guards. No payment mutation was introduced; D11 ledger-derived invariants remain.
- E2E evidence identifies local Worker/D1 desktop flow and inherited mobile evidence because UI did not change. The broad product-flow runner's missing npm `playwright` limitation is disclosed as not-PASS.
- Boundary B2 changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`, references exact A2, requires external review and blocks continuation pending that review.

## Decision

No conditions. No architecture/product contradiction or `ROADMAP_BLOCKER` found in the reviewed F0.7 scope. Safe to continue Foundation 0 under the approved DAG. This is F0.7 repair acceptance only, not aggregate Foundation 0 PASS or promotion approval.
