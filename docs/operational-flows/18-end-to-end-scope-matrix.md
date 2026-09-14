# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

Every row requires tenant-scoped backend authorization, concurrency guards, atomic truth, success audit only when mutation wins, authoritative reload and browser proof where UI exists. Canonical companions: `16`, `19`, `20`, `05`, operational invariants.

| ID | Flow | Binding E2E result / acceptance boundary |
|---|---|---|
| E2E-00 | Foundations | Raw JS <=300000; hotel IANA timezone/server local date; incremental migrations; shared D11 financial foundation; existing gates green. |
| E2E-01 | Reservation/edit | Atomic create. Confirmed room/date change is priced; guest/name/notes-only edit preserves total. |
| E2E-02 | Inline guest+reservation | Atomic guest+booking under both required capabilities. |
| E2E-03 | Check-in | CONFIRMED + checklist + readiness -> CHECKED_IN/OCCUPIED; total unchanged. |
| E2E-04 | Cancellation | CONFIRMED + reason; inventory released; room/total unchanged; financial evidence preserved. |
| E2E-05 | No-show | Eligible CONFIRMED + reason -> NO_SHOW; inventory released; room/total unchanged. |
| E2E-06 | Late arrival | Existing PATCH; explicit-offset ETA; valid hotel-local stay date; context/audit only. |
| E2E-07 | Reassignment | Remaining claims move; room turnover/history; destination repricing + D11 reconciliation atomic. |
| E2E-08 | NON_BLOCKING maintenance | OCCUPIED/AVAILABLE/DIRTY/CLEANING allowed; physical state preserved; RBAC enforced. |
| E2E-09 | BLOCKING occupied maintenance | Guest remains until explicit vacancy; sale/readiness blocked; vacancy routes MAINTENANCE. |
| E2E-10 | Vacant BLOCKING | Vacant eligible state -> MAINTENANCE; resolve -> DIRTY. |
| E2E-11 | Housekeeping | DIRTY -> CLEANING -> AVAILABLE only when truthful. |
| E2E-12 | Checkout+Billing | Total preserved; settlement follows authoritative Billing; D11-ineligible invoice fails closed. |
| E2E-13 | Extension | Added nights atomic; current-room repricing + D11 reconciliation; conflict full rollback. |
| E2E-14 | Billing reconciliation | Every priced mutation satisfies complete D11, including payment-ledger correlation, derived remaining/credit, status/timestamps and ineligible-invoice rejection. |
| E2E-15 | Front-desk board | bookings.read -> admin/ops/receptionist; housekeeping/saas_admin denied. |
| E2E-16 | Context+freshness | Stable IDs context only; refresh after mutation/focus/entry/poll. |
| E2E-17 | Continuation | Preserve search/filter; authoritative reload; next case deterministic. |
| E2E-18 | Audit | Success evidence iff authoritative operation wins; financial audit distinguishes price reconciliation from payment received. |
| E2E-19 | Synthetic shift | Exercise all positive/negative flows including D9-D11 and ledger correlation. |
| E2E-20 | Contract conformance | Runtime/tests/OpenAPI/client/browser match canonical routes/capabilities/time/pricing/Billing semantics. |

Mandatory D11 proof uses the exact matrix in `20`: price increase/decrease/credit, PAID/PENDING timestamp outcomes, zero-remaining payment rejection, VOIDED conflicts, and after every case `invoice.paid_amount_cents == SUM(payment_entries.amount_cents)`. Repricing must leave payment-entry count/content and payment method/reference unchanged while recording a distinct reconciliation audit.

Out of scope: frozen-rate redesign, automatic credit disposition/refund, VOIDED recovery command, new arrival cutoffs, split-stay/auto relocation, multi-case maintenance, new OUT_OF_ORDER, paid realtime, production/cutover/data migration, unrelated module redesign.

The wave completes only with bounded implementation, automated/domain/API proof, cross-module proof and required browser evidence for every row.