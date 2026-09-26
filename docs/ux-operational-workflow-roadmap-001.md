# HMS Operational UX/UI Roadmap — Discovery 001

Status: `DISCOVERY / DEFINITION — HUMAN GATE`
Date: `2026-09-26`
Task Contract: `.orchestration/contracts/UX-OPERATIONAL-WORKFLOW-ROADMAP-001.md`
Implementation baseline: `a61d688534e0802a27cc7e5badb71dafacad19b9`
V11 authority: `origin/analysis/operational-flow-definition-v11`
Product source UX baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

This is a workflow definition, not a component redesign. It records observed
target behavior separately from V11 target behavior. No product code was
changed for this discovery.

## Evidence method and confidence

Evidence labels used below:

- **Code observed** — inspected current Cloudflare React/API implementation.
- **Browser mock** — current Reception regression executed against the current
  app with API interception; proves rendered controls/interactions only.
- **Integrated browser** — prior Wave 1.2 artifact `47b9fed` exercised the real
  local Worker/D1 and Reception UI for reassignment success and conflict at
  375px. It does not establish integration for the other workflows.
- **V11 target** — binding behavior from V11 operational-flow documents.
- **Inference** — operational priority/risk judgment; not a measured hotel
  event rate.

The current Reception mock browser regression completed check-in, reassignment
and checkout at 375, 390, 430, 768 and 1024px. Its API is mocked. Prior
integrated reassignment screenshots are [success at mobile width](../output/playwright/cf-wave12-reassignment-success.png)
and [stale conflict at mobile width](../output/playwright/cf-wave12-reassignment-conflict.png).
The mock screenshots are not database evidence.

Attempting the repository-managed local acceptance runtime did not reach the
browser: `scripts/cf-i09-local-start.sh --reuse` stopped because the local
database did not match the canonical two-hotel fixture; `--reset` retained the
old local persistence in its managed backup and then failed during migration
rehearsal with `invalid maintenance resolve transition`. This establishes a
local inspection limitation only. It does not establish a production defect.
No Reports/Users browser claims are made here.

The pinned source UX is represented through the checked-in source contract
inventory and approved parity decision; this workspace does not contain the
source repository checkout. Consequently this is a source-contract comparison,
not a fresh pixel-by-pixel source browser audit.

## 1. Current workflow map

`Context changes` counts user-facing module or task-surface changes, not clicks.
Where the current implementation cannot perform the V11 workflow, the row
states that explicitly instead of describing a hypothetical path as current.

