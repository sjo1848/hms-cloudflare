# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Pre-edit Inventory

Status: `FROZEN BEFORE EDITING MIGRATION 0019`

Authority: Issue #52 Controller comment `5945260364`. Inventory is based on a fresh isolated local D1 with original migration bytes 0001–0018 from base `0e78050999550d193ff0d352672b233e2f3da472`, applied with project Wrangler `4.125.0`. No staging database or real data was read or written.

## Exact migration source and baseline

- Original 0001–0018 are the exact files from `git show HEAD:<migration>` copied to an isolated temporary migrations directory; their combined byte SHA-256 from the previous synthetic proof is `001fd6efa6437b5816db96ae5220b68d27d84ed799d4298ac4a88c6cba787e2f` (22,886 bytes).
- `wrangler d1 migrations apply HOTEL_DEMO_DB --local --config <isolated-config> --persist-to <isolated-state>` applied 18/18 successfully with Wrangler 4.125.0. `d1_migrations` contains exactly the ordered names 0001 through 0018.
- Raw schema capture: `/tmp/hms-0018-schema-capture.json` (temporary diagnostic output); source definitions are also preserved below. After schema inventory, the frozen fixture was applied locally to this 0018-only D1. Its exact ordered row/schema snapshot is `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-RAW/0018-before.json`; fixture SQL SHA-256 is `7869383f24c4f0539e2e87403ff4559db0257d3891d9db2542f66ed667deebf0`. Direct SQLite read-only checks report `foreign_key_check=[]`, `integrity_check=['ok']`. Wrangler local blocks these PRAGMA reads via its SQLite authorizer; the canonical remote disposable proof must run them through D1.

## `payment_entries` exact schema at 0018

```sql
CREATE TABLE payment_entries (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  payment_reference TEXT,
  note TEXT,
  received_by_user_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  operation_token TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
)
```

Column order is `id`, `invoice_id`, `booking_id`, `amount_cents`, `payment_method`, `payment_reference`, `note`, `received_by_user_id`, `received_at`, `operation_token`. `operation_token` was added by 0015 after initial billing migration 0010. The standalone unique index from 0015 was intentionally replaced in 0016 by booking-scoped uniqueness.

Indexes and unique constraints at 0018:

| Name | Kind | Exact key |
|---|---|---|
| `sqlite_autoindex_payment_entries_1` | UNIQUE / primary key | `(id)` |
| `idx_payments_shift` | non-unique | `(received_at, payment_method)` |
| `idx_payments_booking` | non-unique | `(booking_id, received_at)` |
| `idx_payment_entries_booking_operation_token` | UNIQUE | `(booking_id, operation_token)` |

Nullable operation tokens retain SQLite unique-index NULL behavior. No other payment-entry index or table-level uniqueness exists in the 0018 source schema.

## All dependencies on `invoices`

- The only foreign key referencing `invoices` in original migrations 0001–0018 is `payment_entries.invoice_id → invoices.id ON DELETE CASCADE`.
- `invoices` itself references `bookings(id) ON DELETE CASCADE`; this is outbound and does not create another invoice child.
- `idx_invoices_status` is the only explicit index on `invoices` at 0018. `booking_id` UNIQUE and `id` PRIMARY KEY create SQLite autoindexes.
- There are no triggers whose owning table is `invoices` at 0018. `trg_extra_charge_total` is owned by `extra_charges`; it updates `bookings.total_cents` and pending `invoices.amount_cents`. It must be dropped/recreated exactly as migration 0019 already does while the invoice parent is rebuilt.
- The three new billing reconciliation triggers are created by 0019 and are not pre-existing dependencies.
- Source search across original migrations 0001–0018: `REFERENCES invoices` occurs only in 0010's `payment_entries` definition; no other child table is defined.

## Legacy values to preserve

The previous full-schema diagnostic demonstrated the minimal legacy case: invoice `diagnostic-invoice-full` for booking `diagnostic-booking-full`, status `PAID`, amount and paid amount `10000` cents, plus one CASH payment row `diagnostic-payment-full` of `10000` cents. The prior evidence did not retain every nullable/actor/timestamp field of that row, so it is not treated as sufficient for this repair.

The phase-2 fixture was frozen as `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-FIXTURE.sql` before any 0019 edit; SHA-256 is `7869383f24c4f0539e2e87403ff4559db0257d3891d9db2542f66ed667deebf0`. The exact full inserted rows, including nullable, actor and timestamp fields, are in the before snapshot above. It includes:

| Synthetic entity | Frozen values to be asserted exactly |
|---|---|
| `diag-booking-unpaid` / `diag-invoice-unpaid` | booking and invoice IDs; invoice `PENDING`, amount `12000`, paid `0`; no payment rows |
| `diag-booking-partial` / `diag-invoice-partial` | invoice amount `20000`, paid `7000`, `PENDING`; `diag-payment-partial-cash` 3000 CASH, reference `diag-ref-cash-001`, note `first partial payment`, token `diag-op-partial-cash`; `diag-payment-partial-card` 4000 CARD, NULL reference/note/token |
| `diag-booking-paid` / `diag-invoice-paid` | amount/paid `10000`, `PAID`; `diag-payment-paid` 10000 TRANSFER, reference `diag-ref-transfer-001`, note `settled synthetic invoice`, token `diag-op-paid-transfer` |
| distinct synthetic guests/rooms/bookings | three unique guest, room, booking and invoice identities to prove no cross-link/substitution |

Overpayment is not seeded at 0018: the pre-0019 invoice constraint rejects `paid_amount_cents > amount_cents`, so no assumption about post-migration overpayment policy is made. Phase 3 will test that case only if the accepted post-0019 contract demonstrably supports it.

## Pre-edit decision

The smallest transaction-safe design family to prove is: snapshot `payment_entries` values, drop the dependent child table while foreign keys are active, rebuild `invoices`, recreate the exact 0018 payment-entry DDL and indexes, restore every column/value, then remove the temporary snapshot inside the same migration transaction. No alternative path or PRAGMA-based FK disabling is accepted. Exact candidate SQL remains unimplemented until this inventory and contract are frozen. This inventory is now frozen; the Controller-authorized Phase 2 may begin.
