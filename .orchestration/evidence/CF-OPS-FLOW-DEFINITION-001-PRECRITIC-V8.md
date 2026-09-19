# PRE-CRITIC V8 — OPERATIONAL FLOW + APP INTERACTION

Verdict: `PASS FOR IMMUTABLE EXTERNAL REVIEW`

## Scope expansion reviewed

The user intentionally expanded the definition after A7/B7 to require an application-like interaction model. A7/B7 are superseded final-review targets. The new canonical pack includes `21-app-interaction-contract.md`, `22-interaction-flow-matrix.md`, E2E-21 and `CF-OPS-UX-001`.

## UX architecture — PASS

- persistent shell is binding;
- desktop master/detail and mobile focused-task behavior are explicit;
- overlay taxonomy distinguishes task sheet/drawer, confirmation dialog, quick dialog/popover and toast;
- native browser confirm/alert is forbidden product UX;
- one primary task surface is allowed; subordinate work remains inside it;
- focused-task back stack is deterministic: confirmation -> task -> workspace;
- dirty close/Back/module exit uses discard guard.

## Navigation / RBAC — PASS

Accepted source and target both use `/bookings` for Reception; the deep-link contract now preserves that route.

`/api/v1/auth/me` is the target application bootstrap and must add deterministic server-derived `capabilities[]` and `network_capabilities[]`. Desktop/mobile navigation and landing use the canonical module-capability map in `19`; no duplicate frontend authorization map is allowed.

Protected workspaces do not mount/fetch before capability bootstrap resolves. Unauthorized direct URL shows in-shell Forbidden while backend remains authoritative. A stale-access 403 refreshes bootstrap once and is never auto-replayed as a mutation.

## State/history/filter continuity — PASS

- meaningful filters/selection use URL/history semantics;
- ordinary refresh/mutation preserves filters;
- contextual Back restores prior workspace and scroll, with selected-item-in-view fallback after reflow;
- free-text search may replace history to avoid per-keystroke entries;
- category counts are stable base-scope counts, separate from visible text-filtered count;
- contextual navigation cannot use unconditional global scroll reset.

## Flow transitions — PASS

Reception has explicit task surfaces and transitions for reservation/edit, check-in, late arrival, cancellation, no-show, reassignment, extension, checkout and maintenance reporting.

Rooms, Guests and Housekeeping have explicit master/detail/focused-task, filter and contextual-navigation targets.

Billing embedded in Reception is controlled only by the Reception-selected booking. Payment, extra-charge and cash-close interactions have focused financial surfaces and remain governed by D11.

## Refresh / errors / conflict — PASS

First load uses skeletons; later refresh keeps known data visible. Mutations show local pending state. Validation is inline. Infrastructure and stale/concurrent conflicts are distinct. A stale mutation is never replayed automatically, and safe draft input is preserved where possible.

## Responsive / accessibility / motion — PASS

Mobile ~360–390, tablet ~768 and desktop ~1280 require executable task proof. Core mobile navigation is capability-aware/direct for authorized operations. Focus entry/return, modal containment, Escape/Back semantics and reduced motion are binding.

Motion is short and functional and cannot gate authoritative operations. Heavy animation/UI frameworks are explicitly disallowed as a workaround around the <=300000 raw-JS prerequisite.

## Domain/API/financial consistency — PASS

The UX contract does not alter booking/room/maintenance transitions, D9 pricing boundary, D10 time semantics or D11 ledger/invoice truth. UI previews are advisory and backend commands remain authoritative.

Additive auth/bootstrap fields and other contract additions must be reflected in OpenAPI/client types before browser acceptance.

## Current implementation gap audit — PASS

The definition explicitly requires later BUILD to replace:
- contextual global scroll reset;
- Reception inline create + long stacked lifecycle forms;
- native cancellation confirm;
- independent Reception Billing booking selector;
- Rooms/Guests inline creation;
- hamburger-only authorized core navigation;
- destructive whole-workspace loading on refresh;
- disposable filter/history state.

No runtime change is falsely claimed in this definition phase.

## Scope isolation — PASS

Comparison against accepted staging remains restricted to `docs/operational-flows/**` and `.orchestration/**`. No product runtime/schema/CI/deploy/staging/main change is authorized or included.

## Human gates

No product-policy Human Gate is open inside the reconciled definition. A fresh immutable Artifact A8 + metadata-only Boundary B8 must now be published and independently reviewed. Product implementation and implementation planning remain locked until that review passes.

Next action: publish A8/B8 and prepare the external independent critic packet.
