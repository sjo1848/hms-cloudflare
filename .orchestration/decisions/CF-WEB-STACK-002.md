# CF-WEB-STACK-002 — Frontend routing and server-state decision

## Status
Accepted for Architecture Hardening II.

## Context
The first architecture hardening removed full-document navigation and reduced `App.tsx` to composition. The current application has a small, fixed set of top-level routes, no nested dynamic route tree, and no requirement for route loaders/actions. The existing router is ~2 KB source, uses the History API, supports Back/Forward, direct-route reload through Cloudflare SPA fallback, and has browser regression coverage.

Reception and Housekeeping had the more material frontend debt: feature pages mixed transport calls, asynchronous orchestration, domain-derived view state, and rendering. Architecture Hardening II separates those responsibilities into feature-local API adapters, state/command hooks, model functions, and view components.

## Decision
1. Retain the minimal tested router for this increment instead of adding React Router solely for framework conformity.
2. Do not add TanStack Query while the product lacks cross-feature cache/revalidation requirements that justify its runtime/dependency cost.
3. Keep server-state transport behind feature-local API adapters and orchestration hooks so a future query library can replace the orchestration boundary without rewriting view components.
4. Revisit React Router when nested/dynamic routing, route-level data APIs, route guards, or URL composition exceed the current router's intentionally small contract.
5. Revisit TanStack Query when at least two of these are demonstrated: cross-feature cache reuse, background refetch, mutation invalidation fan-out, offline/retry policy, request deduplication under observed duplicate traffic.

## Why this is not deferred accidental debt
The retained custom surface is deliberately small, tested, and bounded. Adding dependencies without a demonstrated requirement would increase bundle/dependency maintenance and Cloudflare-facing artifact size without removing a current product or maintenance defect. The adoption triggers above turn the choice into an explicit architecture decision rather than an untracked TODO.

## Invariants
- Internal navigation must never cause a full document reload.
- Direct route + reload must continue to work through Cloudflare SPA fallback.
- Feature views may not call the shared HTTP client directly once a feature adapter exists.
- Feature-local server-state orchestration must remain replaceable without changing domain view components.
