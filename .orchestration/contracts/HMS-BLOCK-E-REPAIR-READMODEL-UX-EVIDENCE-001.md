# Block E — Bounded Read Model, Case UX and Evidence Repair

Status: **FROZEN BEFORE FOLLOW-UP PRODUCT CHANGES**  
Parent Task Contract: `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`  
Authorization: Controller resolved the bundle gate and resumed E from `8d4ba5e49f025211ccc60dada3fdd4b54b4b9021`; only JS raw ceiling changed to 350000 by separate record `HMS-BLOCK-E-BUDGET-GATE-CONTROLLER-RESOLUTION-001.md`.

## Purpose and findings addressed

Close the scoped implementation/evidence gaps found by separate read-only domain/concurrency, UX/responsive and QA/evidence reviewers. This remains Block E only and cannot revise its frozen domain meaning.

## Bounded requirements

1. **Exact bounded history:** retain the existing D1 event log. Return a deterministic most-recent bounded history per room rather than a hotel-global prefix; include exact event ID, room/case identity, event type, from/to, actor, request and timestamp. For an open selected case, show only events correlated to its exact case ID; room housekeeping history may be presented separately where it has no case. Show a truthful empty state. No new event or retention policy.
2. **Booking impact:** list future `CONFIRMED` booking facts only when the remaining stay interval overlaps the board-date onward interval and an open `BLOCKING` case affects that room. A `NON_BLOCKING` case, terminal booking, non-overlapping booking or missing facts must not be marked AT RISK. Read only; assert both booking rows remain unchanged.
3. **Case semantics/UI:** preserve all stored case facts needed to operate it (status, impact, priority, reason, assignee, reporter/time and resolution facts when available). Keep State, Attention and Impact distinguishable. Existing supported `NON_BLOCKING` and `BLOCKING` values must be selectable when reporting; the server remains authoritative. Resolve exact open cases with the existing exact-case route; preserve occupancy and other dimensions. Legacy room-only recovery remains explicit and separate.
4. **Responsive/context interaction:** make COMPACT/NARROW a Queue→Case task transition rather than a stacked desktop pane; at WIDE retain Queue and Case together. A focused task has correct dialog semantics, keyboard containment, Escape/visible close, and focus restoration. Prove 1280×900, 1280×600/reduced-height, 900×700, 390×844, 320×700 and 844×390. Preserve the existing date query and in-session filter/search/selection through task open/close, refresh and browser history where represented; do not touch global navigation taxonomy.
5. **Loading/capability:** keep last board on refresh failure with visible alert/retry, ignore stale requests, preserve drafts by room/case. Mutation visibility follows server-provided capabilities; direct unauthorized writes still 403 and leave D1 unchanged.
6. **Tenant proof:** seed two independently migrated local operational D1s, grant the same synthetic identity valid active memberships in both, seed distinguishable same-ID room/case/booking/event rows, then prove each board/history/risk read returns only its selected hotel's rows and each write changes only its selected D1.
7. **Regression evidence:** extend existing local CF-I05 API/browser runners and/or add narrowly scoped Housekeeping tests. Cover positive/negative date overlap, blocking/advisory, event case identity/order/bound, empty history, two-tenant isolation, exact queue ordering, visible impact/history/risk, capability denial, focus/navigation and process cleanup.

## Files and non-goals

Allowed within this bounded repair: existing `apps/api/src/routes/housekeeping.ts`; `apps/web/src/features/housekeeping/`; Housekeeping locale catalogs/public JSON/generated key count; Housekeeping-specific unit and executing-D1 tests; `scripts/cf-i05-regression.sh`, `scripts/cf-i05-browser-regression.sh`, `scripts/cf-i05-browser-regression.playwright.js`; task-local evidence/orchestration. No schema, migration, new route, capability/role map, booking mutation, cross-module code, source semantics or additional budget changes. Do not delete valid workflows or translations. Do not alter the historical budget-gate evidence.

## Invariant classification and evidence

The parent task's 24-row invariant map remains binding. This bounded repair reuses its classifications; the applicable set and follow-up proof are frozen in `.orchestration/evidence/HMS-BLOCK-E-REPAIR-READMODEL-UX-EVIDENCE-001-INVARIANTS.md`. No applicable invariant may remain UNPROVEN at final Artifact A. Follow-up self-adversarial admission is `.orchestration/evidence/HMS-BLOCK-E-REPAIR-READMODEL-UX-EVIDENCE-001-PRECRITIC.md`.

## Stop / publication

Any need for new product policy, architecture, schema/domain semantics or crossing E scope is `ROADMAP_BLOCKER`. Any current ceiling failure is `BUNDLE_BUDGET_GATE_REQUIRED`. Otherwise repair and validation continue autonomously under the parent contract. Artifact A remains uncreated until the complete parent validation and Pre-Critic pass; then use the non-circular exact A → B → separate Independent Critic protocol. Final handoff remains `BLOCK_E_COMPLETE_AWAITING_CONTROLLER_REVIEW`.
