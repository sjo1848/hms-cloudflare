# PRE-CRITIC V9 — OPERATIONAL FLOW + APP INTERACTION

Verdict: `PASS FOR IMMUTABLE EXTERNAL REVIEW`

## Closed governance set — PASS

Canonical departures are D1-D12. D12 explicitly authorizes only the user-requested app-interaction/navigation modernization and forbids using UX modernization to weaken domain, RBAC, required capability coverage or command ownership.

## Domain / accounting — PASS

D1-D11 remain unchanged by UX refinement. Booking/room/maintenance transitions, hotel-local time, D9 pricing boundary and D11 invoice/payment-ledger truth remain authoritative.

## Navigation / source route — PASS

Reception remains canonically at `/bookings`, matching accepted source and accepted target route. Contextual deep links use the existing target route set.

The accepted source/frontend navigation difference is no longer hidden: D12 registers server-derived capability bootstrap and target-route landing behavior as intentional interaction modernization.

## Capability / access UX — PASS

`GET /api/v1/auth/me` additively exposes deterministic `capabilities[]` and `network_capabilities[]` derived from canonical backend authority. Module visibility and root landing use the single mapping in `19`.

Protected modules do not mount/fetch ordinary protected data before bootstrap resolves. Unauthorized direct URL renders in-shell Forbidden; backend remains the real authorization boundary. Stale-access 403 refreshes bootstrap once and never replays the denied mutation.

## Interaction model — PASS

21/22 bind:
- persistent shell;
- desktop master/detail and mobile focused-task surfaces;
- capability-aware direct core navigation;
- one primary task drawer/sheet at a time;
- product confirmation dialogs and compact contextual dialogs;
- no browser-native confirm/alert;
- deterministic confirmation -> task -> workspace Back stack;
- dirty task discard guard across close/Escape/Back/module exit;
- selected Reception booking governs embedded Billing.

## Filters / history / scroll — PASS

Meaningful filters and selected context are navigable state. Refresh/mutation preserves them. Back restores prior workspace and scroll; selected-item-in-view is deterministic fallback after data reflow. Text search may replace history rather than create one entry per keystroke. Category counts are stable base-scope counts and visible-result count is separate.

## Loading / conflict / feedback — PASS

Initial load uses skeletons. Later refresh preserves known data. Mutation state is local. Validation, infrastructure error and stale conflict are distinct. State-changing writes are never auto-replayed. Safe draft data may survive recoverable conflict.

## Flow coverage — PASS

Reception: reservation/edit, check-in, late arrival, cancellation, no-show, reassignment, extension, checkout and maintenance reporting each have a defined task surface, entry/exit and conflict behavior.

Rooms, Guests, Housekeeping and embedded Billing have defined filter/context/task transitions. Payment, extra charge and cash close are focused financial tasks.

## Responsive / accessibility / performance — PASS

Mobile/tablet/desktop execution is mandatory. Focus entry/return, modal containment, keyboard queue behavior and reduced motion are binding.

No heavy animation/UI framework is authorized to implement app feel; the <=300000 raw-JS prerequisite remains ahead of material UI growth.

## E2E / evidence — PASS

E2E-21 requires capability navigation/Forbidden behavior, history restoration, focused flows, product dialogs, Billing coupling, conflict recovery, filter persistence and reduced motion. UX invariants are promoted to the orchestration registry.

## Scope isolation — PASS

Compare against accepted staging contains only `docs/operational-flows/**` and `.orchestration/**`. No runtime/schema/CI/deploy/staging/main changes are included.

## Exit

No definition-level Human Gate remains. Publish immutable Artifact A9 + metadata-only Boundary B9, perform fresh controller adversarial review, then require a genuinely independent external critic before implementation planning.
