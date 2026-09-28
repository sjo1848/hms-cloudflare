# HMS-F0-06 — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001.md`
Evidence type: synthetic Miniflare D1, clean local Wrangler D1, local Worker/Vite/browser regression only.
Real-data status: **no real active stays, remote D1, or cutover read/written**.

| Invariant | Applies? | Status | Concrete evidence |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `active-stay-pricing-bootstrap.executing-d1.test.ts`: concurrent same-manifest activation converges with exactly two segments; injected failure during shadow staging leaves zero run/candidate/head/segment rows and replay succeeds; injected late canonical segment failure rolls back activation. Inventory ABA, changed ledger/source digest, and a canonical pricing-segment set changed after staging reject with zero drift. |
| INV-AUDIT-001 | APPLIES | PASS | Activated segment rows retain exact synthetic actor, hotel and request IDs. Rejected/stale activation adds no canonical segment; all financial and lifecycle snapshots remain unchanged. |
| INV-DOMAIN-001 | APPLIES | PASS | Classifier admits only `CHECKED_IN`; other state is a held class. Any already-canonical pricing segment set is snapshotted and held as `ORPHAN_OR_CONFLICT`; synthetic activation cannot layer another pricing truth over F0.5. F0.4 lifecycle guards remain covered by its 14 executing-D1 cases. |
| INV-TENANT-001 | APPLIES | PASS | Foreign hotel source is rejected. Two independently created operational D1 databases stage distinct hotel manifests; activating hotel A leaves hotel B `SHADOWED` with zero canonical segments. Integrated reassignment E2E also proves two-tenant object isolation. |
| INV-RBAC-001 | N/A | N/A | No product HTTP/API or user capability surface is introduced; bootstrap functions are test/local synthetic-only. |
| INV-PARITY-001 | APPLIES | PASS | Five-class matrix uses explicit source refs and rates; current target room price is never promoted to historical rate. Aggregate-only, conflicting, mismatched, VOIDED and already-segmented canonical stays remain held. Exact existing segment rows are included in the source digest. |
| INV-ENUM-001 | APPLIES | PASS | Classifier and persisted schema use closed five-class values; run/candidate states are constrained by migration `0026`. Five-class executing-D1 test asserts exact classification/status pairs. |
| INV-UX-001 | N/A | N/A | No operational UI is changed by F0.6. The separate F0.4 regression is preservation evidence only. |
| INV-ORDER-001 | N/A | N/A | No queue ordering or next-case behavior changes. |
| INV-RESP-001 | N/A | N/A | No F0.6 frontend surface is changed. The independently scoped F0.4 regression is rerun at desktop/mobile widths only as inherited browser regression evidence. |
| INV-EVID-001 | APPLIES | PASS | Every F0.6 claim maps to executing-D1 tests, clean Wrangler migration commands through 0027, build/type/query-plan/regression commands, and `scripts/cf-wave12-reassignment-integrated.sh`. Screenshots under `output/playwright/` are diagnostic; assertions are executable. |
| INV-LEGACY-001 | APPLIES | PASS | No real history is inferred or synthesized. Explicit synthetic duplicate-room identity is classified `ORPHAN_OR_CONFLICT`; no candidate activation or product drift occurs. Unknown history remains held/aggregate-only. |
| INV-MONEY-001 | APPLIES | PASS | Before/after executing-D1 snapshots preserve booking total, extra charges, full invoice, payment entries/paid_at, inventory and lifecycle. D11 4/4, CF-I06 and F0.4 repricing/payment cases pass. All monetary inputs and arithmetic use safe integer cents. |
| INV-STATE-001 | APPLIES | PASS AFTER A/B | This evidence is included in replacement Artifact A2. A separate orchestration-only Boundary B2 records exact A2 SHA, requires external review and disables resume; no self-SHA is included in A2. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit authorization route changes. |
| INV-CF-I07-002 | N/A | N/A | No admin mutation/no-op audit behavior changes. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade behavior changes. |
| INV-CF-I07-004 | APPLIES | PASS | Wrangler regressions and integrated Worker/Vite/Playwright runners use owned temp persistence and cleanup traps. Final browser runner exits zero; process cleanup is checked before success. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic changes. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changes. |
| INV-CF-I08-003 | N/A | N/A | No analytics date/series changes. |
| INV-CF-I08-004 | N/A | N/A | No room or booking state values are added or changed. |
| INV-CF-I08-005 | N/A | N/A | No operational effective-date predicate is introduced by F0.6; F0.4 interval remains unchanged and separately browser-verified. |
| INV-SCOPE-001 | APPLIES | PASS | Diff is limited to the synthetic F0.6 classifier/shadow path, additive migration 0027, tests/evidence, and updating F0.3 expected schema/migration/source/report digests because additive 0027 changes cumulative fingerprints. No Blocks A–H, real data, remote D1, PR, push, merge, main, staging, deploy or production. |

