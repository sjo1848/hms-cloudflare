# Block C invariant map

Classification is frozen before implementation. Every current registry invariant is listed; evidence is a required acceptance mapping, not a claim of implementation PASS yet.

| Invariant | Classification | Acceptance/evidence mapping |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | No optimistic lifecycle success; duplicates blocked; conflict/uncertainty reconciled with exact authoritative booking/account and D1 assertions. |
| INV-AUDIT-001 | APPLIES | UI reports success only after authoritative command result; executing-D1 checks exact event iff transition won. |
| INV-DOMAIN-001 | APPLIES | Existing reservation and lifecycle commands only; no generic CRUD or invented transition. |
| INV-TENANT-001 | APPLIES | All data from hotel-scoped existing APIs; local Worker/D1 test proves wrong-tenant/unauthorized path has zero effects where relevant. |
| INV-RBAC-001 | APPLIES | Server-owned capabilities control visibility; API guards authoritative; capability denial/refresh remains fail-closed and zero-write. |
| INV-PARITY-001 | APPLIES | Preserve F0.8, P0.1, F0.4/.5, F0.7 and approved C lifecycle/domain semantics; source parity contract and regression evidence. |
| INV-ENUM-001 | APPLIES | Preserve serialized status vs semantic state predicates for booking/room/readiness/maintenance. |
| INV-UX-001 | APPLIES | Every in-scope operation is a focused task from Booking/Stay Case and returns context. |
| INV-ORDER-001 | APPLIES | Queue lane/search/filter and accepted next-priority selection survive all tasks; deterministic Block B regression. |
| INV-RESP-001 | APPLIES | Execute every supported workflow at WIDE/COMPACT/NARROW and reduced-height/landscape; reachable controls and assertions. |
| INV-EVID-001 | APPLIES | Each claim points to exact test/API/Worker/D1/browser output; mocks and screenshots labeled as such; report response-loss limits. |
| INV-LEGACY-001 | N/A | No legacy migration/backfill or legacy record synthesis; F0.8 operation recovery is current command identity, covered by INV-ATOMIC/DOMAIN. |
| INV-MONEY-001 | APPLIES | Integer cents; no payment fabrication or whole-stay repricing; segmented remaining pricing and checkout ledger truth preserved. |
| INV-STATE-001 | APPLIES | Freeze substantive Artifact A then orchestration-only Boundary B, exact identity, non-circular handoff and separate Critic. |
| INV-CF-I07-001 | N/A | No protected admin/network/audit route or capability helper change. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No downgrade flow. |
| INV-CF-I07-004 | APPLIES | Integrated browser runners own and positively terminate Worker/Vite/browser processes before PASS. |
| INV-CF-I08-001 | N/A | No analytics arithmetic/report behavior. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No new status enum; no-show remains deferred. |
| INV-CF-I08-005 | N/A | No analytics/report date defaults. |
| INV-SCOPE-001 | APPLIES | Diff/route audit restricts changes to Reception transactional task UX, tests and evidence; C–H and unrelated modules remain untouched. |

At final Pre-Critic, applicable entries must be marked PASS with concrete evidence or artifact publication is blocked. N/A rationales remain bounded to this Task Contract.

## Final implementation evidence — Artifact A candidate

Classification above is unchanged from the frozen pre-code map. Every APPLIES row passed the local synthetic checks below. This internal gate is not an Independent Critic verdict.

