# TASK CONTRACT — UX-UI-RECEPTION-CHECKIN-001

Task ID: `UX-UI-RECEPTION-CHECKIN-001`  
Phase: `BUILD`  
Branch: `impl/ux-ui-reception-checkin`  
Base snapshot: `6ffd6f9aa8e6836d60cbeba5383494605e5611cc`  
Authority: Human authorization in the current task request; `UX-UI-RECEPTION-CHECKIN-001` Google Doc (UI Contract & Wireframes v1, read in full); parent `UX-UI-INTERACTION-SYSTEM-001` Google Doc; P0.1 behavior/evidence in `.orchestration/contracts/P0.1-RECEPTION-ARRIVAL-CHECKIN.md`.

## Design authority and outcome

Implement Reception + Guided Check-in as the first HMS UI Interaction System reference implementation. Preserve P0.1 domain behavior and make the existing workflow feel continuous on desktop and mobile.

The reference was located in connected Drive and read in full: `HMS Cloudflare — Reception + Guided Check-in — UI Contract & Wireframes v1` (Artifact ID `UX-UI-RECEPTION-CHECKIN-001`, Doc ID `1vvDchF0ll5qQXlA0DKhuSNw4EIyouAtragUi89RI_VE`); its parent is `HMS Cloudflare — UX/UI Interaction System v1 + Workflow Component Matrix` (Artifact ID `UX-UI-INTERACTION-SYSTEM-001`, Doc ID `112Lp-pYeDOfC9Ij8XXAMCbQe4Gs4Op-KblhI9Uh0t_c`). The current Human request explicitly authorizes implementation. The full source contract's key ordering is task header → authoritative context → blockers/advisories → task inputs → consequences/review → sticky primary action → authoritative refresh → return/next case. Progressive disclosure should preserve decision-critical facts and not crowd Reception.

## Scope

- Desktop: Reception remains visible as the main context; check-in opens in a right-side shadcn Sheet.
- Mobile: check-in opens in a shadcn Drawer/full-screen task with comfortable scrolling, stable header, reachable primary action and predictable close/back behavior.
- Reception queue entry remains an explicit dominant check-in action. Group only the existing selected-arrival secondary controls (reservation edit and close selection) in a Dropdown Menu; do not add commands or alter their domain behavior. Check-in remains independently visible.
- Both surfaces retain guest, room, stay dates, readiness, BLOCKING/NON_BLOCKING meaning, stay summary, consequences, inline validation and loading/error/conflict/success states.
- Keep filter, search, selected booking, lane, queue scroll and navigation context when task opens, refreshes, conflicts, succeeds or closes.
- Keep the normal Check-in action visible. Dropdown Menu may contain only secondary booking actions; do not add it solely to satisfy a component list.
- Use existing Reception and i18n patterns. Add only the shadcn Sheet/Drawer primitives needed by this flow. No alert dialog for ordinary check-in; no tabs for workflow steps; no hover-only required facts; toast is supplemental only.
- Show final consequences before confirmation: booking becomes checked in, assigned room becomes occupied, and the operational handoff is clear. Explain a disabled primary action with the known blocker and safe next action; do not use color as the only distinction.
- Backend/API changes are forbidden unless a reproducible UI requirement cannot be met through the current P0.1 contract. If demonstrated, document the gap and make the minimum contract-aligned correction.

## Acceptance — requirement → surface → proof

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Desktop continuity | Reception + Sheet | Queue remains the parent context; right Sheet does not navigate; filter/search/selection/lane/scroll are retained on close and success | Real browser at desktop width; screenshots: queue, Sheet, blocker, advisory, success |
| Mobile task | Reception + Drawer | Full-height task, internal scroll, fixed header/footer, touch-size actions, close/back without hover; no small modal | Real browser at 375/390px; screenshots: queue, Drawer, blocker/advisory, success/return |
| Required context | Task header/body | Guest, assigned room, check-in/out dates remain in a stable header; authoritative stay facts, readiness, maintenance impact, compact summary/consequences and validation are available in the task in the source-defined progression | Browser assertions and visual review |
| Readiness semantics | Task body | BLOCKING names the cause and prevents submit; safe next action is stated when known. NON_BLOCKING is visibly advisory and permits continuation; neither distinction relies on color alone | Real API/D1 fixture for both statuses |
| Loading and errors | Task body/actions | Reception stays stable while task loads; busy state is local to task; errors are inline; pending submit cannot double-submit | Real browser and request-count assertion |
| Stale conflict | Task body | 409 stays in Sheet/Drawer, explains changed state, refreshes authoritative facts and allows retry only if now eligible | Real Worker/D1 concurrent readiness change, persisted zero-drift assertion |
| Success | Task + queue | API response is not treated as final display state: authoritative refresh precedes success/advance; new booking/room state appears, success is visible, Reception context remains and next canonical case is offered | Real Worker/D1 E2E + assertions for D1 event/state and queue selection |
| Keyboard/focus | Both surfaces | Open focuses task heading; Tab/Escape and explicit close are predictable; focus restores to next case or original trigger; validation is associated inline | Browser keyboard/focus assertions |
| Reference implementation consistency | Component layer | Use shadcn Sheet on desktop and Drawer on mobile; components expose accessible title/description and controlled open/close; no unneeded global navigation/component system | Source review + browser inspection |
| Queue action hierarchy | Selected arrival case | Check-in stays independently visible; only existing edit/close-selection controls move under an accessible Dropdown Menu; no new command or mutation | Desktop/mobile browser and source review |

