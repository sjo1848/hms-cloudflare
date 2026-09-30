# HMS Block D Rooms — Pre-Critic Gate (Pre-implementation admission)

Status: **FROZEN BEFORE PRODUCT CODE**. This is the required contract/admission review, not implementation PASS or Independent Critic.

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
