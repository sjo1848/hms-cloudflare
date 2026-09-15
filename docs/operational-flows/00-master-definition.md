# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`  
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Canonical set: `16-target-transition-matrix.md`, `18-end-to-end-scope-matrix.md`, `19-api-command-contract-map.md`, `20-intentional-target-departures.md`, `05-maintenance-data-rbac.md`, `.orchestration/OPERATIONAL-INVARIANTS.md`.

## Governing rules
HMS follows the hotel operator workflow. Physical room state, future sellability and immediate readiness are distinct. Source behavior is preserved unless a departure is registered in `20`; unregistered divergence is a defect.

## Booking lifecycle / arrival context
`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. No generic rollback. No new calendar cutoff for check-in/cancellation. No-show from `hotel_local_date >= check_in`.

Late arrival remains CONFIRMED context. D10 requires explicit-offset RFC3339 ETA parsed as an instant and validated against the hotel-local stay date.

## Pricing / Billing
D9: only explicitly priced operations may alter booking total: booking room/date edit, reassignment, extension, extra charge, or future expressly priced command. Guest/name/notes-only, check-in, cancellation, no-show, late arrival and checkout preserve stored total.

D11 is the single reconciliation rule for all priced mutations. Payment entries are immutable evidence and after every successful payment or reconciliation `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)` for that invoice. Price reconciliation never creates/deletes/rewrites a payment, never fabricates a payment method/reference and is audited separately from cash/payment receipt.

A priced mutation may produce a total below prior payments. `remaining_cents` and `credit_cents` are derived; invoice status/timestamps reconcile deterministically without adding a new status. Existing `VOIDED` invoice or ledger mismatch is fail-closed for priced mutations and cannot authorize checkout settlement.

Checkout `settled` requires valid authoritative Billing with no remaining balance; positive balance uses pending-approved + reference + admin-only override. Checkout itself never reprices accommodation.

## Room / maintenance
Normal occupied turnover: `OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`. Open BLOCKING maintenance at vacancy routes to MAINTENANCE, then resolution -> DIRTY.

Maintenance impact `NON_BLOCKING | BLOCKING`. NON_BLOCKING may coexist with OCCUPIED/AVAILABLE/DIRTY/CLEANING without independent state/sale block. BLOCKING prevents new occupancy; occupied guest stays until explicit move/checkout. V1 one open case/room.

Roles: admin/ops/housekeeping maintenance read-report-resolve; receptionist read-report/escalate not resolve; saas_admin none. Cleaning remains housekeeping.write.

## Reassignment / extension
Reassignment: CHECKED_IN, non-overrun, valid destination, reason min 6. Move only remaining claims, preserve history, destination OCCUPIED, old DIRTY or MAINTENANCE. Destination-price repricing plus extras; D11 reconciliation.

Extension: explicit later checkout for CHECKED_IN, added nights atomic, current-room repricing plus extras; D11 reconciliation.

## API ownership
`19-api-command-contract-map.md` is binding. Generic PATCH/direct room status cannot bypass canonical lifecycle or maintenance commands. New API surface, pricing/Billing fields and timestamp formats align OpenAPI/client types.

## Workflow continuity
Reception booking controls embedded Billing. Stable query IDs carry context only. Revalidate after mutation, focus/context entry and modest visible polling. After success preserve filters/search and select next case by deterministic board priority.

## Technical prerequisites / waves
Before material UI growth: raw JS <=300000 without raising 320000 budget. Before date-sensitive flows: persisted IANA timezone + server hotel-local date. Before priced flows: shared D11 foundation including forward schema change, ledger correlation and reconciliation audit.

Wave 0: JS headroom + timezone + shared D11 financial foundation. Wave 1: reassignment, maintenance, arrival exceptions, extension/Billing. Wave 2: board/Reception/Billing/guest+reservation/context continuity. Wave 3: optimization + synthetic shift. Each state-changing increment gets its own Task Contract and independent review.

## Outside scope
No frozen contracted-rate model, new arrival cutoffs, automatic credit disposition/refund, separate VOIDED recovery workflow, split stay/automatic relocation, multiple simultaneous maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration, or unrelated Reports/Users/Network redesign.

## Definition exit
Close analysis only when canonical documents are contradiction-free, all E2E rows implementation-ready, source departures closed-set, no Human Gate blocks scope, Pre-Critic passes, immutable Artifact+Boundary critic returns PASS, and orchestration points to that artifact. Until then implementation remains locked.