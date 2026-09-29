# Task Contract — HMS-F0-12 Aggregate Evidence / Activation Gate

Status: `AUTHORIZED / CONTRACT FROZEN AFTER READ-ONLY REVIEW`
Branch: `impl/hms-foundation-0`
Authority: Foundation 0 Human authorization RG1–RG7; Roadmap A2 `b2581e4c370eeb6f74e9380af010e48386642b4f` / B2 `c6a4bcb9a2939505f7ddf8e72c02ec9b825f00f3`; `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` §F0.12; approved evidence matrix, room-state cutover plan, active-stay pricing bootstrap plan; frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008.
Dependencies: F0.1–F0.11 Development Gates closed; F0.11 exact A2 `f7c8d28db1ce1dd6839f1f182260537f0e2d4898` with linked Euler A2+B4 `REWORK` and Ohm A2+B5 handoff `PASS`.
Review: James (Contract) and Galileo (DB/Data), separate read-only GPT-6 Luna Medium. Bounded findings and dispositions: `.orchestration/evidence/HMS-F0-12-CONTRACT-AND-DB-REVIEW-001.md`; no `ROADMAP_BLOCKER`. Mandatory contract-admission Pre-Critic: `.orchestration/evidence/HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001-PRECRITIC.md`, PASS for aggregate work admission only.

## Objective

Assemble a reproducible aggregate evidence package for F0.1–F0.11 and synthetic-only cutover/bootstrap readiness. Report each increment's exact artifact/evidence identity and each synthetic hotel/record disposition; missing or unverified evidence stays `UNPROVEN` and prevents aggregate PASS. This task does not execute or authorize real-data cutover or pricing bootstrap.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Preserve increment-level truth | `.orchestration/STATE.md`, `.orchestration/STATUS.json`, exact A/B commits and increment evidence | Include F0.1–F0.11 individually; preserve `PASS_WITH_CONDITIONS` history and the exact condition-discharge evidence; no inherited or historical verdict is silently upgraded | Immutable commit IDs, file paths and SHA-256 digests; linked exact-pair critic reports |
| Reconcile required validation matrix | `.orchestration/evidence/` and approved Test/Evidence Matrix | For each required command or integrated proof, record exact command, fixture/environment, result/exit, output path/hash and whether it was freshly rerun or accepted unchanged from an immutable artifact; failures/omissions remain explicit | F0.1–F0.11 evidence matrix and hash inventory; fresh aggregate commands below |
| Expose synthetic per-hotel/per-record readiness | **PROPOSED NEW SURFACE:** `.orchestration/evidence/HMS-F0-12-AGGREGATE-EVIDENCE-MANIFEST.json` or equivalent report if current evidence cannot be assembled without losing row-level dispositions | Include only synthetic fixture identities with their actual classifications, blockers, readiness/sellability or bootstrap status; identify the associated isolated synthetic hotel D1; never present fixture names as customer hotels; unresolved/held rows are excluded from simulated activation and never defaulted READY | F0.3 `hotel-synthetic-a` room rows and F0.6 `synthetic-hotel` stay candidates, directly tied to the executing-D1 assertions; synthetic-only label and no-live-authorization assertion |
| Verify deterministic migration/cutover rehearsal | Existing F0.3 mapper/recovery test, F0.6 classifier/shadow activation, migration rehearsal tooling | Verify exact existing synthetic manifest/schema/source digests and deterministic replay evidence; do not add production activation, mutate canonical/live data, or infer unresolved real records | F0.3 and F0.6 evidence, exact clean-chain/rehearsal command results; no external DB binding |
| Bind aggregate to immutable inputs | `.orchestration/evidence/`; **PROPOSED NEW SURFACE:** small deterministic manifest validator only if a source audit confirms current scripts cannot validate exact paths/hashes | Capture code artifact A SHAs, boundary/review SHAs, evidence-file SHA-256, runner/version identity and report digest; repeated generation from frozen inputs is byte-identical; changed/missing input invalidates aggregate readiness | Two-generation checksum comparison; missing/tampered-input negative test; exact tool/command and process cleanup evidence |
| Keep gates distinct | `.orchestration/STATE.md`, `.orchestration/STATUS.json` | Development aggregate can PASS only if every required item is supported and unresolved synthetic rows remain held; promotion remains blocked by inherited external browser/runtime findings; live data, staging, deploy, merge and Blocks A–H remain unauthorized | Explicit Development vs Promotion disposition; authorization flags remain false |

## Scope and non-goals

Allowed: read current immutable F0 artifacts/evidence; rerun scoped, local/synthetic checks; write aggregate evidence and orchestration state; add a narrowly scoped deterministic evidence-manifest validator only if needed to meet the exact hash/repeatability requirements and after confirming no existing tool does so.

Forbidden: any real/customer data access or mutation; real cutover or pricing bootstrap; production or configured customer/default Wrangler persistence; product behavior/schema/API/UI changes; Blocks A–H; PR, push, merge, main, staging mutation, deploy or production; clearing shared/preexisting promotion findings.

