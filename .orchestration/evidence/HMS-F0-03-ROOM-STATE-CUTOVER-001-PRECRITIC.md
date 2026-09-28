# HMS-F0-03-ROOM-STATE-CUTOVER-001 — Mandatory Pre-Critic Gate

Status: implementer pre-Critic only; it is not an Independent Critic verdict.
Authority: frozen Blueprint 001, Reconciliation 007 Amendment A, Final Disposition 008; Roadmap A2/B2; task contract `.orchestration/contracts/HMS-F0-03-ROOM-STATE-CUTOVER-001.md`.

## 1. Contract completeness

- F0.3 Task Contract exists and lists scope, forbidden actions, required surfaces, failure behavior and all registry invariant IDs before implementation.
- This increment is only deterministic room-state shadow mapping/reconciliation plus minimal truthful Rooms readiness display. No cutover policy, live-data adjudication, migration/backfill, UI workflow, F0.4 or Blocks A–H was chosen or implemented.
- No unresolved product decision was converted into a mapper default. Ambiguous legacy data remains `REVIEW_REQUIRED`, `CONFLICT`, `ORPHAN`, `DUPLICATE_OPEN_CASE`, or `UNSUPPORTED_VALUE`, with unresolved readiness/sellability.

## 2. Source parity pre-flight

- Kept Occupancy, Housekeeping, Maintenance Impact, Service, Readiness and date-range Sellability separate and derived via accepted F0.1 semantics.
- `AVAILABLE` alone does not prove READY or `IN_SERVICE`; legacy `MAINTENANCE` does not invent hidden Housekeeping evidence. `NON_BLOCKING` is advisory; `BLOCKING` blocks readiness/sellability while occupancy can remain OCCUPIED.
- Active booking nights are checked against event-backed reassignment history, including elapsed nights; different reservations in different rooms on the same date are not a collision, but one booking/night claimed in two rooms is.
- Existing route capability and API shape are unchanged. UI labels unresolved state and does not count it ready. This is not a workflow redesign.
- No queue order, money, report, capability set, historical migration, source workflow or enum meaning changed.

## 3. Mutation/concurrency sweep

- Product mapper is pure; source extraction is read-only and all seven mapping-relevant table SELECTs are sent in one D1 batch. Report digest includes hotel/date/range/schema/migration identities and canonicalized complete returned source arrays.
- No product business-state mutation, activation, event insertion or financial operation was added. Synthetic shadow tables exist only inside disposable executing-D1 tests.
- Synthetic checkpoint execution persists `INCOMPLETE/SOURCE_SNAPSHOT_CAPTURED`; an injected failed row batch rolls back every row and preserves that checkpoint. Resume writes the rows and `STAGING/SHADOW_ROWS_WRITTEN`; restart validates the durable rows before `COMPLETE`; a further COMPLETE replay is idempotent. A test-only activation-request function re-reads and maps executing D1. The fresh digest accepts only into a test-owned marker table; after source drift the stale request is denied and exact before/after snapshots assert zero change to shadow runs/rows, approval markers, room state, or Housekeeping/lifecycle events.
- The F0.3 data reviewer’s findings were repaired and follow-up rechecked: source hotel is checked before event-type allow-list, each disposition verifies the row’s explicit hotel ID, contradictory reassignment `from_room_id` representations are conflicts, and cross-room collision semantics include booking identity.
- No business audit/event side effects are produced by mapping. Executing-D1 assertions check zero Housekeeping/lifecycle events and payment entries in the integrated synthetic browser fixture.

## 4. Security sweep

- No new API route or capability was introduced. Existing `/api/v1/rooms` remains the protected read boundary.
- Executing-D1 route regression asserts the selected hotel’s projection and rejects an unauthorized role; two isolated synthetic D1s reuse the same room ID without sharing data.
- Explicit foreign event identity is surfaced as an ORPHAN disposition and fails the associated room closed. Storage routing remains the authoritative tenant boundary; this task does not claim that a D1 binding can self-attest its hotel identity.

## 5. UX parity sweep

- The only UI change replaces legacy `Room.status` as the readiness label/count source with existing authoritative `operational_state.readiness`; unresolved rooms are explicitly labeled and not counted READY.
- No action hierarchy, booking queue, workflow structure, component system, navigation or business interaction was changed.
- Actual local Worker+D1 browser assertions verify list and selected-room detail at 1280×800 and 390×844 while preserving hotel context.

## 6. Browser evidence sweep

- `scripts/f03-room-state-browser.sh` launches a fresh synthetic fixture, local Wrangler Worker, Vite and Playwright. The final application-code browser run passed both desktop and 390px assertions, including real `/api/v1/rooms` payload state and zero-ready metric.
- It then stops and verifies its owned process groups, audits synthetic D1 for unchanged canonical dimensions/zero events/zero payment rows, and removes the exact owned fixture before the terminal PASS message.
- Durable screenshots are diagnostic only; browser assertions are the primary UI evidence. The sole console error is the local missing favicon 404, unrelated to the asserted Rooms interaction.

