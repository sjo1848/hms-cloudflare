# CF-UX-MOBILE-001 — Invariant classification and evidence

Status: REWORK IN PROGRESS
Artifact: PR #9 / branch `ux-mobile-hms-elite`
Scope: Shell + Reception responsive UX

| Invariant | Classification | Required proof | Current status |
|---|---|---|---|
| INV-ATOMIC-001 | N/A | No domain mutation or state transition changed. | N/A |
| INV-AUDIT-001 | N/A | No audit/event mutation changed. | N/A |
| INV-DOMAIN-001 | N/A | No domain operation changed. | N/A |
| INV-TENANT-001 | APPLIES | Run the existing tenant/profile regression and verify the displayed tenant context follows the active profile without changing request routing. | PENDING |
| INV-RBAC-001 | APPLIES | Verify existing protected routes and role behavior remain unchanged; UI visibility is not used as authorization. | PENDING |
| INV-PARITY-001 | APPLIES | Compare HMS Elite shell/Reception journey against the target without changing business semantics. | PENDING |
| INV-ENUM-001 | N/A | No enum representation or predicate changed. | N/A |
| INV-UX-001 | APPLIES | Source-vs-target journey map plus browser execution of Reception actions. | PENDING |
| INV-ORDER-001 | APPLIES | Verify Reception queue/order and selected-case behavior remain unchanged. | PENDING |
| INV-RESP-001 | APPLIES | Browser script at 375, 390, 430 and 1366 px exercising material navigation and Reception controls. | PENDING |
| INV-EVID-001 | APPLIES | Cross-check every claim against CI, browser output and the immutable artifact. | PENDING |
| INV-LEGACY-001 | N/A | No legacy/backfill recovery changed. | N/A |
| INV-MONEY-001 | N/A | No financial calculation or mutation changed. | N/A |
| INV-STATE-001 | APPLIES | Confirm artifact/publication boundary and exact reviewed head before external review. | PENDING |
| INV-CF-I07-001 | N/A | No capability authority changed. | N/A |
| INV-CF-I07-002 | N/A | No admin mutation changed. | N/A |
| INV-CF-I07-003 | N/A | No role downgrade changed. | N/A |
| INV-CF-I07-004 | N/A | No regression runner changed. | N/A |
| INV-CF-I08-001 | N/A | No reporting arithmetic changed. | N/A |
| INV-CF-I08-002 | N/A | No network aggregation changed. | N/A |
| INV-CF-I08-003 | N/A | No report date/state semantics changed. | N/A |
| INV-CF-I08-004 | N/A | No expanded state predicate changed. | N/A |
| INV-CF-I08-005 | N/A | No report clock or continuity behavior changed. | N/A |
| INV-SCOPE-001 | APPLIES | Diff/scope audit confirms only the contracted shell + Reception batch and its evidence are included. | PENDING |

This file is not a PASS declaration. PENDING entries block final publication until the named evidence exists and is checked.