No new product behavior, migration, data classification policy or historical-data adjudication is authorized. A missing real-data owner, cutover window or adjudication policy is recorded as deferred, not decided here.

## Synthetic record dispositions (expected source-backed set)

- F0.3 synthetic room-state rehearsal: test fixture hotel `hotel-synthetic-a`; `ready-room` is `MAPPED`, readiness `READY_FOR_ARRIVAL`, and `SELLABLE` for the test interval; `unknown-room` is `REVIEW_REQUIRED`, `UNRESOLVED`, not sellable. Separate local browser fixture `Hotel Norte` has three synthetic rooms all `UNRESOLVED`; do not conflate fixtures or call them live hotel data. Report only as synthetic test assertions, never as a current/persistent hotel-D1 inventory.
- F0.6 synthetic bootstrap fixture: hotel `synthetic-hotel`; `stay-a` is `TRACEABLE_SEGMENTS` and is the sole simulated activation candidate; `aggregate` is `TRACEABLE_AGGREGATE_ONLY/HELD`; `conflict` is `ORPHAN_OR_CONFLICT/HELD`; `mismatch` is `ACCOUNT_MISMATCH/HELD`; `voided` is `VOIDED/HELD`. `full-paid` and `overpaid-credit` are additional explicit ledger cases. A second isolated hotel pair verifies tenant separation; neither represents customer data.
- These synthetic outcomes do not classify any actual customer room/stay and do not authorize any live activation. Aggregate readiness means evidence package complete for review, not permission to activate.

## Binding cutover/bootstrap acceptance crosswalk

The aggregate report must disposition each item below as `PROVEN`, `UNPROVEN`, or `NOT_APPLICABLE` with rationale and exact evidence. Do not mark a row PROVEN merely because a related suite is green.

| Frozen plan acceptance | Required disposition/evidence |
|---|---|
| Room mapping rules and edge-case corpus | Link exact F0.3 unit/executing-D1 cases for supported/unsupported values, occupancy, HK/maintenance dimensions, contradictory and missing history; list uncovered source-plan cases as UNPROVEN. |
| Duplicate/orphan/unknown reports | Link exact F0.3 row-level classifications and assertions, including `unknown-room`; no silent omission or READY fallback. |
| Per-hotel/per-record count/checksum reconciliation | Use exact synthetic fixture hotel/record identities, input/accounted/output counts, source/schema/migration/report digests; never label as a live hotel report. |
| Two migration/rehearsal executions | Freshly execute the same synthetic room-state rehearsal twice from isolated clean local D1; record exact commands/exit/output hashes and compare canonical report digests. Existing in-test repeat mapping is supplemental, not a substitute for two clean invocations. |
| Failure/restart and idempotency | Link injected staged failure, recovery from each persisted checkpoint, COMPLETE replay, stale digest rejection and exact zero-drift assertions. |
| Date-range inventory and holds | Link explicit date interval/room-night/hold cases. If a frozen required predicate lacks executable coverage, mark UNPROVEN; do not infer from availability summaries. |
| Maintenance open-case uniqueness | Link full migration-chain executing-D1 assertion for one OPEN case per room; record any excluded migration regression accurately. |
| Events/provenance | Link actor/hotel/request/source references and exact zero fabricated-event assertions for map/reject/replay paths. |
| Post-activation verification | PROVEN only for explicitly test-scoped synthetic activation simulation and its exact verification assertions. Real cutover/post-activation is NOT_APPLICABLE here because forbidden; live readiness is not established. |
| Bootstrap synthetic case matrix | Explicitly map date boundaries, room/rate changes, extra charges, partial/full/overpaid credit, VOIDED, account mismatch, duplicate retries, missing/aggregate-only history, conflict, tenant isolation, interruption/restart and source/account drift to F0.6 test assertions. Missing proof is UNPROVEN. |
| Bootstrap exact preservation | Link exact before/after assertions for booking total/status/room/pricing version, charges, invoice fields including paid_at, complete payment rows, room/inventory/lifecycle/financial events and replay. No amount inference or payment fabrication. |
| Real-data cutover/bootstrap | `NOT_APPLICABLE` to this authorized task and explicitly prohibited; no real source/readiness claim may be made. |

## All-registry invariant classification

