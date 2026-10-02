# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Full 0019–0030 Proof

Status: `PASS — PHASE 3`

## Disposable D1 and canonical migration sequence

- Synthetic disposable D1: `hms-diag-0019-fullchain-20261002-a`, ID `ca1482d9-f994-4955-b51f-30be3768cd16`, location hint ENAM.
- Project Wrangler `4.125.0` applied pristine base migrations 0001–0018 through `d1 migrations apply --remote`.
- Frozen fixture SQL SHA-256: `7869383f24c4f0539e2e87403ff4559db0257d3891d9db2542f66ed667deebf0`; pre-0019 charge extension SQL SHA-256: `2a4a99de0b9b347886944cd15de7aba91b206b6f43cd33fa8121094462c039d0`.
- Migration 0019 was applied through canonical `d1 migrations apply --remote`. A supported D11 total reduction then constructed a synthetic 2000-cent credit case. Migrations 0020–0030 were applied through the same canonical command. The ledger has all 30 migrations; each of 0019–0030 is present exactly once.
- All 12 pending migrations applied successfully. Exact command output: `...-RAW/apply-19.log` and `...-RAW/apply-20-30.log`.

## Financial row preservation

Before/after query snapshots are `...-RAW/fullchain-before-0019.json` and `...-RAW/fullchain-after-wrangler.json`; comparison/assertions are `...-RAW/fullchain-assertions.json`.

- Invoice count remains 3; payment-entry count remains 3; no payment row, ID, link, integer-cent amount, method, reference, note, actor, received timestamp or operation token changed.
- The synthetic extra charge `diag-charge-unpaid` remains exactly present. Its historical columns match; migration 0030 adds `operation_token` as NULL, without fabricating identity. The accepted original charge trigger had increased the unpaid booking/invoice by exactly 500 cents before the 0019 snapshot.
- The one intentional change after 0019 is the fixture operation lowering `diag-booking-paid.total_cents` from 10,000 to 8,000: D11 retains paid ledger 10,000, leaves invoice PAID, and derives 2,000 cents of credit. Migrations 0020–0030 preserve this state.
- All three bookings/guests/rooms and distinct invoice links remain in their correct synthetic fixture relationship.
- Final remote `PRAGMA foreign_key_check` returns no rows: `...-RAW/fullchain-after-fkcheck.json`.
- Cloudflare remote query authorization rejects direct `PRAGMA integrity_check` with `SQLITE_AUTH`; the exact read-only remote SQL export SHA-256 is `6a9ae241ffc7cf488aabfec4545a53a238e1521ad3c04ee3e503522ceb904295`. Loading that export into isolated in-memory SQLite produced `integrity_check=['ok']` and `foreign_key_check=[]` (asserted in `...-RAW/fullchain-assertions.json`).

## Schema and behavior

- Final non-Wrangler schema inventory: 122 objects. Names and SQL definitions match the previously proven original 0001–0030 direct-import schema after whitespace normalization and reversal of only the authorized `SELECT (CASE … END);` lexical wrapping. Exact comparison found no differences.
- Payment token uniqueness and D11 ledger guard were proved on the isolated-0019 D1; see `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-0019-PROOF.md`.
- Executing-D1 regressions passed: `d1-billing-reconciliation.executing-d1.test.ts` 12/12, including transactional migration preservation, D11 credit/reconciliation, charge idempotency/concurrency/response recovery; `check-in-concurrency.executing-d1.test.ts` 1/1, including settled, unpaid, partial, credit and concurrent checkout behavior. The migration batch rollback assertion confirms a post-migration statement failure leaves the old invoice/payment rows and schema intact.

Phase 3 passes. No staging D1, Access app, Worker, deployment workflow, main, F-cash, real hotel data or Blocks G–H was touched. The disposable database is removed after preserving the above evidence. Phase 4 full repository validation and artifact preparation remain required before any staging-ref movement.