| Workflow | Entry and visible context | Current steps / context changes | Decisions and feedback | Desktop / mobile | Backend dependency and current state |
|---|---|---|---|---|---|
| **Reception / Front Desk** | `/bookings`; queue search, five lane filters, guest/room/stay row; select a booking for its case panel. | Load bookings, rooms and guests separately; queue classification/sort runs in client. Select case in same module. Billing also renders beneath the queue and case. No front-desk board read model is wired. | Operator identifies lane/guest/room and chooses a lifecycle action. Queue empty/error feedback exists; no authoritative readiness/blocker summary is assembled by the UI. | Desktop master/detail is present. Mobile switches to stacked list and selected detail lower on page; context can require scrolling. | `GET /bookings`, `/rooms`, `/guests` exist. V11 requires server-owned `GET /front-desk/board`, hotel-local queue semantics, readiness and blockers. **Friction / incomplete parity.** |
| **New reservation** | Reception `Create booking` button; current selected guest and available-room lists. | Expand inline form; choose existing guest; dates; press Find rooms; choose room; optional notes; submit. Same module, but the form expands above queue. | Select guest/room/dates; availability conflict is returned as API error. No inline guest creation, review summary, or clear contextual success selection is evident in this surface. | Desktop form competes with queue width. Mobile form precedes queue and adds vertical scroll. No task drawer/sheet. | `POST /bookings` and `/rooms/available` exist. V11 requires guest→dates→availability→review and atomic `POST /bookings/with-guest` for a new guest. **Friction / incomplete parity.** |
| **Edit reservation** | Select a `CONFIRMED` booking in Reception. Guest, room, check-in/out, notes appear inline. | Change fields; date change asynchronously reloads room availability; submit. One selected case, no module switch. | Operator chooses room/dates/guest and notes. Invalid room may be cleared after availability response. Error is a generic alert; no explicit priced-total review or field-preserving conflict treatment is visible. | Desktop is a form in the case panel. Mobile puts the form in the stacked case; long scroll alongside other lifecycle sections. | `PATCH /bookings/:id` and availability exist. V11 requires price preview for room/date changes and typed conflict recovery. **Friction.** |
| **Check-in** | Confirmed arrival in Reception queue; select case. | Checklist grouped as identity/document, guest/stay, room, final review. On mobile groups advance in four steps; desktop renders all groups together. Submit closes selected case and reloads queue. | Confirm guest count, document, contact, stay; room readiness is shown as current assignment. Backend conflict is surfaced through an alert; browser regression exercises mocked conflict/retry, API regression covers backend. | Desktop all check-in groups compete in case panel; mobile staged flow. Current browser regression passed five widths with mocks. | `/bookings/:id/check-in` enforces checklist/readiness and lifecycle command. V11 calls for focused drawer/sheet, explicit readiness and next-priority continuation. **Usable with friction; integration evidence is partial.** |
| **In-stay reassignment** | Select checked-in Reception case. Current room/stay and reassign form appear in case panel. | Load hotel date, availability and Billing; choose destination; review price and reason; submit. Same module and selection. Checkout form remains alongside it. | Choose only available room; BLOCKING disabled; NON_BLOCKING advisory; price/credit shown; reason min 6; 409 has operational message and refreshed context. | Desktop case panel; mobile full-page stacked content rather than a dedicated focused surface. Prior integrated real Worker/D1 browser success and conflict PASS at 375px. | `/bookings/:id/reassign`, availability, per-room maintenance and invoice endpoints support the flow. V11 drawer/sheet, history and explicit old-room consequence remain target. **Operationally usable; surface still competes with unrelated lifecycle actions.** |
| **Stay extension** | V11: selected checked-in stay in Reception. | No extension control is present in current Reception source. | No checkout-change, added-night availability or repricing review is available. | Not observable as an app flow at either viewport. | V11 requires `POST /bookings/:id/extend-stay`; current lifecycle routes do not expose it. **Incomplete / blocked.** |
| **Checkout** | Select checked-in stay in Reception; checkout form appears with reassignment. | Choose settled/pending-approved policy; optional reference; confirm charge review, room release, housekeeping handoff; submit; case closes and queue reloads. Same module; no separate task surface. | Operator makes settlement/override choice and three confirmations. Backend typed conflicts show generic lifecycle error. Browser regression exercises mocked UI at five widths; no fresh real Worker/D1 checkout flow was run in this discovery. | Desktop and mobile share same inline form; on mobile it follows reassignment content. | `/bookings/:id/check-out`, invoice/Billing and room turnover exist. V11 requires selected-booking authoritative Billing, explicit admin-only override branch, consequence confirmation and resulting maintenance/housekeeping state. Pending override is currently offered as an ordinary dropdown value. **Friction / important authorization clarity gap.** |
| **Late arrival** | V11: confirmed booking selected in Reception. | No late-arrival control or current UI API call found. | ETA and note cannot be recorded in target UI. | Not observable. | V11 requires explicit-offset ETA, hotel-time validation and note; current booking/lifecycle routes expose no late-arrival operation/fields. **Incomplete / blocked.** |
| **No-show** | V11: confirmed arrival on/after hotel-local check-in date, selected in Reception. | No no-show action found. | No reason, eligibility feedback or distinct terminal result in the UI. | Not observable. | V11 requires explicit `POST /bookings/:id/no-show`, reason and inventory release. Status serialization supports `NO_SHOW`, but no command route exists. **Incomplete / blocked.** |
| **Cancellation** | Select confirmed booking in Reception; Cancel booking button. | Click button, then native `window.confirm`; no product dialog. | Confirmation has no required reason input; cancellation error is surfaced at workspace level. No dedicated consequence summary. | Desktop browser-native confirm. Mobile browser-native confirm remains browser-controlled and not an in-app focused task. | `PATCH /bookings/:id` cancellation exists, but current client sends status only. V11 requires reason min 6, clear inventory/consequence and a product danger dialog. **Broken against target contract.** |
| **Payments** | Reception embeds Billing below its queue/case, or navigate to Billing-owning Reception workspace. | Billing fetches bookings and offers its own booking selector; enter amount, method, reference/note; register; refresh selected invoice/payment/charges. Can require scrolling from active Reception case and can drift from selected booking. | Choose booking and amount/method; balance/remaining shown; errors refresh and display retry/conflict message. Submit pending state exists for payment. | Long forms are vertical on mobile; separate selector and payment section are far below Reception task. | Payment/invoice/balance endpoints and D11 ledger are supported. V11 says Reception-selected booking owns embedded Billing and no independent selector. **Financially supported, high context friction.** |
| **Extra charges** | Same Billing section/booking selector as payment. | Enter description and amount; submit; refreshed list. | Decide description/amount; total consequence is not shown before submission in this surface; no explicit pending/double-submit state is evident for charge. Errors appear as workspace alert. | Same long, vertically stacked Billing panel. | `/bookings/:id/extra-charges` and D11 reconciliation exist. V11 requires resulting total/Billing consequence before confirm. **Supported backend, friction in interaction.** |
| **Housekeeping** | `/housekeeping`; date, search, refresh, Next task, shift/Dirty/Cleaning/Available/Maintenance filters. Select room task. | Select task; start/finish cleaning; board reload; optional advance. Mobile opens focused detail after selecting a room and returns to queue; this path is present in code and historical/inherited browser evidence. | Decide next room/task; occupied departure blocker or maintenance state; input resolution/reason/assignee. Current reload sets loading while fetching, which may replace known board with loading text. | Desktop queue + detail. Mobile focus behavior exists; status filter strip scrolls horizontally. Historical Housekeeping screenshots/tests are present but not rebuilt with the current local acceptance fixture. **Usable base with refresh/context friction.** |
| **Maintenance** | Current target combines report/resolve controls inside Housekeeping room task; no contextual Reception report action found. | Select room; fill reason, priority, assignee; submit. UI sends `impact: BLOCKING` unconditionally. Resolve uses a separate resolution text in the same task details. | Operator cannot choose NON_BLOCKING in current UI, although API accepts both impacts; no clear guest/booking/future-reservation context in Reception. | Desktop task detail; mobile uses the Housekeeping focused view, but reporting and resolution controls extend the page. | Open/escalate/resolve routes and capabilities exist; V11 impact semantics and future-booking alert are binding. **Incomplete parity / user intent cannot be expressed.** |

