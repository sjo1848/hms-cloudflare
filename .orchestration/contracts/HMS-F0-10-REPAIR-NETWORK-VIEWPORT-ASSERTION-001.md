# Task Contract — F0.10 truthful Network viewport evidence

Task ID: `HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001`
Parent: F0.10 capability contract and bounded Network keyboard/auth-context repairs.
Rework trigger: fresh Independent Critic Zeno returned `REWORK` on exact A4 `ba2ff62daf48616ad84700c684adf4cd5d70733e` + B4 `10ff54deaf2b2ae612544c7817f4ac8a67425099`: no-write desktop test ran at mobile 375px and hardcoded a desktop label; both no-write screenshots were mobile. The preceding `/auth/me` identity assertions themselves were supported.
Status: `FROZEN BEFORE EVIDENCE REPAIR`.

## Objective / acceptance

Evidence-only correction. Place `setViewportSize(1280,900)` immediately before the no-write desktop navigation/assertions and explicitly set `(375,844)` before the separate mobile case. Capture actual `page.viewportSize()` for each result and fail unless exact expected width and height are active during DOM/keyboard/POST assertions. Do not append a hardcoded PASS label.

The integrated runner must inspect the saved PNG headers: no-write desktop image width exactly 1280, mobile exactly 375; assert the widths differ and optionally digest differs. Persist screenshot dimensions in machine-readable output. The same existing authenticated Ops profile and real `/auth/me` assertions apply at each viewport, along with DOM absence, plan readability, 40-Tab exclusion, POST 403, and D1 zero effect.

Correct any previous Pre-Critic/invariant prose that claimed both no-write widths passed. Keep A4+B4 immutable with its historical `REWORK`; do not hide the prior overclaim. No product/schema changes.

## Non-goals / prohibited

No UI/API/role/capability/schema/migration changes, no F0.11, Blocks A–H, real data, PR/push/merge/main/staging/deploy/production. Only the F0.10 runner and its evidence may change.

## Invariant classification (all 24)

| Invariant | Classification | Rationale / evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No product command mutation changes; denied POST and zero effect remain covered. |
| INV-AUDIT-001 | APPLIES | Denied network mutation must leave zero hotel/audit effect; existing D1 assertion retained. |
| INV-DOMAIN-001 | N/A | No domain state transition. |
| INV-TENANT-001 | APPLIES | Preserve authenticated Ops subject/hotel checks at both viewport runs. |
| INV-RBAC-001 | APPLIES | Prove expected capability context and denial per viewport, not only backend status. |
| INV-PARITY-001 | N/A | No source behavior/grants change. |
| INV-ENUM-001 | N/A | No enum or serialization changes. |
| INV-UX-001 | APPLIES | Keyboard/DOM claims must correspond to the actual viewport and UI identity. |
| INV-ORDER-001 | N/A | No operational queue/order behavior. |
| INV-RESP-001 | APPLIES | Exact 1280×900 and 375×844 assertions and image dimensions. |
| INV-EVID-001 | APPLIES | Derive dimensions from runtime/captured PNG; no hardcoded responsive labels; preserve prior REWORK. |
| INV-LEGACY-001 | N/A | No legacy records or identity synthesis. |
| INV-MONEY-001 | N/A | No financial changes. |
| INV-STATE-001 | APPLIES | A5+B5 exact boundary then a fresh Critic; only later may the row finalize. |
| INV-CF-I07-001 | APPLIES | Capability authority remains the real server response. |
| INV-CF-I07-002 | N/A | No admin mutation implementation changes. |
| INV-CF-I07-003 | N/A | Downgrade behavior unchanged. |
| INV-CF-I07-004 | APPLIES | Integrated runner continues to stop/verify owned processes. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No KPI aggregation changes. |
| INV-CF-I08-003 | N/A | No date predicate changes. |
| INV-CF-I08-004 | N/A | No booking/room query changes. |
| INV-CF-I08-005 | N/A | No clock/context continuity changes. |
| INV-SCOPE-001 | APPLIES | Runner and evidence only; no product/schema edits. |

## Validation and publication

Freeze `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-VIEWPORT-ASSERTION-001-PRECRITIC.md` before code/evidence changes. Run syntax, diff, the actual local Worker/two-D1/Vite browser runner, and its PNG-dimension assertions. Verify results and screenshots independently; confirm no product/schema paths changed. Correct invariant/Pre-Critic assertions based only on fresh evidence. Freeze replacement A5, then orchestration-only B5, then a fresh Critic distinct from Tesla, Harvey and Zeno. Foundation 0 remains incomplete.
