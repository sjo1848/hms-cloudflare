# CF-WEB-STACK-002 — Frontend routing and server-state decision

## Status
Accepted for Architecture Hardening II.

## Context
The first architecture hardening removed full-document navigation and reduced `App.tsx` to composition. The current application has a small, fixed set of top-level routes, no nested dynamic route tree, and no requirement for route loaders/actions.

Measured repository evidence at the hardening baseline:
- `apps/web/src/app/router.tsx`: 2,349 bytes source.
- Router runtime dependencies added by HMS: zero.
- Web JavaScript baseline: about 254 KB raw / 75 KB gzip.
- Existing browser architecture regression verifies History API navigation, Back/Forward and no document reload.
- Cloudflare Static Assets already provides SPA direct-route fallback.

Reception and Housekeeping had the more material frontend debt: feature pages mixed transport calls, asynchronous orchestration, domain-derived view state, and rendering. Architecture Hardening II separates those responsibilities into feature-local API adapters, state/command hooks, model functions, and view components.

Current standard-library options were explicitly reviewed rather than forgotten. React Router and TanStack Query are mature choices, but adding either changes the dependency/runtime surface. For the current product shape, their advanced routing/cache capabilities are not yet exercised by a demonstrated requirement, while the existing router is a bounded 2.3 KB source surface with direct behavior evidence.

## Decision
1. Retain the minimal tested router for this increment instead of adding React Router solely for framework conformity.
2. Do not add TanStack Query while the product lacks cross-feature cache/revalidation requirements that justify its runtime/dependency cost.
3. Keep server-state transport behind feature-local API adapters and orchestration hooks so a future query library can replace the orchestration boundary without rewriting view components.
4. Revisit React Router when nested/dynamic routing, route-level data APIs, route guards, or URL composition exceed the current router's intentionally small contract.
5. Revisit TanStack Query when at least two of these are demonstrated: cross-feature cache reuse, background refetch, mutation invalidation fan-out, offline/retry policy, request deduplication under observed duplicate traffic.
6. Architecture Fitness and the web bundle budget make this decision reversible and observable rather than permanent by inertia.

## Why this is not deferred accidental debt
The retained custom surface is deliberately small, tested, measured and bounded. Adding dependencies without a demonstrated requirement would increase dependency maintenance and browser bundle surface without removing a current product or maintenance defect. The adoption triggers above turn the choice into an explicit architecture decision rather than an untracked TODO.

The actual frontend debt found by inspection was instead transport/orchestration embedded inside large feature pages; that debt is removed in this increment.

## Invariants
- Internal navigation must never cause a full document reload.
- Direct route + reload must continue to work through Cloudflare SPA fallback.
- Feature views may not call the shared HTTP client directly once a feature adapter exists.
- Feature-local server-state orchestration must remain replaceable without changing domain view components.
- Any future router/query-library adoption must pass the same mobile/Product Flow gates and Cloudflare bundle budget.