## 2. UX assessment matrix

No hotel usage telemetry or shift diary is present in this repository. Frequency
is therefore a qualitative workflow proxy: **each shift/daily**, **booking
event**, **exception/event-driven**, or **periodic**. It is not an observed count.
Criticality/error cost are high when a wrong result changes guest occupancy,
room readiness, inventory or money; medium when it is recoverable metadata or
task ordering. Cognitive load reflects the distinct facts/decisions the current
surface asks an operator to hold. Step/context labels come from current code,
not the V11 target. These judgments are provisional until hotel staff validate
actual volume and pain.

| Workflow | Frequency proxy | Criticality / error cost | Cognitive load | Current task stages / context changes | Context loss | Clarity | Mobile | Recovery | Daily impact and evidence rationale |
|---|---|---|---|---|---|---|---|---|---|
| Reception hub | Each shift / daily | High / high | High | Queue→case→scroll to Billing; 0 module switches, several independent panels | High | Medium | Low-medium | Medium | Controls arrival/departure work; local client queue lacks V11 blocker/readiness context. |
| New reservation | Booking event | High / high | High | Guest→dates→availability→room→create; same module, inline expansion | Medium | Medium | Low | Low-medium | Wrong room/date creates inventory conflict; no atomic inline guest intent. |
| Edit reservation | Booking event | Medium-high / high if room/date | High | Select→edit→async availability→save | Medium | Medium | Low-medium | Low | Room/date changes affect inventory and D11 price; no clear consequence preview. |
| Check-in | Each arrival / daily | High / high | High | 4 logical checklist groups; mobile staged, desktop simultaneous | Medium | Medium-high | Medium | Medium | Gate from confirmed stay to occupied/readiness; browser mock regression evidence. |
| Reassignment | Exception/event-driven | High / high | High | Select→candidate→price/reason→submit; no module switch | Medium | High for candidate/price; medium for full context | Medium | High in demonstrated 409 path | Guest/room/billing/inventory effect; real local success/conflict evidence on prior artifact. |
| Extension | Exception/event-driven | High / high | High | Not available | High | None | None | None | Requires additional nights and D11; user currently cannot complete the intent. |
| Checkout | Each departure / daily | High / high | High | Billing policy + reference + 3 confirmations; inline with reassignment | High | Medium-low | Low | Medium-low | Ends occupancy and turns over room; ordinary dropdown hides privileged override distinction. |
| Late arrival | Exception/event-driven | Medium / medium | Medium | Not available | High | None | None | None | Prevents staff from recording ETA in target; V11 requires exact time semantics. |
| No-show | Exception/event-driven | High / high | Medium | Not available | High | None | None | None | Terminal state/inventory release can race with check-in; no task exists. |
| Cancellation | Booking event | High / high | Medium | Select→native confirm→cancel | Medium | Low | Low | Low | Irreversible terminal transition; no reason and browser-owned confirmation. |
| Payments | Each collection / daily | High / high | High | Select booking→amount/method/reference→submit; Reception to lower Billing section/independent selection | High | Medium | Low | Medium | Money and selected booking can drift; server ledger/D11 is sound but UI ownership is not. |
| Extra charges | Stay/checkout event | High / high | Medium | Select booking→description/amount→submit | High | Medium-low | Low | Low-medium | Priced mutation lacks visible before-confirm total consequence. |
| Housekeeping | Each turnover / daily | High / medium-high | Medium | Filter/search/date→select→transition→reload | Medium | Medium-high | Medium | Medium | Room readiness gates arrivals; queue/focus foundation exists, but refresh can displace known state. |
| Maintenance | Event-driven; urgent cases may interrupt shift | High / high | High | Select room→case fields→submit/resolve; current UI only sends BLOCKING | High | Low-medium | Low-medium | Medium | Wrong impact changes saleability/readiness; existing bookings need visible warning without auto-move. |

