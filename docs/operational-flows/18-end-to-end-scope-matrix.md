# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

Every row requires tenant authorization, concurrency guards, atomic truth, truthful audit, authoritative reload and browser proof where UI exists. Canonical companions: `16`, `19`, `20`, `21`, `22`, `05`, operational invariants.

| ID | Flow | Binding E2E result / acceptance boundary |
|---|---|---|
| E2E-00 | Foundations | Raw JS <=300000; hotel timezone/local date; migrations; shared D11 financial foundation; gates green. |
| E2E-01 | Reservation/edit | Atomic create; room/date priced; metadata-only preserves total. |
| E2E-02 | Inline guest+reservation | Atomic guest+booking. |
| E2E-03 | Check-in | CONFIRMED + checklist/readiness -> CHECKED_IN/OCCUPIED; total unchanged. |
| E2E-04 | Cancellation | CONFIRMED + reason; inventory release; financial evidence preserved. |
| E2E-05 | No-show | Eligible CONFIRMED + reason -> NO_SHOW; inventory release; room/total unchanged. |
| E2E-06 | Late arrival | Explicit-offset ETA; valid local stay date; context/audit only. |
| E2E-07 | Reassignment | Remaining claims move; room turnover/history; repricing + D11 atomic. |
| E2E-08 | NON_BLOCKING maintenance | Eligible room states preserved; RBAC enforced. |
| E2E-09 | BLOCKING occupied maintenance | Guest remains; sale/readiness blocked; vacancy -> MAINTENANCE. |
| E2E-10 | Vacant BLOCKING | Eligible vacant state -> MAINTENANCE; resolve -> DIRTY. |
| E2E-11 | Housekeeping | DIRTY -> CLEANING -> AVAILABLE only when truthful. |
| E2E-12 | Checkout+Billing | Stored total; authoritative Billing; ineligible invoice fails closed. |
| E2E-13 | Extension | Added nights atomic; repricing + D11; conflict rollback. |
| E2E-14 | Billing reconciliation | Full D11 including ledger correlation and derived remaining/credit. |
| E2E-15 | Front-desk board | Canonical authorization and deterministic queue/readiness. |
| E2E-16 | Context+freshness | Stable IDs; refresh after mutation/focus/entry/poll. |
| E2E-17 | Continuation | Preserve search/filter; next case deterministic. |
| E2E-18 | Audit | Success evidence iff authoritative operation wins. |
| E2E-19 | Synthetic shift | Positive/negative flows including D9-D11. |
| E2E-20 | Contract conformance | Runtime/tests/OpenAPI/client/browser match canonical semantics. |
| E2E-21 | App interaction continuity | Persistent shell; capability-derived landing/navigation/Forbidden; module/task transitions; drawer/sheet/dialog taxonomy; no native confirm; filters/history/scroll preserved; selected Reception booking controls Billing; skeleton/refresh/conflict states; focus return; reduced-motion; mobile focused-task return. |

## Mandatory D11 proof
Use the exact D11 matrix from `20`, including ledger equality and no fabricated payment evidence.

## Mandatory UX proof — E2E-21
Browser tests cover the scenarios in `21-app-interaction-contract.md`: Reception -> Rooms -> Back restoration, capability-aware desktop/mobile navigation and denied direct URL behavior, reservation/check-in/reassignment/checkout focused surfaces, product cancellation/no-show dialogs, selected-booking Billing coupling, conflict recovery, filter persistence and reduced-motion.

## Out of scope
Frozen-rate redesign, automatic credit disposition/refund, VOIDED recovery command, new arrival cutoffs, split-stay/auto relocation, multi-case maintenance, new OUT_OF_ORDER, paid realtime, production/cutover/data migration, unrelated redesign.

The wave completes only with bounded implementation, automated/domain/API proof, cross-module proof and required browser evidence for every applicable row.
