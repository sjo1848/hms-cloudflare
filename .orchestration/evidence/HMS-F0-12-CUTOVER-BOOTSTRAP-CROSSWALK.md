# F0.12 — Frozen Cutover / Bootstrap Acceptance Crosswalk

Status: evidence consolidation in progress; dispositions below are evidence inventory, not a Development Gate verdict. Authority: the approved F0.12 Task Contract and `docs/implementation-roadmap/HMS-{ROOM-STATE-CUTOVER,ACTIVE-STAY-PRICING-BOOTSTRAP}-PLAN-V1.md`. All named rows are synthetic test assertions only.

## Room State Cutover Plan §6

| Acceptance criterion | Disposition | Exact proof / limitation |
|---|---|---|
| Source-to-target mapping table | PROVEN (synthetic mapper) | `apps/api/src/modules/room-state/legacy-cutover.test.ts`: “maps fully evidenced dimensions…”; `legacy-cutover.executing-d1.test.ts`: synthetic `ready-room` and `unknown-room`; source refs and report output are asserted. Does not establish actual legacy hotel mapping. |
| Edge-case corpus | PROVEN for the explicitly enumerated synthetic mapper cases; not the entire possible legacy corpus | Unit cases at `legacy-cutover.test.ts:82–327`: `NON_BLOCKING` advisory vs `BLOCKING`; occupied + blocking; legacy MAINTENANCE + NON_BLOCKING held; duplicate open case; orphan claim; unsupported status; date-range inventory/hold; stale event version; invalid interval; orphan source rows; cross-hotel event; collision; insufficient provenance; reassignment history/past claims. The plan's overall future/source-data corpus is not represented as complete. |
| Duplicate/orphan/unknown reports | PROVEN for synthetic cases | Mapper unit tests above; executing-D1 row counts exactly 2, output rows exactly 2, `unknown-room` is `REVIEW_REQUIRED/UNRESOLVED`; not defaulted READY. |
| Dry-run count/checksum reconciliation | PROVEN for the pinned synthetic fixture | Executing-D1 asserts `input_room_count=2`, `output_room_count=2`, all input records accounted, exact source/schema/migration/report digests (see F0.3 test). No live hotel report. |
| Migration rehearsal twice | PROVEN after two fresh invocations | Fresh command receipts are in `.orchestration/evidence/f0-12-runs/f03-clean-rehearsal-{1,2}.log`; each Vitest invocation creates isolated Miniflare D1 databases and applies the hotel migration chain. Both runs assert the same pinned schema `9860115abc7026d395c4b41ad65330ac73fb112b3781d32d95eb495aff2f6a9c`, migration `e17dfad84766271700b7c845e5a7e834a66360f5ce2ac9ad18fb36d1d3b7894d`, source `2793c1d9ef13dc08823afec83a0a9ac4bbe9325de37f8c84e5e56a2e72d2929f` and report `65c051291483a531c2abd514cf41adbcc4b7e7af72c9897373b4f2631d14b914` digests. |
| Injected failure/restart/idempotency | PROVEN in executing D1 | Injected statement failure leaves `INCOMPLETE/SOURCE_SNAPSHOT_CAPTURED` and zero shadow rows; restart reaches `STAGING/SHADOW_ROWS_WRITTEN`, then `COMPLETE`; replay stable; stale source digest rejected with exact side-effect equality. |
| Deterministic no-false-ready predicates | PROVEN for synthetic cases | `ready-room=READY_FOR_ARRIVAL/SELLABLE`; `unknown-room=UNRESOLVED/UNRESOLVED`; unresolved class excluded from simulated candidate set. This is test output, not current inventory. |
| Date-range inventory and hold validation | PROVEN for mapper predicates; execution scope | Unit test “distinguishes date-range inventory/hold blockers…” checks intersecting interval and edge-touching non-overlap, then digest invalidation. Not a live inventory query. |
| One-open-maintenance uniqueness | PROVEN in full-chain executing D1 | Same test applies all hotel migrations; one OPEN `case-a` remains and duplicate OPEN `case-b` is rejected by D1. |
| Tenant isolation | PROVEN for the tested synthetic mapper/D1 separation only | F0.3 creates two independent minimal D1s with the same room ID and verifies each mapper's hotel identity/digest and room rows stay local. It does not test F0.3 cutover checkpoints or production routing/authorization. F0.6 separately verifies synthetic bootstrap run/segment isolation in two D1s. |
| Event/provenance assertions | PROVEN for the specifically tested provenance predicates and unchanged canonical event tables; no general audit-event claim | Mapper unit tests reject unrelated, weak-provenance and foreign-hotel source events. F0.3 executing-D1 snapshots canonical lifecycle/housekeeping events across shadow/simulation/stale reject and verifies no synthetic cutover audit event is fabricated. F0.6 activation asserts actor/hotel/request provenance on generated pricing segments; this is not general lifecycle/financial event provenance. |
| Post-activation verification | PROVEN only as test-scoped simulation; real criterion N/A | F0.3 writes a `f03_shadow_activation_simulations` synthetic marker after digest gate and verifies canonical rooms unchanged; stale digest creates no marker/drift. This is not canonical room-state activation. |
| Real-data cutover | NOT_APPLICABLE / PROHIBITED | Explicitly outside this authorization; no source/customer binding or actual activation/readiness assertion. |

