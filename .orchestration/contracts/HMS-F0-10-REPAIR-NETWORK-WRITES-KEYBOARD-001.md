# Task Contract — F0.10 network write visibility and keyboard proof

Task ID: `HMS-F0-10-REPAIR-NETWORK-WRITES-KEYBOARD-001`
Parent: `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md` and `.orchestration/contracts/HMS-F0-10-REPAIR-CAPABILITY-CONTROL-MAPPING-001.md`
Rework trigger: fresh Independent Critic on A `be92a5750c9be4b1b112bbd9980a8b34fc83d42a` + B `d224b69ac0c2fa0c8d427d6dab3dc8cd30ae4cbe`, findings F0.10-IC-01 (network write visibility, High), F0.10-IC-02 (keyboard evidence, Medium), and F0.10-IC-03 (conditional INV-STATE evidence, Medium).
Status: `FROZEN BEFORE REWORK`.
Authority: accepted F0.10 contract, actual `saas.hotels.write` route guards, existing server-owned capability context, binding invariants.

## Objective and bounded scope

Close only the two Independent Critic findings. Hotel registration and plan update controls must only exist in the rendered UI when the current `/auth/me` network capability set includes `saas.hotels.write`. Existing backend authorization remains authoritative. Prove an identity with an authorized hotel membership but no network write capability cannot find the controls in DOM or keyboard traversal, including when directly navigating to `/network`. Add explicit keyboard evidence that authorized controls remain reachable and inaccessible controls do not become focusable. No other surface or permission behavior is in scope.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Network write affordances require server capability | `NetworkPage.tsx`, capability context | Register property and plan-update `<select>` are rendered only when `saas.hotels.write` is in the current server-provided network set; no role-name logic or client grant | component diff; local Worker browser assertions for saas_admin and ops/receptionist without network write |
| Read-only plan remains legible | Network detail | Without write capability, selected hotel's plan remains readable as text; no select/form exists | browser DOM/content assertions |
| Backend remains authority | `/api/v1/hotels` POST and plan PATCH | Existing route guard and response semantics unchanged; direct API remains denied without grant | source diff audit and CF-I07; no permission changes |
| Keyboard availability | Network page desktop and mobile | Authorized keyboard user can focus register and plan controls; unauthorized direct-route user tabs through visible controls without focusing any write control; hidden nav remains absent | Playwright keyboard traversal + focused element assertions |
| Exact existing scope preserved | Network / AppShell | Capability arrays still sourced only from `/auth/me`; scopes are not merged; no role map added | API tests and integrated D1/Worker result |

## Non-goals / forbidden

Do not change API routes, guards, role grants, Access, membership, tenant routing, network read behavior, hotel operations, migrations/schema, product policy, other F0.10 surfaces, F0.11, or Blocks A–H. No real data, remote bindings, PR/push/merge, main, staging, deploy or production. Existing exact Artifact A and B remain immutable; repair yields replacement A2 and orchestration-only B2.

Implementation surface clarification: `AppShell.tsx` may remove the now-unused `data-network-capabilities` attribute and the obsolete CSS-only Network visibility rule/file once NetworkPage performs capability-based conditional rendering. This removes a dead presentation path and preserves the same server-provided capability semantics; it is included only if needed to remain within the frozen JS budget. No hotel capability data attribute used by other surfaces may be removed.

## Concurrency, idempotency, recovery

No business mutation is added or changed. Capability context continues clearing on identity change and rejecting stale `/auth/me` responses. Register/plan API operations are unchanged and remain server guarded. A stale or absent capability fails closed by omitting the controls. No optimistic update or retry is added.

## Invariant classifications (all 24)

| Invariant | Classification | Reason/evidence obligation |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business write semantics change. |
| INV-AUDIT-001 | N/A | No audit-producing operation or audit record changes; direct denied requests have zero product mutation. |
| INV-DOMAIN-001 | N/A | No domain command/state transition changes. |
| INV-TENANT-001 | APPLIES | Use the current hotel member without network write plus a separate network-only identity; preserve independent hotel/network scopes and no cross-tenant effects. |
| INV-RBAC-001 | APPLIES | Exact server capability controls rendering; API guards remain authoritative; prove allowed/denied role contexts and zero denied writes. |
| INV-PARITY-001 | N/A | No source workflow or route capability changes. |
| INV-ENUM-001 | N/A | No state/enum changes. |
| INV-UX-001 | APPLIES | Authorized controls remain discoverable/usable; unauthorized affordances are absent and plan remains readable. |
| INV-ORDER-001 | N/A | No operational queue ordering changes. |
| INV-RESP-001 | APPLIES | Assert visibility and keyboard reachability at desktop 1280×900 and mobile 375×844. |
| INV-EVID-001 | APPLIES | Capture exact DOM/focus/browser and D1 evidence; distinguish source inspection from integrated result. |
| INV-LEGACY-001 | N/A | No historical row handling. |
| INV-MONEY-001 | N/A | No monetary behavior or calculations change. |
| INV-STATE-001 | APPLIES | New immutable A2 + orchestration-only B2 and fresh critic required; no self-acceptance. |
| INV-CF-I07-001 | APPLIES | No frontend role map; canonical API capability helper remains sole authority. |
| INV-CF-I07-002 | N/A | No admin mutation implementation change. |
| INV-CF-I07-003 | N/A | No role downgrade operation in this bounded repair. |
| INV-CF-I07-004 | APPLIES | Integrated runner must own and verify cleanup of its processes. |
| INV-CF-I08-001 | N/A | No report arithmetic changes. |
| INV-CF-I08-002 | N/A | No network KPI aggregation changes. |
| INV-CF-I08-003 | N/A | No reporting date/state predicates change. |
| INV-CF-I08-004 | N/A | No booking or room state predicates change. |
| INV-CF-I08-005 | N/A | No reporting clock or cross-surface continuity changes. |
| INV-SCOPE-001 | APPLIES | Diff only NetworkPage render gating and targeted integrated keyboard/visibility evidence. |

## Development Gate and recovery

Close only when the exact write controls are capability-gated in DOM, keyboard assertions pass for authorized and unauthorized contexts at desktop/mobile, all prior F0.10 checks are rerun after any product code change, invariant evidence is complete, and fresh Independent Critic reviews exact A2+B2. A failed test is repaired under this contract. If frontend and current `/auth/me`/route contract contradict, stop as a contract conflict; do not broaden authorization.

Rollback/recovery is the forward code change only: restore the prior read-only plan text/form-visibility implementation within a new artifact if required; backend grants/data have not changed. Human Gate is not required for this bounded technical repair. Foundation remains open through F0.11 and F0.12; no aggregate PASS is declared here.

## Frozen Pre-Critic result

`PRE-CRITIC: PASS FOR BOUNDED REWORK — implementation may begin`

Evidence before change: critic found no ROADMAP_BLOCKER or architecture contradiction. The registration `<details>` and plan `<select>` were already hidden by CSS keyed to AppShell's exact `data-network-capabilities`; however, controls remained mounted and there was no negative-capability/keyboard browser proof. This repair tightens the same accepted presentation contract by conditionally rendering them from `CapabilitiesContext`, then proves actual DOM and keyboard behavior. No additional product decision is introduced.
