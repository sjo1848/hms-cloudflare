# HMS Cloudflare — Implementation Roadmap Master v1

Artifact: `HMS-CODEX-IMPLEMENTATION-ROADMAP-HANDOFF-009`  
Stage: `IMPLEMENTATION ROADMAP PLANNING`  
Status: `ROADMAP_COMPLETE_AWAITING_CONTROLLER_REVIEW`  
Implementation authorization: **NONE**  
Repository: `sjo1848/hms-cloudflare`  
Audited product baseline: `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`  
Repository/documentary HEAD inspected: `00f1ef8af3ad1225669b93ffeed1c327b78771ec` (`analysis/hms-system-ux-discovery-v1`)  
Planning branch: `planning/hms-implementation-roadmap-f0-a-h`

## 1. Authority and scope

This roadmap plans the frozen product architecture; it does not amend it. Authority: handoff Drive ID `1wrWb_UJJ9BfZWH8QtlqHYXczSXenxV-w_VjiOF1dTKU`; Blueprint 001 `1fKFR1vtxrb97p6D8ouzbCbBfBeQDarXQIZcdtOTIg1s`; Critic Reconciliation 007 `1IY6rpPbtFscOtQ9l1z-xzinx5QlI64nkmpkujDJthus`; Final Disposition 008 `1jbE5KNL3ebdjSMPRBcPNqcsprc3fHjYihjy0qsAtAnI`. 007/008 supersede earlier conflicting text. Supporting Context/IA, Shell/Reception, RoomOps, Finance, Interaction/Responsive and textual Wireframes were consulted as elaboration. No unresolved architectural contradiction was found. No `ROADMAP_BLOCKER` is declared.

The deliverable is a contract and evidence plan for Foundation 0 followed by Blocks A–H. It authorizes no product implementation, schema/data mutation, implementation issue/PR, merge, staging, deployment or production action. Implementation and every material migration/cutover require later explicit authorization. Historical test receipts in the repository are not fresh passes for this roadmap.

## 2. Repository snapshot and drift

The worktree was clean at the discovery boundary; planning changes are isolated on this documentation branch. Fetch/read-only verification resolved the discovery branch locally and remotely to `00f1ef8…`. Comparing audited product baseline `b9197e2…` to that HEAD shows documentation/orchestration additions only: no `apps/**`, hotel/control migration, test, package, Wrangler or `scripts/migration/**` product changes. Thus source inspection applies to the same product code as the audited baseline; the documentation branch adds the AS-IS audit, workflow catalog, journey maps, screenshots and their orchestration evidence. No uncommitted product changes were present at task start.

Observed current constraints relevant to sequencing:

- Hotel D1 schema through migration `0021`: `rooms.status` remains a single unconstrained text column; `room_inventory_nights` records room-night ownership; booking total is one integer-cent aggregate; there is no persisted stay-pricing-segment relation.
- Maintenance impact has a forward migration at `0020`; it preserves one open case per room. Backfill classifies an open case as BLOCKING when the room is currently `MAINTENANCE`, otherwise NON_BLOCKING. It does not recover the Housekeeping state hidden by a prior status overwrite.
- `0021` hardens remaining-night reassignment inventory guards, but reassignment pricing still derives a destination rate times the booking’s total night count. Search/preview/mutation must be measured against the single interval and segmented-pricing contract before Block C accepts it.
- Billing reconciliation `0019` guards VOIDED/ledger-mismatch repricing and derives invoice totals from booking total and payment entries. Payment rows have an operation token (`0015`,`0016`); `extra_charges` has no such persisted token/unique replay contract in `0010`; cash close has an internal token (`0012`) generated per request at the API.
- `auth/capabilities.ts` is the server-side role capability authority, but `/api/v1/auth/me` returns role/network_role rather than effective capability sets. AppShell uses identity/hotel context and does not consume a server-owned capability payload. Client refresh/invalidation is a new contract requirement, not permission to duplicate role maps in the browser.
- Cash today is “Caja actual / desde último cierre”; there is no explicit session-open/float owner model. Human validation of shared cash box versus operator/session-owned cash gates only the Cash subsection of Block F.
- Existing migration rehearsal (`scripts/migration/*`) is synthetic-fixture, multi-D1, sequential evidence. It is not real-data extraction, production cutover authorization, or proof of atomic cross-D1 rollback.

