# EVIDENCE — CF-OPS-FLOW-DEFINITION-001 DEEP DIVE

Baseline reviewed: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.

This supplements `CF-OPS-FLOW-DEFINITION-001-BASELINE.md` with findings discovered during adversarial definition review.

## Operational date gap

Current reporting/dashboard code derives `today` from `new Date().toISOString().slice(0,10)`, while browser features can derive dates from the browser clock. There is no authoritative persisted per-hotel IANA timezone in the inspected target control metadata. Date-sensitive lifecycle commands therefore need a hotel-local server foundation before they can claim correctness.

## Reassignment remaining-night defect

Current reassignment validation/claim logic is based on the booking's full original stay interval. For an already checked-in guest this can reject a valid destination because that destination had a conflict on a historical night. The target definition therefore moves only `[effective_date, check_out)` where `effective_date=max(check_in, hotel_local_date)` and leaves past inventory history on the original room.

## Maintenance schema/event mismatch

Current `maintenance_cases` has one-open-case-per-room and current housekeeping triggers assume `MAINTENANCE_OPEN` changes room state to `MAINTENANCE` and `MAINTENANCE_RESOLVE` changes it to `DIRTY`. This cannot truthfully represent a non-blocking incident opened/resolved while a guest remains in an occupied room. The next maintenance increment must add case impact and allow truthful case events with no physical-state change.

## Maintenance authorization gap

Current receptionist capabilities include lifecycle and Billing but not housekeeping writes. Reusing `housekeeping.write` to report a guest-room defect would over-grant cleaning/maintenance execution authority. The definition separates maintenance read/report/resolve capabilities.

## Billing consistency defect

Current extra-charge behavior increases booking total and updates an invoice only when the invoice is already `PENDING`. A previously `PAID` invoice can therefore become stale after a later charge. Payment entries may also exist before checkout. Any future authoritative increase to booking total must reconcile invoice amount/status while preserving payment history.

Checkout currently persists a payment-policy choice such as `settled` or `pending-approved`, but `settled` itself does not prove authoritative remaining balance is zero. Its intended commercial meaning is therefore isolated as `HG-FIN-002` rather than inferred during implementation.

## Extension price evidence gap

Target booking `total_cents` and source `total_price_cents` do not provide a trustworthy contracted nightly-rate snapshot once extra charges can modify total. Dividing total by nights is unsafe, and choosing current room price would be a new commercial rule. Extension price basis is therefore `HG-FIN-001`.

## Frontend budget gate

`check-cloudflare-budgets.mjs` sums every generated JS asset. Accepted staging is approximately `319858 / 320000` raw JS, leaving no safe feature-growth margin. Route code splitting alone does not lower this total. Wave 0 requires behavior-preserving net reduction to `<=300000` raw JS without raising the budget.

## Source/target enum context

Target booking domain already serializes `NO_SHOW` and maps it to the source semantic `NoShow`; reports already exclude `NO_SHOW` from revenue semantics. The missing piece is an explicit Reception/domain command with temporal eligibility, not inventing a new reporting meaning.

## Scope proof

The analysis branch changes only `docs/**` and `.orchestration/**` relative to the accepted staging baseline. No runtime application, schema migration, CI budget, production or deployment code is modified by this analysis phase.