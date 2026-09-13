# EVIDENCE — CF-OPS-FLOW-DEFINITION-001 DEEP DIVE

Baseline reviewed: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.
Accepted source reviewed: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.

This supplements `CF-OPS-FLOW-DEFINITION-001-BASELINE.md` with findings discovered during adversarial definition review and the first Independent Critic cycle.

## Operational date gap

Current target reporting/dashboard code derives `today` from UTC while browser features can derive dates from the browser clock. There is no authoritative persisted per-hotel IANA timezone in the inspected target control metadata. Genuine date-sensitive rules therefore need a hotel-local server foundation.

The timezone foundation must not invent new calendar cutoffs absent from accepted source behavior.

## Source temporal parity

Accepted source evidence establishes:

- formal check-in requires the source checklist/evidence and an available room, but does not impose a calendar-day check-in window;
- cancellation is a terminal transition from `Confirmed` with required terminal reason and no arrival-date cutoff;
- no-show is distinct and is permitted **from the arrival date**; source backend rejects only dates before `check_in`;
- source UI enables no-show when current date is `>= check_in`.

Therefore the repaired definition uses hotel-local date for no-show (`hotel_local_date >= check_in`) while preserving source check-in/cancellation semantics. A new early/late check-in or cancellation cutoff requires a future product decision.

## Reassignment remaining-night defect

Current target reassignment validation/claim logic is based on the booking's full original stay interval. For an already checked-in guest this can reject a valid destination because that destination had a conflict on a historical night. The target definition therefore moves only `[effective_date, check_out)` where `effective_date=max(check_in, hotel_local_date)` and leaves past inventory history on the original room.

## Maintenance schema/event mismatch

Current `maintenance_cases` has one-open-case-per-room and current housekeeping triggers assume `MAINTENANCE_OPEN` changes room state to `MAINTENANCE` and `MAINTENANCE_RESOLVE` changes it to `DIRTY`. This cannot truthfully represent a non-blocking incident opened/resolved while a guest remains occupied. The next maintenance increment must add case impact and allow truthful case events with no physical-state change.

## Maintenance authorization gap

Current receptionist capabilities include lifecycle and Billing but not housekeeping writes. Reusing `housekeeping.write` to report a guest-room defect would over-grant cleaning/maintenance execution authority. The definition separates maintenance read/report/resolve capabilities.

## Billing consistency defect in target

Current target extra-charge behavior increases booking total and updates an invoice only when the invoice is already `PENDING`. A previously `PAID` invoice can therefore become stale after a later charge. Payment entries may also exist before checkout. Any authoritative increase to booking total must reconcile invoice amount/status while preserving payment history.

## Checkout settlement source parity

The first analysis pass incorrectly treated meaning of `settled` as unresolved. Accepted source evidence is explicit:

- API contract states `settled` requires a fully paid account;
- `pending-approved` requires operational reference and privileged override;
- transactional backend locks the invoice and rejects `settled` unless invoice status is `PAID` and paid amount covers booking total.

Therefore checkout settlement meaning is binding parity, not a Human Gate. The target's weaker behavior is a parity defect to repair.

## Extension price evidence gap

The new dedicated active-stay extension flow still has an unsupported commercial choice. Target/source totals can include extra charges and there is no explicit contracted nightly-rate snapshot dedicated to extension pricing. `total / nights` is unsafe. Source generic update behavior recalculates accommodation using room price, but the accepted product contract does not explicitly define a dedicated extension-rate policy. `HG-FIN-001` remains legitimate.

## Frontend budget gate

`check-cloudflare-budgets.mjs` sums every generated JS asset. Accepted staging is approximately `319858 / 320000` raw JS, leaving no safe feature-growth margin. Route code splitting alone does not lower this total. Wave 0 requires behavior-preserving net reduction to `<=300000` raw JS without raising the budget.

## Source/target enum context

Target booking domain already serializes `NO_SHOW` and maps it to source semantic `NoShow`; reports already exclude `NO_SHOW` from revenue semantics. The missing target capability is an explicit Reception/domain command with source-parity eligibility and hotel-local date authority.

## Scope proof

The analysis branch changes only `docs/**` and `.orchestration/**` relative to accepted staging. No runtime application, schema migration, CI budget, production or deployment code is modified by this analysis phase.