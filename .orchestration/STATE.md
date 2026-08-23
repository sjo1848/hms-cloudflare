# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `DESIGN`  
Phase Status: `ACTIVE — INDEPENDENT DESIGN REVIEW NEXT`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Durable governance documents:
  - `HMS-CLOUDFLARE — Project State & Orchestration`
  - `HMS-CLOUDFLARE — Migration Design Package v0.1`
  - `HMS-CLOUDFLARE — Codex Runtime Bootstrap`
  - `REFERENCE — PROJECT-METHOD-TRANSFER-PACK-v0.1`
- Runtime decision record: `.orchestration/decisions/CF-DATA-001.md`
- Source parity artifact: `docs/source-contract-inventory.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED

- Authentication boundary: Cloudflare Access.
- Frontend: React + Vite.
- API: Cloudflare Workers + Hono + TypeScript.
- Persistence target: Cloudflare D1.
- Deployment topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
- Compatibility objective: preserve same-origin `/api/v1` behavior where practical.
- Source HMS remains untouched.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B

Decision date: `2026-08-23`  
Decision record: `.orchestration/decisions/CF-DATA-001.md`

Selected topology:
- one control-plane D1 for Access identity mappings, hotels, memberships/roles and routing metadata;
- one operational D1 per hotel for hotel-scoped operational data.

Reason: preserve a strong database-level tenant boundary rather than silently weakening the source HMS tenant-isolation posture because D1 lacks PostgreSQL RLS.

Cost guard:
- target remains `$0/month / Cloudflare Free`;
- no paid Cloudflare plan, paid D1 transition or other material recurring-cost increase may be activated without a separate Human Gate;
- Free-tier capacity is an explicit growth boundary.

Operational constraint:
- critical atomic workflows must remain inside the relevant hotel operational D1; do not rely on cross-database atomic transactions between control-plane and hotel databases.

## SUPERSEDED / NON-CANONICAL

- Native HMS username/password + Argon2-on-Workers is not the selected authentication path.
- Local foundation commit `53e2a69a350d22754532c8f53a709280f1fdd1f8` remains `PROVISIONAL ONLY`: candidate evidence, not accepted implementation and not a BUILD PASS.
- CF-DATA-001 options A and C are not active decisions.

## VALIDATED RESULTS

### Bootstrap

- `CF-BOOTSTRAP-REVIEW-001`: `REWORK → repaired → fresh independent PASS`.
- Bootstrap PR #1 integrated.
- Rework cycles used: `1`.
- Review evidence: `.orchestration/reviews/CF-BOOTSTRAP-REVIEW-001.md`.

### Source contract inventory

- `CF-SOURCE-CONTRACT-001`: `PASS`.
- Artifact: `docs/source-contract-inventory.md`.
- Router/OpenAPI/artifact operations: `51 / 51 / 51`.
- No method/path discrepancy found.
- Critic evidence: `.orchestration/reviews/CF-SOURCE-CONTRACT-001-critic.md`.
- Rework cycles used: `0`.

### Source baseline

- Pinned source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Source repository remains read-only for this migration.

## CRITICAL INVARIANTS

- Tenant isolation.
- Tenant-scoped relational integrity.
- Room-night overlap prevention.
- Domain lifecycle semantics for check-in, checkout, room reassignment and housekeeping.
- Integer-cent financial semantics and business-operation atomicity.
- Backend-authoritative RBAC/capability enforcement.
- `/api/v1` compatibility except the intentionally replaced native login/refresh mechanism.
- Audit/request traceability.
- No real hotel-data migration or production cutover during parity BUILD.
- Product acceptance and production readiness remain separate states from technical PASS.

## ACTIVE / PLANNED TASKS

### CF-DESIGN-REVIEW-001

Status: `READY`

Objective: independently review the integrated Migration Design Package after CF-DATA-001 Option B, including tenant topology, auth adaptation, D1 semantic translation, room-night overlap design, implementation increments, Decision Latitude, acceptance surfaces and Free-tier cost boundary.

Required outcome: `PASS`, `REWORK`, `CONTRACT_DEFECT`, or legitimate `HUMAN_GATE`.

The Critic must not rely on the Design Package author's reasoning context and must explicitly test for silent security/cost degradation and internal contradictions.

### CF-FOUNDATION-RECONCILE-001

Status: `PLANNED / BLOCKED_BY_DESIGN_EXIT`

Objective: inspect the provisional foundation against the accepted Design Package and method; retain, rework or discard each part by evidence.

### CF-I01

Status: `PLANNED / BLOCKED_BY_DESIGN_EXIT`

Objective: platform foundation BUILD under a formal Task Contract after DESIGN independently passes.

## PENDING HUMAN GATES

None.

A new Human Gate is required only for a material strategy/scope/security/cost/irreversibility trade-off. In particular, any paid Cloudflare transition requires its own Human Gate.

## PENDING HUMAN ACTIONS / INPUTS

None.

## BLOCKERS

No Human Gate currently blocks DESIGN.

`CF-I01` BUILD remains blocked until:
1. CF-DATA-001 Option B is integrated into the complete Design Package;
2. `CF-DESIGN-REVIEW-001` returns independent PASS after any bounded REWORK;
3. DESIGN exit criteria close.

## NEXT AUTHORIZED ACTION

Codex, as Runtime Orchestrator:
1. read this state and `.orchestration/decisions/CF-DATA-001.md`;
2. reconcile any remaining stale gate/bootstrap wording in repository governance artifacts;
3. instantiate/run `CF-DESIGN-REVIEW-001` as an Independent Critic against the integrated Design Package and canonical evidence;
4. on `REWORK`, repair autonomously inside approved DESIGN scope and use a fresh independent Critic;
5. on `PASS`, close DESIGN, create/activate the `CF-I01` Task Contract and continue automatically.

Do not ask for routine human confirmation after PASS.

## STOP CONDITION

Stop only for:
- a legitimate new Human Gate;
- a material blocker that cannot be recovered within method rules;
- a required Human Action/Input that cannot be executed by the runtime.

Do not begin product BUILD before independent DESIGN PASS.

## ORCHESTRATION RULES

- Human = Product/Risk Authority.
- Codex = Runtime Orchestrator / repository execution.
- ChatGPT = External Project Controller / Method Custodian / audit and Human Gate interface.
- Every substantive task requires a Task Contract.
- Every substantive output requires independent Critic review.
- Routine REWORK is autonomous.
- Retry exhaustion triggers diagnosis, not automatic escalation.
- Separate independent branches require separate Critics and later Integration Review.
- Persist artifact identity/ref and evidence before Critic review.
- Before repo mutation verify repository/worktree boundary.
- Do not merge or declare global PASS from local/subtask PASS alone.
- Do not use the human as a routine message bus.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.

## METHOD METRICS

- `human_coordination_messages`: target `0` during routine execution.
- `corrective_interventions`: `1` historical — premature foundation construction before full method bootstrap.
- `unnecessary_prompts`: target `0`.
- `false_pass`: `0 accepted`.
- `source_of_truth_divergence`: provisional foundation remains non-canonical until reconciled.