## 3. Main frictions evidenced in the current target

1. **Reception case view mixes unrelated actions.** Reservation editing,
   check-in, reassignment and checkout are rendered inline in the selected case.
   On mobile, reassignment is followed by checkout and then a long Billing
   section. The 375px integrated conflict screenshot shows how much scrolling
   and unrelated form context a reassignment operator sees.
2. **Queue context is weaker than V11.** Client-side queue classification uses
   a browser-derived date and booking/room/guest fetches. V11 requires the
   canonical server-owned front-desk board with hotel-local date, readiness,
   blockers and deterministic priority.
3. **Billing can lose Reception’s selected booking.** Billing has an independent
   booking selector; payment/charge intent can silently point at another stay.
4. **Cancellation is not a product workflow.** Native browser confirmation,
   no required reason and no consequence summary conflict with V11.
5. **Three approved lifecycle intents are missing from the user surface:**
   late arrival, no-show and extension. Backend commands/fields are also absent
   for those intents except the NO_SHOW status representation.
6. **New reservation is only partially composed.** Existing guest selection
   works, but inline guest creation plus booking is not the atomic V11 intent.
7. **Maintenance intent is collapsed.** Current control always reports
   BLOCKING, so the operator cannot record NON_BLOCKING advisory work even
   though the backend accepts both values.