| Invariant | Class | Contractual obligation / rationale |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Verify recorded exact-winner/replay/rollback evidence for F0.3/F0.6/F0.7/F0.9; no new business mutation; aggregate cannot mask a failed atomicity row. |
| INV-AUDIT-001 | APPLIES | Verify audit/event evidence and zero-side-effect rejection evidence are linked; do not infer from final state alone. |
| INV-DOMAIN-001 | APPLIES | Aggregate must retain domain-specific classifications and gate semantics, not reduce them to generic green checks. |
| INV-TENANT-001 | APPLIES | Preserve per-hotel synthetic boundaries and two-D1 isolation evidence; never aggregate records across tenant D1s. |
| INV-RBAC-001 | APPLIES | Verify required F0 authorization evidence (including F0.10); an aggregate report must not grant access or substitute client claims. |
| INV-PARITY-001 | APPLIES | Trace each foundation acceptance row to frozen Blueprint/Reconciliation/Roadmap and source-backed evidence; no semantic changes. |
| INV-ENUM-001 | APPLIES | Preserve exact room/readiness, bootstrap class, checkpoint and gate vocabularies; unknown values fail closed. |
| INV-UX-001 | APPLIES | Aggregate required integrated workflow evidence from F0.1–F0.11; API-only or mock evidence cannot satisfy a required real local Worker/D1 browser row. |
| INV-ORDER-001 | APPLIES | Preserve evidence for required queue/next-item ordering (F0.11); do not treat reachability as ordering proof. |
| INV-RESP-001 | APPLIES | Record required desktop/mobile evidence and exact viewport from each increment; do not merge incompatible widths or infer mobile PASS. |
| INV-EVID-001 | APPLIES | Exact claim→artifact/test/command/exit/hash; missing, failed or infra-interrupted evidence is UNPROVEN and blocks aggregate PASS. |
| INV-LEGACY-001 | APPLIES | Explicit unresolved/quarantined synthetic records remain visible and held; no inferred readiness/history or anonymous replacement. |
| INV-MONEY-001 | APPLIES | Validate evidence preserves integer cents, D11 ledger truth and no live pricing inference/bootstrap; financial proof is exact before/after. |
| INV-STATE-001 | APPLIES | Publish immutable aggregate Artifact A and orchestration-only Boundary B, exact A reference, critic-required state; no self-referential SHA or self-PASS. |
| INV-CF-I07-001 | APPLIES | Validate F0.10 central capability evidence and no role-name bypass as part of required foundation evidence. |
| INV-CF-I07-002 | APPLIES | Validate F0.10 same-value/no-op mutation evidence and zero audit behavior is present, not inferred. |
| INV-CF-I07-003 | APPLIES | Validate the exact allowed-before/denied-after downgrade proof is present in F0.10 evidence. |
| INV-CF-I07-004 | APPLIES | Every fresh aggregate runner must own/verify cleanup; historic runner cleanup evidence remains individually attributed. |
| INV-CF-I08-001 | N/A | CF-I08 is outside F0.1–F0.11; no report arithmetic is changed or claimed by this gate. |
| INV-CF-I08-002 | N/A | No network aggregation changes or claims. |
| INV-CF-I08-003 | N/A | No report date/state predicate changes or claims. |
| INV-CF-I08-004 | N/A | No CF-I08-specific state expansion; foundation room/bootstrap enums are covered by INV-ENUM-001. |
| INV-CF-I08-005 | N/A | No reporting clock/default/continuity changes. |
| INV-SCOPE-001 | APPLIES | Limit all writes to F0.12 contract, evidence/manifest/validator if justified, and orchestration; no Blocks A–H, real data or promotion. |

## Validation and gates

1. Contract reviewer and DB/data reviewer read-only review before substantive aggregate generation; no product implementation starts before Pre-Critic is frozen.
2. Source audit proves whether a manifest generator/validator is necessary; if not, use existing tools and document the negative result. Any proposed new runner is deterministic, local-only, read-only with respect to product databases, uses explicit inputs/paths, and fails closed on missing evidence/hash mismatch.
3. Re-run the full current unit/integration suite, TypeScript, web build/architecture/budgets, D1 query plans, explicit API/Web/staging-SPA Wrangler dry-runs, and the authorized serial CF-I03–CF-I06 regression set in isolated local state. Freshly run relevant F0.3/F0.6 synthetic executing-D1 suites and rehearsal; run no customer binding. Capture exact command, fixture, exit code and output hash.
4. Verify F0.1–F0.11 increment evidence and critic dispositions individually; record each external/shared finding as promotion-only and not as PASS. Report any absent command/evidence as UNPROVEN.
5. Produce repeatable aggregate manifest/report with exact code/evidence hashes and synthetic room/stay dispositions; a second generation must match byte-for-byte. Test missing/tampered input fails closed. Never run live activation.
6. Mandatory Pre-Critic and 24-invariant evidence file must pass; publish immutable aggregate Artifact A, then orchestration Boundary B. Obtain a fresh Independent Critic on exact A+B.

Development Gate: `PASS` only if all F0.1–F0.11 required evidence is present/validated, synthetic unresolved/held rows are excluded from activation, deterministic digest/repeatability and missing-input fail-closed checks pass, and no applicable invariant is FAIL/UNPROVEN. Otherwise remain `INCOMPLETE` with exact gaps; do not manufacture a green aggregate.

Promotion/Human Gate: remains blocked. Controller review follows exact A+B Critic. Any actual customer-data inspection, adjudication, live cutover/activation, pricing bootstrap, staging, merge or deployment requires its separately authorized Human Gate. No Foundation 0 completion may be declared before F0.12 exact aggregate gate closes.
