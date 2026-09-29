# Task Contract — F0.10 no-write Network auth-context evidence

Task ID: `HMS-F0-10-REPAIR-NETWORK-AUTH-CONTEXT-001`
Parent: F0.10 server-owned capabilities and `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001.md`.
Rework trigger: fresh Independent Critic Harvey returned `REWORK` on exact A3 `15835e28de8b6d3a7b069c65a197bd937a9596f5` + B3 `be82c603aa6a24a902be2039f7e72e26400508d9`; no-write DOM evidence lacked explicit confirmation that the browser's actual `/auth/me` response represented the expected member/tenant/capability context at both viewports.
Status: `FROZEN BEFORE EVIDENCE CHANGE`.

## Objective and acceptance

Evidence-only repair. In the real integrated browser flow, capture and assert the actual Worker response to `/api/v1/auth/me` received by the page for the no-network-write hotel member at both 1280×900 and 375×844. Assert HTTP 200, exact expected subject, hotel ID, `ops` role, non-empty expected hotel membership capability (e.g. `housekeeping.read`), and absence of `saas.hotels.write` from network capabilities. Then assert DOM absence of registration/plan editor, readable plan, and 40 keyboard Tabs do not focus forbidden controls at each viewport. Existing direct POST 403 and D1 zero inserted denied hotels remain required.

Do not proxy/intercept `/auth/me`. The one synthetic hotel-list GET fixture remains narrowly scoped to rendering/selecting the no-write property detail; no other request may be mocked. Record viewport-specific `/auth/me` fields and keyboard/DOM outcomes separately in the result JSON. If the actual browser response disagrees with expectation, do not relabel it: investigate source/fixture and make only evidence corrections unless a genuine product defect is established.

## Non-goals and boundary

No product source, API, schema, role/capability, migration, layout, or business behavior changes are authorized. A2/B2 and A3/B3 remain immutable with their historical verdicts. No F0.11, Blocks A–H, real data, PR/push/merge/main/staging/deploy/production.

## Invariant classification (all 24)

| Invariant | Classification | Rationale / acceptance evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No product command semantics; actual denied POST and zero D1 insertion remain verified. |
| INV-AUDIT-001 | APPLIES | Denied network writes must create no hotel/audit effect; D1 snapshot remains zero. |
| INV-DOMAIN-001 | N/A | No domain state transition changes. |
| INV-TENANT-001 | APPLIES | Actual `/auth/me` response must assert subject and selected hotel at both viewports; tenant-scoped binding remains real. |
| INV-RBAC-001 | APPLIES | Actual returned capability arrays prove the browser context lacks network write; direct mutation still 403. |
| INV-PARITY-001 | N/A | No workflow or grant change. |
| INV-ENUM-001 | N/A | No enums or serialized contract changes. |
| INV-UX-001 | APPLIES | The DOM/keyboard assertions are meaningful only after the UI's authoritative identity context is evidenced. |
| INV-ORDER-001 | N/A | No queue/order behavior. |
| INV-RESP-001 | APPLIES | Assert authenticated no-write context plus forbidden-control absence at desktop and mobile separately. |
| INV-EVID-001 | APPLIES | Distinguish actual `/auth/me` and denied POST from synthetic hotel-list GET; persist viewport-specific output. |
| INV-LEGACY-001 | N/A | No legacy data interpretation. |
| INV-MONEY-001 | N/A | No financial behavior. |
| INV-STATE-001 | APPLIES | New immutable artifact + orchestration-only boundary + fresh independent critic; verdict finalized only after exact pair review. |
| INV-CF-I07-001 | APPLIES | Browser observes server-owned arrays; no client capability authority added. |
| INV-CF-I07-002 | N/A | No admin mutation implementation change. |
| INV-CF-I07-003 | N/A | No downgrade implementation change; prior evidence remains. |
| INV-CF-I07-004 | APPLIES | Integrated runner owns and verifies process cleanup. |
| INV-CF-I08-001 | N/A | No report arithmetic. |
| INV-CF-I08-002 | N/A | No KPI aggregation. |
| INV-CF-I08-003 | N/A | No date behavior. |
| INV-CF-I08-004 | N/A | No booking/room predicate. |
| INV-CF-I08-005 | N/A | No reporting clock/continuity. |
| INV-SCOPE-001 | APPLIES | Runner/evidence only; any product/schema modification is outside this contract and requires a new approved bounded contract. |

## Pre-Critic and validation

Before runner edits, freeze `.orchestration/evidence/HMS-F0-10-REPAIR-NETWORK-AUTH-CONTEXT-001-PRECRITIC.md`. Run the integrated local Worker + disposable D1 + Vite/browser script, assert both context payloads and UI behavior, direct denied POSTs and zero D1 effect, cleanup, JSON validity, syntax checks, and `git diff --check`. No unrelated full-suite rerun is required if product/schema files remain unchanged. Freeze replacement A4 and orchestration-only B4, then obtain a fresh Independent Critic distinct from Tesla and Harvey. F0.10 remains open until the exact pair verdict and invariant state are reconciled.