## Active-Stay Pricing Bootstrap Plan §§3–5

| Acceptance criterion | Disposition | Exact proof / limitation |
|---|---|---|
| Date boundaries | PROVEN for the tested synthetic interval/effective-date cases only | F0.4 `reassignment-interval.executing-d1.test.ts` asserts before/equal check-in behavior and overrun; F0.6 `active-stay-pricing-bootstrap.executing-d1.test.ts` seeds a bounded synthetic stay and classifies explicit source segment intervals. This is not a full calendar boundary matrix. |
| Room/rate changes | PROVEN for the tested traceable synthetic segment inputs and stale-snapshot guards | F0.6 activates only the source-backed `stay-a` segment set, and guards subsequent canonical source drift. The suite does not assert a broad independent room-change × rate-change matrix; today's room price is never inferred as historical price. |
| Extra charges | PROVEN | F0.6 exact charge preservation across synthetic activation; F0.9 extra-charge tests are separate and do not change the bootstrap result. |
| Partial/full/overpaid accounts | PROVEN for classification; exact activation preservation is proven only for the partial-paid `stay-a` case | The manifest classifies full-paid and overpaid-credit variants. Executing-D1 activation compares exact booking/account/ledger snapshots for partial-paid `stay-a`; it does not activate full-paid or overpaid variants. No broader preservation claim is made. |
| VOIDED and account mismatch | PROVEN for classification and held disposition, not independent activation attempts | The synthetic manifest asserts `VOIDED/HELD` and `ACCOUNT_MISMATCH/HELD`; only `stay-a` is activated. The crosswalk does not claim activation attempts against those held rows. |
| Duplicate retry/replay | PROVEN | Identical synthetic activation replay is idempotent; exact segment/event/financial state assertions. |
| Missing/aggregate-only history | PROVEN | Missing or aggregate-only history classified `TRACEABLE_AGGREGATE_ONLY/HELD`; no even-split/historical price inference. |
| Conflict and duplicate identities | PROVEN | `conflict=ORPHAN_OR_CONFLICT/HELD`; duplicate room snapshot identity quarantined rather than collapsed. |
| Tenant isolation | PROVEN | Two separate operational D1 databases keep checkpoints/activation data isolated. |
| Interruption/restart | PROVEN for shadow-stage restart and atomic activation rollback; process-kill during canonical activation is not claimed | Injected shadow-stage failure rolls back and same-manifest restart resumes. A later canonical segment insert failure rolls back all activation writes. There is no process termination/restart simulated midway through canonical activation. |
| Source/account drift and ABA | PROVEN | Changed payment truth despite equal count and source digest supersession rejected with zero activation drift; inventory ABA rejected when visible room-night keys return. |
| Exact preservation | PROVEN for the asserted partial-paid `stay-a` snapshot | Before/after booking total/status/room/pricing version, charges, invoice including `paid_at`, complete payment rows, room/inventory/lifecycle/financial event rows are compared for `stay-a`; no fabricated payment entries. The equality proof is not extrapolated to full-paid/overpaid variants that were classification-only. |
| Real-data bootstrap | NOT_APPLICABLE / PROHIBITED | No customer data read or mutation; synthetic isolated D1 only. No historical-allocation policy is inferred. |

## Synthetic record interpretation

- `hotel-synthetic-a`: two source rows only within the test; `ready-room` maps to `READY_FOR_ARRIVAL` and is sellable for the asserted interval; `unknown-room` stays unresolved and not sellable. Separate `Hotel Norte` browser fixture is not this D1 and has three unresolved synthetic rooms.
- `synthetic-hotel`: `stay-a` is the sole synthetic `TRACEABLE_SEGMENTS` candidate; `aggregate`, `conflict`, `mismatch`, `voided` remain held. `full-paid` and `overpaid-credit` are explicit financial test variants. These names describe fixtures, not actual/persistent hotel inventory.
- F0.3 test-scoped activation marker and F0.6 synthetic activation that writes pricing segments in an isolated test D1 are distinct mechanisms. Neither grants live activation authority.

Every `PROVEN` above is bounded to the exact synthetic test assertion. If the fresh required invocation does not complete with exit 0, its receipt is UNPROVEN and the aggregate gate must remain INCOMPLETE.

## Read-only DB/Data reviewer disposition

Raman (separate GPT-6 Luna Medium, read-only) reviewed this crosswalk and the named code/tests. Initial feedback narrowed broad wording and requested exact fresh-run receipts. The rows above now distinguish test-classifier coverage from activation/preservation, minimal-D1 isolation from checkpoint/routing isolation, source-event input validation from emitted audit events, and shadow restart from canonical activation rollback. The reviewer supplied no new product/data policy and did not issue an aggregate verdict. Follow-up confirmation is recorded separately before publication.
