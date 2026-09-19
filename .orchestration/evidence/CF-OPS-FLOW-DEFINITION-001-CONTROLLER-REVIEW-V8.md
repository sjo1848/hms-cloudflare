# CONTROLLER REVIEW V8 — APP INTERACTION DEFINITION

Artifact reviewed: `7f2ffc302768f298dbece336762d6ad7bcf21ee6`
Boundary reviewed: `7f0e10ca35cd46c636667cf7dd60bfd7af971fb9`
Verdict: `REWORK`

Boundary structure: PASS. B8 is exactly one metadata-only commit over A8 and changes only STATE/STATUS.

## F1 — App-navigation modernization is an unregistered source departure — BLOCKING GOVERNANCE

Accepted source frontend uses a local `roleHasCapability` map and its role-home logic can land analytics-capable users on DashboardHome. The accepted Cloudflare target baseline instead has a server-side capability canon, no Dashboard route in its current route set, and historically falls through to Reception.

A8 intentionally improves this by:
- exposing effective capabilities from server bootstrap;
- refusing a duplicate frontend authorization map;
- using capability-aware desktop/mobile navigation;
- using a target-route capability-derived landing;
- changing mobile/navigation interaction mechanics under 21/22.

Those are reasonable and user-requested UX hardenings, but the master/governance contract says source divergence is allowed only when registered in `20-intentional-target-departures.md`. CF-OPS-UX-001 alone does not satisfy that closed-set rule.

### Required repair

Register a narrow departure D12 that authorizes interaction/navigation modernization only:
- server-derived effective capabilities for UI navigation instead of duplicated frontend role authorization logic;
- capability-aware desktop/mobile navigation and guarded direct URLs;
- target-route-set landing behavior for this Cloudflare wave, without silently claiming source Dashboard-route parity;
- drawer/sheet/dialog/filter/history/motion mechanics from 21/22;
- no change to backend capability authority, domain states/transitions, required task information, or API business semantics.

D12 must not become a general license to remove source capabilities or product surfaces. Calendar/Dashboard feature restoration/removal remains a separate scope decision; this interaction wave only governs the accepted target route set.

## Other review areas — PASS

No blocking contradiction found in:
- D1-D11;
- billing ledger truth;
- maintenance/RBAC;
- /bookings canonical Reception route;
- overlay/back-stack rules;
- dirty-task guards;
- filter/history/scroll semantics;
- selected-booking Billing coupling;
- capability-denied direct URL behavior;
- JS-budget constraint;
- responsive/accessibility/reduced-motion requirements;
- scope isolation.

Result: REWORK F1 only. Product implementation remains locked.
