# HMS Cloudflare — Durable Invariant Registry

Status: `BINDING`  
Purpose: convert defects and lessons already discovered into reusable pre-Critic obligations. An applicable invariant may be waived only by an explicit approved decision or legitimate Human Gate. A Task Contract cannot silently weaken it.

## How this registry is used

For every new increment or REWORK, Codex MUST:

1. read this registry before planning;
2. mark each invariant `APPLIES` or `N/A` with a one-line reason in the Task Contract or its evidence file;
3. design at least one acceptance/evidence path for every applicable invariant;
4. run the invariant checks during self-adversarial QA, before publishing the immutable artifact;
5. persist `.orchestration/evidence/<TASK-ID>-INVARIANTS.md` using the pre-Critic template;
6. refuse to publish a substantive artifact while an applicable invariant is `UNPROVEN`.

Independent Critic may still find defects. The purpose is to stop rediscovering already-known defect classes in later increments.

## Defect promotion rule

When an Independent Critic finds a defect whose root cause can recur outside the current task, the root-cause rule MUST be promoted into this registry before the next delivery wave. The rule should describe the reusable failure pattern, not merely the specific file or endpoint that failed.

---

## INV-ATOMIC-001 — Conditional aggregate mutation cannot report false success

**Applies when:** a business operation contains a state-dependent `UPDATE`/`DELETE`, multiple writes, related entity/case transitions, or a mutation followed by an event/audit record.

**Invariant:** the business operation must prove that the exact authoritative entity/version/case intended by the current operation won the transition. If a conditional mutation affects zero rows, a related entity has been replaced/reopened, or state leaves and later re-enters the same visible value (ABA), the operation must not succeed merely because the final state again looks valid. All writes and audit/event side effects must represent the same logical operation or roll back together. A transaction/batch plus final-state checks is not sufficient when zero-row statements, stale identities or ABA re-entry can be treated as success.

**Required evidence:**
- deterministic zero-row stale-state regression;
- when identity/version/case correlation exists, deterministic stale-identity or ABA regression (for example K1 -> resolved -> K2 opened -> stale K1 attempt);
- exact final-state assertions for every affected entity/table, including newer/current related records;
- zero unauthorized event/audit side effects;
- endpoint/business operation must not return success for the stale operation.

**Origin:** CF-I04 lifecycle races; CF-I05 cleaning/maintenance concurrency review; CF-I05 REWORK-1 stale maintenance-case ABA review.

## INV-AUDIT-001 — Audit/event exists iff the business mutation succeeded

**Applies when:** risk-relevant mutation records an event/audit row.

**Invariant:** one successful logical mutation produces the intended audit/event exactly once; a failed/stale/rejected mutation produces none. Audit insertion must not itself turn a zero-row business mutation into apparent success.

**Required evidence:** concurrent or repeated-operation regression with event counts and actor/hotel/request assertions.

**Origin:** CF-I04 lifecycle event guards; CF-I05 housekeeping event review.

## INV-DOMAIN-001 — Domain transitions are not generic CRUD

**Applies when:** operation changes booking, room, housekeeping, maintenance, payment, settlement, or other domain state.

**Invariant:** state transitions must pass through explicit domain operations with transition rules and cannot be bypassed through generic PATCH/update surfaces.

**Required evidence:** search/diff audit for bypass path plus adversarial API test rejecting an invalid direct transition.

## INV-TENANT-001 — Tenant isolation fails closed at authoritative boundary

**Applies when:** request reads/writes hotel-scoped data or resolves object IDs.

**Invariant:** client-supplied IDs never authorize hotel access. Membership/routing selects the operational D1 before ordinary business access. Cross-tenant or unknown-binding attempts cannot read, mutate, reference, or create audit/event data in another tenant.

**Required evidence:** authorized tenant success + cross-tenant/unknown-binding denial + zero target mutations/events.

## INV-RBAC-001 — Backend authorization is authoritative

**Applies when:** capability-restricted API/UI surface is introduced or changed.

**Invariant:** frontend visibility/guards may improve UX but never substitute backend capability enforcement. Unknown roles fail closed.

**Required evidence:** allowed-role matrix and at least one denied-role mutation/read test appropriate to the surface.

