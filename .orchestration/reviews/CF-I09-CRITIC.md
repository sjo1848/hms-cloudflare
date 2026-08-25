# CF-I09 — External Independent Critic

Artifact A: `a972bca40ed60505bc42f5ae560977886c2972ab`  
Boundary B: `54d8ad2e77b78f4101a14501b7e81ef014c9be2a`  
Verdict: **REWORK-1**  
Human Gate: **NONE**

## Publication boundary

The commit topology is correct: B is the direct child of A and B changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.

However canonical metadata records only the abbreviated `a972bca` rather than the exact full artifact SHA. `INV-STATE-001` requires the exact full remote-resolvable A SHA in canonical publication metadata. This is a blocking admission/evidence defect, not a product-code defect.

## Accepted CF-I09 foundation — preserve

The following parts of A are substantively strong and must not regress during REWORK-1:

- local-only source→CONTROL_DB/per-hotel-D1 rehearsal with server-owned two-binding routing;
- exhaustive fixture-key disposition and explicit enum mapping structure;
- UUID/TEXT, integer-cents, DATE/UTC and JSON normalization;
- `NO_SHOW` representation and exclusion from inventory/report/Housekeeping semantics;
- clean rehearsal, replay refusal before business mutation, injected partial-run failure and reconciliation refusal;
- reconciliation beyond row counts: exact IDs/rows, FK integrity, money totals, invoice/payment/closure consistency, event ownership, tenant leakage checks and source-equivalent reporting metrics;
- local Access bypass restricted to development + explicit opt-in + loopback hostname;
- readiness requiring all three local D1 stores plus applied migration manifest;
- local reset/start/stop and local-only backup/restore rehearsal with checksums and post-restore reconciliation;
- real local Worker+D1 integrated smoke covering two hotels, tenant denial, Rooms/Guests/Bookings/lifecycle, Housekeeping/Maintenance, Billing/cash, Users/RBAC, reports/analytics and network reads;
- fresh inherited CF-I03–CF-I08 regression intent;
- no remote D1, paid resource, production, real-data or cutover action.

## Blocking findings

### 1. Valid source `saas_admin` role is absent from the migration model — P1

The immutable source RBAC canon includes five roles: `admin`, `saas_admin`, `ops`, `receptionist`, `housekeeping`. `saas_admin` has only `saas.hotels.read` / `saas.hotels.write`. The source demo seed also inserts a real `saas_admin` user.

Artifact A's `ENUMS.role` omits `saas_admin`; `validateFixture()` therefore rejects a source-valid SaaS administrator. The synthetic fixture avoids this by using a source `admin` and separately listing that same user in `target_adaptations.network_admin_user_ids`, which grants network membership to a tenant admin instead of proving source-role migration.

This is not source-semantic parity. CF-I09 must support source-valid `saas_admin` explicitly.

Required repair:

- add a deterministic source fixture with a source `saas_admin` user;
- map the source `saas_admin` role to the accepted target network membership semantics;
- do **not** grant ordinary hotel capabilities merely because the legacy source row carries a non-null `hotel_id` required by the old schema; source RBAC meaning is authoritative;
- prove source `admin` remains hotel-scoped and does not gain SaaS/network capability unless an explicitly separate target adaptation is justified by the contract;
- reconcile exact identity, hotel-membership and network-membership counts/ownership;
- run allowed/denied behavior proving the migrated `saas_admin` has network capability and lacks tenant operational capability.

### 2. Valid legacy payments with unknown receiver are rejected — P1

Source migration `0024_payment_entries_and_cash_shift.sql` defines `payment_entries.received_by_user_id` as nullable and explicitly backfills paid invoices into `payment_entries` **without** `received_by_user_id`. Therefore a valid database at the pinned source baseline can contain a payment whose receiver is unknown.

Artifact A's preflight deliberately rejects `received_by_user_id = null` (`missing receiver cannot be attributed`). The target `payment_entries.received_by_user_id` is `TEXT NOT NULL`, so simply preserving SQL NULL is not possible without a target adaptation.

Required repair:

- add a source-derived fixture representing the exact legacy backfill case: paid invoice/payment with `received_by_user_id = NULL`;
- migrate it truthfully without inventing a real user and without attributing it to the migration operator;
- use an explicit unknown/legacy actor representation or an equally truthful target adaptation, with provenance sufficient to distinguish it from a real Access subject;
- ensure the related reconstructed financial event uses the same truthful provenance semantics;
- reconcile exact payment/invoice cents and actor/provenance fields;
- preserve normal non-null receiver mapping for ordinary source payments.

### 3. Source legacy maintenance can have an unknown reporter, but reconstructed target event requires an actor — P1

Source migration `0028_maintenance_legacy_backfill.sql` intentionally drops `NOT NULL` from `maintenance_cases.reported_by_user_id` and backfills rooms already in `MAINTENANCE` with `reported_by_user_id = NULL`.