## Findings and disposition

- `F0.6-R1` (read-only DB/Data review): duplicate `rooms` identities with divergent values were not classified as conflict; `INSERT OR IGNORE` could collapse the stored shadow rows without proving the full manifest cardinality. Repaired by `DUPLICATE_ROOM_SNAPSHOT_ID` → `ORPHAN_OR_CONFLICT` and by an in-transaction activation guard that compares persisted room/inventory/charge/payment snapshot row counts to the original source-array lengths. A directed executing-D1 test proves quarantine, no activation and no operational drift.
- `F0.6-IC-01 HIGH` (Galileo, fresh Independent Critic on A1+B1): existing `booking_pricing_segments` are canonical quote inputs but were absent from F0.6's source snapshot and activation guard. A stay could therefore gain overlapping bootstrap segments or quote/account-total drift after F0.5 had already established pricing truth. Repaired by including the exact segment set/fields in the stable source manifest; holding any already-segmented stay without candidates; and additive migration `0027_active_stay_bootstrap_segment_snapshot_guard.sql`, which compares current rows to the staged snapshot in both directions before `SHADOWED → ACTIVATING`. A directed test mutates the segment set after shadowing and restores booking version/token/timestamp, proving the segment guard itself rejects and leaves the staged run and all canonical state unchanged. The exact-set assertion is inside the activation batch transaction.
- F0.3's pinned schema/migration/source/report fingerprints reflected the pre-0027 cumulative chain. Clean execution showed only these additive-chain fingerprints changed; updated the exact deterministic values. The F0.3 recovery, stale-drift and canonical-preservation assertions pass unchanged.
- F0.4 migration `0024` had previously failed Wrangler parsing because a scalar `CASE` predicate in a D1 trigger was parsed as `incomplete input`. The earlier bounded fix replaced it with equivalent boolean predicates and separate fail-closed triggers. Fresh clean Wrangler runs now apply 0001–0027 to both local hotel bindings. F0.4's 14 executing-D1 tests pass; integrated browser evidence checks the same remaining interval across candidate availability, quote/preview and mutation.
- One initial all-at-once validation attempt ran CF-I03/04/05/06 concurrently; CF-I03 and CF-I06 share fixed port 8787, and this caused port/fixture interference plus a load-only 10-second F0.3 test timeout. Those attempts are not counted. Repeated CF-I03/04/05/06 sequentially on their isolated temporary stores: all pass. The subsequent uncontended full `npm run check` passes.

## Publication check

- [x] All applicable invariants have reproducible evidence; no applicable invariant remains `UNPROVEN`.
- [x] Only synthetic/local data was used; no real active-stay read or cutover occurred.
- [x] Mandatory Pre-Critic Gate is recorded in `HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001-PRECRITIC.md`.
- [x] A1 Independent Critic `REWORK` and bounded disposition are preserved in `.orchestration/evidence/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001-INDEPENDENT-CRITIC.md`.
- [x] Replacement Artifact A2 includes the repair and fresh validation; orchestration-only Boundary B2 identifies exact A2 SHA.
- [x] A fresh Independent Critic, separate from implementation and Pre-Critic, remains required after exact A2+B2.
