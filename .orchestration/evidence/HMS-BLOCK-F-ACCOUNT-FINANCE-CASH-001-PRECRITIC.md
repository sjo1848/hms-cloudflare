# Block F Account/Finance — Pre-Critic (Pre-implementation)

Status: `FROZEN BEFORE IMPLEMENTATION`
Base: `39ee0a2b38e7205b8e041e792e16ee469c996241`
Task Contract: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`

## Admission checks

- Controller Issue #52 body and complete current comments read. Latest decision is `CONTROLLER_DECISION: START` at the exact base above.
- Dedicated worktree/branch created at that exact base; the unrelated dirty `impl/hms-foundation-0` worktree was not modified.
- Approved Block F, Blueprint, DAG, Open Decisions, test evidence matrix, PM autonomy/invariant decisions, durable invariant registry and mandatory Pre-Critic gate read.
- F-account and F-cash are separate in approved roadmap. OD-1 explicitly gates Cash alone on real-hotel ownership validation; no real-data access is authorized. This contract implements F-account only and leaves Cash unchanged.
- Frozen inventory and requirement/evidence matrix identify existing APIs/capabilities, UI, tests and data boundaries. No source-of-truth replacement, role grants, new schema/domain policy or new backend contract is planned.
- Key preflight findings: current account route combines account and Cash panels; the main navigation intentionally omits Billing; invoice/payments/charges are already read from the selected Booking; pending/credit and Cash must remain separate; existing F0.7/F0.9/F0.10/F0.11 semantics are binding.
- Read-only specialist reviews found no ROADMAP_BLOCKER. Their concrete payment findings were frozen before recovery implementation in `.orchestration/contracts/HMS-BLOCK-F-REPAIR-PAYMENT-RECOVERY-001.md`: response-loss/reload exact payment identity, final-payment replay before current-balance validation, booking-scoped token lookup, and changed-payload conflict. Their context review also required normalized internal return-path validation and focus/responsive evidence. Reviewers did not edit or test.
- The contextual case-launched account route omits the Cash panel as an explicit F-account/F-cash separation; the existing direct `/billing` route remains unchanged. This boundary is frozen in the parent Contract and inventory before recovery work.
- No unresolved implementation detail currently requires product policy. If an implementation need contradicts a contract or needs new domain/backend semantics, stop and classify in Issue #52 rather than guessing.

## Pre-Critic result

`PASS TO IMPLEMENTATION` for the bounded F-account scope only. This is not an Independent Critic verdict and does not authorize F-cash, Blocks G–H, promotion or a substantive artifact PASS.

## Required post-implementation adversarial checks

- zero-row/stale account snapshots cannot be called settled or success;
- charge token/payload identity and event pair survive response loss/reload without duplicate charge;
- payment ledger and D11 sums reconcile exactly, with no fabricated or edited ledger rows; payment exact retry survives response loss + reload and a completed final payment, while changed payload conflicts;
- stale account reads cannot replace a different Booking/Stay selection;
- unauthorized/cross-tenant financial calls leave zero effects;
- pending balances/credit never enter Cash math, and Cash code/contract is unchanged;
- narrow/compact account operations retain keyboard access, focus and explicit recovery state; Application Back accepts only the normalized Reception route and returns focus to the selected Case meaningfully.

## Final Pre-Critic Gate — post-implementation

Status: `PASS FOR F-ACCOUNT ARTIFACT A CANDIDATE`; this is implementer evidence, not an Independent Critic verdict or Block F Controller PASS.

- **Contract/source parity:** frozen parent Task Contract and bounded repair contracts are present. Payment recovery uses the existing booking-scoped operation identity and D11/balance behavior; no new domain/API/schema/capability/Cash policy was introduced. Checkout/F0.7 remains unchanged.
- **Mutation/concurrency:** `npm run check` passes 35 files/175 tests, including executing-D1 D11 atomic/replay/rollback/concurrency tests. `npm run test:cf-i06` passes final-payment replay after zero remaining, changed-payload conflicts, concurrent payment winner, overpay rejection, stale Cash-close conflict and exact cents. The regression runner recursively owns and verifies its Worker tree before PASS per the frozen cleanup repair.
- **Authorization/tenant:** CF-I06 proves allowed `subject-a` behavior, configured independent hotel D1 success, reciprocal cross-hotel invoice/payment/charge denials, forbidden-housekeeping and unknown-role 403 writes, unknown hotel/binding fail-closed, and unchanged state for denied operations.
- **UX/browser:** `npm run test:cf-i06-browser` passes on local Worker + migrated D1 + Vite. It observes the committed synthetic post-commit-502 payment, reloads the persisted identity, retries the exact operation and asserts one D1 payment row. It runs account/charge/payment controls at 375/390/430/768/1024/1280, contextual Account at 1280×900 / 768×812 / 375×812 / 375×600 / 844×390, visible keyboard focus, safe Case return, and browser/application Back focus. Five diagnostic screenshots accompany executable assertions.
- **Evidence claims:** requirement mapping and exact limits are in `HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-RESULTS.md`; baseline/result/delta and ceilings are in Results and Bundle records. English/Argentine Spanish runtime JSON match source; `npm run test:i18n` and the coverage gate pass.
- **Build/gates:** `npm run types:check`, `npm run web:build`, `npm run architecture:fitness` (architecture I/II, i18n, budgets), `npm run test:d1-query-plan`, API + Web Wrangler dry-runs, `node --check`, `bash -n`, and `git diff --check` pass. JS/CSS raw/gzip plus aggregate and entry payload remain under all active ceilings.
- **Scope:** diff audit retains the legacy direct `/billing` route and Cash code/contract; contextual F-account omits the gated Cash panel. No checkout, schema, capabilities, F-cash/OD-1, G–H, real data or promotion work is included.
- **State/publication:** the exact immutable Artifact A and immediate orchestration-only Boundary B are the next method steps. B records exact A, sets external review required and resume false. A remains a candidate until a fresh independent read-only Critic reviews the exact pair; no self-approved substantive PASS is asserted.

Final gate conclusion: all applicable implementation invariants have executable or static evidence in `HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-INVARIANTS.md`. No applicable product invariant remains UNPROVEN or FAIL. `INV-STATE-001` is realized by the required non-circular A→B publication sequence; F-cash remains separately gated by OD-1.