8. **Refresh and recovery are inconsistent.** Some workflows keep typed state
   and refresh locally; others close the selected case after mutation or
   replace visible content with loading. This makes success and next action
   less predictable.
9. **Mobile shell is a hamburger-only module switch.** The current shell lists
   all modules without server-derived effective capabilities. V11 requires
   capability-aware direct core navigation and a secondary More surface; API
   authorization remains the security boundary.

## 4. Common operational interaction model

Adopt the hypothesis with task-specific variations:

`select booking/room context → open one focused task → collect only missing
facts → show blockers and consequences → confirm domain command → show local
result → authoritative refresh → return to same/next operational context`

- Desktop: persistent shell; queue/list and selected context stay visible;
  multi-field work uses one right-side drawer. Do not stack unrelated forms in
  the detail panel.
- Mobile: selection opens a full-screen task sheet; sticky task header and
  primary action; close/Back restores prior filter, selected row and scroll.
- Exceptions: low-risk late-arrival metadata uses a compact dialog/popover;
  cancellation/no-show/final checkout use consequence-specific confirmation;
  payment and extra-charge work gets financial consequence before confirmation.
- Every recoverable conflict keeps the operator in the task, refreshes
  authoritative facts and preserves still-valid input. Never replay a write.
- On success show task-local confirmation, refresh linked room/booking/Billing
  read models, and keep the selected item if still relevant. Otherwise select
  the next item using canonical V11 queue priority.
- Filters, search, selection, Back/Forward, focus restoration and reduced-motion
  behavior are acceptance semantics, not optional polish.

This model is already supported by V11 documents `03a`, `03b`, `03c`, `21` and
`22`. It is not permission to change domain meaning or introduce a parallel
product experience; `.orchestration/decisions/CF-UX-PARITY-001.md` remains
binding.

## 5. Prioritized roadmap

Priority reflects the operation’s role in daily guest/room/money outcomes and
the current contract gap. The ranking is not based on implementation ease.

### P0 — daily shift continuity and room/money truth

1. **Reception operational hub and selected-case continuity.** Connect the
   queue to the canonical V11 board and context-preserving task model. This
   enables the rest of Reception; keep it a visible operator workflow, not an
   infrastructure-only foundation.
2. **New/edit reservation and arrival check-in.** These directly control
   booked room nights and the arrival→occupied transition. Keep guest, dates,
   availability, readiness and price consequence together.
3. **Checkout with Reception-selected Billing.** Departure is a daily room
   release and a settlement decision; Billing must follow the selected booking.
4. **Housekeeping turnover.** Dirty/cleaning/available room readiness directly
   controls whether the next arrival can be served. The existing module is a
   usable base, but refresh/queue/context completion belongs in this tier.
5. **Payment and extra-charge task context.** Keep the high-risk financial
   operations tied to the Reception-selected booking and show exact D11
   consequences. Frequency has not been measured, but each mutation has high
   cost of error and is part of the same stay/checkout workflow.

### P1 — high-impact in-stay and arrival exceptions

6. **Reassignment and extension.** Reassignment already has an integrated
   Reception flow; its next UX increment is review/final fit after this
   definition gate. Extension is a missing user-visible command. Both alter
   remaining inventory and D11 Billing; never auto-move a guest.
7. **Cancellation and no-show.** Separate terminal intents, reason capture,
   hotel-local eligibility for no-show, inventory release and distinct success
   meanings. Low/variable frequency does not lower the error cost.
8. **Late arrival.** Fast in-context ETA/note update, validated by explicit
   offset and hotel-local stay date, without a lifecycle wizard.
