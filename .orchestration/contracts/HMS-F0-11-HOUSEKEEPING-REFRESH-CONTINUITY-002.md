# HMS-F0-11-HOUSEKEEPING-REFRESH-CONTINUITY-002 — Bounded Product Repair

Status: `FROZEN BEFORE PRODUCT CHANGE`
Authority: F0.11 contract and IC-F0.11-03 evidence repair. Deterministic browser proof exposed an actual continuity defect: during a board refresh `HousekeepingPage` unmounts the existing workspace; window scroll changes from 600 to 0.
Mode: local/synthetic only. This is still F0.11, not a new workflow or foundation.

## Objective and scope

During an in-place Housekeeping board refresh, retain the already rendered board/task context while the authoritative read is pending. Clearly indicate the read is in progress and disable actions that could mutate from stale board state. Once the read completes, show its authoritative result; if it fails, retain the prior context and visible error/retry as already contracted.

Expected surface: `apps/web/src/features/housekeeping/HousekeepingPage.tsx`; deterministic browser regression in `scripts/cf-f0-11-refresh-races.playwright.js`.

## Acceptance

1. Initial empty/loading state remains unchanged before a first board exists.
2. During later refresh with a loaded board, the selected task/list remains rendered, and the refresh is observable.
3. Mutation controls and queue actions are disabled while loading/action is active; stale state cannot initiate a second command.
4. Search/filter/date/selection and scroll remain through a same-board refresh.
5. `Next task` continues to select the explicit expected queue identity; a failed post-action authoritative read does not advance, and explicit recovery refresh reconciles state.
6. No API, data, lifecycle command, schema, route, or backend change.

## Invariant mapping

| Invariant | Class | Rationale / proof |
|---|---|---|
| INV-ATOMIC-001 | N/A | No write implementation changes; controls remain disabled until reads finish. |
| INV-AUDIT-001 | N/A | No event mutation. |
| INV-DOMAIN-001 | N/A | No domain transition changes. |
| INV-TENANT-001 | N/A | No API or tenant boundary changes. |
| INV-RBAC-001 | N/A | No authorization changes. |
| INV-PARITY-001 | N/A | No source operation semantics change. |
| INV-ENUM-001 | N/A | No enum change. |
| INV-UX-001 | APPLIES | Preserve selected task/context and truthful loading/error state. |
| INV-ORDER-001 | APPLIES | Prove known Next task identity independently of target self-order. |
| INV-RESP-001 | APPLIES | Keep material task operable at the tested viewport; controls disabled during refresh. |
| INV-EVID-001 | APPLIES | Browser assertions distinguish mocked read behavior from integrated local state. |
| INV-LEGACY-001 | N/A | No recovery records. |
| INV-MONEY-001 | N/A | No financial state. |
| INV-STATE-001 | APPLIES | Replacement immutable A2 and new boundary require fresh Critic. |
| INV-CF-I07-001 | N/A | No admin/network authorization. |
| INV-CF-I07-002 | N/A | No admin mutation. |
| INV-CF-I07-003 | N/A | No role changes. |
| INV-CF-I07-004 | APPLIES | Local browser runner verifies process cleanup. |
| INV-CF-I08-001 | N/A | No reports. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date semantics. |
| INV-CF-I08-004 | N/A | No state enum. |
| INV-CF-I08-005 | N/A | No report clock behavior. |
| INV-SCOPE-001 | APPLIES | One small F0.11 refresh continuity fix only; no F0.12 or unrelated surface. |

## QA and rollback/recovery

Run the delayed/error browser test at 1280×900; assert scroll, date, non-default filter, search, selected room, disabled state, fixed `Next task` identity and recovery. Run focused web tests/type check/build/architecture/budget and the full required F0.11 gate suite before replacement Artifact A2. Revert the small UI condition/disabled props if they alter task semantics; no data recovery is required because there are no writes.

No Human Gate is required: this repair corrects an observed defect within the already approved F0.11 continuity contract and introduces no operational policy choice.
