# HMS System UX Discovery / AS-IS Audit v1

Artifact ID: **HMS-SYSTEM-UX-DISCOVERY-ASIS-001**
Stage: **DISCOVERY_COMPLETE_AWAITING_CONTROLLER_REVIEW**
Audited product: `b9197e278e227a8e3da5ecb867d6d430f69c1d2f` on `impl/ux-ui-reception-checkin`, PR [#50](https://github.com/sjo1848/hms-cloudflare/pull/50), OPEN / Draft at inspection.
Documentary branch: `analysis/hms-system-ux-discovery-v1`. No product changes. No merge/deploy/main/staging. Promotion remains BLOCKED.

This artifact supplies AS-IS evidence for the later **HMS SYSTEM UX BLUEPRINT v1**. It is not that blueprint, not a TO-BE decision, and not implementation authorization.

## 1. Executive AS-IS Summary

**FACT:** HMS is a connected Hotel Operations Management System: reservations occupy room-nights; arrival changes physical occupancy; stay mutations affect inventory and billing; checkout hands a dirty room to housekeeping; maintenance affects readiness and future sellability; payment entries feed invoice balances and cash closures; memberships govern hotel operations while network capabilities govern SaaS administration.

**FACT:** there are seven frontend routes. Billing/Payments/Cash are not independent routes: all three are rendered beneath Reception. Maintenance is embedded in Housekeeping and read as context in Reception. Guest, room and booking identifiers connect the backend, but many corresponding frontend relationships are display-only.

**FACT:** guided check-in is the latest interaction reference: centered desktop Dialog, full-screen mobile Drawer, shared native-dialog lifecycle, explicit conflict/refresh/next-case behavior. It is unpromoted but part of this AS-IS baseline. Other operations still use inline forms, separate selectors and browser confirms. These facts describe uneven implementation, not a decision to standardize every workflow on the same component.

**INFERENCE:** the largest visible discontinuities are not simply styling: an operator changes selection between Reception and Billing; guest/room detail cannot open the related operational case; supported maintenance modes and financial history are absent from UI; several expected lifecycle actions have schema/contract language but no command.

**UNKNOWN:** actual staff frequency, task duration, error frequency, multi-user load, device mix, and satisfaction. No hotel observation/interview was performed. Severity below reflects observable obstruction/risk, not invented usage scores or a prioritized roadmap.

Method: source/route/domain inspection, three separate read-only reviewers, historical directed evidence, current read-only local browser observations. See §23 for exact evidence and limits. No product test/build rerun: unchanged code; prior PASS is cited as historical, not freshly reproduced.

## 2. Product Surface Inventory

All component paths below are relative to `apps/web/src`. Frontend roles are intended operating audiences, not claims that every control is capability-filtered. API remains authoritative.

| Surface / route | Root / purpose and audience | Data, actions, forms and filters | Composition, navigation, async and dependencies |
|---|---|---|---|
| App Shell / all | `app/AppShell.tsx`; hotel context and navigation | Hotel label, language, seven links; local synthetic profile selector only in local DEV | Desktop sidebar; mobile modal navigation; auth/me bootstrap; no capability-aware link filtering; remount on local profile change; router scrolls top on module navigation |
| Reception / `/bookings` | `features/reception/ReceptionPage.tsx`; front desk triage | Queue lanes/counts/search; guest/room/stay/readiness; create/edit/cancel/check-in/reassign/checkout | Queue/detail, expandable creation, inline selected forms, arrival Dropdown; native Dialog/Drawer check-in. Board refresh distinguishes initial/loading from refreshing; dependencies guests, rooms, availability, maintenance, billing |
| Rooms / `/rooms` | `features/rooms/RoomsPage.tsx`; inventory/readiness and room administration | Status/type/rate; browser-derived occupant/arrival/upcoming; search, create/edit, holds create/delete | Master/detail/card board; administration form; selected hold fetch; local errors/loading/refresh; no contextual guest/booking link. Depends bookings and holds |
| Guests / `/guests` | `features/guests/GuestsPage.tsx`; contact and stay context | Name/email/phone, situation, recent bookings; search, four filters, create | Master/detail, expandable create; local selection; no booking link. Guest fetch plus capped booking fetch; booking failure silently removes context |
| Housekeeping / `/housekeeping` | `features/housekeeping/HousekeepingPage.tsx`; room turnaround | Date/search/status queue, selected room/departure/open case; start/finish, next task, report/resolve maintenance | Desktop workspace; stacked tablet; dialog-like article below768; mutation busy/error/refresh; depends checkout room state and open maintenance |
| Maintenance / embedded | Same HK root; case handling, ops/HK/reception by capability | Reason/priority/owner; no impact selector/escalation control; case ID summary and resolution note | No independent route, case list/history or affected-reservations workspace; arrival/reassignment consume maintenance context separately |
| Account/Billing / embedded `/bookings` | `features/billing/BillingWorkspace.tsx`, `BillingPanel` | Independent booking selector; invoice total/paid/remaining/status, charges/payment text lists | Always stacked below Reception, not coupled to selected Reception booking; no portfolio; shared error; refresh fetches bookings then three financial reads |
| Payment / same panel | `BillingPanel`; collect a specified amount | Amount in cents, method, optional reference/note | Inline form, submit disabled while pending; operation token and refresh; no separate receipt/detail UI |
| Cash/Shift / same route | `CashBalancePanel`; reconciliation/handoff | Balance/cash/noncash/count/pending/opening; expected/count cents, handoff, notes | Separate state and refresh from payment panel; inline close form; success difference/status; no closure history UI |
| Reports / `/reports` | `features/reports/ReportsPage.tsx` exports `OperationalReportsPage` implementation | Presets 7/30/current month; date range, refresh, revenue and occupancy daily series, peak signal | KPI cards + two internally scrollable series; paired requests, loading and retry; no operational case drilldown |
| Users / `/users` | `features/users/UsersPage.tsx` exports `OperationalUsersPage` | Membership subject/email/role/active; search/status/role filters; create, role change, deactivate | List/detail; bottom detail region mobile; browser confirm only for deactivation; saving/loading/messages; backend capability/self-role constraints |
| Network / `/network` | `features/network/NetworkPage.tsx`; SaaS administration | Hotels/slug/ID/binding/plan; search, register, immediate plan change; range/KPIs/ranking | `<details>` registration; property master/detail; loading/error/retry; control-plane + multi-hotel analytics, not hotel reception |
| Access / outside app | Cloudflare Access middleware, not app route | Authentication boundary | Actual Access login/logout/challenge UX UNKNOWN in local audit; DEV identity selector is not production authentication |
| Internal agent service | `apps/api/src/agent-hms-service.ts` | Availability, quote, reservation create/cancel | Capability-scoped Workers RPC; no browser surface; intentional integration channel, not automatically a UI defect |

Resources with no dedicated page: booking detail URL page, maintenance cases, invoices, payments, cash closures, audit events, shifts. `/` and unmatched paths fall back to Reception rather than a separate dashboard/404 page (E-SHELL).

## 3. Complete Workflow Catalog

The [catalog](HMS-SYSTEM-WORKFLOW-CATALOG-V1.md) is the counted source of stable IDs, entry points, status and evidence. It covers REC, RES, STAY, GUEST, ROOM, HK, MAINT, ACC, PAY, SHIFT, REPORT, ADMIN and NET. Counts are mechanically checked in task evidence; endpoint aliases are not extra workflows.

Status is capability-level, not a viewport certification. A missing mobile walkthrough alone is an evidence limit, not proof that a workflow is absent. A backend endpoint that is unused because a list already supplies detail is not a missing operator workflow. This resolves reviewer classification differences (§23).

## 4. Reception Deep Dive

| Stage | Current sequence / operator decisions | Context and feedback | Discontinuity / evidence |
|---|---|---|---|
| Queue / triage | Attention default; arrivals/departures/in-house/all; search guest/room/reservation; select case | Canonical board priority/reason, hotel-local date, counts/readiness. q/lane in query; focus/30s visible refresh | Board is more authoritative than independently derived room/guest context. E-BOARD/E-REC |
| New reservation | Expand create → choose existing guest → dates → find rooms → choose room → notes → create | Same Reception route; success resets form and reloads queue | No inline guest creation or pre-submit price summary. For new guest: Guests → create → Reception → reselect; at least two module changes and repeated selection. E-REC/E-HOOK |
| Edit | Select confirmed booking → secondary edit action for arrivals → guest/room/dates/notes → save | Existing data populated; availability debounced; success closes selected case/reloads | Distinct from checked-in stay change; backend rejects generic in-house edit. E-BOOK |
| Cancel | Confirmed edit → cancel → browser confirm → PATCH CANCELLED | Reload/close on success; generic page error | No terminal-reason input; V11 expects reason. This is partial target coverage, not evidence that cancellation is absent. E-HOOK/V11-19 |
| Arrival | Select due/overdue arrival → focused task → guest/checklist → readiness/stay → confirm | Guest/current room/dates/check-out; document/contact/stay confirmations and positive guest count; primary sticky CTA | No hard date-window invented; future confirmed cases retain a check-in entry outside arrival lane. Late-arrival record/no-show absent. E-CHECK/E-LIFE/V11-06 |
| Readiness | AVAILABLE physical readiness; BLOCKING cause disables; NON_BLOCKING advisory allows | In-task explanation; backend is authority | Maintenance/readiness mandatory information is not hover-only. H-CHECK supports historic integrated behavior |
| Check-in conflict | 409 → authoritative refresh, room step, error remains → operator retries | Task not silently closed; accepted-write/failed-refresh tracked separately | Stronger recovery than ordinary inline operations. No new E2E claim in this audit. E-HOOK/H-CHECK |
| Success/next | Backend success → board reload → close task → select/focus next filtered case | Short status; q/lane retained; same Reception | Next is first other case in authoritative filtered ordering, not a whole-hotel unconstrained priority. E-REC |
| In-house / reassign | Select checked-in case → target → reason ≥6 trimmed → preview → submit | Guest/room/dates/effective date; current/new total, difference, paid, remaining/credit; 409 refreshes context | Inline form coexists with checkout. Frontend availability queries full original stay, whereas backend moves remaining nights; selected target maintenance loaded separately. Potential overly restrictive eligibility is INFERENCE, not newly reproduced. E-HOOK/E-LIFE |
| Departure | Select checked-in case → policy settled/pending-approved → reference → charge/release/handoff checks → checkout | Backend validates policy/authority and changes room to DIRTY; success closes case/reloads | Charge review checkbox is not an embedded account review. Operator must select the same booking again in Billing. Policy selection does not itself record a payment. E-REC/E-BILLUI/E-LIFE |

### Financial context inside Reception

**FACT:** `ReceptionPage` returns `Bookings` followed by `BillingWorkspace`; the latter returns `BillingPanel` and `CashBalancePanel`. Each owns separate state. Selecting a queue case does not select its invoice. Billing initially selects the first item from `/bookings?limit=100`, even while Reception displays another arrival. Current mobile screenshot demonstrates this: queue Next Arrival/Blocked Arrival, billing Priority Arrival.

**INFERENCE:** operator can unintentionally act on a different financial booking if assuming queue selection propagates. No actual wrong payment was submitted; this is a context-risk finding, not a measured incident.

### Async and error distinctions

Reception full-load epoch rejects stale aggregate loads; periodic refresh avoids active mutation. Check-in has ref-backed double-submit protection and explicit accepted-but-refresh-needed state. Reassignment/checkout use action busy; booking create/edit/cancel have simpler try/catch/reload. Availability and separate financial reads are not protected by the full queue epoch. Generic localized HTTP text can hide which dependency failed. No repair performed.

## 5. Guest/Stay Domain

Guests are contacts; bookings/stays are separately stored. Create requires name/email, phone optional. List uses name/email/phone search and all/in-house/arrival/upcoming situation filters. Detail shows contact, one preferred current situation and at most five recent bookings. No edit/delete control or route was found for guest contact. No navigable booking/account relationship from detail.

Room/guest context derives from first 100 bookings and browser-local date. Active stay takes precedence, then due arrival, upcoming booking, historical stay. Booking-read failure is caught to an empty list while guest data still renders. **INFERENCE:** “no stay” can mean unavailable/truncated context, not absence of a stay. This is why GUEST-04 is `UI_ONLY_OR_ASSUMED` for the displayed authoritative-sounding situation, not for basic guest CRUD.

In-house changes are explicit lifecycle commands; generic confirmed PATCH is not extension. REASSIGN persistence preserves elapsed inventory history; the UI exposes only current room and preview, not the historical room-night narrative. No inferred guest-wide folio combines several bookings.

## 6. Rooms

Room board shows physical status plus one derived booking situation. Search covers number/type/status and derived guest. Room create/edit uses number, free-text category and integer-cent rate. Selected detail shows occupant/arrival/upcoming and holds; create/delete holds exists, edit absent despite PATCH backend. Hold type is hardcoded OTHER in UI.

**FACT:** physical AVAILABLE is not identical to sellable for arbitrary dates. Inventory overlaps, holds and BLOCKING maintenance matter. Current screenshot shows room102 as Disponible with an arrival pending while summary says zero available: the summary’s operational derivation differs from the physical badge. Neither by itself is a date-range availability quote.

Room/guest relationships lack links into Reception. Backend has individual room reads and cross-room hold board; UI uses room list/per-room holds. No room status generic dropdown bypass was found in edit. Checkout/HK/maintenance mutate physical state; reservation inventory is a separate state dimension.

## 7. Housekeeping

Hotel-local board date (initial URL `date` or server default), room/guest search, all/dirty/cleaning/ready/maintenance filters, refresh timestamp, selected task and next action. Queue ranks actionable rooms and synthesizes departure context; current checked-in departure blocks cleaning. Start DIRTY→CLEANING; finish CLEANING→AVAILABLE; finish advances to next actionable visible task, falling back to another visible task.

Selected workspace carries room/status, guest/departure when available and open maintenance. Search excludes case reason/owner/priority/impact. Date changes are local state, not synchronized back to URL. Maintenance creation asks reason/priority/owner but always BLOCKING. Resolve label says return to DIRTY, though API can preserve physical state for advisory cases.

Responsive is not one uniform transition: CSS changes at900; JS dialog-like mode is below768. Tablet820 captured stacked queue then selected detail, not a modal. Mobile role=dialog article differs from check-in’s native modal; inertness/focus trapping not established by the source or these captures.

## 8. Maintenance

Backend evidence (E-HKAPI/E-MAINT): impact BLOCKING/NON_BLOCKING; one open case per room; report/read/resolve capabilities separate; escalation of existing NON_BLOCKING with note; historical blocking preservation; occupied BLOCKING retains OCCUPIED while affecting sellability; vacant BLOCKING moves eligible physical states to MAINTENANCE; resolution derives physical return. No automatic guest move/cancellation of affected future booking.

Frontend exposure: BLOCKING creation only; reason/priority/owner; open-case summary lacks explicit impact in HK; resolution via legacy `/dirty` alias; NON_BLOCKING visible as advisory in check-in/reassignment but cannot be created/escalated through this UI. Ordinary occupied rooms are not a general HK board list; only eligible departure context can expose some occupied situations. Backend support does not prove operator reachability.

**INFERENCE / unresolved diagnostic:** checkout SQL unconditionally sets DIRTY; HK start guard accepts DIRTY, while open blocking-case logic is separate. A blocking case on OCCUPIED followed by checkout may yield a misleading actionable cleaning task. Reviewer found the source path; no new destructive transition test was run. Do not label this a confirmed runtime regression or fix it during discovery. See F-12.

## 9. Guest Account / Billing / Payments

| Concept | Current authority | UI exposure and limitation |
|---|---|---|
| Booking account | One invoice per booking; booking total plus extra charges; no separate guest-wide account object found | Separate selector below Reception; total/paid/remaining/status; fallback booking total if invoice null |
| Remaining/credit | D11 derives max(amount−paid,0), max(paid−amount,0); ledger corroborates paid | Ordinary Billing omits credit; reassignment preview displays it. No automatic refund/credit consumption UI or claim |
| Charges | Extra-charge records; priced atomic mutation + reconciliation event | Description/cents form, category OTHER; list description/amount only; no edit/remove UI |
| Payments | Immutable ledger amount/method/reference/note/receiver/time; invoice reconciliation | Amount/method/ref/note entry; history displays amount/method but omits returned actor/time/ref/note |
| Settlement | Dedicated backend remaining-balance command | No frontend caller; entering full remaining amount in payment form is distinct from checkout’s policy checkbox |
| Invoice portfolio | GET invoices with derived remaining/credit | No invoice-list UI; account selected booking-by-booking |

Payment submit disables the button and retains an operation token for uncertain/non4xx errors; it refreshes before showing retry hint. 4xx clears the token. **INFERENCE:** editable payment fields/booking selection while an uncertain token remains can complicate retry semantics; no new payment was attempted. Source evidence cannot establish safe recovery for all ambiguous outcomes. Extra charge has no corresponding busy/idempotency UI guard. No financial invariant was re-certified in discovery.

`recordExtraCharge()` historical D1 evidence confirms a successful batch may report `[1,2,1,1]`; this audit does not reinterpret trigger counts or alter D11. Money inputs expose cents to operators, while summaries format currency.

## 10. Cash / Shift

Cash is a third concept, not the booking invoice or payment form. Backend aggregates ledger payments since latest closure; without closure, earliest payment; without either, current timestamp. “Opening” is therefore a derived boundary, not proof of an explicit opened session, assigned cashier or opening float.

Visible: total, cash, noncash, count, pending invoice amount, opening time, read-only expected cash, counted amount, handoff name, notes, close result difference. Backend close revalidates expected totals/count and records a closure. UI error catches and refreshes; no pending-submit flag in the close form. Backend closure history exists but no UI caller.

**FACT:** payment panel refresh does not automatically refresh sibling cash panel or Reception board. Cash has its own mount/manual/close refresh. **INFERENCE:** newly recorded payment can coexist with an older displayed shift balance until refresh. A closure conflict is therefore plausible; not newly submitted here.

## 11. Reports

Reports is date-ranged revenue/occupancy, not a transaction ledger. Revenue groups stored booking totals by check-in date excluding cancelled/no-show; it is not cash receipts. UI explicitly says arrival-based revenue. Occupancy daily rows and peak signal derive from analytics. Presets use browser-local date, while backend default date logic is hotel-local; Network initializes with UTC date. Cross-timezone consistency is not assumed.

UI includes four summary cards, peak highlight, daily occupancy and revenue rows/meters, invalid-range validation, loading and retry. Range controls can show a newly selected range while prior successful data remains if refresh fails; no provenance stamp for each successful dataset. No booking drilldown or actionable alerts beyond the peak signal found. `/analytics/kpis` is backend-only, separate from locally calculated report summary cards.

Historical Reports/Users/workerd finding remains SHARED/PREEXISTING. Current read-only inspection loaded both Reports and Users; one successful load does not close it or prove global browser PASS.

## 12. Users / Administration

Hotel membership administration: Access subject, email, role, active status; role/status filters/search; create membership; immediate role change on select; deactivate with browser confirm. Four tenant roles exposed. Backend imposes capabilities and self-action restrictions; UI is not the authorization boundary.

Selected detail becomes a CSS bottom sheet on mobile but remains `role=region`, not check-in’s native modal. Closing returns focus to the opener in source. No explicit reactivation flow; whether re-creation is an intended product recovery is UNKNOWN, not an invented activate command. Audit API aggregates control/lifecycle/HK/billing events but no UI event viewer.

No global effective-capability navigation: all seven links render. `/auth/me` current UI consumes hotel label; V11’s capability arrays/landing contract is not implemented in the inspected bootstrap. This is an expected-contract gap, not grounds to add it now.

## 13. Network / SaaS

Network is platform administration: register hotel into one of two server-configured operational bindings; list/search/select properties; change plan BASIC/PRO/ENTERPRISE; compare date-ranged revenue/active bookings/occupancy/ADR/RevPAR/ranking. Backend metadata creation accepts address/timezone/features; UI does not expose those fields. UI plan change is immediate on native select, no separate confirmation. Registration is not evidence of provisioning arbitrary D1 infrastructure.

Current fixture profile label says “Admin / Network” but this run received 403 for hotels/network KPIs. The screen still offered registration and rendered “no properties”, analytics unavailable and an error. FACT about this denied state; authorized populated Network behavior is source-derived / UNKNOWN live. No role or fixture changes were made to force a green view.

Internal Workers agent service exposes capability-scoped availability/quote/reservation create/cancel. These are not browser HTTP endpoints and not a hidden human receptionist screen. Backend-only classification is descriptive, not a requirement for UI parity.

## 14. End-to-End Hotel Journeys

See [journey artifact](HMS-HOTEL-OPERATIONS-JOURNEYS-AS-IS-V1.md) for A–G tables and dependency diagram. Shared identifiers do not imply shared UI context. Major crossings: guest→reservation, room→booking, booking→account, payment→cash, checkout→HK, maintenance→arrival/future reservation. The first, second, third and fifth require manual navigation/reselection; payment→cash requires separate refresh. No end-to-end journey was re-executed by mutating the fixture in this discovery.

## 15. Current Information Architecture

`AppShell → {Reception, Rooms, Guests, Housekeeping, Reports, Users, Network}`. All sidebar entries share the “Operation” grouping despite hotel administration and SaaS responsibilities differing. Header shows hotel label + Operation, not a persistent booking/guest/room/shift context. Local DEV profile selection is a synthetic helper, not a production hotel switcher.

Resources as pages: Rooms/Guests/Users/Network. Embedded workflows: check-in task, inline reassign/checkout, reservation create/edit. Embedded domains: Billing/Payment/Cash under Reception; Maintenance under HK. Language selector persists via i18n; context forms mostly React-local. Navigation uses path routing and scroll-to-top, not nested resource detail routes. No claim that current navigation is the correct future IA.

## 16. Responsive Audit

Fresh screenshots: seven routes ×1280/820/390 width, height900. These are desktop-browser viewport emulations, not touch-device/virtual-keyboard tests. All screenshots are read-only; no business form submitted. Historic integrated check-in separately exercises375/1280 and compact1280×520. **No whole-system mobile usability PASS.**

| Surface | Desktop AS-IS | Tablet820 AS-IS | Mobile390 AS-IS | Classification / limits |
|---|---|---|---|---|
| Shell | Sidebar + header | Sidebar replaced by hamburger/header | Same mobile nav; hotel context reduced | RESPONSIVE_STRUCTURAL; native nav lifecycle source-supported |
| Reception | Queue/detail, Billing/Cash below | Stacked queue/detail; task mobile at≤900 | Long stacked page; horizontally scrollable lanes; billing/cash far below | RESPONSIVE_STRUCTURAL for queue/task; finances layout-only. No virtual keyboard measurement |
| Check-in | Centered bounded native Dialog, independent body/footer | Drawer threshold≤900 | Full-screen native Drawer | RESPONSIVE_STRUCTURAL; historic integrated focus/scroll; current task observations separate evidence |
| Rooms | Board/master-detail | Intermediate resource layout | Detail placeholder above cards; full-width admin CTA; long context strings truncate | RESPONSIVE_STRUCTURAL for detail order, otherwise layout reflow; source class corrected after main inspection |
| Guests | List/detail | Desktop-like two-panel until≤760 | Detail before list; horizontal filters; ellipsized guest/context | RESPONSIVE_STRUCTURAL; no current create submission or keyboard test |
| Housekeeping | Queue/workspace | Stacked queue + nonmodal selected detail | JS below768 uses dialog-like task article; status strip scrolls | INCONSISTENT: CSS900 vs JS768; tablet behavior observed, modal accessibility not certified |
| Billing/payment/cash | Inline forms in separate lower sections | Reflow | Long vertical form stack; cents and currency both used | RESPONSIVE_LAYOUT_ONLY; no isolated mobile financial task |
| Reports | KPI cards/two series | Four KPI cards/two series; date controls wrap | Two KPI columns, stacked series, independent list scroll | RESPONSIVE_LAYOUT_ONLY; not a current report mutation test |
| Users | List/detail | Shared intermediate layout | Cards; selected detail fixed bottom region | RESPONSIVE_STRUCTURAL; source focus restore; not native modal |
| Network | Property/detail; registration details | Two-column property layout persists by source | Reflow at≤560; observed denied/empty/error state only | RESPONSIVE_LAYOUT_ONLY; populated property detail UNKNOWN live |

Thresholds are heterogeneous:900 shell/check-in/global HK;760 guest/resource;767 users detail;768 JS HK;560 compact;420 resource compact. At820 the user gets mobile shell but several desktop-like module structures. This is evidence, not proof that all threshold variation is a defect.

No complete surface is labelled MOBILE_COMPRESSED merely from absence of tests. Specific elements (financial stack, intermediate report density) are described without generalizing. Touch target quality, screen reader behavior, physical keyboard/IME, on-screen keyboard occlusion, very long localized data and all possible detail states remain UNKNOWN where not covered by historical evidence. Source labels/disabled controls alone do not prove usability.

## 17. Interaction Pattern Inventory

| Pattern | Current uses / implementation | Semantics and consistency |
|---|---|---|
| Page navigation | `AppLink`/custom RouterProvider, all seven modules | push/replace state; popstate; scroll-to-top; no global context store |
| Master/detail | Reception, Rooms, Guests, HK, Users, Network | Different selection/order/mobile behavior; not one shared detail component |
| Inline / expandable form | Reservation, room/guest create, holds, reassign/checkout, charges/payments/cash, membership; Network `<details>` | Multiple operations can coexist on a landing; expansion is not modal |
| Centered Dialog | Check-in >900; source-local `DialogContent` + `NativeModal` | Native `<dialog>`, backdrop/inertness/focus/scroll lifecycle; not claimed shadcn |
| Full-screen Drawer | Check-in≤900 via local Drawer wrapper | Same native lifecycle, responsive class; no duplicated task business logic |
| Dialog-like article / CSS sheet | HK below768 / Users≤767 | HK role=dialog; Users role=region; semantics differ from native modal |
| Mobile nav modal | Shell native `<dialog>` | Focus entry/trap/Escape/backdrop/return implemented separately |
| Dropdown Menu | Arrival secondary edit/close | Local source implementation; Check-in primary remains visible |
| Native select | Guest/room, payment method, checkout policy, role, plan, language | Includes potentially growing guest/room lists, not only small enumerations |
| Browser confirm | Booking cancellation, membership deactivation | Browser-managed interaction; differs from in-app task discard |
| Custom alertdialog | Dirty check-in discard confirmation inside task | Not the normal check-in surface |
| Persistent feedback | Role alert/status, inline errors/success/readiness, shared page messages | Check-in specific recovery vs generic HTTP errors elsewhere; no toast-only critical feedback |
| Sheet wrapper | `components/ui/sheet.tsx` exists | Existence is not active right-Sheet check-in usage; current task uses Dialog/Drawer |
| Popover / Tabs / Hover Card / toast system | No corresponding active workflow implementation found in source search | Do not infer usage from earlier design/component policy |

## 18. Context Continuity Audit

| Workflow/context | Select/filter/search/scroll | Close/success/conflict | URL / Back / Forward / reload / module navigation |
|---|---|---|---|
| Reception queue | q/lane synced; booking selection in local state plus query; check-in scroll/focus targeted | Close restores row focus; success next filtered case; conflict stays in task | Task deep-link restored from board; popstate handles task/lane/q, dirty task asks discard. A non-task booking_id alone does not have equivalent selection restoration. Draft checklist lost on reload |
| Reservation edit/create | Local forms/selected case; same queue | Success resets/closes+reloads; shared error retains form | No draft persistence; module change unmounts. Back is not a general form undo |
| Reassign/checkout | Selected case; target/reason/policy local | Success closes+reloads; reassign409 reloads context; checkout generic error | No dedicated task URL or history restoration; no persisted draft |
| Billing/payment | Independent selected booking, charge/payment fields | Own refresh; potential overlapping read responses lack epoch; no linkage to Reception selection | No query state; first booking selection on mount. Module/reload loses selection/token/draft; not a claim about backend retry durability |
| Cash | Own balance, count/handoff/notes | Close status+refresh; error+refresh; payment success does not notify sibling | No URL shift identity, explicit open session or history navigation |
| Rooms/Guests | Component-local selected resource/search/filter | Detail close local; refresh data, resource-dependent selection handling | No room_id/guest_id deep-link restoration; module navigation/reload loses local context. Display relationships not links |
| HK | Date initially query, search/filter/selection local | Finish advances visible task; error retained; next actionable | Date updates not written to URL; no task history integration; context not durable across module unmount |
| Reports | Range/preset/data local | Errors can coexist with older successful data | No date-range URL; back between modules does not restore local report state |
| Users | Search/filter/selected member local; opener reference | Refresh rebinds selected member; close returns opener focus | No member query route; reload/remount clears detail/filter |
| Network | Search/range/property local | Load/plan changes refresh; selected copied object can differ from fresh list | No property query route/context transfer to hotel operations |

FACT source matrix, with historic check-in runtime support; current browser navigation does not certify all back/forward/conflict branches. The router supports pathname/search popstate generally, but that does not persist every component’s internal state. Hash-only state is not represented in router React state.

## 19. Frontend ↔ Backend Capability Matrix

The catalog supplies each capability’s current UI/status. This matrix emphasizes API parity and quality, including backend-only capabilities without counting endpoint aliases as workflows.

| Capability | Backend | Frontend | UI quality | Evidence | Gap |
|---|---|---|---|---|---|
| Booking create/edit/cancel | GET/POST/PATCH bookings | Inline Reception | Integrated booking selection; cancel reason absent | E-BOOK/E-REC | V11 terminal evidence, atomic new guest+booking absent |
| Check-in/reassign/checkout | Three lifecycle commands | Guided check-in, inline others | Uneven context/recovery | E-LIFE/E-CHECK/E-REC | No extension/no-show; reassignment availability interval discrepancy |
| Detail reads | GET booking/:id, room/:id | Uses lists/board instead | Equivalent detail data partially composed | E-BOOK/E-INV | Unused endpoints, not automatically missing workflow |
| Availability/holds | Date search, per-room CRUD, holds board | Reception search, Rooms list/create/delete | Hold type reduced to OTHER | E-INV/E-ROOM | Hold edit/board backend-only |
| Guest contact | GET/POST guests | Create/search/detail | Context derived/capped; no navigation | E-INV/E-GUEST | Guest edit absent; no authoritative situation model |
| HK board/start/finish | Board + dirty-list alias + transition commands | Board/queue/actions | Date/context local; mobile semantics divergent | E-HK/E-HKAPI | Dirty-list endpoint unused, not separate missing journey |
| Maintenance | Read/report/escalate/resolve+dirty alias | Embedded HK; selected arrival/reassign reads | Impact-mode mismatch | E-HKAPI/E-HK | NON_BLOCKING create/escalate backend-only; occupied/affected-booking reachability incomplete |
| Invoice/account | Booking invoice, invoices list | Independent booking selector | No credit in ordinary summary | E-BILLUI/E-BILLAPI | Portfolio absent |
| Charges | GET/POST extra charges | Inline create/list | Fixed category; reduced detail | E-BILLUI/E-BILLAPI | Other category/detail exposure partial |
| Payment | history, amount payment, settlement | Amount payment/history | Ref/time/actor omitted in history; token retry hint | E-BILLUI/E-BILLAPI | Settlement action backend-only |
| Cash | balance, close, history | Balance/close | Independent refresh and no explicit session | E-BILLAPI | Closure history backend-only; opening model undecided |
| Audit | GET audit/events | None | N/A | E-ADMIN | Backend-only |
| Users | list/create/change role/deactivate | All four | Immediate select mutation; browser confirm for deactivate | E-USERS/E-ADMIN | Reactivation uncertain; capability-aware navigation absent |
| Hotel reports | KPI endpoint + revenue + occupancy | Revenue/occupancy and derived KPI cards | No case drilldown | E-ANALYTICS/E-REPORT | KPI endpoint has no caller; not same as missing report cards |
| Network | hotel list/create/plan, network KPIs | Same with reduced metadata input | SaaS mixed into shell; denied state ambiguous | E-NET/E-ADMIN | Timezone/address/features creation not exposed |
| Agent integrations | Four capability-scoped RPC methods | None | Separate consumer | E-RPC | Backend-only by channel; not assumed required human UI |
| Health/readiness/auth | GET health/ready/auth/me | Auth hotel label only | Access challenge external | E-INDEX | Health/readiness not operational screens; capability arrays not present |

## 20. UX Friction Inventory

Severity: P0=observed operational blocker; P1=material risk/discontinuity; P2=usability; P3=polish. Not a future delivery priority. No invented frequency scores. Source-inferred risks are labelled and not elevated to confirmed incidents.

| ID | Category / severity | Observation and consequence | Basis |
|---|---|---|---|
| F-01 | DUPLICATE_SELECTION / P1 | Queue booking and Billing booking independent; wrong-context financial action possible | FACT separation + INFERENCE risk; E-REC/E-BILLUI, current mobile capture |
| F-02 | LANDING_FORM_STACK / P2 | Reception, account charges/payments and cash-close forms share one long landing | FACT current mobile capture/E-BILLUI |
| F-03 | NAVIGATION_GAP / P1 | Room/guest booking context cannot open related case | FACT E-ROOM/E-GUEST |
| F-04 | BACKEND_UI_GAP / P1 | NON_BLOCKING creation and escalation inaccessible through UI | FACT E-HK/E-HKAPI |
| F-05 | STATE_VISIBILITY / P1 | Ordinary invoice summary omits credit; history omits audit-relevant payment detail | FACT E-BILLUI/E-BILLAPI |
| F-06 | CONTEXT_LOSS / P2 | Most module filters/selection/drafts reset on remount; check-in is an exception | FACT source §18 |
| F-07 | RESPONSIVE_GAP / P2 | HK tablet gets stacked layout without mobile task semantics; native modal/region/role-dialog differ | FACT source and820 capture; accessibility impact UNKNOWN |
| F-08 | FEEDBACK / P1 | Network403 also displays zero/no properties and registration affordance | FACT current denied-state screenshots; not authorized-empty dataset |
| F-09 | STATE_VISIBILITY / P1 | Browser-local/capped booking context can disagree with hotel-local authoritative queue | FACT derivation + INFERENCE boundary/truncation risk |
| F-10 | RESOURCE_WORKFLOW_MISMATCH / P1 | Checkout charge-review assertion is separate from actual account selection/review | FACT E-REC/E-BILLUI; mistaken settlement interpretation INFERENCE |
| F-11 | FEEDBACK / P1 | Payment refresh does not refresh cash/queue; cash display can become stale | FACT independent state + INFERENCE operator consequence |
| F-12 | STATE_VISIBILITY / P1 candidate | Occupied BLOCKING → checkout DIRTY → cleaning eligibility may conflict with maintenance intent | INFERENCE from E-LIFE/E-HKAPI/E-HK; runtime UNVERIFIED |
| F-13 | BACKEND_UI_GAP / P1 | No-show/late-arrival/extension absent as commands despite model/V11 expectation | FACT bounded negative search, not implementation authorization |
| F-14 | ACTION_HIERARCHY / P2 | Reassign and checkout forms coexist in selected in-house detail | FACT E-REC |
| F-15 | DUPLICATE_PATTERN / P2 | Native check-in discard, browser cancel/deactivate, HK role-dialog, Users region all differ | FACT §17; not all differences necessarily wrong |
| F-16 | MOBILE_INTERACTION / P2 | Long financial forms/cents inputs and omitted context need lengthy scroll; touch/keyboard usability unproven | FACT screenshot + UNKNOWN physical-device behavior |
| F-17 | DESKTOP_DENSITY / P2 | Reports820 retains four KPI cards/two series under mobile shell; independently scrolling series | FACT screenshot; operator burden INFERENCE |
| F-18 | FEEDBACK / P2 local inspection interruption | Worker exited during audit; Vite served app but API500/ECONNREFUSED caused generic service message until local restart | FACT local logs; recovered once. This was a temporary audit-runtime interruption, not evidence of a hotel operations blocker or product regression |
| F-19 | STATE_VISIBILITY / P2 | Room summary availability and physical AVAILABLE badge use different concepts | FACT room102 screenshot/source; terminology confusion INFERENCE |
| F-20 | BACKEND_UI_GAP / P2 | Closures/invoice portfolio/audit/hold edit absent despite APIs | FACT bounded frontend/API search |
| F-21 | FEEDBACK / P2 | Shell says Staging/Access active even on local fixture | FACT screenshot/i18n; not deployment evidence |
| F-22 | STATE_VISIBILITY / P1 candidate | Reassign UI queries original dates but command checks remaining dates; eligible destination may be excluded | FACT code difference, runtime scenario UNVERIFIED |

No fixes, priority scores or component replacement recommendations are part of this artifact.

## 21. Confirmed Missing Capabilities

Bounded to this product baseline, not a claim about unmerged branches or source HMS: REC-06 ETA recording; REC-07 no-show; RES-03 atomic new guest+booking; STAY-03 extension; GUEST-05 contact edit; ROOM-09 contextual room→booking/guest navigation; SHIFT-04 explicit shift opening/session; ADMIN-07 capability-aware landing/navigation. V11 expectation is cited where binding; guest-edit/shift-opening were explicitly requested audit checks and remain product-scope questions, not invented mandatory features.

Do not conflate these with backend-only modes (maintenance advisory/escalation, invoice list, settlement, closure history, audit, hold edit, KPIs, RPC). Some unused read endpoints (detail reads, dirty list, holds board) are not separate operator workflows. Schema-only ETA/no-show is not an implemented operation. Cancel and confirmed booking edit do exist. Generic confirmed date edit is not in-house extension.

## 22. Uncertain / Needs Product Decision

Unknowns: real staff frequency/error cost; guest-edit and explicit shift-opening expectations; reactivation semantics; affected-future-reservation review exposure; external Access flow; authorized populated Network viewport behavior; complete touch/keyboard/focus/reload behavior outside historical check-in evidence. Candidate cross-domain defects F-12/F-22 need bounded technical reproduction in a later authorized task before calling them runtime regressions.

Current contracts define some target obligations, but this audit does not schedule or resolve them. Separate an already documented V11 departure from a new product decision. No new early-check-in cutoffs, automatic moves, settlement semantics, navigation hierarchy or Dialog/Drawer choices are introduced.

## 23. Evidence Index

Paths below resolve relative to repository root at audited SHA. Use `https://github.com/sjo1848/hms-cloudflare/blob/b9197e278e227a8e3da5ecb867d6d430f69c1d2f/<path>` for immutable source. Symbols are included because several files use minified/long JSX lines; file references are verified rather than copied from reviewer line-number estimates.

| Code | Source / proof |
|---|---|
| E-SHELL | `apps/web/src/app/{AppShell.tsx,navigation.ts,router.tsx,LocalDevIdentitySelector.tsx}`; navLinks/pageFromPath/navigate |
| E-INDEX | `apps/api/src/index.ts`; health/ready/auth/me and route registration; `apps/api/src/auth/capabilities.ts` |
| E-REC | `apps/web/src/features/reception/ReceptionPage.tsx`; Bookings, updateLocation, finishCheckIn, final ReceptionPage composition |
| E-HOOK | `apps/web/src/features/reception/{useReceptionWorkspace.ts,reception-api.ts,queue.ts}`; load, loadReassignmentContext, checkIn, submitPayment-independent architecture |
| E-CHECK | `apps/web/src/features/reception/CheckInTask.tsx`; `apps/web/src/components/ui/{dialog.tsx,drawer.tsx,native-modal.tsx,dropdown-menu.tsx}` |
| E-BOARD | `apps/api/src/routes/front-desk.ts`; authoritative board/readiness/priority |
| E-BOOK | `apps/api/src/routes/bookings.ts`; `apps/api/src/modules/bookings/{domain.ts,d1-booking-repository.ts}` |
| E-LIFE | `apps/api/src/routes/lifecycle.ts`; `apps/api/src/modules/lifecycle/{domain.ts,d1-lifecycle-repository.ts}`; checkIn/reassign/checkout |
| E-INV | `apps/api/src/routes/inventory.ts`; room/hold/guest routes |
| E-GUEST | `apps/web/src/features/guests/{GuestsPage.tsx,guests-operational.css}` |
| E-ROOM | `apps/web/src/features/rooms/{RoomsPage.tsx,rooms-operational.css}` |
| E-HK | `apps/web/src/features/housekeeping/{HousekeepingPage.tsx,useHousekeepingWorkspace.ts,model.ts,housekeeping-api.ts,housekeeping-operational.css}` |
| E-HKAPI | `apps/api/src/routes/housekeeping.ts`; `apps/api/src/modules/housekeeping/` |
| E-MAINT | `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql` |
| E-BILLUI | `apps/web/src/features/billing/BillingWorkspace.tsx`; BillingPanel/CashBalancePanel |
| E-BILLAPI | `apps/api/src/routes/billing.ts`; shiftOpening/shiftSnapshot/recordPayment; `apps/api/src/modules/billing/d1-payment-repository.ts`; migrations0010/0019 |
| E-REPORT | `apps/web/src/features/reports/{ReportsPage.tsx,OperationalReportsPage.tsx,reports-operational.css}` |
| E-ANALYTICS | `apps/api/src/routes/analytics.ts` |
| E-USERS | `apps/web/src/features/users/{UsersPage.tsx,OperationalUsersPage.tsx,users-operational.css}` |
| E-ADMIN | `apps/api/src/routes/admin.ts` |
| E-NET | `apps/web/src/features/network/NetworkPage.tsx` |
| E-RPC | `apps/api/src/{agent-hms-service.ts,agent-hms-authorization.ts}` |
| E-CSS | `apps/web/src/styles.css` plus module CSS above |
| E-NEG | `rg` of registered get/post/patch/delete routes in `apps/api/src/routes`/index, call sites in `apps/web/src`; bounded baseline absence, not all branches |
| V11-19/06/07 | `origin/analysis/operational-flow-definition-v11` at `d7bc554b1df24393605fb50222ea7475a31d1971`, `docs/operational-flows/{19-api-command-contract-map.md,06-booking-temporal-rules.md,07-maintenance-future-reservations.md}`. Target authority, not evidence of implementation |
| H-CHECK | `.orchestration/evidence/UX-UI-RECEPTION-CHECKIN-001.md`, `scripts/p0-1-arrival-integrated.playwright.js`, local `output/playwright/ux-ui-checkin-integrated.log`; historical local Worker/D1 at 375/1280 evidence, not rerun |
| H-REASSIGN | `.orchestration/STATUS.json` inherited wave1.2 evidence; scripts/evidence therein, mock and real local explicitly separate |
| H-ROADMAP | `docs/ux-operational-workflow-roadmap-001.md`; prior smaller roadmap, not adopted as TO-BE here |
| B-DISC | `docs/ux/evidence/discovery-browser-observations.md`; new read-only local viewport observations, screenshot index and limits |
| R-DISC | `.orchestration/evidence/HMS-SYSTEM-UX-DISCOVERY-ASIS-001-INVARIANTS.md`; documentary validation/Pre-Critic/reviewer reconciliation |

### Git / review provenance

Base branch fetched and verified0/0 divergence; initial worktree clean; analysis branch created without merging. PR50 Draft includes latest check-in. Open stacked PR43–49 reflect accumulated development; older open PR33 Reception and PR34 Rooms are separate proposals against acceptance/staging, not silently included. No claims about their unmerged implementations enter this baseline audit.

`multi_agent_available=true`: separate read-only product reviewer Descartes (`01a0e0ce-a92c-74e1-b33b-a06c480d0850`), responsive reviewer Kant (`01a0e0ce-a9f7-7183-9bcf-dfc9fb52bdc1`), backend reviewer Popper (`01a0e0ce-aa7e-7223-8270-c986afe7f3e5`), each runtime model `gpt-6-luna`, medium. No Sol escalation. Main writer integrates; these are discovery/Pre-Critic reviewers, not Independent Critic acceptance.

Discrepancies retained/resolved: responsive reviewer used UI_PARTIAL to mean missing all-width proof; catalog instead classifies capability completeness and records runtime evidence limits separately. Rooms initially called layout-only; actual CSS/mobile observation reorders detail, so structural aspect is recorded. Network initially grouped with Users structural label; split because Network mainly reflows. Several reviewer path/line references were inaccurate; main uses verified files/symbols. Suspected checkout-maintenance contradiction remains an explicit inference, not silently promoted to FACT.

## 24. Questions for Controller/Human Gate

1. Which actual staff roles/devices and operational frequencies should inform the later blueprint? No usage evidence was supplied.
2. What is the accepted conceptual boundary between booking account, payment operation and cash/shift responsibility? Current co-location is documented, not endorsed or redesigned.
3. Are guest editing and explicit shift opening/session ownership required product capabilities, or beyond current accepted scope?
4. How should future work expose already-supported maintenance modes, historical money/audit data and contextual relationships? This audit supplies gaps, not a chosen interaction architecture.
5. Should F-12/F-22 receive separate diagnostic contracts before their runtime effects inform the blueprint?
6. What additional authorized Network/touch/tablet evidence is required before interpreting those unverified states as design facts?
7. Which V11 obligations are already approved sequencing commitments versus newly requested product scope? Do not treat all `MISSING` rows as automatic backlog approval.

**Development/discovery boundary:** documentary evidence submitted for Controller review, not product acceptance or full-system technical PASS. **Promotion:** BLOCKED; inherited shared findings unchanged. No next workflow, TO-BE or implementation begins from this artifact alone.
