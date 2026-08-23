# TASK CONTRACT — CF-I04

TASK ID: `CF-I04`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME ORCHESTRATOR / CONTEXTUAL SPECIALISTS`  
STATUS: `READY`

## OBJECTIVE

Implement the accepted Reception Lifecycle parity increment on the integrated CF-I03 bookings foundation. Preserve `/api/v1`, Access → CONTROL_DB membership → authorized hotel-D1 routing, tenant-local room/booking integrity, half-open room-night semantics, integer cents and lifecycle atomicity. This increment covers walk-in/check-in, in-house room reassignment and checkout/housekeeping handoff. Do not implement billing, payments, housekeeping as a standalone feature, RBAC administration, reporting, network administration or later increments.

## CANONICAL INPUTS

- `AGENTS.md`, `.orchestration/STATE.md` and `.orchestration/STATUS.json`.
- Approved design: `docs/migration-design-package.md`, especially lifecycle integrity, atomicity, traceability and CF-I04 sections.
- Source parity: `docs/source-contract-inventory.md`, especially J-02, J-03, J-04, P-02, P-07, P-08, P-09, P-15, P-17 and P-18.
- `.orchestration/contracts/CF-I03.md`, its accepted implementation and both Independent Critic records.
- Current integrated `main` at the head recorded in `.orchestration/STATUS.json`.

## SCOPE

### Domain/Lifecycle Specialist

Implement lifecycle APIs and hotel-D1 atomic seams for:

- walk-in creation or locating an existing booking context;
- check-in transition `Confirmed → CheckedIn` only after guest count, document verification, contact confirmation and stay confirmation are all accepted;
- room occupancy/state transition, actor/time/request traceability and audit data for check-in;
- in-house room reassignment with destination room/hold/claim availability checks and complete rollback on failure;
- checkout transition `CheckedIn → CheckedOut` with required policy/reference, charge-review and release/handoff confirmations, room `Occupied → Dirty` and traceability.

Lifecycle transitions are domain operations, not generic booking PATCH status changes. All booking, room, claim, state and audit mutations that belong to one hotel operation must remain atomic within that hotel D1.

### Reception UX Specialist

Extend the responsive `/bookings` reception workspace with browser-testable flows for walk-in/check-in, reassignment and checkout. Preserve existing loading, empty, validation, typed-error and availability behavior. Cover accepted mobile widths 375/390/430 and responsive transitions at 768/1024 without adding billing, standalone housekeeping or later feature surfaces.

### QA/Security Specialist

Create independent adversarial evidence for lifecycle authorization, tenant isolation, invalid transition rejection, checklist gating, reassignment overlap/rollback, checkout release/dirty-room handoff, actor/request traceability, concurrency/atomicity and desktop/mobile journeys. The QA/Security context must not approve its own implementation.

## DEPENDENCY GRAPH

`CF-I03 integrated main` → `contract + scope/invariant review` → `Domain/Lifecycle API + D1 seams` → `Reception UX integration` → `QA/Security adversarial validation` → `Orchestrator full validation` → `immutable artifact / Independent Critic`.

Domain/Lifecycle and Reception UX may prepare bounded designs independently after the contract, but UX integration consumes the lifecycle transition/error contract. QA/Security starts only against the combined implementation candidate and remains independent of the implementer context. No CF-I04 product implementation is authorized until this graph and dispatch record are persisted.

Dispatch record for this runtime: `RUNTIME_CAPABILITY_FALLBACK`. The visible Codex adapter exposes no separate specialist/subagent execution contexts. The Orchestrator preserves the three responsibility boundaries in this contract and evidence plan, but makes no false multiagency claim.

## AUTHORIZATION AND DATA INVARIANTS

- Backend authorization is authoritative; never trust client hotel or database identifiers.
- Every booking, room, claim, hold and lifecycle reference resolves only in the authorized hotel operational D1.
- Legal transitions are explicit; cancelled/checked-out bookings cannot be revived through generic mutation.
- Check-in cannot partially occupy a room or mark a booking in-house when any required checklist item is false.
- Reassignment cannot claim an unavailable/held destination and must leave booking, old claims, new claims and room states unchanged after failure.
- Checkout must not partially release or dirty a room; successful checkout records the required handoff and makes the prior room dirty.
- Risk-relevant mutations retain actor, hotel and request traceability.
- Dates remain half-open; money remains integer cents. No production/remote-D1/real-data/paid-resource action is authorized.

## REQUIRED ACCEPTANCE

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Walk-in/check-in | `/bookings` reception workspace and lifecycle API | Walk-in context persists; checklist gates completion; valid transition is `Confirmed → CheckedIn` with occupied room and traceability. | Domain/API tests, D1 assertions and browser journey. |
| Reassignment | Booking case and room picker/API | Destination availability and tenant ownership are checked; booking/claims/room state update atomically; failed destination leaves all prior state intact. | Adversarial API/D1 regression and browser evidence. |
| Checkout/handoff | Booking case checkout surface/API | Required policy/reference, charge review, release and handoff gates are enforced; valid transition produces `CheckedOut`, dirty room and durable handoff trace. | Domain/API/D1 tests and browser journey. |
| Authorization/tenant boundary | All lifecycle routes | Forbidden/unknown binding/cross-tenant IDs fail closed; no client-controlled database selection. | QA/security regression and routing evidence. |
| Atomicity/concurrency | Hotel operational D1 | No partial lifecycle transition or stale claims/room state after failed or conflicting mutation. | Transaction/rollback/concurrency evidence. |
| Responsive reception | `/bookings` at accepted widths | Required mobile and desktop flows remain usable with observable loading, validation, error and success states; no later scope appears. | Playwright/component evidence at 375/390/430/768/1024. |

## RESPONSIBILITY AND REVIEW BOUNDARY

The Runtime Orchestrator must delegate the bounded Domain/Lifecycle, Reception UX and QA/Security responsibilities to separate contextual specialist executions when the runtime exposes them. If it cannot instantiate true specialist contexts, it must record `RUNTIME_CAPABILITY_FALLBACK` and preserve contextual separation in artifacts and evidence; it must not simulate multiagency or claim an implementer self-review as independent.

The QA/Security Specialist validates adversarially after implementation. The Runtime Orchestrator integrates results, runs complete local validation and stops at the immutable artifact / Independent Critic boundary.

## DECISION LATITUDE

Specialists may choose internal module layout, schema naming, helper organization, fixture data and test structure. They may not change CF-DATA-001 Option B, the Access boundary, `/api/v1` compatibility objective, parity-first scope, lifecycle semantics, cost boundary or Product Acceptance boundary.

## FORBIDDEN ACTIONS

- Billing, invoices, payments, cash closure or financial settlement implementation.
- Standalone housekeeping/maintenance, users/RBAC administration, reporting, analytics or network administration.
- Generic status PATCH bypassing lifecycle workflows.
- Production deployment, remote D1 mutation, real-data access or paid Cloudflare activation.
- Skipping independent Critic review or self-approving substantive work.

## REQUIRED OUTPUTS

- Lifecycle API/domain/D1 changes and responsive reception UI within this scope.
- Domain, API/D1, adversarial QA/security and browser evidence preserving `Requirement → Expected Surface → Acceptance → Evidence`.
- Exact immutable artifact commit SHA persisted before Independent Critic review.
- Updated `.orchestration/STATE.md` and `.orchestration/STATUS.json` at each terminal transition.
- Independent Critic review of the exact artifact; no `@codex review`.

## CRITIC FOCUS

Challenge checklist bypasses, illegal transitions, room-state drift, stale claim release, reassignment overlap/rollback, checkout handoff incompleteness, cross-tenant references, client-controlled routing, missing actor/request traceability, non-atomic writes, responsive/mobile gaps and accidental billing/housekeeping scope expansion.

## DONE WHEN

All scoped acceptance criteria are evidenced, the artifact is committed, complete local validation passes and an Independent Critic returns `PASS` (or bounded rework obtains a fresh `PASS`). Then derive the next authorized action without self-declaring Product Acceptance.