9. **Maintenance.** Make impact explicit, show occupied/future-booking
   consequences, and route the right role to report/escalate/resolve. A
   BLOCKING incident must interrupt the relevant operational queue; an existing
   future booking remains intact for Reception to resolve explicitly.

### P2 — lower-frequency supporting/read-only workspaces

10. **Rooms/Guests administration and Reports/Users/Network read-oriented
    tasks.** Improve search, filters, contextual navigation, state continuity
    and responsive detail after daily Reception and room-readiness journeys are
    coherent. Rooms/Guests remain operational context providers, not “read-only”
    modules where they actually mutate inventory or guest records.

### Change from initial priority hypothesis

Housekeeping moves from P2 to P0 because each turnover changes the pool of
rooms eligible for arrivals. New/edit reservations also move to P0 because
availability and inventory errors directly affect the sold stay. Maintenance
is P1 rather than P2: its occurrence may be less frequent, but a BLOCKING case
can prevent sale/check-in and an OCCUPIED incident affects an active guest.
Payments/charges remain visibly coupled to P0 checkout and stay context because
their per-operation error cost is high. These rankings are provisional until a
hotel shift-volume sample or operator interviews validate the frequency proxy.

## 6. Acceptance criteria for prioritized workflows

These are workflow outcomes, not visual specifications.

| Workflow | Acceptance |
|---|---|
| Reception hub | Clear due/attention entry; guest, booking, room, local date, readiness, maintenance and Billing facts are authoritative; queue/search/filter remain stable; selected task opens without losing list position; refresh does not blank known data; stale state explains what changed; success selects the relevant/next priority case. |
| New reservation | Entry from Reception; existing or inline-created guest; dates and availability shown together; invalid range/conflict explained; price/room choice reviewed before submit; inline new guest and booking are atomic; duplicate submit prevented; success selects the new stay in Reception; same context restored on cancel/error. |
| Edit reservation | Selected booking identity remains visible; dates/room changes revalidate availability and price; metadata-only changes do not invent repricing; invalid fields are identified; recoverable conflict retains valid draft; confirmation explains any priced effect; success refreshes the selected booking and queue without losing filters. |
| Check-in | Available only for eligible confirmed arrival context; guided identity/document→stay→readiness→review; server is authoritative for room readiness; no duplicate data entry; mobile focused sheet and desktop drawer; error remains at relevant step with blocker; success reports occupied room and advances by queue priority; keyboard focus enters and returns correctly. |
| Checkout | Checked-in booking context and authoritative Billing stay linked; checklist, payment/override authority, release and handoff consequences are explicit; privileged pending-balance branch is visibly distinct and unavailable to unauthorized roles; conflict stays in task with refreshed balance; success states resulting room readiness and next departure; mobile primary action remains reachable. |
| Reassignment | Selected guest/current room/stay retained; hotel-local effective date and only valid destinations; BLOCKING disabled, NON_BLOCKING advisory; exact new total/delta/remaining/credit shown; reason validation; explicit confirmation; conflict refreshes candidates/Billing while preserving valid reason; success shows new room and old-room state after authoritative refresh; Back returns to same queue/filter. |
| Extension | Selected stay/current room retained; requested checkout and added nights; date/inventory/hold/maintenance validation; total and D11 balance consequence shown before confirmation; 409 identifies availability or Billing change; no partial extension; success updates checkout and selected Billing context. |
| Payment | Payment always belongs to active selected booking; amount/method/reference and remaining balance reviewed; double submit/replay safe; success confirms amount and refreshed paid/remaining state; conflict refreshes invoice and preserves safe input; mobile numeric entry and submit accessible. |
| Extra charge | Charge belongs to selected booking; description/amount plus resulting total and D11 balance shown before confirmation; invalid/voided/mismatched invoice is explained operationally; no duplicate submit; success refreshes invoice and charge list; no fabricated payment. |
| Housekeeping | Board/date and turnover/cleaning/maintenance context visible; only valid transition offered; pending action is local; refresh keeps queue/filter/scroll; next task follows V11 ordering; mobile focused task returns to prior queue position; occupied maintenance has no cleaning action and links to Reception when BLOCKING. |
| Maintenance | Operator can explicitly record NON_BLOCKING or BLOCKING; reason/priority/assignment validated; occupied room remains occupied while blocker affects future sale; vacant BLOCKING room becomes maintenance; future reservation is flagged but never moved/cancelled automatically; role capability controls action; resolution reflects actual physical state; success/conflict refreshes room and Reception context. |
| Cancellation | Confirmed booking only; guest/stay/inventory consequence and required reason min 6; in-app danger confirmation, not browser-native dialog; race with check-in returns conflict and preserves reason/context; success communicates inventory release and refreshes queue. |
| No-show | Eligible confirmed booking at/after authoritative hotel-local check-in date; required reason; explicit product confirmation and distinct consequence; conflict with check-in leaves zero drift; success releases inventory, preserves room/financial truth and removes the case from arrivals. |
| Late arrival | Confirmed booking summary; ETA + note; explicit RFC3339 offset validation and future/in-stay date rule; compact quick dialog; field error is local; success keeps CONFIRMED state/total, refreshes board context and returns focus to trigger. |

