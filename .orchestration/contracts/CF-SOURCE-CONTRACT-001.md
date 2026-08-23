# TASK CONTRACT — CF-SOURCE-CONTRACT-001

TASK ID: `CF-SOURCE-CONTRACT-001`
PROJECT: HMS Cloudflare
GLOBAL PROJECT MODE: `DELIVERY`
PHASE: `DESIGN`
STATUS: `READY`

## OBJECTIVE

Create a durable, evidence-backed inventory of the accepted source HMS contract and representative product journeys from the pinned baseline so later Cloudflare increments can prove parity without relying on memory or chat history.

## CANONICAL INPUTS

- Source repo: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Source README/product surfaces.
- `backend/src/infrastructure/web/routes/mod.rs`
- `backend/openapi.yaml`
- relevant domain/application services and migrations needed to resolve semantics.
- frontend route tree and API client/auth bootstrap.
- existing browser/QA/security evidence that defines accepted observable behavior.
- `AGENTS.md`
- `.orchestration/STATE.md`

## CONTEXT / CURRENT STATE

`CF-DATA-001` is pending and blocks final D1 tenancy/schema design plus `CF-I01` BUILD. This task is intentionally independent: it documents what must be preserved, not how D1 tenancy will be implemented.

## REQUIREMENTS

1. Inventory every currently routed `/api/v1` endpoint by method/path, capability/RBAC requirement, high-level purpose, and primary product surface.
2. Explicitly mark native auth endpoints (`login`, `refresh`, `logout`) as compatibility exceptions under `CF-ARCH-001`; preserve `/auth/me` as application bootstrap contract.
3. Identify the source product surfaces/routes: reception/bookings, rooms, calendar, guests, housekeeping, users, reports, dashboard/network and relevant error/auth surfaces.
4. Define representative end-to-end acceptance journeys sufficient to detect migration regressions, including at minimum:
   - reservation creation;
   - walk-in/check-in;
   - room reassignment;
   - checkout → housekeeping handoff;
   - room hold/availability;
   - housekeeping transitions;
   - extra charge/payment/settlement/cash closure;
   - role/capability denial;
   - cross-tenant access attempt;
   - network-level authorized view;
   - desktop and accepted mobile reception widths.
5. For each representative journey map `Requirement → Expected Surface → Acceptance → Evidence`.
6. Identify source invariants that are not obvious from route names, especially lifecycle, booking overlap, money, tenant FKs/RLS and audit semantics.
7. Identify PostgreSQL-specific guarantees that require explicit target translation, but do not choose a tenant topology blocked by `CF-DATA-001`.
8. Produce a parity matrix that later increments can reference without reopening the whole source repo.
9. Record unknowns where source evidence is genuinely insufficient; do not invent semantics.

## EXPECTED SURFACES

- Repository design artifact: `docs/source-contract-inventory.md`.
- Orchestration evidence: `.orchestration/reviews/CF-SOURCE-CONTRACT-001-critic.md`.
- Updated `.orchestration/STATE.md` with artifact ref, Critic verdict, rework count and next action.

No product UI/API/DB mutation is part of this task.

## CONSTRAINTS / NON-GOALS

- Do not modify the source HMS repo.
- Do not implement Cloudflare product/runtime code.
- Do not resolve `CF-DATA-001` by assumption.
- Do not add features or redesign product journeys.
- Do not treat route inventory alone as product parity; include observable journeys and invariants.
- Do not copy PostgreSQL migrations literally into the target.
- Do not expose secrets, real guest data or credentials.

## DECISION LATITUDE / IMPLEMENTATION-OWNED DECISIONS

The Specialist may decide:
- document organization;
- grouping/order of endpoints;
- exact parity-matrix columns;
- which additional source files to inspect;
- which source tests/evidence are representative.

The Specialist may not decide:
- tenant topology A/B/C;
- new product requirements;
- changing the approved Cloudflare stack;
- weakening security/integrity invariants;
- deleting source capabilities from migration scope.

## ALLOWED ACTIONS

- Read/search the pinned source repository.
- Read current target bootstrap files.
- Create/update only the required design/evidence/state artifacts on the active target branch.
- Run non-mutating analysis tooling if useful.

## FORBIDDEN ACTIONS

- Product code implementation.
- Deployment/provisioning.
- Production/real-data access.
- Mutation of source repo.
- Merge to `main` without the normal review/integration path.

## REQUIRED OUTPUT

`docs/source-contract-inventory.md` containing:
- source baseline identity;
- source product surface map;
- complete routed API inventory;
- auth adaptation boundary;
- critical invariant map;
- representative acceptance journeys;
- parity/traceability matrix;
- PostgreSQL-specific translation obligations;
- explicit unknowns/open evidence gaps.

## EVIDENCE REQUIRED

- immutable source baseline SHA;
- source file paths/refs supporting endpoint/surface/invariant claims;
- completeness check against source router and OpenAPI;
- consistency check against frontend routes/API usage;
- evidence references for representative existing tests/journeys where available;
- artifact commit SHA before Critic review.

## TRACEABILITY

For every representative material capability:

`Requirement → Expected Surface → Acceptance → Evidence`

Examples must include UI evidence when the product requirement is UI-observable and DB/security evidence when the invariant is persistence/security-level.

## DONE WHEN / EXIT CRITERIA

- all currently routed `/api/v1` endpoints are accounted for or a discrepancy is explicitly identified;
- source product surfaces are mapped;
- critical invariants are explicit;
- representative end-to-end journeys are defined with acceptance/evidence expectations;
- auth compatibility exception is explicit;
- no unresolved `CF-DATA-001` choice has been smuggled into the artifact;
- artifact is committed with immutable ref;
- an Independent Critic reviews contract + artifact + canonical evidence;
- verdict is PASS, or bounded REWORK completes and a fresh independent review returns PASS.

## CRITIC FOCUS

The Independent Critic must actively search for:
- missing routed endpoints;
- API-only evidence substituted for UI contract;
- lifecycle semantics flattened into CRUD;
- tenant/financial/overlap guarantees omitted;
- hidden assumption of a D1 tenant topology;
- stale source SHA/path references;
- false completeness caused by relying only on README/OpenAPI without source/router/frontend cross-check.

Critic verdicts: `PASS | REWORK | HUMAN_GATE | CONTRACT_DEFECT`.

## HUMAN GATE TRIGGERS

Only if this inventory uncovers a material contradiction in accepted source behavior or a previously unknown strategic/security trade-off that cannot be resolved from canonical evidence. Normal missing documentation is not automatically a Human Gate.

## STOP CONDITION

`PASS_CF_SOURCE_CONTRACT_001` or a legitimate Human Gate/material blocker.

## HANDOFF DESTINATION

Independent Critic → updated Orchestration State → next independent DESIGN task or `WAITING_HUMAN_GATE: CF-DATA-001`.
