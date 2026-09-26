# TASK CONTRACT — UX-OPERATIONAL-WORKFLOW-ROADMAP-001

TASK ID: `UX-OPERATIONAL-WORKFLOW-ROADMAP-001`
PROJECT: `HMS Cloudflare`
PHASE: `DISCOVERY / DEFINITION`
BRANCH: `definition/operational-ux-workflow-roadmap`
BASE ARTIFACT: `a61d688534e0802a27cc7e5badb71dafacad19b9`
STATUS: `AUTHORIZED / DOCUMENTATION ONLY`

## Objective

Produce an evidence-based operational UX/UI roadmap for the HMS. Analyze
complete hotel workflows, not isolated screens or components. Inspect current
Cloudflare app behavior and available implementation, compare it to approved
V11 interaction/domain contracts, identify user-visible friction, and propose
priorities and acceptance criteria for later Human Gate review.

## Scope

Inventory at least: Reception/front desk, new reservation, edit reservation,
check-in, reassignment, stay extension, checkout, late arrival, no-show,
cancellation, payments, extra charges, housekeeping and maintenance.

For every workflow record entry point, visible context, current steps/context
switches, operator decisions, success/error/conflict feedback, desktop/mobile
behavior, backend dependencies and evidence-based usability classification.
Assess operational frequency, criticality, error cost, cognitive load, steps,
context loss, clarity, mobile usability, error recovery and daily impact. Any
qualitative rating must cite the evidence/rationale; do not invent numeric
precision or operational frequency data unavailable in repository sources.

Deliver one definition artifact with: current workflow map, UX matrix, key
frictions, common interaction model, prioritized roadmap, acceptance criteria
for prioritized workflows, backend gap register, risks, Pre-Critic findings,
and a recommended first workflow for implementation.

## Evidence sources

- Current application source and local browser inspection at representative
  desktop/mobile widths where executable.
- Existing browser evidence and regression fixtures in this repository.
- V11 contracts on `origin/analysis/operational-flow-definition-v11`, read-only.
- Accepted source UX and existing binding product decisions/contracts.

Each assertion must be labeled as observed implementation, executable browser
evidence, inherited test evidence, V11 target, or reasoned recommendation.
Screenshots support inspection but do not substitute for workflow execution.

## Forbidden actions

No production-code changes, redesign implementation, backend work, feature
opening, merge, deployment or staging mutation. Do not reclassify an unobserved
browser workflow as usable. Do not resolve product choices that V11 leaves
unclear; record them as unclear contract/Human Gate candidates.

## Acceptance

- All 14 required workflows have an evidence-backed inventory row.
- Matrix dimensions are evaluated consistently and qualitative judgments have
  explicit rationale; no unsupported frequency or severity scores.
- Actual current behavior is separated from binding V11 target behavior.
- Roadmap ordering follows hotel operational value, risk and supported
  frequency evidence rather than implementation convenience.
- Proposed common interaction model is tested against materially different
  workflows and exceptions are recorded.
- Backend dependencies are classified `required`, `optional`, `already
  supported` or `unclear contract`; no backend implementation is included.
- Acceptance criteria cover context, steps, information timing, validation,
  feedback/conflicts, mobile, keyboard/focus, success and return-to-context.
- Pre-Critic review identifies unsupported claims, omissions, scope creep and
  premature backend work; the artifact is corrected before the Human Gate.
- `.orchestration/STATE.md`, `.orchestration/STATUS.json` and evidence are
  reconciled to an exact documentation artifact and stop at the requested
  Human Gate. No implementation begins.

## Invariant mapping

- `INV-ATOMIC-001` — N/A: no business mutation is implemented; describe atomicity
  only as a backend dependency where the operation requires it.
- `INV-AUDIT-001` — N/A: no event/audit behavior is changed; record audit needs
  as workflow acceptance/dependency.
- `INV-DOMAIN-001` — APPLIES: preserve commands and domain transition semantics
  from V11; do not recommend generic CRUD for lifecycle work.
- `INV-TENANT-001` — N/A: no data access or tenant boundary is changed.
- `INV-RBAC-001` — APPLIES: map existing capability/dependency evidence and do
  not suggest UI visibility as authorization.
- `INV-PARITY-001` — APPLIES: compare current target experience with accepted
  source and V11; flag material departures rather than silently legitimizing.
- `INV-ENUM-001` — APPLIES: distinguish semantic domain states from serialized
  labels when mapping workflow states.
- `INV-UX-001` — APPLIES: this task defines workflow UX and must not disguise
  missing parity as infrastructure necessity.
- `INV-ORDER-001` — APPLIES: Reception/Housekeeping queue ordering and next-item
  continuation affect workflow quality and must be inspected against contract.
- `INV-RESP-001` — APPLIES: inspect task completion at mobile and desktop; label
  any unexecuted browser path unproven.
- `INV-EVID-001` — APPLIES: each claim links to source, contract, test, browser
  observation or is explicitly a recommendation.
- `INV-LEGACY-001` — N/A: no legacy records/backfill/recovery are changed.
- `INV-MONEY-001` — APPLIES: evaluate payment, extra-charge, checkout and
  repricing workflows without proposing fabricated financial truth.
- `INV-STATE-001` — APPLIES: publish definition artifact and canonical state
  with a non-circular artifact/boundary if committed.
- `INV-CF-I07-001..004` — N/A: no admin/network authorization routes or tests
  are changed.
- `INV-CF-I08-001..005` — N/A: Reports analytics semantics are not in requested
  inventory; no reporting implementation or claims are changed.
- `INV-SCOPE-001` — APPLIES: documentation-only discovery; no UI/backend wave
  may be absorbed into this definition artifact.

## Stop boundary

After the definition artifact, invariant evidence, Pre-Critic findings and
orchestration state are reconciled, stop for Human Gate. Do not start UI or
backend implementation.