## 7. Backend dependency register — record only, no implementation

| Workflow gap | Classification | Evidence / minimum requirement |
|---|---|---|
| Front-desk queue/readiness | `required` | Current routes register bookings/inventory/lifecycle/housekeeping but no `GET /api/v1/front-desk/board`; V11 `03c`/`19` require server-owned local date, deterministic priority, readiness, maintenance blockers and relevant Billing. |
| Inline new guest + reservation | `required` | Current UI selects existing guests and current API exposes separate guest and booking creates; V11 `11`/`19` require atomic `/bookings/with-guest`. |
| Late arrival | `required` | No target control/fields/command found. V11 requires ETA + note, explicit offset, future instant and hotel-local stay-date validation. |
| No-show | `required` | No target command/UI. `NO_SHOW` serialization alone is not a lifecycle transition; V11 requires command, reason, eligibility and inventory release. |
| Stay extension | `required` | No target UI/route found. V11 requires atomic added nights, current-price repricing and D11. |
| Cancellation reason | `required` | Current UI sends `{status:"CANCELLED"}` after native confirm; V11 requires terminal reason min 6 and explicit lifecycle evidence. |
| Capability-aware shell | `required` | Current `/auth/me` omits effective `capabilities[]`/`network_capabilities[]`; AppShell renders the full navigation list. V11 `19`/`21` require server-derived nav hints and guarded direct routes. Backend remains authoritative. |
| Payment/extra charge/D11 | `already supported` | Existing billing routes and Wave 0.3 D11; UI needs selected-booking coupling and consequence review, not another financial source/helper. |
| Check-in/reassignment/checkout | `already supported` | Lifecycle routes exist; reassignment real local API/D1 browser evidence exists in Wave 1.2 artifact. Check-in/checkout still need fresh integrated browser evidence when their UI increments are delivered. |
| Housekeeping/maintenance impact | `required` (UI only; API already supported) | Board, cleaning, maintenance report/escalate/resolve and role capabilities exist. Current UI reports BLOCKING unconditionally; add explicit choice/warning surface without backend expansion. |
| Error semantics for existing routes | `unclear contract` only where current responses do not identify a user-actionable stale cause | Do not add API fields speculatively. First determine whether existing typed 409 plus authoritative refresh can meet task acceptance; request product/contract clarification only if it cannot. |

No backend gap in this table is authorization to implement. A later Task
Contract should group only the minimum dependencies needed to complete the
selected visible workflow. Do not start a generic “workflow foundation” wave.

## 8. Risks and constraints

- Frequency is not measured; ranking needs validation with front-desk and
  housekeeping operators before treating it as an empirical utilization plan.
