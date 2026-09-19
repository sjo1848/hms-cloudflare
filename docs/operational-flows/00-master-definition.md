# HMS Cloudflare — Operational Flow Master Definition

Status: `ANALYSIS / UX INTERACTION REFINEMENT / IMPLEMENTATION LOCKED`

Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

Canonical set: `18`, `19`, `20`, `21`, `22`, `16`, `05`, operational invariants and binding decisions.

## Governing rules

HMS follows hotel operator workflow. Physical room state, sellability and immediate readiness are distinct. Source behavior is preserved unless registered in `20`. D12 is the narrow user-authorized interaction/navigation modernization boundary; UX continuity in `21/22` is product behavior, not cosmetic latitude.

## Booking lifecycle / arrival

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, terminal `CANCELLED | NO_SHOW`. No generic rollback. No new check-in/cancellation cutoff. No-show from hotel-local arrival date. Late arrival remains CONFIRMED context under D10.

## Pricing / Billing

D9 defines priced vs state/evidence-only mutation. D11 is the only reconciliation model: immutable payment ledger, exact paid correlation, derived remaining/credit, deterministic status/timestamp behavior, no fabricated payment evidence, VOIDED/ledger mismatch fail closed. Checkout uses stored authoritative total and valid Billing authority.

## Room / maintenance

Normal vacancy routes OCCUPIED -> DIRTY, except open BLOCKING maintenance routes MAINTENANCE. NON_BLOCKING is advisory/state-preserving. BLOCKING prevents new occupancy. V1 one open case/room. Maintenance RBAC is binding.

## Reassignment / extension

Reassignment moves only remaining nights, preserves history, turns over old room and applies destination-current-price semantics through D11. Extension claims added nights atomically and reprices through D11. Overrun must extend or checkout before reassignment.

## API ownership

`19` owns canonical routes/capabilities/evidence. Generic PATCH/direct room state cannot bypass domain commands. Front-desk board remains canonical Reception read model.

## App interaction

`21-app-interaction-contract.md` is binding and `22-interaction-flow-matrix.md` maps it to concrete flows/current gaps.

Required product behavior:
- persistent shell across module changes;
- desktop master/detail and mobile focused-task model;
- multi-step work in drawer/full-screen sheet;
- destructive/material confirmation in product dialog;
- no native browser confirm/alert;
- filter/search/selection/history continuity;
- contextual Back/Forward and no unconditional scroll reset for contextual navigation;
- Reception-selected booking controls embedded Billing;
- skeleton/refresh/conflict/dirty-close/focus behavior;
- short reduced-motion-aware transitions with no heavy animation dependency;
- capability-aware direct mobile navigation for the current user's authorized core operational modules;
- focused flow-specific transitions for reservation, check-in, late arrival, cancellation/no-show, reassignment, extension, checkout, maintenance, payments/charges and cash close.

## Technical waves

Wave 0: JS headroom, timezone, Billing foundation.
Wave 1: domain correctness.
Wave 2: interaction foundation + operational workspace transformation.
Wave 3: optimization + full synthetic shift/browser acceptance.

## Outside scope

Frozen rate redesign, new arrival cutoffs, automatic credit disposition, VOIDED recovery flow, split stay/auto relocation, multiple maintenance cases, new OUT_OF_ORDER design, paid realtime, production/cutover/real-data migration, unrelated module redesign.

## Definition exit

Close only when domain + E2E + API + RBAC + D1-D12 + E2E-21 + `21/22` are contradiction-free, Pre-Critic passes, a fresh immutable Artifact+Boundary is reviewed, and orchestration points to that artifact. Previous A7/B7 are superseded after UX scope expansion.