## 7. Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Complete mapping of the seven declared source arrays | `readLegacyRoomStateSnapshot()` fixed query set, source dispositions and counts; unit/D1 tests | Executing D1 + static |
| Stable synthetic source/result identity | Four fixed SHA-256 assertions in executing-D1 baseline test; same-input report replay | Executing D1 |
| Failure-safe staged restart and stale-request behavior | Executing-D1 assertions for failure rollback; restart from `SOURCE_SNAPSHOT_CAPTURED` and `SHADOW_ROWS_WRITTEN`; idempotent COMPLETE replay; accepted current digest; stale request rejection; exact zero-side-effect table snapshots | Executing D1 |
| Rooms API tenant/capability remains protected | Existing executing-D1 route test in `npm run check` | Executing D1/API |
| Operator sees unresolved rather than false-ready state | `scripts/f03-room-state-browser.playwright.js` with local Worker+D1 plus three screenshots | Integrated browser |
| No real records or canonical room values were mutated | Fresh synthetic paths only; runner D1 audit `canonical_state: UNCHANGED`; no migration or live binding used | Local synthetic |
| Build/architecture/query-plan/dry-run gates | Exact commands and measured results in companion `...-INVARIANTS.md` | Local validation |

## 8. Full regression and scope audit

- Fresh full checks: `npm run check`, `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, `git diff --check`, and runner `bash -n`.
- A transient full-suite run timed out several executing-D1 tests at the repository default while the F0.3 test created an additional full-migration D1. The extra D1 was removed by folding the unique-open-case assertion into the existing migrated fixture; measured F0.3 full-chain test runtime was 6.023s, so only that one integration test has a 10s allowance. No sleep or global timeout change. A subsequent default `npm run check` passed at unchanged `--maxWorkers=2`.
- No migration files changed; no shared migration/rehearsal code changed. The executing-D1 suite applies the full existing hotel migration chain and specifically verifies the 0020 open-case unique index. Separate CF-I09 backup/restore regression is not claimed as run.
- Diff scope is limited to the pure F0.3 mapper/tests, truthful unresolved display in Rooms, owned local browser harness/evidence and orchestration records.
- No production, live customer D1, real-data cutover, pricing bootstrap, PR, merge, main, staging or deploy action occurred.

## 9. Adversarial findings and repairs

| Finding | Repair/evidence |
|---|---|
| Any other room’s same-date reservation caused false collision | Require same booking ID and night; separate-stay and true duplicated-booking tests |
| Foreign event with unrelated type could pass local mapping | Tenant identity checked before event allow-list; foreign disposition ORPHAN test |
| Reassignment row column/details could disagree | `REASSIGN_HISTORY_FROM_ROOM_MISMATCH` conflict and regression |
| Parallel independent reads could mix source instants | Seven SELECTs moved into one transactional D1 batch; official Cloudflare binding contract documented in evidence |
| Successful browser run retained fixture due path-form mismatch | Absolute temp path and repeat run proved process/fixture cleanup |
| One-open-case uniqueness was only implicit | Executing-D1 duplicate OPEN insert is rejected; exactly one case remains |

Read-only DB/Data reviewer Hilbert rechecked the earlier mapper findings; that review did not cover the subsequent Independent Critic findings. The initial exact A+B pair received `REWORK` from Pauli (fresh read-only GPT-6 Luna Medium): (1) stale digest denial had not been exercised as a request with zero-write assertions; (2) staged checkpoint restart was not covered. The current test/evidence adds both cases; this remains implementer evidence, not an Independent Critic verdict. Live source-write freeze and D1 identity attestation remain outside the synthetic scope.

## 10. Publication readiness

- [x] Applicable invariants are PASS; N/A entries carry explicit scope rationale in companion invariant evidence.
- [x] No migration history was edited; no live data/binding/canonical write was used.
- [x] Every material claim is tied to executable or static evidence and the limitations above are explicit.
- [x] Re-ran `npm run check` (29 files / 116 tests), `npm run types:check`, `npm run web:build`, `npm run architecture:fitness` (architecture, i18n and Cloudflare budgets), `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, and `git diff --check`; all PASS. The executing-D1 rework test passes 2/2. Product runtime/UI files are unchanged by this rework, so the existing real local Worker+D1 desktop/mobile evidence remains scoped to the identical product code.
- [ ] Publish immutable Artifact A2, then orchestration-only Boundary B2 with exact SHAs and the Independent Critic REWORK history.
- [ ] Do not start F0.4 until a fresh Independent Critic reviews the exact A2+B2 pair and canonical state authorizes continuation.

This Pre-Critic record is not a self-approved F0.3 substantive PASS and does not close Foundation 0.
