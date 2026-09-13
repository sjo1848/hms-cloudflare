# 20 — Intentional target departures from accepted source

Status: `BINDING GOVERNANCE REGISTER / IMPLEMENTATION LOCKED`

Purpose: distinguish deliberate target corrections/hardening from accidental source-parity drift. The default remains source parity; only the departures listed here are authorized for this workflow wave.

## D1 — Authoritative hotel-local operational date

Source implementation uses UTC/browser-derived dates in several places. Target uses a persisted hotel IANA timezone and server-derived `hotel_local_date` for genuinely date-sensitive predicates.

Reason: hotel operations belong to the property's calendar day. This preserves the business meaning of source rules such as "no-show from arrival date" while removing timezone-dependent behavior.

Boundary: this change does not invent new calendar cutoffs for check-in or cancellation.

## D2 — Overrun checked-in stay must be normalized before reassignment

Source room change does not explicitly reject a `CHECKED_IN` booking whose `check_out` is already at/before the hotel-local operational date.

Target rule: when `hotel_local_date >= check_out`, the active stay is an overrun attention case. Before room reassignment, the operator must either:
- extend to a valid future checkout, establishing an authoritative remaining inventory interval; or
- checkout, ending occupancy.

Reason: remaining-night reassignment cannot truthfully move future inventory when no future stay interval exists. This is an explicit domain-correctness departure, not source parity.

## D3 — Explicit no-show and stay-extension lifecycle commands

Accepted source can represent no-show/date change through generic booking update behavior. Target adds explicit commands:
- `POST /api/v1/bookings/:id/no-show`;
- `POST /api/v1/bookings/:id/extend-stay`.

Reason: both operations have material lifecycle/inventory/audit consequences and must have command-specific concurrency guards. Business timing/pricing semantics remain source-parity unless separately listed here.

Generic booking PATCH remains for confirmed pre-occupancy edit/cancellation and cannot become a lifecycle bypass.

## D4 — Active-stay reassignment reason enforced server-side

Accepted source Reception UI requires an operational reassignment reason for a checked-in stay, while source backend can accept the update without making that reason a mandatory transactional precondition.

Target makes `reason` (trimmed min 6 chars) mandatory in the explicit reassignment command.

Reason: the evidence requirement already exists in the accepted operator workflow; enforcing it server-side prevents API clients from bypassing the audit contract.

## D5 — Atomic inline guest + reservation command

Accepted workflows support creating/selecting a guest for reservation work, but a frontend sequence of independent guest-create then booking-create can leave unintended guest-only state when room availability is lost.

Target adds one same-hotel atomic business command for inline new guest + reservation.

Reason: one operator intent should not produce partial persistence on booking conflict. Standalone Guests creation remains available for intentional guest-only creation.

## D6 — Occupied maintenance model and dedicated maintenance capabilities

Accepted/target baseline housekeeping workflow primarily models maintenance as a room state for vacant turnover work. Target introduces maintenance cases independent from physical room state with `NON_BLOCKING | BLOCKING`, occupied-room coexistence, explicit escalation/resolution and dedicated read/report/resolve capabilities.

Reason: real in-stay incidents must be tracked without falsely vacating/moving the guest or over-granting housekeeping state permissions to Reception.

One open case per room remains the v1 boundary.

## D7 — Restore/extend source front-desk board contract in Cloudflare target

Accepted source exposes `GET /api/v1/front-desk/board`; current Cloudflare staging reconstructs more operational meaning client-side.

Target restores/extends that source contract instead of creating a new parallel route.

Reason: queue priority/readiness/blocker meaning should be server-owned and consistent across Reception surfaces.

## D8 — Billing consistency hardening after total changes

Current target can leave an existing paid invoice stale after a later total increase such as an extra charge. Target requires every authoritative booking-total change to reconcile invoice amount/status in the same logical operation.

Reason: `PAID` cannot remain truthful when paid amount no longer covers authoritative amount. Payment entries remain immutable evidence.

This hardening does not change source checkout policy semantics: `settled` still means fully paid and `pending-approved` remains the governed exception.

## Non-authorized departures

The following remain outside this wave unless a new explicit product decision is created:
- contracted/frozen nightly-rate pricing replacing current-room repricing;
- new early/late check-in cutoff;
- cancellation cutoff;
- configurable same-day no-show hour;
- automatic refund/retention/penalty policy;
- automatic relocation or split-stay extension;
- multiple simultaneous maintenance cases per room;
- new OUT_OF_ORDER transition design;
- paid real-time/WebSocket dependency;
- production/cutover or real-data migration.

## Governance rule

If BUILD discovers that an implementation requires behavior different from both the accepted source and this register, stop and return to analysis. Do not rationalize the difference as an implementation detail.