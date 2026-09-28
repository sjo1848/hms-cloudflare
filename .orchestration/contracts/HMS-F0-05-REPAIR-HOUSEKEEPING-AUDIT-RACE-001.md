# Technical Repair Contract — F0.5 Validation Finding: Housekeeping Audit Race

Status: `AUTHORIZED / BOUNDED TECHNICAL REWORK`
Branch: `impl/hms-foundation-0`
Parent task: `HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001`

## Finding and scope rationale

The required CF-I05 regression exposed a shared room-state correctness defect: concurrent callers can both read the same room-state version; the guarded room update allows only one winner, but the stale caller's unconditional housekeeping audit insert can still commit. The stale request returns 409 after its batch has already written a second event. This violates binding `INV-ATOMIC-001` and `INV-AUDIT-001` and prevents the authorized Foundation validation chain from closing. This repair is limited to making the existing housekeeping transition's event conditional on the exact target state/version and on no event already recording that transition version. It does not change product behavior or broaden housekeeping features.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Stale concurrent room command must not create an event. | Existing `apps/api/src/routes/housekeeping.ts`; regression scripts and executing-D1 room-command tests. | Event insertion is conditional on the room's post-transition version/state and absence of a prior event for that room/event type/version. No SQLite `changes()` causal chaining. | Deterministic/concurrent request regression: one 200, one 409, target state/version advanced once, exactly one event. |
| A later legitimate transition remains possible and auditable. | Same transition route and current migration guards. | Event identity is scoped to room + event type + `room_state_version_after`; a later version can emit a new event. | Start/finish race and replay tests, exact event details. |
| Audit failure still rolls back the room mutation. | D1 batch in existing transition route. | A thrown event-trigger error aborts the batch; zero-row guarded insert yields a conflict without a second event. | Executing-D1 injected audit failure and exact before/after snapshots. |

## Invariants

| Invariant | Classification | Acceptance mapping |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Guarded update/event pair; race, stale replay and injected event rejection leave no partial mutation. |
| INV-AUDIT-001 | APPLIES | Exactly one event iff one transition wins; loser produces none. |
| INV-DOMAIN-001 | APPLIES | Preserve existing housekeeping transition state rules; no new states or alternate command. |
| INV-TENANT-001 | APPLIES | No tenant routing or identity changes; regression continues to assert hotel/request provenance. |
| INV-SCOPE-001 | APPLIES | Only repair the shared command's audit race required by the Foundation validation; no housekeeping UX/features. |
| All other registry invariants | N/A | No corresponding surface/contract behavior is changed by this narrow repair. |

## Constraints and gates

- Do not use `changes()` as a cross-statement causal token.
- No product/schema/migration change is planned; keep the repair on the existing versioned D1 event contract.
- Do not modify Reports, Users, production, real data, `main`, staging, or deploy.
- Re-run executing-D1 room-state tests, CF-I05, full `npm run check`, browser regression, and F0.5 required validation after correction.
- This is internal technical rework under approved Foundation 0 authority, not an Independent Critic or Development Gate PASS.