| Invariant | Result | Concrete evidence |
|---|---|---|
| INV-ATOMIC-001 | PASS | Full 175-test serial suite; F0.8 same operation identity/replay/recovery; executing-D1 reassignment race/409; checkout single-mutation server result. See results report and `output/playwright/f0-08-reservation-recovery.log`, `block-c-reassignment-integrated.log`, `block-c-checkout-integrated.log`. |
| INV-AUDIT-001 | PASS | Reservation/check-in/edit/reassignment/checkout UIs wait for operation response and refresh authoritative board; executing-D1 rollback/event tests all pass. |
| INV-DOMAIN-001 | PASS | Only pre-existing commands/capabilities used; extension/no-show/late arrival explicitly deferred; no Worker, schema or lifecycle changes. Exact diff and frozen inventory. |
| INV-TENANT-001 | PASS | Synthetic local Worker/D1 operation tests include unauthorized/cross-hotel recovery denial; Block B integrated runner confirms selected hotel and server read/write boundaries. |
| INV-RBAC-001 | PASS | Server `/auth/me` capabilities remain permission source; billing denial and capability refresh/downgrade scenario passed in Block B regression; UI hides unsupported operations. |
| INV-PARITY-001 | PASS | Full suite 175/175; F0.8 staged creation, F0.4 remaining-stay reassignment, F0.7 settlement and lifecycle regressions; no new semantics. |
| INV-ENUM-001 | PASS | Queue/readiness and checkout assertions keep Booking lifecycle, room occupancy, housekeeping, maintenance impact and service state separate; authoritative D1 reads in Block B and checkout logs. |
| INV-UX-001 | PASS | F08/F11/Reassignment/Checkout evidence proves Case → focused task → authoritative result → Case/Queue; fresh `block-c-reassignment-integrated.log` asserts cancel/back/forward, no task reopen, Case focus restoration and deep-link return. Checkout focus assertion ran before its documented post-mutation local Worker disconnect. |
| INV-ORDER-001 | PASS | Block B workspace runner proves lane/search/filter, priority and queue restoration; fresh Block C reassignment Worker/D1/browser runner preserves Case/Queue selection through cancel and Back/Forward history without reopening a cancelled task. |
| INV-RESP-001 | PASS | Block B geometry plus focused Reservation/Checkout viewport assertions cover WIDE, COMPACT, NARROW, reduced-height and landscape; Reassignment entry focus is asserted at desktop 1280×900 and mobile 375×812 in fresh Worker/D1 browser run; Checkout entry focus is asserted in its task run. |
| INV-EVID-001 | PASS | Report links claims to executable Worker/D1/browser logs and names the checkout rerun disconnect without calling it PASS. UI success uses command/refresh, not screenshots; timings distinguish causal proof from localhost observations and no after-FCP/LCP is claimed. |
| INV-MONEY-001 | PASS | Reassignment D1 evidence preserves historical/consumed nights and payment ledger while reconciling remaining segments; checkout leaves paid amount zero and does not fabricate settlement. |
| INV-STATE-001 | PASS | Frozen Block C and bounded repair contracts predate implementation changes; initial A+B REWORK is preserved; replacement Artifact A2 will be frozen before orchestration-only Boundary B2 and fresh exact-pair Critic. No self-approved PASS. |
| INV-CF-I07-004 | PASS | Fresh reassignment integrated runner emits PASS only after Worker/D1 assertions and verifies its owned Worker/Vite/browser process trees stopped; original checkout and other Block B/C runners retain cleanup evidence. |
| INV-SCOPE-001 | PASS | Final source diff is limited to Reception UI/API adapter/hook/styles/i18n, local tests/runners, requested output evidence and orchestration evidence. No backend/API/schema/capability or D–H product changes. |

All invariants classified N/A above remain N/A with their frozen rationales. Evidence manifest and exact A/B identity are recorded at the orchestration-only boundary after Artifact A is committed.


## Bounded REWORK verification — exact replacement candidate

Independent Critic A+B findings are recorded in `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INDEPENDENT-CRITIC-A-B.md`; bounded contract is `.orchestration/contracts/HMS-BLOCK-C-REPAIR-HISTORY-FOCUS-001.md`. All original 24 invariant classifications remain unchanged. Fresh Block C integrated Reassignment exit 0 asserts task focus, cancellation history, browser Back/Forward, Case focus and direct deep-link context on real local Worker/D1. Final full Vitest is 35/175 PASS; TypeScript, generated types, production build, architecture, i18n, D1 query plans, Wrangler dry-runs and active budgets PASS. Checkout's final rerun limitation and preserved complete initial checkout evidence are explicitly bounded in the Results report; no checkout settlement code changed in this repair. These remain internal Pre-Critic claims, not Independent Critic approval.
