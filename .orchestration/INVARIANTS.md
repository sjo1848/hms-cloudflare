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

## INV-ENUM-001 — Enum meaning survives representation changes

**Applies when:** a source and target represent the same domain state/value using different enum names, casing, separators, serialization formats, display labels or storage literals.

**Invariant:** business predicates, ranking, authorization, transitions and filters must operate on canonical semantic values or an explicit source→target normalization layer. Source literals must not be copied into target business logic when target serialization differs. Display labels and storage literals may differ, but their domain meaning must remain equivalent.

**Required evidence:**
- explicit mapping for every enum value used by the migrated business rule;
- at least one regression where source and target serialized spellings differ but must trigger the same business predicate;
- negative assertion for a semantically different value;
- cross-layer evidence that DB/API/UI serialization does not silently change domain behavior.

**Origin:** CF-I05 REWORK-4 review: source Housekeeping queue used `CheckedIn` while target D1/API emitted `CHECKED_IN`, causing blocked-task ranking to be skipped for an eligible departure.

## INV-UX-001 — Infrastructure migration cannot silently redesign workflow

**Applies when:** accepted source user journey has a target UI surface.

**Invariant:** preserve workflow structure, information needed for the task, interaction semantics and material mobile behavior. Pixel-perfect parity is not required. A materially different journey is not accepted as technical adaptation.

**Required evidence:** source-vs-target journey map plus browser execution of the material actions.

**Origin:** CF-UX-PARITY-001; CF-I04 reception; CF-I05 housekeeping workspace.

## INV-ORDER-001 — Operational ordering and next-item selection are product semantics

**Applies when:** the accepted source ranks, prioritizes, deduplicates, synthesizes, or selects queue/list/work items and the order affects what the operator sees or does next.

**Invariant:** target ordering cannot fall back to storage order, identifier order, alphabetical order, API order, or the first rendered target item when the source defines an operational ranking or synthetic-item rule. `next`, `best`, `priority`, queue-head and equivalent actions must resolve according to the accepted source semantics. Synthetic/derived work items required by the source must remain represented even when their base entity is absent from an ordinary list.

**Required evidence:**
- explicit source ranking/selection/synthetic-item rule → target implementation mapping;
- deterministic fixture where natural/storage/identifier order conflicts with the expected operational rank;
- assertion of the known expected ordered identities, not an expectation derived from the target's own first item;
- when the source synthesizes work items, a fixture proving the item is present, contextualized and cannot expose an invalid operation.

**Origin:** CF-I05 REWORK-3 review: source Housekeeping priority ranking and orphan-departure queue behavior were lost while the target browser incorrectly labeled first-rendered-target consistency as source-priority parity.

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

## INV-STATE-001 — Canonical closure uses a non-circular publication boundary

**Applies to:** every substantive task.

**Invariant:** a commit cannot contain its own SHA as canonical metadata. Publication therefore uses a two-commit boundary:

1. **Artifact commit A** — immutable substantive implementation + tests + evidence content. It does not need to know its own SHA.
2. **Publication-boundary commit B** — orchestration-only commit that records the exact full SHA of A in STATUS/STATE, sets `external_review.required=true`, `resume_authorized=false`, and identifies the next action as External Independent Critic.

External Independent Critic reviews artifact A plus canonical boundary state B. B must not change substantive product code. Conversation claims or local-only state never substitute for remote B. After a Critic verdict, a later orchestration commit may record PASS/REWORK and authorize the next action.

**Required evidence:**
- remote main contains artifact A followed by publication-boundary B;
- B records exact `artifact_head=A` (or equivalent exact field/reference), current task and external-review flags;
- B changes only orchestration/evidence metadata needed for publication, not substantive product behavior;
- no stale prior-artifact head or `PENDING_IMMUTABLE_HEAD` is presented as canonical closure;
- reviewer can resolve both A and B remotely.

**Origin:** CF-I05 REWORK-4 review exposed a circular self-SHA requirement: trying to write a commit's own SHA changes that commit. The method is corrected to use an explicit non-circular publication pair.

## INV-CF-I07-001 — Central capability authority has no role-name bypass

**Applies when:** a protected admin, audit or network route is in scope.

**Invariant:** middleware and handlers must authorize only through the canonical capability authority. Direct role-name shortcuts cannot grant a capability absent from that authority.

**Required evidence:** static scan for route-local role shortcuts plus positive/negative API assertions for each network/admin boundary.

## INV-CF-I07-002 — Semantic no-op mutations produce no audit

**Applies when:** a role, plan or other admin mutation is requested.

**Invariant:** matching SQL rows is insufficient; same-value/no-op requests are rejected or return an explicit no-op and produce zero audit events.

**Required evidence:** repeated same-role and same-plan requests with unchanged state and exact audit counts.

## INV-CF-I07-003 — Downgrade proof is allowed-before/denied-after

**Applies when:** a role downgrade is claimed.

**Invariant:** the same Access subject must successfully perform a privileged operation before downgrade and be denied that same operation after downgrade, with no stale business/audit side effect.

**Required evidence:** deterministic before/after API sequence and durable state assertions.

## INV-CF-I07-004 — Successful regression owns process cleanup

**Applies when:** a regression runner starts Worker/Vite/Playwright processes.

**Invariant:** terminal PASS is emitted only after the runner's owned process tree is terminated; no owned process may remain after successful exit.

**Required evidence:** runner cleanup trap and post-run process check.

## INV-CF-I08-001 — Reporting arithmetic is integer-cent and zero-safe

**Applies when:** analytics, revenue, occupancy, ADR or RevPAR is exposed.

**Invariant:** monetary outputs remain integer cents; date/range and state predicates are authoritative backend SQL; zero denominators return zero rather than `NaN`, floating estimates or fabricated values.

**Required evidence:** independently calculable D1 fixtures including cancellation exclusion, empty range and cents that expose rounding errors.

## INV-CF-I08-002 — Network aggregation is server-side, bound and complete

**Applies when:** a network actor requests multi-hotel analytics.

**Invariant:** only the explicit network capability may fan out over active control-plane hotels; each binding is selected from server configuration, every configured hotel must contribute or return a truthful unavailable error, and ranking is deterministic and independently asserted.

**Required evidence:** two real local D1 bindings, exact total/per-hotel reconciliation, ranking fixture and unavailable-binding denial.

## INV-CF-I08-003 — Report date/state semantics are explicit

**Applies when:** report data is queried by date or booking state.

**Invariant:** both range boundaries and inclusion/exclusion state predicates are validated and documented; client-side aggregation cannot redefine them.

**Required evidence:** valid, invalid, empty and cancelled/non-revenue deterministic queries.

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
- artifact commit A is immutable and remotely resolvable;
- publication-boundary commit B records exact A, sets `external_review.required=true` and `resume_authorized=false`, and contains no substantive product-code changes.

Codex self-checking these items is not an Independent Critic PASS; it is the admission gate for external review.
