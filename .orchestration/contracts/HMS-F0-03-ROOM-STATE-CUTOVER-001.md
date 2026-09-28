# Task Contract — HMS-F0-03-ROOM-STATE-CUTOVER-001

Task ID: `HMS-F0-03-ROOM-STATE-CUTOVER-001`  
Parent: `HMS-FOUNDATION-0-START-001`  
Depends on: F0.1 `HMS-F0-01-ROOM-DIMENSIONS-001` and F0.2 `HMS-F0-02-SHARED-ROOM-INVARIANTS-001` (exact F0.2 A+B independently reviewed PASS).  
Authority: Foundation 0 Authorization `HMS-FOUNDATION-0-AUTHORIZATION-012`; approved Roadmap A2/B2; frozen Blueprint 001, Reconciliation 007 and Final Disposition 008. F0.3 mapping rules may only implement those accepted semantics; this contract does not choose live-data adjudication or cutover policy.  
Execution boundary: `impl/hms-foundation-0`; synthetic fixtures and disposable local D1 only.

## Objective

Implement and prove a deterministic, provenance-carrying shadow mapping/reconciliation for legacy room state into F0.1 dimensions. Exercise the proposed cutover path only on generated synthetic data. Classify every room and related claim; unknown, contradictory, orphaned, duplicate-open-case, unsupported or unrecoverable input must remain unresolved/quarantined and must never become READY or sellable. Repeated runs, interruption/restart and source drift must be observable and safe.

The accepted product model remains separate Occupancy, Housekeeping, Maintenance Impact and Service State, with derived Readiness and date-range Sellability. Maintenance does not overwrite Housekeeping. Do not infer dimensions merely from the absence of a blocker or from legacy `rooms.status = AVAILABLE`. F0.3 does not claim to recover historical Housekeeping state that prior maintenance/status transitions overwrote.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Preserve complete source accounting and provenance | Existing `scripts/migration/source-target-map.mjs`, `scripts/migration/migration-core.mjs`; proposed room-state mapper/report only if existing tools cannot satisfy this contract | Inventory schema/migration identity and all relevant room, booking, room-night, hold, maintenance case, Housekeeping task/event/history inputs. Every mapped/quarantined row carries hotel/room/source identifiers, source digest, mapping version/rule and classification. | Synthetic source manifest, exact row/class counts and canonical checksums |
| Map only deterministic evidence | Existing F0.1 `apps/api/src/modules/room-state/domain.ts`, `read-model.ts`; proposed shadow transform | Use only mappings explicitly supported by frozen semantics and direct, internally consistent source evidence. Preserve existing canonical values only when valid and evidence-consistent. A legacy status alone cannot establish READY; hidden prior Housekeeping beneath MAINTENANCE stays unresolved absent deterministic history. | Positive/negative mapping corpus with expected identities/classes and reasons |
| Reconcile room, stay and inventory truth | Existing `apps/api/schema/hotel-migrations/0001_foundation.sql`, `0009_housekeeping_maintenance.sql`, `0020_maintenance_impact.sql`, `0022_room_state_dimensions.sql`, `0023_room_state_command_guards.sql`; proposed shadow report | Detect conflicting/multiple CHECKED_IN assignments, inconsistent current inventory claims, invalid/overlapping room-night claims, overlapping holds, foreign/orphan references, duplicate open maintenance cases and conflicting timelines. Do not omit them by rejecting the entire corpus before the report can classify them. No cross-D1 atomicity claim. | Per-room/per-class reconciliation, adversarial two-hotel synthetic D1 fixtures, exact zero-leakage assertions |
| Avoid false readiness/sellability | Existing `apps/api/src/modules/room-state/domain.ts`, `read-model.ts`, `apps/api/src/routes/inventory.ts`; `apps/web/src/features/rooms/RoomsPage.tsx`; proposed minimal report/status exposure only if required | Every non-`MAPPED` or incomplete/contradictory row is excluded from READY and SELLABLE results. Preserve occupancy + maintenance coexistence and independent Housekeeping/service dimensions. Date-range Sellability is computed only from authoritative interval/inventory/hold/service/BLOCKING evidence; if any required evidence is absent, report `UNRESOLVED`, not `SELLABLE`. | Unit + executing-D1 tests and, if the existing Rooms UI/API does not visibly distinguish unresolved state, narrow UI change plus real local Worker/D1 browser assertions at desktop and narrow viewport |
| Run a safe synthetic rehearsal | Existing `scripts/migration/rehearse.mjs`, `reconcile.mjs`, `wrangler-local.mjs`, `test-rehearsal.sh`; new focused runner only if these cannot satisfy the room-state cases | Use a fresh disposable local D1 root under a verified task-owned temporary directory; reject remote mode and unsafe persistence paths. Re-running the same `(hotel_id, room_id, source_digest, mapping_version)` is deterministic/idempotent. A changed digest invalidates prior mapping/readiness. Inject interruption at each staged per-hotel checkpoint; retain explicit `INCOMPLETE`, then resume/reconcile deterministically. A source digest change between shadow snapshot and simulated activation must reject stale output. | Two full rehearsals, changed-source run, interruption/restart at each checkpoint, exact output comparison and owned-process cleanup proof |
| Keep real-data operations forbidden | No real binding/fixture or runtime surface | Do not connect to, inspect, mutate, cut over, adjudicate or bootstrap any real customer/hotel database. Do not choose the real operational write-freeze or activation-pointer policy. Synthetic activation simulation proves only guard behavior, not live activation readiness. | Command/fixture audit, isolated local persistence evidence and explicit no-real-data statement |

