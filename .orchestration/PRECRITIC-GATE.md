# HMS Cloudflare — Mandatory Pre-Critic Gate

Status: `BINDING`

This gate is executed by Codex **before** publishing any substantive immutable artifact for External Independent Critic. It exists to catch known defect classes earlier and reduce Critic/rework cycles without weakening independent review.

## Gate sequence

### 1. Contract completeness

- Active Task Contract exists.
- Scope, forbidden actions and source-parity rows are explicit.
- Applicable invariant IDs from `.orchestration/INVARIANTS.md` are identified.
- No unresolved requirement is being guessed as implementation detail when it is actually product/risk intent.

### 2. Source parity pre-flight

For every migrated source capability:

- compare source domain fields and validation rules;
- compare allowed state transitions;
- compare required actor/time/audit data;
- compare workflow/information architecture on required UI surfaces;
- record intentional exceptions only if backed by an approved decision.

### 3. Mutation/concurrency sweep

For every business operation with conditional writes:

- identify the authoritative state-changing statement;
- determine what happens if it affects zero rows;
- verify later statements cannot still commit a false success;
- verify audit/event side effects are exactly-once on success and zero on failure;
- add deterministic stale/concurrent regression where applicable.

### 4. Security sweep

- backend capability enforcement exists;
- unknown/forbidden role fails closed;
- tenant routing is authoritative;
- cross-tenant/unknown binding attempts are tested where applicable;
- denial leaves zero business/audit side effects.

### 5. UX parity sweep

- material source workflow is preserved;
- no infrastructure/runtime migration has silently redesigned the journey;
- mobile and desktop interaction models match the accepted product semantics;
- per-entity draft/form state cannot leak across selected cases/rooms/bookings.

### 6. Browser evidence sweep

- every contracted responsive width executes material controls, not merely page reachability;
- validation/error/success states are observable;
- mocks are labeled as mocks;
- integrated evidence is backed by real target API/D1 where required by the contract;
- durable screenshots are diagnostic evidence, not substitutes for executable assertions.

### 7. Evidence claim audit

For each material claim in docs/state:

`claim → exact executable or immutable evidence`

If no evidence exists, weaken/remove the claim or add the missing proof.

### 8. Full regression and scope audit

- current increment regression passes;
- inherited accepted regressions pass where required;
- build/type/Wrangler/diff checks pass;
- diff does not absorb forbidden next-increment scope;
- no paid/production/real-data/cutover action occurred unless explicitly authorized.

### 9. Invariant evidence file

Create/update:

`.orchestration/evidence/<TASK-ID>-INVARIANTS.md`

Every applicable invariant must be one of:

- `PASS` — with concrete evidence;
- `N/A` — with specific rationale;
- `FAIL` — artifact MUST NOT be published; repair autonomously first.

`UNPROVEN` is equivalent to `FAIL` for artifact publication.

### 10. Publish boundary

Only after steps 1–9 pass:

- create/publish one immutable artifact;
- persist exact artifact HEAD;
- set `external_review.required=true`;
- set `resume_authorized=false`;
- stop for External Independent Critic.

The pre-Critic gate does not authorize Codex to self-declare substantive PASS.
