# HMS-F0-07 Repair — Booking Pricing-Version ABA Guard

Status: `FROZEN BEFORE REWORK`
Parent contract: `.orchestration/contracts/HMS-F0-07-SETTLEMENT-GUARD-001.md`
Prior artifact under repair: A `c356fd04563513859e1f6f919b02aeb48f7264c7` + B `5a656917748a3aaa8604b7afd877b95df6d60e00`
Authority: Foundation 0 authorization RG1–RG7; frozen F0.7 contract; `.orchestration/INVARIANTS.md` and `.orchestration/PRECRITIC-GATE.md`.

## Finding

The independent review observed that exact visible booking/invoice/ledger fields are rebound at checkout, but a same-value account ABA was not demonstrated. The parent contract's `INV-ATOMIC-001` mapping explicitly requires stale account/version/ABA evidence. This is bounded technical rework, not a product-policy change.

## Objective

Prevent checkout from winning on a captured account state if booking pricing changes after the read and returns to the same visible amount before the guarded D1 batch. Use the existing monotonic `bookings.pricing_version` introduced by F0.5; do not add a new version source or financial authority.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Checkout snapshot includes the existing booking pricing version. | `D1LifecycleRepository.checkout` account snapshot. | Read `bookings.pricing_version` alongside booking total and invoice/ledger truth. | Type-safe repository code and executing-D1 test. |
| Exact checkout winner binds pricing version. | Conditional booking update in checkout D1 batch. | A pricing version change after snapshot causes checkout to lose even if `total_cents`, invoice fields and ledger sum later equal their captured values. Successful stable checkout retains existing policy. | Deterministic executing-D1 interleaving: same account total/invoice/ledger values before and after, monotonic pricing version advances, checkout has zero domain/inventory/invoice/event drift and reports conflict. |
| Preserve F0.7/D11 semantics and scope. | Migration 0028, payment ledger, invoice, Reception response. | No new migration or account/version source; no ledger mutation, invented payment, changed checkout policy or new UI behavior. | Existing F0.7 matrix and Worker/browser evidence remains applicable; rerun directed/full suite and mandatory gates. |

## Invariant classification

- `INV-ATOMIC-001` — APPLIES: exact stale-account pricing-version ABA must lose; exact state and no event asserted.
- `INV-AUDIT-001` — APPLIES: zero CHECK_OUT event on ABA loser.
- `INV-MONEY-001` — APPLIES: integer cents and D11 invoice/payment state unchanged.
- `INV-EVID-001` — APPLIES: describe only the exact executing-D1/browser proof.
- `INV-STATE-001` — APPLIES: replacement immutable A followed by orchestration-only B and fresh Critic.
- `INV-SCOPE-001` — APPLIES: no scope beyond F0.7 checkout stale-state protection.
- All other registry invariants — N/A with rationale: unchanged by this bounded version-binding repair; prior F0.7 invariant evidence continues to establish them, and the replacement evidence must revalidate no regressions.

## Non-goals / constraints

- No product or settlement policy change.
- No new schema migration, timestamp/version mechanism, payment or ledger behavior.
- No changes to historical migrations.
- No real/customer data, remote D1, cutover, bootstrap, PR, push, merge, main, staging, deploy, production or Blocks A–H.
- Preserve the disclosed broad product-flow runner missing-`playwright` limitation in aggregate reporting; it is not a PASS.

## Validation and publication

Run focused executing-D1 ABA test, `npm run check`, relevant types/build/budgets/query/Wrangler and sequential CF-I03–I06 regressions; retain real local Worker/D1 desktop/mobile browser evidence. Run `git diff --check`, STATUS parse, and the mandatory Pre-Critic Gate. Freeze replacement Artifact A, then orchestration-only Boundary B, and obtain a fresh separate Independent Critic on that exact pair. Do not treat the prior verdict as applying to replacement A.

Rollback: revert the checkout binding/test repair before publication if it violates F0.7 or D11; no persistent data is mutated by the synthetic test. Development continues only after the replacement exact-pair review resolves this finding and the prior runner caveat remains disclosed.
