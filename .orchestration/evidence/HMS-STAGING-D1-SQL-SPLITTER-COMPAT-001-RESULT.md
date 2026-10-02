# D1 SQL Splitter Compatibility — Controller Gate Result

Status: `D1_SQL_COMPATIBILITY_REPAIR_FAILED`

Controller authority: Issue #52 comment `5944972953`, `PROVE_SQL_SPLITTER_COMPATIBILITY_THEN_RESUME_STAGING`.

## Scope and stop

- Project Wrangler: 4.125.0, installed from the unchanged package lock.
- Exact accepted base and current task parent: `0e78050999550d193ff0d352672b233e2f3da472`.
- Dedicated local work branch: `staging/d1-sql-splitter-compatibility`.
- Staging was never retried or written. No accepted/staging D1, Access, Worker, workflow, fixture or real hotel data was touched.
- Four diagnostic D1s used synthetic data only and were deleted after evidence capture.
- Phase 1 showed the lexical parentheses allow the D1 batch migration to execute, but full-schema comparison exposed financial data loss and a behavioral divergence. Therefore semantic equivalence is **not proven** and the repair is not safe to continue to validation or staging.

## Exact lexical edit and migration pass

Original `0019_billing_reconciliation.sql` SHA-256:
`57e2d248c8f741181837f731ac85f709dbcae4508c274fc42e694494c5ab8b73`.

Candidate Phase 1 SHA-256:
`9eb9105f3250c18ce8365a535a456af0b868e3e7da929eb0479f1e2fe7fce0be`.

The two edits in `billing_reconcile_total_guard` are only:

`SELECT CASE … END;` → `SELECT (CASE … END);`

With Wrangler 4.125.0 `d1 migrations apply --remote`, 0019 then applied successfully on the minimal pre-0019 synthetic baseline. The original migration on a separate equivalent minimal baseline succeeded through `d1 execute --file`. Their eight non-migration schema objects normalized to identical definitions; synthetic invoice/payment data and tested D11 outcomes matched on that limited baseline.

## Full-chain proof and failure

To exercise the real pre-0019 foreign-key topology, the full source migrations 0001–0018 were imported into a fresh synthetic D1; the combined file was 22,886 bytes, SHA-256 `001fd6efa6437b5816db96ae5220b68d27d84ed799d4298ac4a88c6cba787e2f`. A synthetic guest, room, confirmed booking, PAID invoice and linked CASH payment (`diagnostic-payment-full`, 10,000 integer cents) were inserted before 0019. Seed SHA-256: `fa8aaa29013c91bb40bb773621a072eff680101be95db7f4876a1dcfb639e675`.

The bounded scan found exactly 35 `SELECT CASE … END;` trigger-guard statements, all inside trigger bodies, in six files:

| Migration | Occurrences | Original SHA-256 | Repaired SHA-256 |
|---|---:|---|---|
| `0019_billing_reconciliation.sql` | 2 | `57e2d248c8f741181837f731ac85f709dbcae4508c274fc42e694494c5ab8b73` | `9eb9105f3250c18ce8365a535a456af0b868e3e7da929eb0479f1e2fe7fce0be` |
| `0023_room_state_command_guards.sql` | 7 | `fd7b7c627485446c4a132440788cf1be59e16ebaa08295db016e980f5caa4ab5` | `7b9fd7a66682d48e49b045009d1ce6b2de2537e2a3ae71b6beb9eb1643224816` |
| `0024_reassignment_interval_room_versions.sql` | 15 | `b9199c80711b351f49d98d4a0745c670fb723d2888b51f5789da45da43e8b504` | `150ccedb6021aa79530dc8dbee9a9cf59ae761285e2b730a4f09154e433dc8ab` |
| `0025_segmented_stay_pricing.sql` | 4 | `aa7b9a407a9e09f37773be9a101f320eae53c0f162f83ecde92fb58f3f0b6da7` | `1eb893683cbad28a73d0e49185d64feecad786b8dbe9f900e6b9b52edd2189a4` |
| `0028_checkout_settlement_guard.sql` | 4 | `a07830700048727891dc6f2bf94ef6388d66ef15e76d54cec98c7b5a5371217e` | `a88b3f12c5b227c8313ec6a8154980ca014570665cbe2319682b6440f1ccefe5` |
| `0029_reservation_creation_recovery.sql` | 3 | `76b7874871dce51e81f717302ef6e0e7ba6387da9f7c05034ad80cfaa3b8c9d5` | `8dfdaaaecfd5b3e73b5a37328f7cc06a7cedf997ceae1906593d77184890a2d3` |

On the repaired disposable DB, canonical Wrangler 4.125.0 `d1 migrations apply --remote` reported all migrations 0019–0030 successful. Read-only ledger verification found 12 entries, each exactly once. It had 122 non-internal schema objects. A second full synthetic D1 ran the original 0019–0030 bytes through direct/import; it also had 122 objects and the same object names. SQL definitions match after normalizing only the authorized parentheses.

However, the repaired `migrations apply` DB lost `diagnostic-payment-full`: `payment_entries` count is 0 while the invoice remains `PAID` with `paid_amount_cents=10000`. The reference DB applying the original chain by direct import preserves the exact payment row (count 1). Both schemas confirm the payment entry's FK to `invoices.id` is `ON DELETE CASCADE`.

The semantic divergence was demonstrated with the same synthetic operation on both databases:

| Path | Booking total update | Resulting account state | Payment rows |
|---|---|---|---:|
| Repaired chain via `d1 migrations apply` | rejected with `D11 payment ledger mismatch` | unchanged at booking/invoice 10,000; invoice still PAID, paid 10,000 | 0 |
| Original chain via `d1 execute --file` | succeeds to 11,000 | invoice 11,000; paid 10,000; PENDING | 1 |

This makes the proposed lexical compatibility patch unsafe under Wrangler's canonical migration path. The observed behavior is consistent with `0019` rebuilding/dropping `invoices` while the `payment_entries.invoice_id` cascade remains active in the batch path despite the migration's `PRAGMA foreign_keys = OFF`; that mechanism is a diagnosis, not permission to alter migration semantics. A separate Controller-approved preservation repair is needed before continuing.

The original-vs-repaired full-chain schema-definition digests before lexical normalization were respectively `223d5972a1a4f621d35200c7e4f8f6427e2071c7f1559fa2a13d472ee345a4bc` and `c802d622e05e3256de54bbd13aba98c562983d886d3c8f65d5c29521f2e2fe16`; the object names and normalized definitions are identical.

## Disposition

- Do not run Phase 3 full validation or Phase 4 staging movement/deploy.
- Do not apply these changes to staging.
- The six local migration files contain only the 35 Controller-authorized lexical parenthesizations; no other migration content changed. They remain a non-promotable diagnostic candidate pending Controller disposition.
- `INV-PARITY-001`, `INV-LEGACY-001`, and `INV-MONEY-001` fail for the canonical batch migration path. No Artifact A or staging checkpoint is claimed.
- Diagnostic resources were removed and no `hms-diag-sqlsplit-*` database remains.
