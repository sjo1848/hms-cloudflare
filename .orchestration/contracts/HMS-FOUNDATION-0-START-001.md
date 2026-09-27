# Task Contract — HMS Foundation 0 implementation

Task ID: `HMS-FOUNDATION-0-START-001`  
Authorization: Drive `18JGIQxyl8Bh6_w7H3eW1qdPL7jfUsdSLk43aE-G-90A` (RG1–RG7 approved)  
Roadmap: Artifact A2 `b2581e4c370eeb6f74e9380af010e48386642b4f`; Boundary B2 `c6a4bcb9a2939505f7ddf8e72c02ec9b825f00f3`  
Branch/base: `impl/hms-foundation-0`, based exactly on B2.  
Status: active sequencing contract; no implementation authorization beyond Foundation 0.

## Objective and scope

Implement only the approved F0.1–F0.12 contracts in `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md`, in the approved DAG. Each material F0 increment gets its own contract before its changes, invariant mapping, and evidence record. Synthetic/local tests and migration rehearsals only. F0.12 aggregates; stop at `FOUNDATION_0_COMPLETE_AWAITING_CONTROLLER_REVIEW`.

Binding design sources: frozen Blueprint 001 (Drive `1fKFR1vtxrb97p6D8ouzbCbBfBeQDarXQIZcdtOTIg1s`), Reconciliation 007 (`1IY6rpPbtFscOtQ9l1z-xzinx5QlI64nkmpkujDJthus`), Final Disposition 008 (`1jbE5KNL3ebdjSMPRBcPNqcsprc3fHjYihjy0qsAtAnI`), Roadmap A2/B2, implementation authorization above. Do not reinterpret product semantics from current implementation.

## Approved dependency order

Critical chain: F0.1 → F0.2 → F0.3 → F0.4 → F0.5 → F0.6 → F0.7 → F0.12. After F0.2, F0.8 and F0.9 may proceed when their surfaces/dependencies permit; F0.10 then F0.11; all join F0.12. Parallelism is permitted only with explicit non-overlapping ownership; one writer per overlapping schema/API surface. No Blocks A–H.

## Cross-cutting acceptance

- Preserve separate room Occupancy, Housekeeping, Maintenance Impact, Service State; derive Readiness and date-range Sellability. Unknown/contradictory records fail closed and are never inferred READY.
- Preserve tenant routing, backend capability authority, integer cents, D11 ledger truth, exact-winner event semantics, actor/hotel/request provenance and hotel-local date semantics.
- Use additive forward migrations only. Do not edit historical migrations. Maintain bounded compatibility while consumers transition.
- Reassignment interval is `max(check_in, hotel_local_date)` through `check_out`, remaining nights only; preserve elapsed history/economics and existing extra charges; do not mutate payment ledger.
- Real customer data, real cutover and real active-stay pricing bootstrap are forbidden. No PR, merge, main, staging, deploy or production.
- Stop and document a ROADMAP_BLOCKER / product-policy conflict instead of inventing semantics.

## Verification and boundaries

Every F0 requires contract-linked executable evidence, fresh targeted tests, migration/D1 assertions where relevant, stale/concurrency/ABA and event checks where relevant, tenant/auth checks where relevant, and explicit truthful evidence claims. Green CI alone is insufficient. F0.3 and F0.6 rehearsals use synthetic data and include unresolved/quarantine cases. F0.12 is not self-approved: complete invariant evidence and Pre-Critic, freeze Artifact A, create orchestration-only Boundary B, then request a genuinely independent Critic. Do not begin Block A.

## Invariant applicability map for the program

Each child F0 contract must enumerate every registry invariant `INV-*` as APPLIES/N/A and map each applicable one to acceptance/evidence. The following cross-cutting invariants normally apply when their stated conditions occur: INV-ATOMIC-001, INV-AUDIT-001, INV-DOMAIN-001, INV-TENANT-001, INV-RBAC-001, INV-PARITY-001, INV-ENUM-001, INV-EVID-001, INV-LEGACY-001, INV-MONEY-001, INV-STATE-001. UX/order/responsive invariants apply only to F0 work with a user-visible queue or responsive journey. CF-I07/08 invariants apply only if those protected domains are touched. No child contract may omit or silently waive registry entries.

## Recovery / stop

Use forward-compatible repair; never destructive rollback on shared data. Synthetic fixtures are disposable. A failed technical check is repaired autonomously. Stop only at the authorized aggregate artifact/critic boundary or when an explicit stop condition in the authorization/contract is met. Implementation authorization remains limited to F0.1–F0.12; real-data authority remains false.
