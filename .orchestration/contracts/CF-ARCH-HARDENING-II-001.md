# CF-ARCH-HARDENING-II-001 — Architecture + Cloudflare Efficiency Hardening II

Status: ACTIVE
Base/deployed checkpoint: `c64180acbf3d683245f6d42aec0f9ed7c60998a6`
Working branch: `hardening/architecture-cloudflare-ii`

## Objective

Reduce known architectural debt and Cloudflare/D1 operational waste without changing accepted hotel behavior, tenant isolation, auth semantics, or deployment security.

The deployed staging checkpoint remains frozen while this work proceeds on an isolated branch. Production is not authorized.

## Architectural target

### Frontend
- Feature-first modular architecture with vertical slices.
- Persistent App Shell.
- Standard client routing via React Router unless exact evidence shows a material regression versus the current minimal router.
- TanStack Query for server-state caching, request deduplication, invalidation and background refresh where it replaces duplicated manual fetch/loading/error state.
- Feature-specific components/hooks/API/model boundaries; page modules should orchestrate, not own every workflow detail.
- Mobile-first behavior and direct-route/reload parity remain mandatory.

### Backend
- Modular monolith with vertical slices.
- Selective Hexagonal Architecture for business-critical modules: bookings/inventory/lifecycle/billing first, then housekeeping/admin where value is demonstrated.
- Hono is an inbound HTTP adapter, not the owner of domain rules.
- D1 is an outbound persistence adapter; business/application logic should not depend directly on D1 APIs when the boundary provides material testability/change-isolation value.
- Avoid ceremonial layers for simple read-only endpoints.

### Cloudflare/D1 efficiency
- Preserve Web Worker -> Service Binding -> private API Worker topology.
- Preserve physical tenant isolation by operational D1 database.
- Prefer Static Assets for frontend delivery; do not move static traffic into unnecessary Worker compute.
- Measure critical D1 query plans before adding indexes.
- Avoid speculative indexes: each new index must correspond to a demonstrated query plan/read-efficiency improvement and account for write amplification.
- Detect N+1/cross-tenant fan-out patterns before scale turns them into operational cost.
- Track Worker/API bundle and frontend asset baseline; dependencies require a demonstrated architectural or product benefit.

## Work stages

1. Baseline + Architecture/Cloudflare Audit.
2. Frontend Architecture II.
3. Backend Modular/Hexagonal II.
4. D1 Performance & Indexing.
5. Architecture Fitness II executable checks.
6. Integral Regression + exact-artifact Pre-Critic + Independent Critic.
7. Controlled integration and a new staging candidate only after PASS.

## Non-goals

- No product feature expansion.
- No production/cutover.
- No weakening Cloudflare Access, Service Binding isolation, RBAC, tenant isolation, D1 invariants or fail-closed behavior.
- No rewrite for architectural aesthetics.
- No generic Clean Architecture/DDD framework applied everywhere.
- No migration from Cloudflare merely to avoid future paid-plan growth.

## Baseline invariants

- Existing Product Flow contract remains authoritative for behavior.
- Current staging candidate `c64180ac...` remains independently testable while hardening proceeds.
- Internal navigation must not reload the document.
- Core workflows remain usable at 375 / 390 / 430 / 1366 widths.
- Direct route + reload remains supported by Cloudflare SPA fallback.
- Operational tenant data stays physically separated by D1 binding.
- Technical PASS never implies Product Acceptance or production authorization.

## Evidence required

- Baseline debt map and prioritized risk register.
- Exact query-plan evidence for every D1 index change.
- Bundle/asset measurements before and after dependency changes.
- Dependency-direction checks for new backend/application boundaries.
- Existing Foundation, UX/mobile and integral Product Flow gates remain green.
- Exact-artifact Pre-Critic evidence and Independent Critic PASS before integration.

## Stop conditions

Routine REWORK is autonomous. Stop only for a real Human Action/Input, material external blocker, production decision, paid-resource activation, or final Product Acceptance decision.
