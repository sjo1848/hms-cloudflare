# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`
Phase Status: `CF-I02 ACTIVE`

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
- Portable integrated Design Package: `docs/migration-design-package.md`
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

Status: `PASS`
Contract: `.orchestration/contracts/CF-DESIGN-REVIEW-001.md`
Review artifact: `.orchestration/reviews/CF-DESIGN-REVIEW-001.md`
Design artifact: `docs/migration-design-package.md`
Reviewed HEAD: `84cc541ae9b5ac8ceccf18ad38885b1b4b3b4617`
Critic verdict: `PASS`; rework cycles: `0`.

Objective: independently review the integrated Migration Design Package after CF-DATA-001 Option B, including tenant topology, auth adaptation, D1 semantic translation, room-night overlap design, implementation increments, Decision Latitude, acceptance surfaces and Free-tier cost boundary.

Required outcome: `PASS`, `REWORK`, `CONTRACT_DEFECT`, `TECHNICAL_BLOCKED`, or legitimate `HUMAN_GATE`.

The Critic must not rely on the Design Package author's reasoning context and must explicitly test for silent security/cost degradation and internal contradictions.

### CF-FOUNDATION-RECONCILE-001

Status: `PLANNED / BLOCKED_BY_DESIGN_EXIT`

Objective: inspect the provisional foundation against the accepted Design Package and method; retain, rework or discard each part by evidence.

### CF-I01

Status: `PASS`
Contract: `.orchestration/contracts/CF-I01.md`
Artifact commit: `faeff038d041f6bbbeab8af3dac7f55e26937316`
Artifacts: `apps/api/**`, `apps/web/**`, `docs/cf-i01-foundation.md`, `.github/workflows/ci.yml`, package/tooling configs.
Evidence before Critic: `npm test` 7/7 passed; `npm run typecheck` passed; `npm run types:check` passed; `npm run wrangler:dry-run` passed for API and web; local CONTROL_DB and HOTEL_DEMO_DB migrations applied successfully; no remote deploy or paid resource mutation.
Access hardening: `Cf-Access-Jwt-Assertion` is validated with Access JWKS, issuer and audience; malformed/missing assertions fail closed; local auth is explicit opt-in and disabled in checked-in vars.
Critic verdict: first `REWORK` at artifact commit `faeff038d041f6bbbeab8af3dac7f55e26937316`; fresh `PASS` at repaired artifact commit `27515d85d9db0677c4946746fa86374252bff4f5`.
Critic evidence: `.orchestration/reviews/CF-I01-critic.md`.
Findings: arbitrary credentialed CORS reflection; missing operational binding resolution; local auth not constrained to development environment.
Rework cycle: `1` of `2`.

Objective: platform foundation BUILD under a formal Task Contract after DESIGN independently passes.

## PENDING HUMAN GATES

None.

A new Human Gate is required only for a material strategy/scope/security/cost/irreversibility trade-off. In particular, any paid Cloudflare transition requires its own Human Gate.

## PENDING HUMAN ACTIONS / INPUTS

None.

## BLOCKERS

No Human Gate currently blocks DESIGN.

`CF-I01` foundation passed its independent Critic and is ready for routine integration/publish.

### CF-I02

Status: `PASS`
Contract: `.orchestration/contracts/CF-I02.md`
Objective: rooms, guests and room holds parity increment under the approved Option B foundation.

Artifact commits: `8551fc01352b8162ad1bf5d90dc2255784396808`, followed by bounded UI rework `bb3a136526c900522394f223206600f543e99e23`.
Artifacts: `apps/api/**`, `apps/web/**`, `docs/cf-i02-inventory.md`, `.github/workflows/ci.yml`.
Critic verdict: first artifact required bounded UI-surface rework; fresh `PASS` at `bb3a136526c900522394f223206600f543e99e23`.
Critic evidence: `.orchestration/reviews/CF-I02-critic.md`.
Evidence: typecheck PASS; 13 tests PASS; web build PASS; generated-type check PASS; API/web Wrangler dry-run PASS; diff check PASS. No remote deployment or paid resource mutation.
Rework cycles: `1`.

## NEXT AUTHORIZED ACTION

CF-I02 passed its independent Critic. Continue with the next READY task after synchronizing/publishing the repository state; do not deploy or activate paid services.

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