## Forbidden scope

No backend redesign, Reports, Users, Housekeeping redesign, P0.2 or later workflow, global navigation redesign, broad design-system rewrite, production data, merge, staging, deploy, `main`, or production action. Preserve all existing P0.1 functional behavior.

## Invariant mapping before implementation

| Invariant | Classification | Planned evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Existing authoritative check-in command remains sole mutation; real stale/409 flow proves no false UI success or partial domain state. |
| INV-AUDIT-001 | APPLIES | Real D1 success has exactly one truthful CHECK_IN event; blocked/conflict has none. |
| INV-DOMAIN-001 | APPLIES | UI continues to call only canonical check-in lifecycle command; static diff audit and P0.1 API tests. |
| INV-TENANT-001 | APPLIES | Use active receptionist identity and tenant-scoped P0.1 board/command; existing executing-D1 isolation tests remain green. |
| INV-RBAC-001 | APPLIES | No client-side authority is added; existing denied-role API/D1 tests plus real receptionist session. |
| INV-PARITY-001 | APPLIES | Preserve P0.1 steps, readiness and mobile semantics; source-to-target task map and browser journey. |
| INV-ENUM-001 | APPLIES | Keep canonical booking/room/maintenance values and visible semantic mapping; blocking/advisory real fixtures. |
| INV-UX-001 | APPLIES | Reception continuity and P0.1 information/action semantics preserved; real desktop/mobile journeys. |
| INV-ORDER-001 | APPLIES | Next case remains server canonical priority; fixture order differs from queue order and browser asserts known next booking. |
| INV-RESP-001 | APPLIES | Full control flow at desktop and mobile, including blocker, advisory, conflict, success, context and focus; durable screenshots. |
| INV-EVID-001 | APPLIES | Label mock, unit, local Worker/D1 and screenshot evidence distinctly; integrated browser is mandatory for acceptance. |
| INV-LEGACY-001 | N/A | No legacy or synthetic history. |
| INV-MONEY-001 | N/A | No financial mutation or pricing display in this check-in UI task; existing booking totals/invoices/payments must remain unchanged in D1. |
| INV-STATE-001 | APPLIES | Publish substantive artifact A followed by orchestration-only boundary B with exact A SHA. |
| INV-CF-I07-001 | N/A | No capability authority, admin, network or protected route change. |
| INV-CF-I07-002 | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated E2E process ownership/cleanup must be verified before its PASS marker. |
| INV-CF-I08-001 | N/A | No Reports arithmetic. |
| INV-CF-I08-002 | N/A | No network analytics. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No expanded report states. |
| INV-CF-I08-005 | N/A | No report defaults or analytics continuity. |
| INV-SCOPE-001 | APPLIES | Changed-file and route audit proves check-in UI-only scope unless a demonstrated blocker is documented. |

## Validation and boundary

Run relevant unit/component checks, `npm run check`, types, web build, architecture/i18n/budget checks, and required inherited P0.1 checks. Run directed browser validation and the integrated real local Wrangler Worker + migrated D1 + Vite browser on desktop and mobile. Capture the requested visual states. Perform separate UX/adversarial review and QA when runtime capabilities are available. Complete the mandatory Pre-Critic Gate and invariant evidence before publishing artifact A.

Publish artifact A then orchestration-only boundary B; stop at `Reception + Check-in UI Controller Checkpoint`. Promotion remains blocked. No next workflow starts automatically.
