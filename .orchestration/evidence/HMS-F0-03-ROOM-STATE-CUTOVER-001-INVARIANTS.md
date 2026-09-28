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
| Synthetic restart/drift rehearsal | Executing-D1 test-owned shadow tables only | `INCOMPLETE` survives interrupted/failed shadow batch; failed batch leaves zero shadow rows; same digest replay is deterministic/idempotent; drift yields a new digest and stale activation guard rejects | `legacy-cutover.executing-d1.test.ts`; canonical room dimensions and source events remain unchanged |
| Migration compatibility / uniqueness | Existing hotel migration chain, including 0020 | One OPEN maintenance case per room remains enforced after applying the complete migration chain | Executing-D1 duplicate-open insert regression |

## Synthetic fixture identity and reconciliation

The deterministic two-room rehearsal applies every existing `apps/api/schema/hotel-migrations/*.sql` file in order to a fresh Miniflare D1. It performs no live binding, customer-data read, canonical cutover or pricing mutation.

| Identity | SHA-256 |
|---|---|
| Executing-D1 schema manifest | `5eacbc95ee0f4db1842ad333075cbd87626a7b62339f0ea13dbbaa402a240672` |
| Full hotel migration source manifest | `051e64cb87d925427f20c04b69bf61a3b5a7bb58e5a2a8c938e201e2d5fda976` |
| Source snapshot digest | `7ad97a67e3df98cfe5148ce097ca2ec511628219362850785013088e2b60d355` |
| Canonical report checksum | `863e235a178d2a7b60e376d3738dc8ab40e71ba89e46b717b36bb87637537359` |
| Mapping version | `room-state-cutover-v1` |

The deterministic baseline has 2 input rooms and 2 output rooms; every input row is accounted (`input_record_count === accounted_input_record_count`). Row classes are `MAPPED: 1`, `REVIEW_REQUIRED: 1`; the mapped room is READY/SELLABLE from explicit independent dimensions, while the legacy AVAILABLE room with missing dimensions is `UNRESOLVED`/not sellable. The test fixes all four hashes as assertions and repeats mapping/replay to require an identical report checksum.

Interruption evidence marks one synthetic per-hotel run `INCOMPLETE`, injects a failing statement in the shadow-row batch, then asserts transaction rollback (zero shadow rows, run still `INCOMPLETE`). A subsequent replay writes two shadow rows and marks the run COMPLETE; a repeated mapping produces the same checksum and no duplicate rows. A deliberate synthetic service-state change changes source digest and trips the exact digest equality activation guard. The canonical room table differs only by that deliberate source mutation; the other room dimensions remain exactly unchanged. A separate pair of synthetic hotel D1s with the same room ID but different room data has distinct digests and no cross-store data access.

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
| INV-ATOMIC-001 | APPLIES | PASS | Injected D1 batch failure rolls back all shadow rows while retaining `INCOMPLETE`; stale digest guard rejects drift | Shadow-only, synthetic transaction; no canonical activation |
| INV-AUDIT-001 | APPLIES | PASS | D1 before/after assertions: no lifecycle/Housekeeping business events are written by mapping, restart or rejected activation | No fabricated operational history |
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
| INV-STATE-001 | APPLIES | PASS | Non-circular A then orchestration-only B publication; B records exact A and requires a fresh independent critic | Exact SHA is canonical in B; no self-approval |
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

## Pre-Critic findings and disposition

| Finding | Disposition |
|---|---|
| PC-F03-01 — unrelated bookings in different rooms on the same date were falsely treated as a room-night collision | Repaired: compare same `booking_id` + `stay_date`; unit regression proves separate stays map normally and same booking duplicated across rooms conflicts |
| PC-F03-02 — unrelated foreign-tenant events could inherit a local room’s MAPPED disposition | Repaired: check tenant before event-type allow-list; foreign source disposition is ORPHAN and room fails closed; regression added |
| PC-F03-03 — reassignment event column and `details.from_room_id` could disagree silently | Repaired: explicit conflict reason; both involved room rows fail closed; regression added |
| PC-F03-04 — concurrent source reads could produce a mixed digest snapshot | Repaired: all seven SELECTs now execute in one D1 batch transaction; Cloudflare's binding contract documents sequential transactional execution |
| PC-F03-05 — browser runner retained successful fixture due relative/absolute path guard mismatch | Repaired: fixture root is absolute; rerun verified exact fixture deletion and owned-process termination |
| Hilbert read-only DB/Data review — source completeness caveat | Closed within the contract boundary: all seven named mapping-relevant tables are read in one batch and every returned row is disposed; future source-schema additions must update the explicit query set and its manifest. No claim is made that the source D1 binding itself attests hotel identity or freezes live writes; those live-cutover policies remain explicitly prohibited and unresolved for the separate Human/data-risk gate. |

No material contradiction with frozen Blueprint/Reconciliation/Final Disposition was found. Independent Critic review remains pending for the exact immutable A+B pair. This evidence is the implementer Pre-Critic record, not an Independent Critic verdict and not a Foundation 0 aggregate PASS.

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
- [x] Artifact A is followed by an orchestration-only Boundary B recording the exact A SHA.
- [x] External Independent Critic is required; Codex does not self-approve a substantive PASS.
