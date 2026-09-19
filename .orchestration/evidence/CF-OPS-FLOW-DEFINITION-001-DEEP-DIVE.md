# EVIDENCE — CF-OPS-FLOW-DEFINITION-001 DEEP DIVE

Target baseline reviewed: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.
Accepted source reviewed: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.

This supplements `CF-OPS-FLOW-DEFINITION-001-BASELINE.md` with findings discovered during adversarial definition review and the first Independent Critic cycle.

## Operational date gap

Current target reporting/dashboard code derives `today` from UTC while browser features can derive dates from the browser clock. There is no authoritative persisted per-hotel IANA timezone in inspected target control metadata. Genuine date-sensitive rules therefore need a hotel-local server foundation.

Timezone work must not invent new calendar cutoffs absent from accepted source behavior.

## Source temporal parity

Accepted source evidence establishes:

- formal check-in requires checklist/evidence and an available room but has no calendar-day eligibility guard;
- cancellation is a terminal transition from `Confirmed` with required terminal reason and no arrival-date cutoff;
- no-show is distinct and permitted from the arrival date; source backend rejects only dates before `check_in`;
- source UI enables no-show when current date is `>= check_in`.

Therefore repaired definition uses `hotel_local_date >= check_in` for no-show and preserves source check-in/cancellation behavior. New early/late check-in or cancellation cutoffs require a future product decision.

## Source pricing parity

Accepted source frontend exposes `check_in`/`check_out` editing on the booking management surface, including active booking context. Accepted transactional backend recalculates every booking update as:

`total_price_cents = nights × selected room price_cents + extra_charges_total`.

The same transaction uses the destination room price after a room reassignment. Therefore observable source behavior for the new dedicated extension/reassignment flows is:

- extension: new total nights × current assigned room price + extra charges;
- reassignment: total stay nights × destination room current price + extra charges.

The first analysis pass incorrectly treated extension pricing as an unsupported Human Gate and declared reassignment non-repricing. Both were repaired to source parity. A contracted/frozen-rate model may be commercially preferable but is a future intentional product departure.

## Reassignment remaining-night defect

Current target reassignment validation/claim logic is based on the booking's full original stay interval. For an already checked-in guest this can reject a valid destination because that destination had a conflict on a historical night. The target definition moves only `[effective_date, check_out)` where `effective_date=max(check_in, hotel_local_date)` and leaves past inventory history on the original room.

This is an explicit operational hardening of the Cloudflare target representation while preserving source-visible lifecycle intent (old room dirty, destination occupied, one active booking).

## Maintenance schema/event mismatch

Current target `maintenance_cases` has one-open-case-per-room and housekeeping triggers assume `MAINTENANCE_OPEN` changes room state to `MAINTENANCE` and `MAINTENANCE_RESOLVE` changes it to `DIRTY`. This cannot truthfully represent a non-blocking incident opened/resolved while a guest remains occupied. The next maintenance increment must add case impact and allow truthful case events with no physical-state change.

## Maintenance authorization gap

Current receptionist capabilities include lifecycle and Billing but not housekeeping writes. Reusing `housekeeping.write` to report a guest-room defect would over-grant cleaning/maintenance execution authority. The definition separates maintenance read/report/resolve capabilities.

## Billing consistency defect in target

Current target extra-charge behavior increases booking total and updates an invoice only when invoice status is already `PENDING`. A previously `PAID` invoice can therefore become stale after a later charge. Payment entries may also exist before checkout. Any authoritative change to booking total must reconcile invoice amount/status while preserving payment history.

## Checkout settlement source parity

The first analysis pass incorrectly treated meaning of `settled` as unresolved. Accepted source evidence is explicit:

- API contract states `settled` requires a fully paid account;
- `pending-approved` requires operational reference and privileged override;
- transactional backend locks invoice and rejects `settled` unless invoice status is `PAID` and paid amount covers booking total.

Therefore checkout settlement meaning is binding parity, not a Human Gate. The target's weaker behavior is a parity defect to repair.

## Frontend budget gate

`check-cloudflare-budgets.mjs` sums every generated JS asset. Accepted staging is approximately `319858 / 320000` raw JS, leaving no safe feature-growth margin. Route code splitting alone does not lower this total. Wave 0 requires behavior-preserving net reduction to `<=300000` raw JS without raising the budget.

## Source/target enum context

Target booking domain already serializes `NO_SHOW` and maps it to source semantic `NoShow`; reports already exclude `NO_SHOW` from revenue semantics. The missing target capability is an explicit Reception/domain command with source-parity eligibility and hotel-local date authority.

## Scope proof

The analysis branch changes only `docs/**` and `.orchestration/**` relative to accepted staging. No runtime application, schema migration, CI budget, production or deployment code is modified by this analysis phase.