## INV-PARITY-001 — Source domain semantics are preserved before target convenience

**Applies when:** migrating an accepted source capability.

**Invariant:** do not replace source domain data or conditions with weaker booleans, defaults, shortened validation, or target-only gates. Any intentional semantic departure requires an approved decision/Human Gate.

**Required evidence:** explicit source field/rule → target field/rule mapping and representative positive/negative contract tests.

**Origin:** CF-I04 guest-count and checkout-policy/reference defects.

## INV-UX-001 — Infrastructure migration cannot silently redesign workflow

**Applies when:** accepted source user journey has a target UI surface.

**Invariant:** preserve workflow structure, information needed for the task, interaction semantics and material mobile behavior. Pixel-perfect parity is not required. A materially different journey is not accepted as technical adaptation.

**Required evidence:** source-vs-target journey map plus browser execution of the material actions.

**Origin:** CF-UX-PARITY-001; CF-I04 reception; CF-I05 housekeeping workspace.

## INV-RESP-001 — Responsive evidence proves the operation, not only the shell

**Applies when:** a Task Contract names responsive widths or a mobile/desktop journey.

**Invariant:** each contracted width must exercise material controls relevant to the capability. Rendering a heading/card/queue does not prove lifecycle usability.

**Required evidence:** reproducible browser script covering the material journey at each contracted width; durable screenshots only where they add diagnostic value.

**Origin:** CF-I04 responsive evidence defects.

## INV-EVID-001 — Evidence claims cannot be stronger than the executable proof

**Applies to:** every substantive artifact.

**Invariant:** documentation must state exactly what tests/scripts prove. Mock evidence cannot be described as integrated evidence; local state cannot be described as remote/canonical closure; a shell check cannot be described as full journey coverage.

**Required evidence:** pre-Critic cross-check of every important evidence claim against a named executable test, DB assertion, browser script, or immutable source artifact.

## INV-LEGACY-001 — Legacy/backfill recovery preserves ownership and traceability

**Applies when:** target synthesizes a missing historical case/record to recover an accepted legacy state.

**Invariant:** synthesized recovery data must be tenant-local and retain the current recovery actor, timestamp and reason/provenance where the source workflow does so. Do not create anonymous operational history merely to satisfy a schema.

**Required evidence:** legacy recovery regression asserting actor/tenant/time/provenance and final state.

**Origin:** CF-I05 legacy maintenance case review.

## INV-MONEY-001 — Financial values and business operations preserve exactness

**Applies when:** money, invoice, charge, payment, settlement or cash closure is in scope.

**Invariant:** money uses integer cents; no floating-point business storage/calculation. Multi-write financial business operations commit or roll back atomically at the business-operation boundary.

**Required evidence:** exact-cent arithmetic tests, stale/concurrent/partial-failure rollback, balance/invoice/payment consistency.

**Critical starting with:** CF-I06.

## INV-STATE-001 — Local PASS is not canonical closure

**Applies to:** every substantive task.

**Invariant:** artifact, review verdict, STATUS/STATE, branch/HEAD and evidence references must converge before the task is considered closed. Conversation output is not authoritative state.

**Required evidence:** clean/synchronized boundary and canonical files pointing at the exact reviewed artifact/verdict.

## INV-SCOPE-001 — Accelerated wave does not imply scope blending

**Applies to:** accelerated delivery waves.

**Invariant:** tightly coupled implementation may be grouped to reduce boundaries, but financial, security/cross-tenant, migration/cutover, paid-cost and product-intent risks remain separately reviewable. No wave may silently absorb the next high-risk increment.

**Required evidence:** diff/scope audit against Task Contract forbidden actions and next increment.

---

## Mandatory pre-Critic rule

A substantive artifact is eligible for External Independent Critic only when:

- the Task Contract exists and lists/links applicable invariants;
- `.orchestration/evidence/<TASK-ID>-INVARIANTS.md` exists;
- every applicable invariant is `PASS` with concrete evidence or explicitly `N/A` with rationale;
- full regression required by the Task Contract passes;
- evidence documentation has been checked against `INV-EVID-001`;
- canonical state identifies the exact immutable artifact and sets `external_review.required=true`.

Codex self-checking these items is not an Independent Critic PASS; it is the admission gate for external review.
