# TASK CONTRACT — CF-I01

TASK ID: `CF-I01`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `CONTEXTUAL SPECIALIST / BUILD`  
STATUS: `READY`

## OBJECTIVE

Build the Cloudflare platform foundation defined by the independently reviewed Migration Design Package, without implementing customer-facing parity features beyond the foundation surfaces required for safe subsequent increments.

## AUTHORITY AND DESIGN INPUTS

- Approved architecture: `CF-ARCH-001`.
- Approved tenant topology: `.orchestration/decisions/CF-DATA-001.md`, Option B.
- Independently reviewed design: `docs/migration-design-package.md`.
- Source parity reference: `docs/source-contract-inventory.md`.
- Independent Design Critic: `.orchestration/reviews/CF-DESIGN-REVIEW-001.md`.
- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.

## SCOPE

Implement and validate:

1. Separate static frontend Worker and API Worker foundation under the approved same-origin routing objective.
2. Cloudflare Workers + Hono + TypeScript API foundation with typed environment/binding configuration.
3. Cloudflare Access identity adapter boundary; no source password/Argon2 implementation.
4. HMS membership/role/capability resolution boundary with a fail-closed authorization seam. A client-supplied hotel identifier must never authorize or select an operational database by itself.
5. CONTROL_DB schema/binding boundary for identity mappings, hotels, memberships/roles and routing metadata only.
6. One representative local hotel operational D1 schema/binding boundary, with ordinary hotel operational data kept out of CONTROL_DB.
7. Authorized hotel routing boundary and explicit prohibition on cross-D1 atomic business operations.
8. Health/readiness surfaces and structured request/error foundation sufficient for later contract tests.
9. Local/CI test harness, type generation/config validation and documented Free-tier guardrails.

No reservation, room, guest, housekeeping, billing, report or other customer-facing feature implementation is included except minimal typed seams/fixtures needed to test the foundation boundaries.

## REQUIRED ACCEPTANCE

Each material requirement must be evidenced as `Requirement → Expected Surface → Acceptance → Evidence`.

| Requirement | Expected surface | Acceptance | Minimum evidence |
|---|---|---|---|
| Worker topology | API and static Worker configs/source | Both Workers have explicit configs, compatibility date and same-origin routing intent; no deployment is performed. | Config validation, type generation and focused tests. |
| Access boundary | API auth adapter | Trusted Access identity input is normalized; missing/invalid identity fails closed; native password/Argon2 path is absent. | Unit tests for valid/missing/malformed identity and error mapping. |
| Membership/capability authorization | API middleware/service seam | Role/capability is resolved from HMS-controlled membership data; frontend/client hotel input cannot bypass it. | Authorization tests including unauthorized hotel selection. |
| Option B data boundary | CONTROL_DB + representative HOTEL DB | Control schema is narrow; ordinary operational tables belong to hotel DB; routing resolves only after auth/membership. | Schema/config inspection and routing tests. |
| Tenant isolation | API routing/bindings | A request cannot select another hotel DB solely by client input; absent/invalid mapping fails closed. | Cross-hotel routing regression tests. |
| Atomicity boundary | Domain/repository seam | Critical operation boundary is one hotel DB; no cross-D1 transaction assumption appears in code/docs. | Static review and focused tests/documentation. |
| Health/readiness | `/health`, `/ready` or equivalent foundation handlers | Health is process-level; readiness reports required binding/config availability without leaking secrets. | Handler tests and local request evidence. |
| Observability/errors | API foundation | Request correlation and structured, typed errors are present at the foundation seam. | Unit/integration evidence with redacted output. |
| Free-tier guardrail | Config/docs/scripts | No paid service activation, paid plan, real credentials or production provisioning is introduced. | Diff/config scan and documented guardrail. |
| Reproducibility | Repository/tooling | Fresh checkout can install, typecheck, test and validate Worker configs locally. | Exact commands and outputs persisted in review evidence. |

## INVARIANTS

- Preserve physical per-hotel operational D1 separation.
- Never trust a client-supplied hotel identifier as authorization.
- Keep control-plane data narrow and operational business data in the hotel DB.
- Do not weaken backend-authoritative RBAC/capability enforcement.
- Do not introduce floating-point money, booking overlap logic, lifecycle shortcuts or product feature scope in this increment.
- Do not activate paid Cloudflare services or incur recurring cost.
- Do not access, migrate or mutate real hotel data.
- Do not deploy to Cloudflare.

## DECISION LATITUDE

The Specialist may choose file/module layout, package manager, test framework, local fixture shape, binding names and internal helpers, provided the acceptance and invariants remain true.

The Specialist may not change Cloudflare Access, Workers/Hono/TypeScript/D1, Option B, `/api/v1` compatibility objective, parity scope, Free-tier boundary, tenant isolation, or the requirement for an independent Critic.

## REQUIRED OUTPUTS

- Foundation source/config/test artifacts under the target repository.
- No production deployment or real-data artifact.
- `.orchestration/reviews/CF-I01-critic.md` with independent review, exact reviewed HEAD, commands/evidence, findings and verdict.
- Updated `.orchestration/STATE.md` with artifact refs, evidence, rework count, verdict and next action.

## CRITIC FOCUS

The Independent Critic must actively test for:

- untrusted hotel/database selection;
- control-plane leakage of ordinary hotel data;
- missing or hand-written binding types/config drift;
- secrets or paid resource IDs committed to the repo;
- floating promises, global request state and unsafe error handling;
- auth adapter fail-open behavior;
- cross-D1 atomicity assumptions;
- absence of reproducible local/CI evidence;
- accidental customer-facing feature implementation.

## REWORK AND INTEGRATION

- A Specialist cannot approve its own implementation.
- Default autonomous rework budget is two cycles under this contract.
- Any substantive rework must be reviewed by a fresh logically independent Critic.
- Integration occurs only after Critic `PASS`; no Human confirmation is needed for routine integration.
- Human Product Acceptance and production readiness remain future states and are not self-declared here.

## DONE WHEN

- Foundation acceptance surfaces and tests are present.
- No forbidden deployment, paid activation, real-data access or product feature expansion occurred.
- Exact artifact HEAD is persisted before Critic review.
- Independent Critic returns `PASS`, or bounded rework completes with a fresh Critic `PASS`.
- State records the next authorized increment or legitimate gate.

## STOP CONDITIONS

Stop only for a legitimate Human Gate, inevitable Human Action/Input, or material technical blocker after diagnosis/retry/fallback. Do not ask routine “continue?” questions.