- V11 is binding for this roadmap, but `CF-UX-PARITY-001` still protects the
  pinned accepted source UX. The next build must explicitly map to source
  behavior and approved V11 departures.
- The local acceptance runtime did not initialize because its fixture/rehearsal
  failed at maintenance resolution. Do not use this task to repair migrations;
  treat integrated browser coverage outside the existing reassignment proof as
  UNPROVEN until the runtime is usable under a separately authorized task.
- Reports/Users/workerd browser instability is a known shared/preexisting gate
  from the prior project state. It is outside this workflow inventory and is
  not attributed to this discovery.
- Billing, room inventory, maintenance and booking state are coupled. A UI
  increment must prove the user-visible path plus API/D1 outcome; a mock browser
  or green build is insufficient.
- D12 interaction changes are already defined in V11; no extra animation or
  component framework is needed. Preserve existing stack and JS budget.
- Never expose unauthorized commands merely because a UI control is hidden;
  backend capabilities remain authoritative.

## 9. Pre-Critic review

| Finding | Review challenge | Resolution in this definition |
|---|---|---|
| PC-01 | Initial P2 placement undervalued room readiness. | Housekeeping moved to P0 because turnover affects daily sellability/check-in. Maintenance moved to P1 because a low-frequency incident can have high guest/safety/saleability cost. |
| PC-02 | Frequency rankings could appear like measured hotel analytics. | The matrix labels frequency as a qualitative proxy; no event counts or arbitrary composite score are claimed. Human/operator validation remains a risk. |
| PC-03 | A single drawer/sheet pattern could hide different domain needs. | The model includes explicit exceptions for low-risk late-arrival update, destructive confirmations and money consequence review, matching V11 `21/22`. |
| PC-04 | Reception hub and new reservation might duplicate the same workflow. | Hub is the continuity/read-model layer; reservation is a distinct create intent reached from that hub. They have separate acceptance outcomes. |
| PC-05 | A roadmap could turn into backend-first migration work. | Gaps are classified and deliberately left unimplemented. P0 is phrased as visible guest/room/money outcomes; each backend item must be justified by a later user-visible acceptance need. |
| PC-06 | “Usable” could be overclaimed from mocks and source code. | Browser evidence labels separate mock Reception interaction, integrated reassignment, static contract/source inspection and failed local acceptance startup. Other integrated workflows remain unproven. |
| PC-07 | Existing Wave 1.2 UI could be treated as accepted product design. | The roadmap treats it as current implementation evidence only. Controller/Human visual review remains a gate; parity authority is still V11 plus the pinned accepted source. |

Residual Pre-Critic limitation: no independent operator interview or frequency
telemetry was available. The ranking is suitable as a Human Gate proposal, not
as final product acceptance evidence.

## 10. First workflow recommended

Start with **Reception arrival → check-in → next-case continuity**, including
only the smallest front-desk board data needed to show authoritative local
date, readiness/blockers and queue priority.

Why this first: it is a daily guest-facing transition with high cost if the
wrong booking or unready room is selected; it exercises the Reception context
model used by later tasks; and the current UI already has a check-in checklist
that can become tangible guided work without inventing new domain behavior.
This recommendation is about workflow outcome, not a backend foundation. The
implementation Task Contract should state which portion is visible in the first
increment and which required board fields are strictly necessary.

First-increment acceptance summary: due arrival is discoverable; selecting it
preserves queue/filter; operator sees guest/stay/room readiness; steps are
identity/document→stay→readiness→review; validation and 409 remain in context;
success confirms OCCUPIED state after authoritative refresh and chooses the
next canonical priority case; mobile and keyboard/focus paths work; Billing is
still bound to that booking. Do not begin this implementation until Human Gate
accepts the roadmap and selected first workflow.

## Decision requested at Human Gate

Accept, reorder or revise the P0/P1/P2 workflow sequence and confirm whether
the recommended first build is Reception arrival/check-in continuity. This
definition does not authorize UI or backend implementation.
