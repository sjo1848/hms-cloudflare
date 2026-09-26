# UX-OPERATIONAL-WORKFLOW-ROADMAP-001 — Invariant Evidence

Artifact candidate: `docs/ux-operational-workflow-roadmap-001.md` on `definition/operational-ux-workflow-roadmap`.
Task Contract: `.orchestration/contracts/UX-OPERATIONAL-WORKFLOW-ROADMAP-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

No product code or business data was changed. The exact immutable SHA is
recorded in the subsequent orchestration boundary commit.

## Invariant classification

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | Task Contract forbids business mutation; roadmap §7 records atomic command dependencies only. | No operation is implemented. |
| INV-AUDIT-001 | N/A | N/A | Task Contract is documentation-only; roadmap §6/§7 names truthful success/audit as later acceptance where required. | No audit/event write path changed. |
| INV-DOMAIN-001 | APPLIES | PASS | Roadmap §§1, 5, 6 and V11 target references keep lifecycle operations as distinct commands; evidence authority is listed in the roadmap and Contract. | No generic CRUD recommendation for domain transitions. |
| INV-TENANT-001 | N/A | N/A | No tenant data access, routing or storage code changed; roadmap §8 says backend authorization/isolation remains authoritative. | Tenant isolation is not tested by this definition-only task. |
| INV-RBAC-001 | APPLIES | PASS | Roadmap §§1, 3, 7 distinguish capability-aware UI hints from authoritative backend authorization; checked-in V11 `05`, `19`, `21` contracts. | No permission behavior implemented or broadened. |
| INV-PARITY-001 | APPLIES | PASS | Roadmap evidence method and §8 disclose that source checkout is unavailable and rely on the approved parity decision plus V11; current implementation and target are distinguished. | No unobserved source-browser parity is claimed. |
| INV-ENUM-001 | APPLIES | PASS | Roadmap workflow map explicitly distinguishes `NO_SHOW` serialization from a missing command and uses semantic `BLOCKING`/`NON_BLOCKING` distinctions. | No enum changes. |
| INV-UX-001 | APPLIES | PASS | Roadmap §§1–5 inventory full operator journeys, context, mobile and task exceptions; mock and integrated-browser evidence are separately labeled. | Definition artifact only. |
| INV-ORDER-001 | APPLIES | PASS | Roadmap §§1, 3, 5, 6 treat server-owned queue priority and next-case continuation as product semantics; V11 `03c`, `21`, `22`. | Does not assert current target already meets V11. |
| INV-RESP-001 | APPLIES | PASS | Roadmap evidence method identifies mock runs at 375/390/430/768/1024 and inherited integrated reassignment at 375px, and explicitly limits what each proves. | Other integrated workflows remain unproven. |
| INV-EVID-001 | APPLIES | PASS | Roadmap evidence method and §§1–9 classify code observations, browser mock, inherited integrated evidence, V11 target and inference; local runtime failure is reported verbatim as an inspection limitation. | No PASS claim for unexecuted workflow integrations. |
| INV-LEGACY-001 | N/A | N/A | No legacy rows, migration, backfill or recovery behavior changed. | Data migration is outside scope. |
| INV-MONEY-001 | APPLIES | PASS | Roadmap §§1, 3, 5–8 identify billing/repricing and ledger consequences and prohibit fabricated financial truth; V11 D9–D11 contracts. | No money mutation or new financial source is proposed. |
| INV-STATE-001 | APPLIES | PASS | This evidence file and the roadmap are published as artifact commit A; `.orchestration/STATE.md` and `STATUS.json` are recorded in a separate boundary commit B pointing to A. | Exact A SHA is resolved before B is created. |
| INV-CF-I07-001 | N/A | N/A | No admin/network authorization route or role-name authorization path is changed; this is a documentation-only task. | Capability notes are descriptive only. |
| INV-CF-I07-002 | N/A | N/A | No mutation or audit behavior is changed. | — |
| INV-CF-I07-003 | N/A | N/A | No role downgrade or authorization regression is changed or claimed. | — |
| INV-CF-I07-004 | N/A | N/A | No CF-I07 regression runner was invoked for this definition artifact; existing browser evidence is explicitly inherited or separately labeled. | No runner PASS is attributed to this task. |
| INV-CF-I08-001 | N/A | N/A | Reports arithmetic is outside the requested workflow inventory; roadmap expressly makes no Reports browser claims. | — |
| INV-CF-I08-002 | N/A | N/A | No network aggregation/reporting implementation or result is inspected or changed. | — |
| INV-CF-I08-003 | N/A | N/A | No report date/state semantics are evaluated; operational hotel-local date references are from V11 front-desk contracts, not Reports. | — |
| INV-CF-I08-004 | N/A | N/A | No Reports cross-module state predicate is evaluated or changed. | — |
| INV-CF-I08-005 | N/A | N/A | No Reports clock default or reporting continuity evidence is produced. | — |
| INV-SCOPE-001 | APPLIES | PASS | `git diff` scope is limited to roadmap, invariant evidence and orchestration boundary; Task Contract forbids UI/backend implementation. | No merge/deploy/staging/main action. |

## Mandatory mutation inventory

None. This task changes documentation and orchestration metadata only. No
business write path, D1 data, or runtime behavior is modified.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Reception check-in/reassignment/checkout UI behavior at listed responsive widths | Existing `scripts/cf-i04-browser-regression.mjs` execution recorded in the roadmap; API interception is disclosed. | mock browser |
| Reassignment success and stale conflict persisted through local Worker/D1 at 375px | Prior Wave 1.2 artifact `47b9fed9300d1a77f5f20ddafadbd79a5514b6b8`; screenshots linked in roadmap. | integrated browser / inherited |
| Workflow target semantics and missing commands | `origin/analysis/operational-flow-definition-v11`, relevant `docs/operational-flows` contracts listed in Task Contract and roadmap. | contract |
| Current UI/API surfaces and missing controls/routes | React/API source inspection on the definition branch; route/component references recorded in roadmap. | static code observation |
| Local acceptance runtime was not usable for a fresh run | `cf-i09-local-start.sh --reuse` fixture mismatch; managed `--reset` rehearsal stopped with `invalid maintenance resolve transition`; no production inference. | local runtime observation |
| P0/P1/P2 order and first workflow | Qualitative operational-risk rationale in roadmap §§2, 5, 10; no measured frequency claimed. | reasoned recommendation |

## Pre-Critic / scope decision

Pre-Critic findings PC-01 through PC-07 are recorded in roadmap §9. Their
resolutions are reflected in the final roadmap: Housekeeping is P0, Maintenance
is P1, frequency is explicitly a proxy, the interaction pattern has exceptions,
backend gaps are not implementation authorization, evidence types are not
conflated, and Wave 1.2 is not treated as product acceptance.

Definition quality gate: PASS for presentation to the Human Gate, with the
explicit limitation that no hotel-operator interview/telemetry or fresh local
acceptance-runtime session was available. This is not Product Acceptance, not
an Independent Critic verdict, and not authorization to implement.

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN for this documentation artifact.
- [x] Task Contract and documentation scope are satisfied with the stated evidence limitations.
- [x] Scope audit excludes product code, backend, migration, merge, deploy and staging.
- [x] Canonical orchestration state is updated in a separate boundary commit pointing to the exact artifact commit.
- [x] External/Human review is required; Codex does not self-approve product PASS.