Artifact A's validation permits that NULL maintenance reporter, and the target `maintenance_cases` table also permits it. But `buildHotelSql()` reconstructs a `MAINTENANCE_OPEN` housekeeping event using `subject(reported_by_user_id)`, while target `housekeeping_events.actor_subject` is `NOT NULL`. A source-valid legacy maintenance row can therefore fail target import or force false attribution if repaired naively.

Required repair:

- add the exact source-legacy maintenance case to the deterministic fixture;
- preserve NULL/unknown reporter truth on the maintenance case;
- for any reconstructed target event that requires a non-null actor, use explicit unknown-legacy provenance rather than a real/migration user, or explicitly omit/reclassify the reconstructed event if that is the source-faithful adaptation;
- reconcile event/case provenance and Housekeeping state after migration.

### 4. Binding model/multi-context receipt is incomplete — P2 admission failure

The artifact parent already contains the binding Luna-first model policy and multi-context admission gate. Before artifact A, `.orchestration/evidence/CF-I09-INTERNAL-REVIEW.md` was required to record:

`role/context → lane → actual model family → reasoning tier → escalation reason (if any) → outcome`

The published receipt lists lanes and test results, but no actual model-family/reasoning assignment and no truthful escalation chain. Given the explicit token/credit guard, this cannot be inferred after the fact or silently waived.

Required repair:

- recover truthful runtime receipts/history where available;
- record actual context/role identifiers plus actual model family and reasoning tier;
- if exact prior assignments cannot be proven, say so truthfully and perform fresh bounded Internal QA/Critic and Integration Review phases under the current Luna-first policy rather than fabricating history;
- any Terra use must show the prior bounded Luna attempt/result; any Sol use additionally requires the bounded Terra attempt/result;
- zero open P0/P1/P2 must be re-established after the migration repairs above.

### 5. Canonical A SHA and evidence claims must be exact — P2 admission failure

Boundary B is structurally clean but `STATUS.json` / `STATE.md` use the abbreviated `a972bca`. The invariant and Pre-Critic evidence nevertheless claim publication-state PASS.

Required repair:

- new substantive artifact A2 must be followed by one orchestration-only B2;
- B2 must record A2's exact full 40-character SHA in canonical state (`last_completed_head`, `external_review.artifact_head` and corresponding STATE reference);
- invariant and Pre-Critic evidence must not claim `INV-STATE-001`, multi-context admission or source-parity PASS until the executable proof actually satisfies them.

## Required source-nullability / historical-provenance sweep

The payment and maintenance defects have the same root cause: target runtime fields are stricter than legitimate historical source rows. During REWORK-1, perform one consolidated audit of source migrations `0001`–`0030` for nullable/legacy/backfilled actor or identity fields that feed target `NOT NULL` actor/identity columns. Do not wait for the External Critic to discover the next instance one-by-one.

At minimum cover:

- `payment_entries.received_by_user_id` legacy NULL;
- `maintenance_cases.reported_by_user_id` legacy NULL;
- already-accepted nullable audit actor behavior;
- nullable room-hold creator and any other source-valid historical actor field that reaches a stricter target event/audit column;
- source `saas_admin` role semantics independently from tenant `hotel_id` storage legacy.

The general rule is: **unknown historical actor remains unknown**. Do not reject valid source history solely because the new runtime requires a principal, and do not fabricate attribution to the migration operator or a real user.

## REWORK-1 exit criteria

1. Preserve all accepted CF-I09 foundation listed above.
2. Source-valid `saas_admin` migration is represented, reconciled and behaviorally tested with source-exact capabilities.
3. Source-valid legacy NULL payment receiver migrates with truthful unknown provenance and exact cents/events.
4. Source-valid legacy NULL maintenance reporter migrates without false actor attribution and with coherent target case/event state.
5. Consolidated source historical-nullability/provenance sweep is documented and executable for all applicable mappings.
6. Migration/reconciliation, replay/partial failure, backup/restore and complete local Worker+D1 smoke pass after the repairs.
7. Fresh inherited CF-I03–CF-I08 plus type/unit/build/Wrangler/route/diff checks pass.
8. `CF-I09-INTERNAL-REVIEW.md` contains truthful model-family + reasoning receipts and separate Internal QA/Critic + Integration Review closure under the binding Luna-first policy.
9. No open P0/P1/P2 remains; any P3 debt is explicit and does not undermine contracted proof.
10. Correct invariant/Pre-Critic evidence so no claim exceeds executable proof.
11. Publish fresh substantive artifact A2, then orchestration-only boundary B2 containing the exact full A2 SHA, and stop for External Independent Critic.
12. No Human Gate, remote Cloudflare resource, paid transition, real-data migration or cutover is introduced.

Diagnosis: `SOURCE_ROLE_PARITY_GAP + LEGACY_NULL_ACTOR_MIGRATION_GAP + HISTORICAL_PROVENANCE_GAP + MULTICONTEXT_MODEL_RECEIPT_MISSING + ABBREVIATED_ARTIFACT_BOUNDARY`.
