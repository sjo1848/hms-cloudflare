# F0.7 Repair — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-07-REPAIR-BOOKING-PRICING-ABA-001.md`
Prior parent evidence: `.orchestration/evidence/HMS-F0-07-SETTLEMENT-GUARD-001-INVARIANTS.md`
Fixture scope: synthetic executing D1 only; no customer/remote data.

| Invariant | Classification | Status | Evidence / rationale |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Deterministic same-visible-value ABA: booking total goes 10,000 → 12,500 → 10,000 while existing monotonic pricing version advances 0 → 2 after checkout snapshot. Checkout loses; booking remains CHECKED_IN, room/version and both inventory nights remain unchanged, no invoice or CHECK_OUT event. Focused executing-D1 test passes. |
| INV-AUDIT-001 | APPLIES | PASS | ABA loser creates zero lifecycle events; asserted exactly in `check-in-concurrency.executing-d1.test.ts`. Parent exact winner/provenance cases remain covered by unchanged A1 evidence. |
| INV-DOMAIN-001 | APPLIES | PASS | Only explicit checkout command is changed; it binds the existing pricing generation. No generic status or billing endpoint added. |
| INV-TENANT-001 | N/A | N/A | No routing, tenant selection or object-resolution code changed; prior A1 tenant evidence remains applicable. |
| INV-RBAC-001 | N/A | N/A | No authorization code changed; prior A1 CF-I03 active receptionist denial evidence remains applicable. |
| INV-PARITY-001 | N/A | N/A | No accepted source checkout policy or user-visible policy semantics changed. |
| INV-ENUM-001 | N/A | N/A | No enum or semantic mapping changed. |
| INV-UX-001 | N/A | N/A | No UI behavior changed; prior A1 real Worker/D1 desktop/mobile conflict/success evidence remains applicable. |
| INV-ORDER-001 | N/A | N/A | Queue ordering/next-case behavior untouched. |
| INV-RESP-001 | N/A | N/A | No responsive surface changed; A1 desktop/mobile checkout browser evidence remains applicable. |
| INV-EVID-001 | APPLIES | PASS | ABA claim maps to the named executing-D1 regression; final suite and inherited browser evidence are separately identified. Broad product-flow runner limitation remains disclosed and is not claimed as PASS. |
| INV-LEGACY-001 | N/A | N/A | No legacy migration/backfill/synthesized history. |
| INV-MONEY-001 | APPLIES | PASS | ABA fixture leaves integer-cent total at 10,000 and has no invoice/payment mutations; exact unchanged state and zero side effects asserted. Parent A1 includes D11 settlement/interleaving/rollback matrix. |
| INV-STATE-001 | APPLIES | PASS | Replacement A2 and orchestration-only B2 are separate commits; fresh Independent Critic required on exact pair. Prior A1/B1 and verdict remain historical and are not represented as applying to A2. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit route. |
| INV-CF-I07-002 | N/A | N/A | No admin semantic no-op mutation. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade workflow. |
| INV-CF-I07-004 | N/A | N/A | This repair does not change a runner that owns Worker/Vite process lifecycle; CF-I03 reruns its pre-existing cleanup contract. |
| INV-CF-I08-001 | N/A | N/A | No analytics arithmetic. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | N/A | No reporting date/state query. |
| INV-CF-I08-004 | N/A | N/A | No state enum change. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/date behavior. |
| INV-SCOPE-001 | APPLIES | PASS | Only checkout snapshot/version binding and its deterministic regression/evidence; no migration, product policy, real data, promotion, or next Foundation block. |

## Independent-review disposition

Ampere (fresh read-only GPT-6 Luna Medium) reviewed prior exact A1+B1. It returned `PASS_WITH_CONDITIONS`; the broad-runner caveat is retained. The reviewer noted that same-value account ABA was not demonstrated. This repair closes that evidence gap using the existing monotonic booking pricing generation. The prior verdict does not apply to replacement Artifact A2.
