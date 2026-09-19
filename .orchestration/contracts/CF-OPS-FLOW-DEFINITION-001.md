# TASK CONTRACT — CF-OPS-FLOW-DEFINITION-001

TASK ID: `CF-OPS-FLOW-DEFINITION-001`
PROJECT: HMS Cloudflare
PHASE: `OPERATIONAL FLOW DEFINITION`
STATUS: `IN_ANALYSIS / IMPLEMENTATION LOCKED`
BASELINE: `acceptance/staging@721eee83280ebee727e18ecb8ec60cd91d81b2b9`
SOURCE REFERENCE: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Objective

Define and persist the complete end-to-end operational **and interaction** contract that governs the next HMS implementation waves. The target must be operationally correct and feel like one application rather than a collection of CRUD pages.

This contract authorizes analysis, source comparison, UX/domain decisions, evidence and orchestration only. Product implementation and implementation planning remain locked until the immutable definition passes independent review.

## Canonical authority

The active contract is defined by:
- `docs/operational-flows/00-master-definition.md`;
- `16-target-transition-matrix.md`;
- `18-end-to-end-scope-matrix.md` — E2E-00 through E2E-21;
- `19-api-command-contract-map.md`;
- `20-intentional-target-departures.md` — closed departure set D1-D12;
- `21-app-interaction-contract.md`;
- `22-interaction-flow-matrix.md`;
- `05-maintenance-data-rbac.md`;
- `.orchestration/OPERATIONAL-INVARIANTS.md`;
- binding decisions under `.orchestration/decisions/**`.

If summaries conflict, the most specific binding canonical document controls. BUILD may not invent an alternate semantic.

## Baseline reconciliation

The prior immutable A10 review target used `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`.
Accepted staging later advanced by exactly one product commit to `721eee83280ebee727e18ecb8ec60cd91d81b2b9`, modifying only Reception queue presentation in:
- `apps/web/src/features/reception/ReceptionPage.tsx`;
- `apps/web/src/features/reception/reception-queue.css`.

That delta is explicitly reconciled by `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE-RECONCILIATION-V11.md`.
It changes scan density/hierarchy only and does not alter lifecycle, API ownership, queue classification/priority, search semantics, Billing ownership, RBAC, persistence or the target obligations in 21/22.

## Domain scope

Must close end-to-end:
- booking lifecycle, check-in, checkout, cancellation, no-show and late-arrival context;
- in-stay room reassignment with remaining-night history;
- checked-in stay extension;
- room readiness/sellability/turnover;
- occupied and vacant maintenance `NON_BLOCKING | BLOCKING`;
- housekeeping handoff and maintenance routing;
- guest + reservation composition;
- Reception/Rooms/Guests/Housekeeping contextual navigation;
- authoritative front-desk/read-model behavior;
- Billing, pricing D9 and reconciliation D11 including immutable payment-ledger correlation;
- hotel-local operational time and D10 instant semantics;
- RBAC, concurrency, audit and tenant-safe behavior.

## Application interaction scope

Must also close:
- persistent application shell;
- capability-derived desktop/mobile navigation, landing and Forbidden behavior using server bootstrap capabilities;
- desktop master/detail and mobile focused-task behavior;
- drawer/full-screen-sheet, product dialog, quick dialog/popover and toast taxonomy;
- deterministic focused-task Back stack and dirty-work discard guard;
- filters/search/selection/history/scroll continuity;
- selected Reception booking as the only embedded Billing context;
- skeleton vs refresh behavior, local mutation pending state and stale-conflict recovery;
- focused transitions for reservation/edit, check-in, late arrival, cancel/no-show, reassignment, extension, checkout, maintenance, payments, extra charges and cash close;
- Rooms/Guests/Housekeeping focused detail/filter behavior;
- focus/keyboard/accessibility and reduced-motion semantics;
- responsive task execution at mobile/tablet/desktop;
- no heavy animation/UI dependency that bypasses the raw-JS prerequisite.

Interaction modernization is source-departure D12 and may not weaken domain semantics, RBAC, required source capability coverage or command ownership.

## Delivery prerequisites / sequencing

Wave 0: JS headroom <=300000, hotel timezone/instant foundation, D9/D11 Billing foundation.
Wave 1: domain correctness.
Wave 2: interaction foundation + operational workspaces under 21/22.
Wave 3: optimization + full synthetic shift/browser acceptance.

Detailed order is owned by `04a-sequencing-refinement.md`.

## Implementation lock

Forbidden in this contract phase:
- runtime/product code change;
- schema/migration implementation;
- CI budget change;
- deployment/staging/main mutation;
- feature implementation;
- implementation Task Contract execution.

Only definition/evidence/orchestration files may change.

## Exit criteria

Before implementation planning:
1. D1-D12 are closed and every source divergence is registered.
2. E2E-00..21 are implementation-ready with explicit success/negative/concurrency/RBAC/UI consequences.
3. 21/22 define task surfaces, filters/history, navigation, overlays, feedback, focus and responsive behavior without implementation agents choosing product semantics.
4. Canonical documents are contradiction-free.
5. Definition invariant evidence is PASS/N/A truthfully.
6. Pre-Critic passes.
7. Immutable Artifact A + one-commit metadata Boundary B are published.
8. Controller adversarial review has no blocker.
9. A genuinely independent definition critic returns `PASS FOR IMPLEMENTATION PLANNING`.

Until item 9, implementation planning and product BUILD remain locked.
