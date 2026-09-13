# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

Every row requires tenant-scoped backend authorization, concurrency guards, atomic truth, success audit only when mutation wins, authoritative reload and browser proof where UI exists. Canonical companions: `16`, `19`, `20`, `05`, operational invariants.

| ID | Flow | Binding E2E result / acceptance boundary |
|---|---|---|
| E2E-00 | Foundations | Raw JS <=300000 without raising 320000 budget; hotel IANA timezone; server hotel_local_date; incremental migrations; existing gates green. |
| E2E-01 | Existing-guest reservation/edit | POST /bookings atomic create. On confirmed PATCH, room/date change is priced; guest/name/notes-only edit preserves total. |
| E2E-02 | Inline guest+reservation | POST /bookings/with-guest; guests.write + bookings.write; atomic guest+booking; lost room leaves no orphan guest. |
| E2E-03 | Check-in | CONFIRMED + checklist + readiness -> CHECKED_IN/OCCUPIED; stale rejects; booking total/invoice amount unchanged by check-in itself. |
| E2E-04 | Cancellation | CONFIRMED PATCH + reason min 6; inventory released; room unchanged; booking total unchanged; financial evidence preserved; no auto money disposition. |
| E2E-05 | No-show | CONFIRMED, never occupied, local date >= check_in, reason min 6; inventory released; room unchanged; booking total unchanged; financial evidence preserved. |
| E2E-06 | Late arrival | Existing PATCH/front_desk ETA+note; bookings.write; CONFIRMED; future ETA inside stay; audit; room/inventory/booking total/invoice unchanged; rerecord allowed. |
| E2E-07 | Reassignment | CHECKED_IN non-overrun, valid destination, reason min 6; remaining claims move; room turnover/history; pricing-affecting destination repricing + invoice reconciliation atomic. |
| E2E-08 | NON_BLOCKING maintenance | May open on OCCUPIED/AVAILABLE/DIRTY/CLEANING; physical state unchanged; no independent sale/readiness block; role boundaries enforced. |
| E2E-09 | BLOCKING occupied maintenance | Guest remains; sale/readiness blocked; explicit reassign/checkout; vacancy -> MAINTENANCE; resolve -> DIRTY; future reservations attention only. |
| E2E-10 | Vacant BLOCKING | AVAILABLE/DIRTY/CLEANING -> MAINTENANCE; resolve -> DIRTY; one open case; escalation evidence. |
| E2E-11 | Housekeeping | DIRTY -> CLEANING -> AVAILABLE; finish rejects if blocking condition; handoff automatic from room state. |
| E2E-12 | Checkout+Billing | Settlement/checklist valid; CHECKED_OUT; room DIRTY/MAINTENANCE; booking total preserved; invoice/settlement uses existing total; admin-only pending override. |
| E2E-13 | Extension | Added nights atomic; later checkout; pricing-affecting current-room repricing + invoice reconciliation; stale/conflict full rollback. |
| E2E-14 | Extra charge | Pricing-affecting total increase reconciles invoice atomically; payments immutable; stale PAID forbidden. |
| E2E-15 | Front-desk board | bookings.read -> admin/ops/receptionist; housekeeping/saas_admin denied; authoritative queue/readiness/late-arrival/maintenance context; read-only. |
| E2E-16 | Context+freshness | Stable IDs context only; refresh after mutation/focus/entry/poll; backend revalidates. |
| E2E-17 | Continuation | Preserve search/filter; reload board; next case same deterministic priority. |
| E2E-18 | Audit | Lifecycle/arrival/maintenance success events iff mutation wins; material actor/hotel/request/evidence persisted. |
| E2E-19 | Synthetic shift | Exercise all flows, negative evidence, stale races, RBAC 403s, no-repricing versus priced-mutation cases, legacy compatibility and desktop/mobile journey. |
| E2E-20 | Contract conformance | Runtime/tests/OpenAPI/client/browser use canonical routes/capabilities/payloads/pricing effects; truthful errors; no unregistered drift. |

## Mandatory D9 financial regression proofs

After creating a reservation, change the room's catalog price before each independent scenario:
1. PATCH only guest/name/ordinary notes -> stored booking total and existing invoice unchanged.
2. Check-in -> total unchanged.
3. Record or rerecord late arrival -> total/invoice unchanged.
4. Cancel -> total unchanged; payment/invoice evidence preserved.
5. Mark no-show -> total unchanged; payment/invoice evidence preserved.
6. Checkout -> settlement uses stored authoritative total; checkout does not reprice.
7. Reassign room -> destination-price repricing occurs and invoice reconciles.
8. Extend stay -> current-room repricing occurs and invoice reconciles.
9. Add extra charge -> total changes and invoice reconciles.

## Other mandatory negative proofs

Late arrival past/out-of-stay ETA, short note, non-confirmed booking; front-desk role 403s; NON_BLOCKING AVAILABLE/DIRTY/CLEANING state preservation; reassignment short reason/blocking destination/conflict/stale/overrun; false settled/non-admin override; extension conflict/concurrent Billing.

## Out of scope

No automatic refund/penalty/retention; no frozen contracted-rate model for actual room/date pricing changes; no split stay/auto relocation; no multi-case maintenance; no new OUT_OF_ORDER; no paid realtime; no new arrival cutoffs; no production/cutover/real-data migration; no unrelated Reports/Users/Network redesign.

## Completion rule

Every row requires bounded Task Contract, implementation, automated/domain/API proof, cross-module proof and browser evidence with no contradiction against canonical documents.