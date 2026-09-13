# PRE-CRITIC V2 — CF-OPS-FLOW-DEFINITION-001

Verdict: `PASS FOR IMMUTABLE EXTERNAL REVIEW`
Reviewed content through predecessor: `5d4eba8b42dc2d9d09b5ab0a578edb1e44ead01d`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`
Accepted source reference: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

This is an admission check only. It does not authorize runtime implementation and is not the final Independent Critic verdict.

## Why V2 exists

The first immutable artifact failed adversarial review because it silently narrowed accepted source behavior in no-show/check-in/cancellation and incorrectly treated source-defined checkout/pricing semantics as Human Gates. Those findings were persisted as REWORK evidence and repaired before this second admission.

## Source-parity repairs — PASS

- no-show is eligible from `hotel_local_date >= check_in`, matching accepted source;
- no new calendar cutoff is added to `CONFIRMED -> CHECKED_IN`;
- no new arrival-date cutoff is added to `CONFIRMED -> CANCELLED`;
- `settled` means fully paid and `pending-approved` retains source reference/override semantics;
- active date/room changes preserve accepted source repricing: total stay nights × current selected room price + extra charges;
- reassignment uses destination current room price; extension uses current assigned room price;
- a contracted/frozen rate is explicitly deferred rather than silently substituted;
- accepted front-desk read-model contract `/api/v1/front-desk/board` is preserved/extended instead of replaced by a parallel invented route.

## Domain coverage — PASS

Binding documents define booking states, room physical states, availability/readiness separation, maintenance impact, inventory ownership, operational time, financial relationship and audit truth.

The transition matrix explicitly covers reservation edit, cancellation, check-in, no-show, extension, reassignment, checkout, terminal rejection, room turnover, maintenance open/resolve and availability overlay.

## Full E2E scope — PASS

`18-end-to-end-scope-matrix.md` defines the complete implementation perimeter and acceptance responsibility for:

- technical foundations and JS/timezone prerequisites;
- reservation with existing guest;
- atomic inline new guest + reservation;
- formal check-in;
- cancellation;
- no-show;
- late-arrival context;
- in-stay reassignment;
- non-blocking occupied maintenance;
- blocking occupied maintenance + explicit relocation;
- vacant-room blocking maintenance;
- Housekeeping turnover;
- checkout + Billing settlement/override;
- checked-in stay extension;
- extra-charge/invoice reconciliation;
- front-desk board/read model;
- contextual navigation and freshness;
- post-action continuation;
- lifecycle/audit evidence;
- full synthetic hotel-shift acceptance.

Every row states authoritative effects and/or failure/concurrency/cross-module/acceptance consequences. Out-of-scope product changes are explicit.

## Maintenance model — PASS

Canonical impact is only `NON_BLOCKING | BLOCKING`; impact is independent from priority and room state. V1 one-open-case rule, escalation, occupied coexistence, vacancy routing, future-reservation handling, board behavior and dedicated maintenance RBAC are defined.

## Billing/accounting — PASS

Payment entries remain immutable evidence. Any authoritative booking-total change reconciles an existing invoice in the same logical operation. `PAID` cannot remain truthful when paid amount is below authoritative amount. Extension/reassignment repricing and extra-charge hardening share the same consistency invariant.

No current Human Gate remains. Automated refund/penalty/retention and alternative contracted-rate policy are future decisions outside this wave.

## Concurrency/audit — PASS

Lifecycle mutations are defined fail-closed: stale/losing operations produce no partial booking/room/inventory/Billing drift and no success event. Required event material includes actor/hotel/request context plus command-specific transition data.

## Cross-module continuity — PASS

Reception-selected booking governs embedded Billing; room state drives Housekeeping/Maintenance handoff; front-desk board owns operational queue/readiness context; Housekeeping board remains authoritative for cleaning work; query parameters preserve context only; revalidation occurs after mutation, focus, contextual entry and modest visible-screen polling.

## UX/acceptance — PASS

Primary Reception/Housekeeping flows are defined to avoid unnecessary module switching while retaining high-risk confirmations. Post-action continuation, responsive evidence and a synthetic shift covering success/conflict/financial/maintenance cases are mandatory acceptance criteria.

## Scope isolation — PASS

Definition work remains documentation/orchestration only. Runtime, schema, CI budget, deploy, production and real-data state are not modified by the analysis definition itself. Implementation remains locked pending immutable publication + fresh critic.

## Admission result

No known unresolved contradiction or missing E2E scope row blocks immutable external review. Exact next action: publish this commit as Artifact A2, publish a one-commit orchestration Boundary B2 that points exactly to A2 with no open Human Gate, then run a fresh adversarial critic against A2+B2.