# HMS-F0-03-ROOM-STATE-CUTOVER-001 — Invariant Evidence

Artifact candidate: F0.3 source state on `impl/hms-foundation-0`; exact Artifact A SHA is recorded by the following orchestration Boundary B.
Task Contract: `.orchestration/contracts/HMS-F0-03-ROOM-STATE-CUTOVER-001.md`
Binding sources: Blueprint 001, Reconciliation 007 Amendment A, Final Disposition 008, Roadmap A2/B2, `.orchestration/INVARIANTS.md`, `.orchestration/PRECRITIC-GATE.md`.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Deterministic shadow mapping | New pure mapper in `apps/api/src/modules/room-state/legacy-cutover.ts`; existing F0.1 `domain.ts` and `read-model.ts` | Only direct, consistent evidence maps; unknown or insufficient source stays `REVIEW_REQUIRED`/unresolved, never READY/sellable | `legacy-cutover.test.ts`, `legacy-cutover.executing-d1.test.ts`; exact fixture identities/checksums below |
| Complete source accounting/provenance | Mapper snapshot/report | Every row in the seven extracted source arrays receives one hotel-scoped disposition; orphan/foreign rows remain explicit; source refs, mapping rule/version, digests and counts are emitted | Unit orphan/foreign tests; D1 exact count/checksum assertions |
| Coherent source snapshot | `readLegacyRoomStateSnapshot()` | Seven source-table SELECTs use one sequential D1 `batch`; source digest covers the complete returned snapshot plus schema/migration identity | Executing-D1 tests; Cloudflare documents `batch()` as sequential transactional statements [D1 `batch()` contract](https://developers.cloudflare.com/d1/worker-api/d1-database/) |
| Assignment and room-night reconciliation | Mapper + lifecycle event evidence | Reassignment history is contiguous, provenance-consistent and agrees with booking assignment and every expected night; duplicate claim of the same booking/night across rooms is conflict; independent bookings in different rooms on the same night remain valid | Unit valid/invalid reassignment and separate-booking/collision cases; executing-D1 report accounting |
| Safe room readiness exposure | `apps/api/src/modules/room-state/read-model.ts`, `apps/web/src/features/rooms/RoomsPage.tsx`, `apps/web/src/domain/types.ts`, `rooms-operational.css` | Legacy AVAILABLE does not display as ready; unresolved is visible in card/detail and excluded from ready count | Executing-D1 Rooms API route regression and real Worker+D1 desktop/390px browser assertions/screenshots |
| Synthetic restart/drift rehearsal | Executing-D1 test-owned shadow tables and test-only activation simulation only | Restart from `SOURCE_SNAPSHOT_CAPTURED` resumes staging; restart from `SHADOW_ROWS_WRITTEN` verifies persisted output and advances to `COMPLETE`; replay from `COMPLETE` is idempotent. Injected batch failure rolls back shadow rows and leaves the prior checkpoint. A stale activation request is denied before writes, with exact before/after comparison of shadow runs/rows, synthetic approval markers, canonical room state, and business events. | `legacy-cutover.executing-d1.test.ts`; exact assertions and updated fixture identities below |
| Migration compatibility / uniqueness | Existing hotel migration chain, including 0020 | One OPEN maintenance case per room remains enforced after applying the complete migration chain | Executing-D1 duplicate-open insert regression |

## Synthetic fixture identity and reconciliation

The deterministic two-room rehearsal applies every existing `apps/api/schema/hotel-migrations/*.sql` file in order to a fresh Miniflare D1. It performs no live binding, customer-data read, canonical cutover or pricing mutation.

| Identity | SHA-256 |
|---|---|
| Executing-D1 schema manifest | `f4f26e960ce4058ccaf218e31f7c5b9807fa5e5e93b2f3fe8c8384cfbeec6431` |
| Full hotel migration source manifest | `051e64cb87d925427f20c04b69bf61a3b5a7bb58e5a2a8c938e201e2d5fda976` |
| Source snapshot digest | `479681109794c806447a783e0b8a758500206fe15937110d03cef0884fb78ed4` |
| Canonical report checksum | `c6699ec7bd4a58f08701aef3247b65bc1f73199af335bc4d08c40ad84345a7db` |
| Mapping version | `room-state-cutover-v1` |

The deterministic baseline has 2 input rooms and 2 output rooms; every input row is accounted (`input_record_count === accounted_input_record_count`). Row classes are `MAPPED: 1`, `REVIEW_REQUIRED: 1`; the mapped room is READY/SELLABLE from explicit independent dimensions, while the legacy AVAILABLE room with missing dimensions is `UNRESOLVED`/not sellable. The test fixes all four hashes as assertions and repeats mapping/replay to require an identical report checksum.

Interruption evidence persists `INCOMPLETE/SOURCE_SNAPSHOT_CAPTURED` with zero rows and injects a failing statement after a shadow-row insert; transactional rollback leaves zero rows and the original checkpoint. The test then invokes `resumeSyntheticShadow()` while the run is still INCOMPLETE. That recovery branch writes two rows and advances to `STAGING/SHADOW_ROWS_WRITTEN`. Simulated process loss there is followed by a second invocation that verifies the exact persisted rows and advances to `COMPLETE`. A further restart from `COMPLETE` keeps row count/checksum stable. A test-only activation request using the current digest is accepted into a test-only marker table; after deliberate synthetic service-state drift, a request against the prior digest is denied. Exact before/after snapshots prove the stale request changes no checkpoint, shadow row, simulated-approval marker, Housekeeping/lifecycle event, or canonical room state. The only canonical room difference is the deliberate source mutation before the stale request. A separate pair of synthetic hotel D1s with the same room ID but different room data has distinct digests and no cross-store data access. The activation helper/table exist only in this test and do not implement or claim production activation.

The D1 rehearsal creates only test-scoped `f03_shadow_runs` / `f03_shadow_rows` tables. These are not production migrations or an activation system. No schema migration file was added or modified.

## Browser/integration evidence

Command: `bash scripts/f03-room-state-browser.sh` (fresh local synthetic fixture, `wrangler dev --local`, actual API Worker + D1, Vite, Playwright). Result: PASS on desktop `1280×800` and narrow viewport `390×844`: `/api/v1/rooms` returned 3 rooms, all 3 `UNRESOLVED`; the visible Spanish status was present in the list and selected-room detail; “Lista para el ingreso” metric was `0`; Hotel Norte context was rendered. Screenshots:

- `output/playwright/f03-rooms-desktop.png`
- `output/playwright/f03-rooms-desktop-selected.png`
- `output/playwright/f03-rooms-mobile.png`

Post-run synthetic D1 audit: `{ rooms: 3, bookings: 3, payment_entries: 0, housekeeping_events: 0, lifecycle_events: 0, canonical_state: "UNCHANGED" }`. The runner terminated and verified its owned browser/Worker/Vite process groups before PASS and removed the run fixture. An earlier failed-cleanup-guard fixture and two prior task-owned synthetic temp fixtures were moved to desktop trash after process absence was verified. The browser log’s only console error is the local app’s missing `/favicon.ico` (404); all contracted assertions passed. The UI check is read-only and does not prove live cutover or any real hotel status.

## Fresh validation

Final full gate after implementation/test changes:

| Command | Result |
|---|---|
| `npm run check` | PASS, 29 files / 116 tests |
| `npm run types:check` | PASS, API + Web Wrangler types current |
| `npm run web:build` | PASS; JS raw `296633/300000` bytes, gzip `86178`; CSS raw `39735/50000`, gzip `7838` |
| `npm run architecture:fitness` | PASS; architecture checks, i18n coverage and Cloudflare budgets |
| `npm run test:d1-query-plan` | PASS; arrival/checkout indexes and keyed inventory |
| `npm run wrangler:dry-run` | PASS; API and Web; no deployment |
| `bash -n scripts/f03-room-state-browser.sh` | PASS |
| `bash scripts/f03-room-state-browser.sh` | PASS; real local Worker/D1, desktop + 390px browser; cleanup and synthetic D1 assertions passed |
| `git diff --check` | PASS |

Test-harness note: an intermediate `npm run check` failed four D1 tests at the repository’s 5-second default while multiple full hotel-migration fixtures were competing. The uniqueness regression was moved into the already-migrated F0.3 fixture, eliminating an extra full migration-chain Miniflare database. The remaining full-chain interruption/replay case measured 6.023 seconds when isolated; it now has a 10-second timeout scoped only to that one integration test. There are no sleeps and no global/Vitest project timeout changes. The final default `npm run check` above passed all tests with `--maxWorkers=2` unchanged.

The executing-D1 test applies the full existing hotel migration chain to fresh synthetic databases and tests the 0020 one-open-case partial unique index. `CF-I09` was not rerun: no shared migration/rehearsal script or migration was changed; this focused test is the applicable F0.3 migration-chain equivalent, not a claim that the separate backup/restore regression ran.

## Invariant registry

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Executing-D1 assertions cover rollback to `INCOMPLETE/SOURCE_SNAPSHOT_CAPTURED`, recovery from both durable checkpoints, idempotent COMPLETE replay, current-digest guard acceptance, stale-request denial, and exact zero-side-effect snapshots around rejection | Test-only shadow/activation simulation; no production activation or canonical mutation |
| INV-AUDIT-001 | APPLIES | PASS | D1 before/after assertions show no lifecycle/Housekeeping business events from mapping, restart, current synthetic guard acceptance or stale rejection | No fabricated operational history; synthetic approval marker is isolated and explicitly test-only |
| INV-DOMAIN-001 | APPLIES | PASS | Diff/route audit: pure mapper and read-only Rooms projection; no generic domain mutation/API was added | Shadow mapping never mutates product domain |
| INV-TENANT-001 | APPLIES | PASS | Two synthetic D1s plus foreign event/disposition adversarial test; no cross-store read/write; foreign row disposition is ORPHAN | Storage boundary is the routed hotel-local D1 |
| INV-RBAC-001 | APPLIES | PASS | Existing Rooms read route test asserts authorized hotel projection and denied role; no new capability or weaker frontend authority | `room-state-route.executing-d1.test.ts` |
| INV-PARITY-001 | APPLIES | PASS | Positive and negative corpus covers supported independent dimensions, occupied+maintenance, advisory/blocking, ambiguous AVAILABLE, reassignment history and inventory truth | Frozen 001/007/008 semantics retained |
| INV-ENUM-001 | APPLIES | PASS | Supported legacy/status/impact values and unsupported values tested; unknown state remains non-ready/unresolved | Mapper and API/UI projection retain canonical values |
| INV-UX-001 | APPLIES | PASS | Targeted read-only Rooms browser verifies selected room, visible unresolved reason, status count, hotel context at desktop and mobile | Narrow truthful-status exposure only; no workflow redesign |
| INV-ORDER-001 | N/A | N/A | No queue ranking, deduplication or next-item behavior changed | — |
| INV-RESP-001 | APPLIES | PASS | Real Worker/D1/browser exercises unresolved card and selected-room detail at 1280px and 390px | Screenshots are diagnostic, executable assertions are primary |
| INV-EVID-001 | APPLIES | PASS | Every claim above maps to a named test, assertion, command or screenshot; mock/live-data claims excluded | — |
| INV-LEGACY-001 | APPLIES | PASS | Ambiguous/foreign/orphan rows retain identifiers and quarantine class; exact D1 assertions show zero generated operational events/cases | No anonymous recovery record synthesized |
| INV-MONEY-001 | N/A | N/A | No financial amount, invoice, payment, charge or settlement is read or changed | D1 browser audit confirms zero payment entries in fixture |
| INV-STATE-001 | APPLIES | PASS | This rework will publish immutable Artifact A3, then orchestration-only Boundary B3 recording exact A3 and requiring a fresh independent critic | Prior A+B and A2+B2 REWORKs remain preserved; no self-approval |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit route or capability authority changed | — |
| INV-CF-I07-002 | N/A | N/A | No administrative mutation | — |
| INV-CF-I07-003 | N/A | N/A | No role downgrade | — |
| INV-CF-I07-004 | APPLIES | PASS | Runner verifies browser, Worker and Vite process groups are gone before terminal PASS; fixture cleanup verified | Cleanup guard itself was repaired and rerun |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic | — |
| INV-CF-I08-002 | N/A | N/A | No network aggregation | — |
| INV-CF-I08-003 | N/A | N/A | No reporting query/date predicate | — |
| INV-CF-I08-004 | N/A | N/A | No booking-state expansion | — |
| INV-CF-I08-005 | N/A | N/A | No reporting clock default or cross-surface mutation | — |
| INV-SCOPE-001 | APPLIES | PASS | Diff contains mapper/tests/read-only Rooms readiness presentation/browser/evidence only; no migration change, F0.4, Blocks A–H, cutover, pricing, PR or deploy | Task Contract boundary retained |

## Initial Independent Critic findings and bounded rework

The first exact A+B pair (`c4af224c0454b34ea2201db7f5726de446668aad` + `23de5ab46f68ce2a5c060bc9ff11c7c22ed6475d`) received `REWORK` from Pauli (fresh read-only GPT-6 Luna Medium). The second exact pair, A2 `3980ef3db3a4e0cb96f7102705d2719777d84f26` + B2 `80177b1a64aa993e983748366de74c4f49557084`, received `REWORK` from Lorentz (fresh read-only GPT-6 Luna Medium): the stale-request proof was accepted; a HIGH finding remained because the test bypassed the INCOMPLETE recovery helper branch; a MEDIUM finding identified the inaccurate `HUMAN_ACTION_REQUIRED` status for external review. The recovery test is repaired in the current artifact; orchestration now records Critic REWORK as technical rework in progress, not a human-only action. Neither review issued substantive PASS. This evidence is implementer-side only; the corrected exact A3+B3 pair requires another Independent Critic review before F0.4.

| Critic finding | Repair/evidence |
|---|---|
| HIGH — stale-digest guard was only reconstructed as a local boolean; no activation request or exact zero-write proof | Test-only `requestSyntheticActivationSimulation()` now re-reads executing D1, checks digest/completion/checksum/checkpoint, records only accepted synthetic requests, and is invoked for both fresh and stale snapshots. The stale case snapshots all shadow/checkpoint/approval/event side effects and canonical room rows before and after; exact equality is asserted. |
| HIGH — staged checkpoint restart coverage was absent | A2 added the staged-state test, but the A2 critic found its initial recovery path called the staging helper directly. The current test now starts `resumeSyntheticShadow()` from the persisted INCOMPLETE checkpoint and asserts it advances to STAGING; a second invocation resumes STAGING to COMPLETE; replay from COMPLETE is idempotent. |
| MEDIUM — B2 classified an automated external review as HUMAN_ACTION_REQUIRED | Corrected in the orchestration-only boundary following the current Artifact A: critic REWORK is recorded as technical rework in progress (`RUNNING`, no Human Gate), and a new external-review-required state is set only when the corrected artifact is frozen for review. |
| Evidence overclaimed checkpoint recovery | Evidence now states precisely that the recovery helper is invoked in the INCOMPLETE branch, followed by a separate invocation from STAGING; exact hashes/claims for each immutable pair are preserved above. |

## Pre-Critic findings and disposition

| Finding | Disposition |
|---|---|
| PC-F03-01 — unrelated bookings in different rooms on the same date were falsely treated as a room-night collision | Repaired: compare same `booking_id` + `stay_date`; unit regression proves separate stays map normally and same booking duplicated across rooms conflicts |
| PC-F03-02 — unrelated foreign-tenant events could inherit a local room’s MAPPED disposition | Repaired: check tenant before event-type allow-list; foreign source disposition is ORPHAN and room fails closed; regression added |
| PC-F03-03 — reassignment event column and `details.from_room_id` could disagree silently | Repaired: explicit conflict reason; both involved room rows fail closed; regression added |
| PC-F03-04 — concurrent source reads could produce a mixed digest snapshot | Repaired: all seven SELECTs now execute in one D1 batch transaction; Cloudflare's binding contract documents sequential transactional execution |
| PC-F03-05 — browser runner retained successful fixture due relative/absolute path guard mismatch | Repaired: fixture root is absolute; rerun verified exact fixture deletion and owned-process termination |
| Hilbert read-only DB/Data review — source completeness caveat | Closed within the contract boundary: all seven named mapping-relevant tables are read in one batch and every returned row is disposed; future source-schema additions must update the explicit query set and its manifest. No claim is made that the source D1 binding itself attests hotel identity or freezes live writes; those live-cutover policies remain explicitly prohibited and unresolved for the separate Human/data-risk gate. |

No material contradiction with frozen Blueprint/Reconciliation/Final Disposition was found. A fresh Independent Critic review remains required for the exact immutable A3+B3 pair. This evidence is the implementer Pre-Critic record, not an Independent Critic verdict and not a Foundation 0 aggregate PASS.

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Legacy state mapping | None; pure transformation | No mutation/success state exists to misreport | No product audit/event rows | Unit + executing-D1 no-drift assertions |
| Synthetic shadow rehearsal | Test-only transactional inserts/UPSERT keyed by hotel/digest/version | Failed batch rejects and rolls back rows; `INCOMPLETE` checkpoint remains | No business events; repeated keyed writes create no duplicate rows | Injected failure, replay/idempotency and stale digest executing-D1 test |
| Rooms readiness read | Read-only existing `/api/v1/rooms` | Existing route contract applies | No event | Existing route tenant/RBAC test and real Worker/D1 browser |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN for the F0.3 artifact candidate.
- [x] Full Task Contract validation passed against synthetic/local-only boundaries.
- [x] Scope audit passed.
- [x] Artifact A3 is followed by an orchestration-only Boundary B3 recording the exact A3 SHA.
- [x] External Independent Critic is required; Codex does not self-approve a substantive PASS.