Detailed path inventory and evidence limitations appear in the companion contracts and matrices.

## 3. Ordered roadmap

| Order | Increment | Outcome | Exit / dependency |
|---|---|---|---|
| 0 | Foundation 0 F0.1–F0.12 | Establish authoritative room dimensions and shared invariants; complete safe room-state and active-stay pricing cutover design/implementation evidence; settle lifecycle, pricing, billing, create recovery, charge retry and server-owned capabilities contracts. | F0.12 evidence gate; ambiguous existing room/bookings explicitly reconciled or held out of unsafe activation. Mandatory before affected A–H. |
| A | App Shell + navigation/context | Separate operations, directory, insights, hotel administration and platform surfaces; server-capability-aware navigation; hotel/user context; routes/deep links, Back and refresh continuity. | Depends on F0.10/F0.11; capability and shared task/context contracts integrated. |
| B | Reception + Booking/Stay Case | Lifecycle queue and selected transactional case become the front-desk operating workspace, not the old stacked landing. | Depends on F0.1/F0.2/F0.7/F0.10–11 and A shell contracts; integrates with C/D/E/F. |
| C | Reservation + Check-in + lifecycle tasks | Guided reservation create/edit and lifecycle tasks; guest creation inside reservation; check-in, reassignment, checkout; extension only if real capability exists; late-arrival/no-show only when backend/domain contracts support them. | Depends on F0.2–F0.9 as applicable, A+B, Room/Account/readiness APIs. T2 preview/search/mutation parity is explicit acceptance. |
| D | Rooms | Operational Room workspace consuming separate Occupancy, Housekeeping, Maintenance Impact, Service, Readiness and date-range Sellability; holds and navigable booking/guest/maintenance context. | Depends on F0.1–F0.3 and A; integrates with B/C/E. |
| E | Housekeeping + Maintenance | Task queue and first-class case with collective discovery, impacts, history, affected booking risk and state-preserving resolve. | Depends on F0.1–F0.3, A and B; checkout handoff and room readiness integrate with C/D. |
| F-noncash | Booking Account, charges, payments, receivables/Finance | Contextual account and payment tasks; portfolio/discovery only as Blueprint-defined; D11 ledger truth and ambiguous outcome recovery. | Depends on F0.5–F0.9 and A/B/C. May proceed separately from Cash after Foundation finance contracts. |
| F-cash | Cash / Close | Global hotel-level “Caja actual / desde último cierre,” cash composition, close/handoff and history; do not invent Shift ownership. | Only after real-hotel cash validation. Shared-box result preserves V1. Operator-owned result reopens only Cash Session ownership/float/handoff contract. |
| G | Guests + Reports + Administration + Network | Align directory, insight, hotel administration and platform administration to shell/context/capability authority; preserve analytics/access semantics. | Depends on A/F0.10–11. Network remains capability-gated and separate from hotel operations. Can parallelize by module after A contracts stabilize. |
| H | Cross-module hardening | End-to-end WIDE/COMPACT/NARROW continuity, accessibility, Back/Forward, keyboard/reduced-height, loading/refresh/conflicts and budget regression across integrated flows. | After material A–G workflows are integrated; not a substitute for block-specific QA or critic. |

Do not place a UI feature ahead of its required domain truth. Blocks are independently contracted below. Parallel work is allowed only where their shared API/context contracts are frozen and they do not write overlapping surfaces; see DAG.

## 4. Gate model

Every Foundation item and Block uses five distinct decisions: **G0 Contract Ready** (Controller confirms exact scope/surfaces/acceptance and unresolved conditions), **G1 Implementation Complete** (writer evidence, no self-PASS), **G2 QA Evidence** (directed domain/API/D1/browser tests, failures resolved), **G3 Independent Critic** (fresh artifact-specific external reviewer when required; never self-approved), **G4 Controller Review**, then **G5 Human Gate** where product intent, data risk, cash ownership, irreversible cutover or promotion requires Human authority. A lower gate cannot imply a later one.

