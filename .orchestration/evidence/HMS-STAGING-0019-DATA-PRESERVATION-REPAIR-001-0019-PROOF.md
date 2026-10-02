# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Isolated 0019 Proof

Status: `PASS — PHASE 2; PHASE 3 REQUIRED`

## Exact execution

- Synthetic disposable D1: `hms-diag-0019-preserve-20261002-a`, ID `4b33c6a1-bbfc-496f-bf71-d646e6405318`, location hint ENAM.
- Wrangler: project `4.125.0` from the unchanged lockfile.
- Starting schema: original 0001–0018 bytes, canonical remote `wrangler d1 migrations apply --remote`; synthetic fixture SQL SHA-256 `7869383f24c4f0539e2e87403ff4559db0257d3891d9db2542f66ed667deebf0`.
- Migration 0019 candidate SHA-256: `2a9ac50148ba1874a0395cc6ed81c8d07151493bb5a699ad6538c9cbe599469c`.
- Applied via the canonical command `wrangler d1 migrations apply HOTEL_DEMO_DB --remote --config <disposable-config>`; 0019 reports ✅. No alternative migration path was used.

## Row and schema preservation

Before/after Wrangler query outputs are `...-RAW/remote-before-wrangler.json` and `...-RAW/remote-after-wrangler.json`; deterministic assertions are `...-RAW/0019-preservation-assertions.json`.

- All 3 invoice rows compare exactly equal immediately before/after 0019, including IDs, booking links, cents, statuses, references, paid timestamps and creation timestamps.
- All 3 payment rows compare exactly equal across all 10 columns. This includes multiple methods, multiple entries for one invoice, nullable and non-null references/notes/tokens, all three booking/invoice/payment identities, and the original operation tokens.
- Payment table column order, checks, PK and both cascading FKs were restored. The unique booking-scoped token index and both read indexes were restored with exact names and keys. The old standalone operation-token unique index remains absent, matching the accepted 0018 schema.
- `PRAGMA foreign_key_check` on the remote D1 returns no rows after 0019 and after the D11 behavior probe.
- 0019 appears exactly once in the migration ledger; ledger has 19 entries at this proof stage.

## Behavioral proof

- D11 reconciliation update on `diag-booking-paid`: booking total `10000 → 11000`; invoice amount `10000 → 11000`; paid amount remains `10000`; status changes `PAID → PENDING`; the original single 10000-cent TRANSFER payment row remains. Exact result: `...-RAW/remote-d11-reconcile.json`.
- Directly corrupting invoice paid amount to 9999 is rejected by `billing_invoice_ledger_guard` with `D11 paid amount must equal immutable payment ledger` (`SQLITE_CONSTRAINT_TRIGGER`). Raw output is `...-RAW/expected-d11-invalid-update.log`.
- Reusing `diag-op-paid-transfer` for a second payment in the same booking is rejected by `idx_payment_entries_booking_operation_token` (`UNIQUE constraint failed: payment_entries.booking_id, payment_entries.operation_token`). Raw output is `...-RAW/expected-token-duplicate.log`.

## Integrity-check execution detail

Cloudflare's remote D1 query API rejects direct `PRAGMA integrity_check` with `SQLITE_AUTH` (the limitation is captured in the command log; `PRAGMA foreign_key_check` is allowed). To check the exact remote state without writing to it, `wrangler d1 export --remote` captured read-only SQL snapshots before migration and after migration/behavior. Each export was loaded into an isolated in-memory SQLite database; `PRAGMA integrity_check` returned `ok`, and `foreign_key_check` returned no rows for both. Digests and row counts are in `...-RAW/remote-before-export-integrity.json`, `...-RAW/remote-after-export-integrity.json`, and `...-RAW/remote-after-d11-export-integrity.json`.

This proof passes Phase 2 only. It does not authorize staging, artifact publication, or final validation. Phase 3 requires a different fresh disposable D1 and the full 0019–0030 chain with the expanded synthetic fixture.
