# INDEPENDENT DEFINITION CRITIC — CF-OPS-FLOW-DEFINITION-001

Verdict: `REWORK`

Reviewed immutable publication:

- Artifact A: `3ad6d84124a7b3da803d8ae2eb4c439a3e411fa4`
- Boundary B: `f5cd69416af361468020ae0a426998a4025dd7f3`
- accepted target baseline: `26239b76b919266de07d7bece5977296647f109c`
- accepted source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Boundary check: PASS. B is exactly one commit after A and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.

## Findings

### F1 — P0: no-show timing silently weakens source parity

Artifact A defines no-show only when `hotel_local_date > check_in` and rejects same-day no-show.

Accepted source behavior explicitly enables no-show **from the arrival date** and backend rejects only when current date is before `check_in`. The API changelog states: `no-show solo se admite desde la fecha de llegada`.

Required repair: preserve source semantic timing while correcting timezone authority: `hotel_local_date >= check_in`.

### F2 — P0: check-in/cancellation calendar restrictions are unapproved product changes

Artifact A defines normal check-in only inside `check_in <= hotel_local_date < check_out` and cancellation only through arrival date.

The accepted source transactional domain instead governs `Confirmed -> CheckedIn|Cancelled|NoShow`; formal check-in requires guest/checklist and room availability, with no calendar-day eligibility guard. Cancellation requires terminal reason but no arrival-date cutoff. The source UI exposes cancellation for a confirmed booking and enables no-show from arrival date.

Required repair: do not add hard calendar restrictions absent from accepted source/product decision. Retain hotel-local date for classification, no-show eligibility, reassignment effective date and other proven date semantics, but preserve source check-in/cancellation behavior. Any future early/late check-in or cancellation cutoff policy requires an explicit product decision.

### F3 — P0: HG-FIN-002 is not a legitimate Human Gate

Artifact A labels the meaning of checkout `settled` as unresolved policy.

Accepted source contract already defines it: API changelog states `settled` requires the account to be fully paid and `pending-approved` requires an operational reference. The source transactional backend locks the invoice and rejects `settled` unless invoice status is `PAID` and paid amount covers booking total.

Required repair: make this a binding parity invariant, not a Human Gate. Keep only `HG-FIN-001` unless another genuinely unsupported commercial choice is discovered.

## Strongest contrary evidence

- Source `BookingArrivalExceptionActions`: `canMarkNoShow = todayUtc >= booking.check_in`; cancel remains available for the confirmed booking.
- Source transactional repository: NoShow fails only when current date is before check-in; `settled` verifies paid invoice against booking total.
- Source API changelog: no-show from arrival date; `settled` requires fully paid account; `pending-approved` requires reference and privileged override.
- Source domain transition table: `Confirmed -> CheckedIn | Cancelled | NoShow` with no calendar restriction on CheckedIn/Cancelled.

## Non-findings

The Critic found no blocking defect in the current definitions for:

- remaining-night in-stay reassignment and historical room-night preservation;
- `NON_BLOCKING | BLOCKING` maintenance impact model;
- one-open-case v1 boundary;
- maintenance RBAC split;
- Billing/invoice consistency after total increases;
- frontend JS headroom prerequisite;
- contextual navigation and refresh strategy;
- artifact scope isolation (documentation/orchestration only).

## Exact next action

Perform bounded definition repair for F1–F3 only, refresh evidence/Pre-Critic, publish a new immutable Artifact A2 + orchestration-only Boundary B2, then run a fresh Independent Definition Critic. Product implementation remains locked.