Foundation 0 completion means readiness for product blocks, not permission to mutate real data or promote. A real-data cutover plan must pass its own explicit Human/data-risk authorization before execution. UI/API QA runs only against authorized local/synthetic fixtures until then.

## 5. Shared implementation rules carried to every block

- Preserve property-scoped D1 routing and backend authorization. Client capability visibility is presentation only; `/auth/me` or equivalent is the server truth.
- Treat domain transitions as commands. Use exact-winner conditions, tenant/object identity, zero-row/ABA tests, atomic event pairing and no partial side effects.
- All money is integer cents; booking account, immutable payment ledger, invoice and cash aggregate are distinct. Uncertain financial outcomes require stable operation identity, lookup/reconciliation and safe retry.
- State, Attention and Impact stay separate. Room “Available” never implies arbitrary-date sellability. Occupancy, housekeeping, open maintenance impact, service state, derived readiness and interval sellability are distinct.
- Preserve current contextual origin, selected entity, filters, search, date and scroll where meaningful; Back/Forward and refreshed authoritative state are product behavior.
- Responsive acceptance is operational, not screenshot-only: material actions at WIDE/COMPACT/NARROW, reduced-height, mobile keyboard/focus and conflict/recovery. Historical receipts remain historical.
- Do not reintroduce deprecated Billing/Cash below Reception, duplicate booking selectors, all-Sheet/all-Drawer task policy, generic room status, browser-native destructive confirms, hover-only critical information, whole-page refresh spinner, or toast-only critical/success feedback.

## 6. Risks, decisions and blocker classification

Material risks are in [Risk Register](HMS-IMPLEMENTATION-ROADMAP-RISK-REGISTER-V1.md); product/controller questions in [Open Decisions](HMS-IMPLEMENTATION-ROADMAP-OPEN-DECISIONS-V1.md). Most material are bounded by approved 007/008 contracts: uncertain legacy room state and historical pricing require explicit reconciliation and cannot silently become READY or be repriced. Unknown live-data distributions are not an architecture contradiction.

**ROADMAP_BLOCKER: none found.** If later source inspection finds that a required transition cannot be represented while preserving separate dimensions or the ledger, stop only the affected block, cite the exact frozen requirement and repository behavior, and do not substitute a product rule.

## 7. Required Controller/Human checkpoint

Requested exact gate: **Controller review of this roadmap package against frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008, including confirmation of F0/A–H ownership, DAG, cutover/reconciliation criteria and open decision gates.** On acceptance, a *separate* explicit implementation authorization is still required before Foundation 0. Cash ownership validation and ambiguous-row adjudication remain later, narrowly scoped Human gates. No implementation, migration execution, PR, merge, staging or deployment is requested or implied here.

## 8. Companion artifacts

- Dependency DAG: `HMS-IMPLEMENTATION-ROADMAP-DEPENDENCY-DAG-V1.md`
- Foundation contracts: `HMS-FOUNDATION-0-CONTRACT-V1.md`
- A–H contracts: `HMS-BLOCK-CONTRACTS-A-H-V1.md`
- Traceability: `HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md`
- Evidence: `HMS-TEST-EVIDENCE-MATRIX-V1.md`
- Cutovers: `HMS-ROOM-STATE-CUTOVER-PLAN-V1.md`, `HMS-ACTIVE-STAY-PRICING-BOOTSTRAP-PLAN-V1.md`
- Risk/decisions: `HMS-IMPLEMENTATION-ROADMAP-RISK-REGISTER-V1.md`, `HMS-IMPLEMENTATION-ROADMAP-OPEN-DECISIONS-V1.md`
- Critic: `HMS-IMPLEMENTATION-ROADMAP-CRITIC-V1.md` if and only if a separate critic run is actually available.
- Evidence/governance: `.orchestration/contracts/HMS-IMPLEMENTATION-ROADMAP-001.md`, `.orchestration/evidence/HMS-IMPLEMENTATION-ROADMAP-001-INVARIANTS.md`, `.orchestration/STATE.md`, `.orchestration/STATUS.json`.
