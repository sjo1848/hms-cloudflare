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
- compare source ordering/ranking/deduplication/synthetic-item/next-item rules where they affect operational behavior;
- compare enum/value representations across source domain, target DB, API and UI; when serialization differs, define a canonical semantic mapping before using the value in business predicates;
- record intentional exceptions only if backed by an approved decision.

### 3. Mutation/concurrency sweep

For every business operation with conditional writes:

- identify the authoritative state-changing statement(s) and the exact entity/version/case identity they represent;
- determine what happens if any authoritative conditional mutation affects zero rows;
- verify later statements cannot still commit a false success;
- when multiple related entities participate, prove every mutation belongs to the same logical operation rather than merely ending in compatible-looking final states;
- when a decision is derived from mutable pre-read state (balance, remaining amount, version, availability, count, aggregate, current case), correlate or revalidate that snapshot inside the same authoritative write boundary before committing side effects;
- for financial operations, prove rejected/stale/overpay/close-conflict paths leave invoice/payment/charge/closure/event state exactly unchanged; a JavaScript check after a successfully completed D1 batch cannot be treated as rollback;
- test ABA/re-entry where relevant: state/entity changes away and later returns to the same visible state, or K1 is replaced by K2 while a stale K1 caller is still in flight;
- verify audit/event side effects are exactly-once on success and zero on stale/rejected/ABA failure;
- add deterministic stale/concurrent/ABA or mutable-snapshot regression where applicable, with exact assertions for both the stale object and any newer/current related object.

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
- source focused-task/open/close/focus behavior is preserved when it is operationally material, even if the visual implementation differs;
- operational queues/lists preserve source ranking, priority, synthetic/derived work items and next-item selection when those semantics exist;
- per-entity draft/form state cannot leak across selected cases/rooms/bookings;
- financial/operational workflows named in the contract (for example balance and cash close) must exist on a user-visible target surface; API-only implementation is not UX parity.

### 6. Browser evidence sweep

- every contracted responsive width executes material controls, not merely page reachability;
- mobile workflows prove the material task-entry/focus/close semantics required by the source contract;
- where source ranking/next-item semantics exist, use deterministic fixtures whose natural identifier/order conflicts with expected priority and assert known expected identities; never derive the expected answer from the target's own first rendered item;
- where the source synthesizes/derives queue items, prove those items remain visible/contextualized and do not expose invalid actions;
- when target enum serialization differs from source, include at least one fixture using the target serialized value and prove the same source business predicate/rank/filter fires;
- per-entity draft isolation/reset is exercised in browser when the Task Contract requires it, rather than inferred only from component state shape;
- validation/error/success states are observable;
- mocks are labeled as mocks;
- integrated evidence is backed by real target API/D1 where required by the contract;
- durable screenshots are diagnostic evidence, not substitutes for executable assertions.

### 7. Evidence claim audit

For each material claim in docs/state:

`claim → exact executable or immutable evidence`

If no evidence exists, weaken/remove the claim or add the missing proof.

For ordering/priority claims, evidence must prove the source rule independently; target-self-consistency is not source parity.
For enum/state claims, evidence must distinguish semantic state from source/target serialized spelling.
A required test that did not complete because of runner/process/environment failure is `UNPROVEN`, not `PASS`; fix/isolate the runner or obtain equivalent executable evidence before publication.

### 8. Full regression and scope audit

- current increment regression passes;
- inherited accepted regressions pass where required;
- any required regression interrupted by runner/process lock remains `UNPROVEN` and blocks publication until it actually passes;
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

### 10. Non-circular publish boundary

Only after steps 1–9 pass:

1. publish **artifact commit A** containing substantive implementation/tests/evidence; A does not need to contain its own SHA;
2. read the exact full remote-resolvable SHA of A;
3. publish **boundary commit B** containing only orchestration/evidence metadata needed to point to A;
4. B records exact artifact A, sets `external_review.required=true`, sets `resume_authorized=false`, and sets next action to External Independent Critic;
5. B must not modify substantive product code;
6. stop for External Independent Critic, which reviews A plus boundary B.

Do not use `PENDING_IMMUTABLE_HEAD` or a previous artifact SHA as final canonical state. A single self-referential commit cannot satisfy this rule because writing its own SHA would change the SHA.

The pre-Critic gate does not authorize Codex to self-declare substantive PASS.
