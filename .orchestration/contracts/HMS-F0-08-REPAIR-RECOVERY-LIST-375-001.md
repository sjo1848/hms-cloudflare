# Task Contract — F0.8 Recovery List Continuity and 375px Evidence

Task ID: `HMS-F0-08-REPAIR-RECOVERY-LIST-375-001`
Parent contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`
Reviewed artifact: A `298545b23e59f8aabfef5a766f76249ee71e856b` + B `5d6e9b37a58554a5b3d4e74bdf13ed7db7a09219`
Status: `FROZEN BEFORE REWORK`

## Finding / bounded objective

Repair Independent Critic findings only:

1. `HIGH`: a `GUEST_CREATED` operation was omitted from `GET /reservation-creation-operations` if the same guest had a separate confirmed booking. The original operation must remain discoverable and truthful until that operation itself reaches `BOOKING_CREATED`; use of the guest in a different operation must not implicitly complete or hide it.
2. `MEDIUM`: integrated mobile browser width was 390px, while the parent contract requires 375px.

No other product behavior is authorized by this repair contract. No new state, retention/cleanup policy, auto-completion, or deletion may be introduced.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Incomplete operations remain recoverable independent of another booking for the guest. | `D1ReservationCreationRepository.listIncomplete`, recovery API, Reception list. | Only the operation's own `BOOKING_CREATED` stage removes it from incomplete results; another booking for the same guest has no effect. Original stage/provenance remain unchanged. | Executing-D1 scenario: create GUEST_CREATED after availability conflict, book the same guest through a distinct operation token, assert original token remains listed with stage and identity intact. Integrated browser reload asserts pending operation remains visible after distinct recovery booking. |
| Contracted mobile width is actually exercised. | `scripts/cf-f0-08-reservation-recovery.playwright.js`. | Run all contracted mobile create controls at 375×844, with real Worker/D1 and authoritative queue refresh. | Fresh integrated runner exit 0 and screenshot at 375px. |
| Preserve current exact and inherited validation. | F0.8 files only. | Full check, targeted executing-D1, integrated browser, architecture, types/build/budget, query plans, Wrangler dry-runs and relevant serial regressions pass. | Fresh command output and exact Artifact A evidence. |

## All registry invariants

| Invariant | Classification | Application to this repair |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Do not let another operation/token claim or complete the original staged operation. |
| INV-AUDIT-001 | APPLIES | No synthetic completion event; original stage audit remains exact. |
| INV-DOMAIN-001 | APPLIES | Operation stage changes only via canonical reservation create mutation. |
| INV-TENANT-001 | APPLIES | Recovery list remains selected-hotel D1 scoped. |
| INV-RBAC-001 | APPLIES | Existing `guests.read` gate remains authoritative. |
| INV-PARITY-001 | APPLIES | Explicitly selected guest may be used by another reservation; that does not imply the original token completed. |
| INV-ENUM-001 | APPLIES | Do not add/repurpose operation or booking statuses. |
| INV-UX-001 | APPLIES | Durable pending recovery remains visible after reload. |
| INV-ORDER-001 | N/A | No queue ranking/next-case ordering changes. |
| INV-RESP-001 | APPLIES | Exercise controls at exact contracted mobile width 375px. |
| INV-EVID-001 | APPLIES | Exact assertions/log/screenshot at the required width; no 390px claim. |
| INV-LEGACY-001 | N/A | No historical record synthesis/backfill. |
| INV-MONEY-001 | APPLIES | Distinct guest booking must not create financial side effects on the original operation or alter D11 semantics. |
| INV-STATE-001 | APPLIES | Publish replacement substantive Artifact A2 then orchestration-only Boundary B2 and critic exact pair. |
| INV-CF-I07-001 | N/A | No admin/network/audit route. |
| INV-CF-I07-002 | N/A | No admin no-op mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated runner verifies Worker/Vite/browser cleanup before PASS. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network analytics. |
| INV-CF-I08-003 | N/A | No report date/state predicate. |
| INV-CF-I08-004 | N/A | No booking/room state enum expansion. |
| INV-CF-I08-005 | N/A | No reporting date default/continuity change. |
| INV-SCOPE-001 | APPLIES | Repair only the two cited F0.8 findings; no real data, Blocks A–H, PR, push, merge, staging, deploy, or production. |

## Non-goals / stop conditions

Do not hide, auto-complete or delete the earlier operation; do not infer completion from same guest ID or another booking. No extra retention policy or UI redesign. Stop only on a demonstrated architecture/product contradiction, real-data need, or scope beyond these repairs; ordinary test/review findings are repaired under this contract.
