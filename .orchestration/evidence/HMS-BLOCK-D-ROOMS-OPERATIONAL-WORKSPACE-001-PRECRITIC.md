# HMS Block D Rooms — Pre-Critic Gate

Status: **PRE-IMPLEMENTATION ADMISSION PASS; FINAL IMPLEMENTATION GATE PASS**. The original admission below was frozen before product code. The final gate was completed before Artifact A. This is not an Independent Critic verdict.

## Scope and authority

- Exact base and checkpoint: `044ad756b0081d2a54083ea89c782557e97a351f`; dedicated clean worktree `impl/hms-block-d-rooms`.
- Human authorized Block D — Rooms only. Existing C/B workflows are compatibility dependencies, not reopened work. E–H are not authorized; no promotion, real data, staging, Product Acceptance, PR, merge, main, deploy or production.
- Product surfaces/workflows and API/capability guards are enumerated in `...-INVENTORY.md`; requirement-to-evidence rows D-01–D-12 are frozen in `...-EVIDENCE-MATRIX.md`.
- Room dimensions/readiness/range sellability have existing F0 domain/read-model semantics. The proposed optional range read is an additive use of the already approved Block D read model and existing F0 predicate; it adds no new domain rule, command, schema or route. `/rooms/available` is expressly not treated as canonical.

## Adversarial pre-code checks

1. **Physical vs interval truth:** the UI must never label an `AVAILABLE` legacy status as Ready or Sellable. Test occupied-but-nonoverlapping future inventory, dirty/cleaning but in-service, service OOO, BLOCKING and NON_BLOCKING maintenance, overlapping room-night claim/hold, touching half-open boundaries and unresolved service evidence.
2. **Maintenance does not overwrite housekeeping:** preserve `OCCUPIED + BLOCKING`, `DIRTY + BLOCKING`, and unknown combinations as separate facts; no Room state control is exposed.
3. **Stale mutation and context:** selected room A → select B while holds/context requests are pending; A response cannot update B. Hold edit/create 409 leaves authoritative data and selection intact; server remains final overlap authority.
4. **Capability/tenant:** authenticated allowed read/write and denied room/booking/guest/maintenance context by actual capability; active membership/tenant proven first; no cross-hotel row/link leakage or zero-write claim from an earlier guard.
5. **Mobile and navigation:** URL reload/deep link selects exact room; Back/Forward restores board/detail, filters and scroll; at 320×700 / 844×390, keyboard actions, selected-room return and hold controls remain reachable. No desktop stack as mobile model.
6. **CSS budget:** only 63 raw CSS bytes remain. Reuse shared styles and remove superseded Rooms CSS before any net addition; after production build all unchanged raw/gzip ceilings must pass or optimize before the required `BUNDLE_BUDGET_GATE_REQUIRED` stop.
7. **Boundary:** no Housekeeping or Maintenance mutations/workflow controls, and no edits to those product modules. Hold APIs and room metadata APIs are the only existing mutations in scope.

## Gate result

**PRE-IMPLEMENTATION CONTRACT GATE: PASS.** Scope is source-backed by the approved D contract; API/capability boundaries are explicit; all 24 invariants are classified; matrix and evidence paths are defined. The existing read-model requirement and F0 predicate support interval evaluation without new domain semantics. No unresolved product policy, material architecture change or unapproved backend contract is being assumed. Product implementation may begin under the frozen Task Contract. This result does not waive final implementation Pre-Critic or Independent Critic.

## Final implementation Pre-Critic (before Artifact A)

Task Contract: `.orchestration/contracts/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001.md`
Final evidence: `.orchestration/evidence/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001-RESULTS.md`
Invariant evidence: `.orchestration/evidence/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001-INVARIANTS.md`

| Gate area | Status | Evidence |
|---|---|---|
| Contract/scope and frozen package | PASS | Contract, exact surface/API/capability inventory, D-01…D-12 requirement/evidence matrix; 24 invariant classifications predate product changes. |
| Source/domain parity | PASS | Existing `deriveRoomOperationalState` and `deriveDateRangeSellability`; no new enum, status source, route, schema or lifecycle semantics; half-open date and hold behavior asserted in executing D1. |
| Mutation/concurrency | PASS | Existing room metadata and hold routes only; executing-D1 success, invalid, duplicate, stale and overlap conflict paths; selected-room responses are request-generation guarded. |
| Security/tenant | PASS | Central capability guards; two operational D1s; authenticated denials and zero drift; UI uses server-supplied capability context. Range downgrade drops unsupported interval and preserves un-ranged read. |
| UX/responsive | PASS | Playwright at 1280×900, 1280×600, 900×700, 390×844, 320×700 and 844×390; deep link/reload, browser Back/Forward, application Back, selection/focus/scroll and reduced-height/landscape scroll documented in Results. |
| Full tests and static gates | PASS | 35 files / 175 tests; TypeScript; Wrangler types; production build; architecture, Architecture II, i18n and bundle budgets; D1 query plan; Worker/Web dry-runs; `git diff --check`. |
| Budget | PASS | JS raw 329,618/330,000; JS gzip 93,456/100,000; CSS raw 54,297/55,000; CSS gzip 10,138/15,000. No ceiling changed. |
| Claim/evidence audit | PASS | Material claims are assigned API-D1, unit, browser, static or build evidence; no screenshot-only PASS. Chrome DevTools trace is not claimed. |
| Scope/no promotion | PASS | No schema/migration, Block E–H workflow, real data, promotion or deployment. |

### Bounded findings repaired before Artifact A

- Capability downgrade with URL-persisted date interval could turn the readable board into a forbidden ranged request. `loadRooms` now sends range parameters only while `rooms.search` is present; downgrade clears range state and reloads base room reads. No role matrix or API contract changed.
- Board count now matches visible filtered rooms, and canonical `UNKNOWN` can be explicitly isolated in each dimension filter.
- UX/QA reviews found no blocker. Current approved roles granting `rooms.read` also grant `rooms.search`; the route regression therefore injects only a temporary test role (cleaned up in `afterEach`) to prove base GET 200 and ranged GET 403 for the same authenticated membership. Production role policy is unchanged.

### Final decision

**PASS for publication of a substantive Artifact A candidate followed by exact orchestration-only Boundary B and separate Independent Critic review.** This internal gate is not a product PASS, Controller approval or Independent Critic verdict. Boundary B must set `external_review.required=true` and `resume_authorized=false`.
