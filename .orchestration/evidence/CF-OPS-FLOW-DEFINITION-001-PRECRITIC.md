# PRE-CRITIC — CF-OPS-FLOW-DEFINITION-001

Verdict: `PASS FOR EXTERNAL DEFINITION REVIEW`
Reviewed content through branch predecessor: `06cfd3c97ab29996549a2fc7b59a5ef5c76c6db3`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`

This is an admission check, not Independent Critic PASS and not implementation authorization.

## Contract coverage

### P0.1 reassignment — PASS

Preconditions, authoritative remaining-night interval, old/new room states, history preservation, concurrency rejection, audit details and UI consequences are explicit in `02a-reassignment.md`, `15-lifecycle-event-contract.md`, `16-target-transition-matrix.md` and `17-reassignment-history.md`.

### P0.2 occupied maintenance — PASS

Canonical impact is `NON_BLOCKING | BLOCKING`; case state is independent from room physical state; occupied blocking incidents require explicit relocation; vacancy/resolve behavior, one-open-case v1, future booking consequences, board routing and dedicated maintenance capabilities are explicit in `02b-canonical-maintenance-model.md`, `05`, `07`, `12` and `16`.

### P0.3 no-show — PASS

Eligibility is `CONFIRMED` and `hotel_local_date > check_in`; same-day no-show is rejected in v1; inventory release, unchanged physical room state, concurrency and audit semantics are explicit. Cancellation/no-show temporal boundary is aligned in `02c`, `03d`, `06` and `16`.

### P0.4 stay extension — PASS WITH HUMAN GATE

Operational mutation, added-night atomicity, no split/auto-relocation, invoice consistency and concurrency behavior are explicit. Rate basis is intentionally not guessed and is isolated as `HG-FIN-001`. Therefore the definition is complete enough for review, but P0.4 implementation remains blocked until that gate is approved.

## Cross-module coverage — PASS

Reception readiness, Reception-selected Billing context, inline guest+reservation composition, checkout/Housekeeping handoff, maintenance routing, stable-ID navigation, refresh/focus/polling and next-case continuity are explicitly defined.

## Operational time — PASS

All date-sensitive decisions are tied to server-derived hotel-local date from a persisted IANA timezone. Current UTC/browser-clock behavior is documented as a baseline gap and Wave 0 prerequisite.

## Billing consistency — PASS WITH HUMAN GATE

Accounting invariant is explicit: authoritative booking-total increases reconcile existing invoice amount/status while preserving payment evidence. Current paid-invoice-after-charge defect is documented. Commercial meaning of checkout `settled` is isolated as `HG-FIN-002` instead of being inferred by BUILD.

## Technical feasibility/scope — PASS

Branch-vs-staging comparison changes only `docs/**` and `.orchestration/**`; no runtime code, migration, CI budget or deploy file is modified. Current frontend budget behavior is documented accurately: total generated raw JS is near 320 KB and code splitting alone does not satisfy the total-size gate. Wave 0 targets net reduction to <=300 KB without raising the budget.

## Invariant sweep

Applicable durable invariants remain binding: atomic conditional mutation, audit iff success, explicit domain transitions, tenant/RBAC boundaries, parity/enum meaning, UX workflow semantics, operational ordering, responsive proof, evidence accuracy, financial exactness and scope isolation.

Operational supplement now covers occupancy turnover, distinct availability/readiness, maintenance coexistence/blocking, no-show, extension atomicity, selected-case context, authoritative revalidation, hotel-local time, reassignment history, Billing consistency and commercial-policy Human Gates.

## Contradiction repairs completed during analysis

- replaced persisted maintenance impact concept `RELOCATION_REQUIRED` with canonical `BLOCKING`;
- corrected vacancy routing from 'any open maintenance' to 'open BLOCKING maintenance';
- corrected no-show from same-day/on-arrival to `hotel_local_date > check_in`;
- removed invented extension pricing from binding definition and isolated it as `HG-FIN-001`;
- corrected reassignment from whole-stay inventory movement to remaining-night movement;
- repaired stale README/orchestration decision references;
- marked intermediate contradictory refinements as superseded.

## Human Gates remaining

- `HG-FIN-001`: extension rate basis. Recommended: persist contracted accommodation-rate snapshot and preserve it for normal extension.
- `HG-FIN-002`: semantic meaning of checkout `settled`. Recommended: require authoritative remaining balance = 0; otherwise use authorized `pending-approved` + reference.

These are explicit policy decisions, not missing analysis that a coding agent may decide.

## Pre-Critic result

No known unresolved definition contradiction blocks external review. Product implementation remains locked. Exact next action: publish this definition artifact boundary, then run Independent Definition Critic against the immutable artifact + boundary state.