## Current repository facts and proposed surfaces

Verified current surfaces:

- `apps/api/schema/hotel-migrations/0001_foundation.sql`, `0009_housekeeping_maintenance.sql`, `0020_maintenance_impact.sql`, `0022_room_state_dimensions.sql`, `0023_room_state_command_guards.sql`;
- `apps/api/src/modules/room-state/domain.ts`, `read-model.ts`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`;
- `apps/api/src/routes/inventory.ts`, `bookings.ts`, `housekeeping.ts`, `lifecycle.ts`;
- `apps/web/src/features/rooms/RoomsPage.tsx`, `apps/web/src/domain/types.ts`;
- `scripts/migration/source-target-map.mjs`, `migration-core.mjs`, `rehearse.mjs`, `reconcile.mjs`, `wrangler-local.mjs`, `test-rehearsal.sh`, and `scripts/migration/fixtures/source-synthetic.json`.

Existing generic rehearsal imports a synthetic source fixture into control/hotel D1s and reconciles selected imported rows. It does not currently implement row-level room-state shadow mapping, cutover classes, no-false-READY verification, per-hotel room cutover checkpoints or source-drift protection. Do not claim otherwise.

**PROPOSED NEW SURFACE (conditional):** pure room-state shadow mapper, synthetic adversarial fixture/corpus, room-state reconciliation report, and/or a dedicated rehearsal runner/test. Add an additive forward migration only if a persistent cutover manifest/checkpoint is required by the approved plan and its schema can be safely exercised on synthetic D1. No migration may perform a real-data mapping/backfill in this task. Exact filenames remain undecided until implementation proves an existing surface insufficient.

**Potential minimal UI surface (conditional):** `RoomsPage` currently consumes legacy `Room.status` and does not render API `operational_state`; the roadmap test/evidence matrix requires unresolved state to be visible to an authorized operator. If targeted integration confirms this gap still exists, expose only the authoritative unresolved/readiness signal needed to avoid showing an unresolved room as operationally ready. Do not build a cutover administration or adjudication workflow in F0.3.

## Classification and mapping constraints

Allowed report classes are exactly: `MAPPED`, `REVIEW_REQUIRED`, `CONFLICT`, `ORPHAN`, `DUPLICATE_OPEN_CASE`, `UNSUPPORTED_VALUE`.

- Each `MAPPED` result must name the accepted mapping rule and all decisive source row/event IDs. Incomplete evidence cannot be upgraded by operator-neutral defaults.
- Any ambiguity, unsupported literal, conflicting occupancy/timeline/claim, unknown impact or missing dimension evidence is non-ready and non-sellable.
- A deterministic date-range result requires a valid half-open interval and authoritative same-hotel evidence for overlapping inventory claims, holds, service state and open BLOCKING maintenance. Missing evidence yields `UNRESOLVED`.
- No historical event/case may be invented to make a room mappable. The legacy status and migration-0020 impact heuristic are not proof of hidden prior Housekeeping state.
- A no-open-case current operational recovery command from F0.2 is not a cutover mapper and may not be invoked to auto-adjudicate fixture rows.
- Counts/checksums must account for every input row and every output disposition; no unexplained drop, duplication or cross-hotel aggregation.

Where Blueprint/Reconciliation/Final Disposition do not determine an individual legacy mapping, keep it classified for review/quarantine. Do not invent a rule. If implementation cannot remain safe without choosing new product/data policy, stop that subproblem and record the exact contradiction; this is a Human/data-risk gate only for adjudication or live cutover, not for continuing clearly deterministic synthetic work.

## Mutation, concurrency, isolation, idempotency

F0.3 is shadow-first. Mapper output is derived and cannot directly update canonical room dimensions, booking assignments, inventory claims, maintenance cases, events or customer totals during ordinary mapping/reconciliation. Any staged writes used to rehearse checkpoint/restart happen only in isolated synthetic D1 and must be atomic within that one D1 boundary. No cross-hotel transaction is claimed.

Use deterministic source digests covering all mapping-relevant rows and the source schema/migration identity. Bind each rehearsal/checkpoint to `(hotel_id, source_digest, mapping_version)`. Before simulated activation, re-read/recompute the synthetic source digest and reject any stale result. A changed digest requires a new mapping run; it must not reuse old readiness. Same digest/version replay must produce identical report/checksum and no duplicate target rows/checkpoints/events. Interruption leaves that synthetic hotel `INCOMPLETE`; restart either resumes from the same verified checkpoint or aborts cleanly, never reports global success. Foreign hotel IDs/references fail closed and produce no foreign-row access or mutation.

No real-data locking strategy, write-freeze duration, activation pointer, row adjudication procedure or post-cutover rollback policy is selected here; those remain under the separate Human/data-risk gate described by the approved plan.

## Non-goals

- Real/sanitized customer data access, real D1 execution, real cutover, activation, or data adjudication.
- Active-stay pricing bootstrap or changes to cents, invoices, charges or payment entries.
- F0.4 reassignment implementation; Blocks A–H; broad Rooms/Housekeeping redesign; cutover administration UI.
- Rewriting migrations 0001–0023, reconstructing erased history, synthesizing maintenance/HK events or cases, or changing 007/008 semantics.
- Treating existing CF-I09 generic migration rehearsal PASS as F0.3 evidence.

## Invariant applicability map

Every registry invariant is classified before implementation.

| Invariant | Classification | Required acceptance/evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Synthetic staged D1 writes/checkpoints prove exact-winner/stale behavior, interruption rollback or explicit INCOMPLETE state, zero false success and exact table-level no-drift. No cross-D1 atomicity claim. |
| INV-AUDIT-001 | APPLIES | No business history is synthesized; mapping manifest provenance is exact; any synthetic checkpoint/audit row appears once iff its stage succeeds and none on rejected/stale run. |
| INV-DOMAIN-001 | APPLIES | Mapping derives canonical dimensions only; no generic domain mutation endpoint or direct production state mutation; diff/API audit verifies. |
| INV-TENANT-001 | APPLIES | Two synthetic hotel D1s; foreign object/reference attempt is rejected or classified without reading/writing other hotel; exact zero foreign drift. |
| INV-RBAC-001 | APPLIES | Room operational-state visibility uses the existing protected `/rooms` read surface; executing-D1 tests retain positive authorized access and negative capability denial after authenticated membership and hotel routing are established. No capability is added or renamed. |
| INV-PARITY-001 | APPLIES | Mapping and output preserve 007/008 dimension/predicate semantics; each deterministic mapping and every non-mappable legacy case has positive/negative fixtures. |
| INV-ENUM-001 | APPLIES | Exercise every supported legacy/target value plus unsupported target serialization; unknown values remain `UNSUPPORTED_VALUE`/unresolved. |
| INV-UX-001 | APPLIES | If the existing Rooms surface is minimally updated, source/target information needed to distinguish unresolved from ready is preserved; do not redesign workflow. Otherwise document browser evidence for the existing contracted unresolved-state display. |
| INV-ORDER-001 | N/A | No queue ranking, deduplication order or next-item selection changes. |
| INV-RESP-001 | APPLIES | If visible unresolved/readiness presentation is touched, test material state at desktop and narrow viewport, not shell reachability alone. |
| INV-EVID-001 | APPLIES | Claims map to executable mapper/D1/browser assertions and exact command/fixture/hash/output; no live-data claim from synthetic rehearsal. |
| INV-LEGACY-001 | APPLIES | Unknown/ambiguous legacy records remain quarantined with original source identity; prove no anonymous history/case synthesis and no false READY. |
| INV-MONEY-001 | N/A | No financial amount, account, payment, charge or cash operation is in scope. |
| INV-STATE-001 | APPLIES | After Pre-Critic and invariant evidence, publish immutable F0.3 Artifact A then orchestration-only B recording A’s exact SHA and requesting independent data/cutover Critic. |
| INV-CF-I07-001 | N/A | No protected admin/network/audit route or capability authority change. |
| INV-CF-I07-002 | N/A | No admin mutation or semantic admin no-op. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Any new/changed shell runner must own and verify cleanup of its Worker/Vite/browser process group before terminal PASS; otherwise no runner lifecycle claim. |
| INV-CF-I08-001 | N/A | No revenue or integer-cent report arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No reporting date/state query. |
| INV-CF-I08-004 | N/A | No booking state expansion. |
| INV-CF-I08-005 | N/A | No reporting clock defaults or cross-surface operational mutation. |
| INV-SCOPE-001 | APPLIES | Changed files stay within F0.3 room-state shadow/reconciliation, explicitly required narrow unresolved-state UI, tests and evidence; no F0.4 or other Foundation/Blocks scope. |

## Validation and evidence

Required fresh evidence:

1. Mapper/unit corpus for all legacy statuses, supported target states, unsupported values, no-history and contradictory-history cases.
2. Executing synthetic D1 migration/rehearsal with complete relevant room/booking/room-night/hold/maintenance/HK rows; test dirty + occupied + maintenance, each independent dimension, duplicate open cases, orphan room/booking/claim/event, conflicting timelines and inventory overlap.
3. Exact per-hotel/per-class input/output counts, stable canonical checksums, source/schema/migration digest and mapping-version report; repeated same-source rehearsal must match byte-for-byte/canonical output.
4. Changed digest invalidation and stale snapshot rejection; injected failure at each staged hotel/checkpoint boundary, safe `INCOMPLETE`, deterministic restart; no false global success.
5. Cross-hotel isolation, exact no-drift on rejected/stale input, no fabricated historical case/event, partial-index/open-case uniqueness proof, and no row classified other than `MAPPED` reaching READY/SELLABLE.
6. If visible Rooms state is needed to satisfy the accepted evidence matrix: actual local Worker + synthetic D1 browser assertion for unresolved status at desktop and narrow viewport; no mock substitute. No new workflow-level browser redesign.
7. Full checks required by the changed scope: relevant executing-D1/unit tests, `npm run check`, `npm run types:check`, `npm run web:build` and budgets if web changed, `npm run architecture:fitness`, D1 query plans, `npm run wrangler:dry-run`, relevant CF-I09 migration regression (or focused equivalent plus CF-I09 if shared code changes), `git diff --check`, and scope/route audit. Record exact exits and fixtures.

### Development Gate

PASS only if every synthetic input is accounted for, deterministic outcomes reconcile exactly, same-input rerun is stable, source drift/interruption fails closed, all ambiguous/unresolved rows remain non-ready/non-sellable, relevant tenant boundaries hold, and any required Rooms UI visibly communicates unresolved truth. No real data is read or mutated. Green aggregate CI alone is insufficient.

### Critic / Human Gate

After fresh invariant evidence and Pre-Critic, require a genuinely independent read-only DB/data/cutover Critic on immutable A+B. No self-verdict. Human/data-risk authorization remains mandatory before any real-data inspection, adjudication, activation, write-freeze/cutover or irreversible action. A missing live-data policy does not block synthetic implementation; do not silently decide it.

### Recovery / stop conditions

Before any synthetic staged activation, abort without canonical writes. A failed synthetic stage is explicitly `INCOMPLETE` and restartable/reconcilable only against the same source digest; changed digest requires a new run. If a failure occurs after synthetic canonical test mutations, use disposable D1 recreation or a verified test-only forward repair, not destructive operations on shared data. Stop only if a binding-document contradiction, new data/product policy requirement, real-data action, or scope expansion is required. Routine defects are repaired autonomously. Do not begin F0.4 until F0.3 exact A+B receives its required review; do not begin Blocks A–H.
