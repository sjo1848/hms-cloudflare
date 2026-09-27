# HMS System Workflow Catalog — AS-IS v1

Artifact: `HMS-SYSTEM-UX-DISCOVERY-ASIS-001`. Product baseline: `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`, unpromoted PR #50. Documentary branch: `analysis/hms-system-ux-discovery-v1`.

## Reading and counting rules

This is an inventory, not a roadmap or acceptance of the product. Each row is a distinct operator outcome/subworkflow, not one row per HTTP endpoint. Aliases and unused detail reads are listed separately in the audit capability matrix, not inflated into extra workflows. Internal agent integrations are explicitly identified.

`UI_COMPLETE`: principal bounded operation has a corresponding UI and backend; does **not** mean every viewport/role/race is certified. `UI_PARTIAL`: principal surface exists but specific information/modes are absent. `BACKEND_ONLY`: implemented capability, no UI exposure found. `UI_ONLY_OR_ASSUMED`: UI-derived claim not authoritatively backed as presented. `MISSING`: expected by cited V11/current model, no implementation found in this baseline. `UNCERTAIN`: evidence insufficient. Missing does not authorize implementation.

Desktop/mobile columns describe source implementation, not fresh E2E results. D=desktop; M=mobile. All rows are source FACT unless the evidence states INFERENCE/UNKNOWN. Evidence codes resolve in the [main audit §23](HMS-SYSTEM-UX-DISCOVERY-AS-IS-V1.md#23-evidence-index). Fresh viewport observations and their limits are separate.

| ID | Domain | Workflow | Entry | Current UI | Backend | Desktop | Mobile | Status | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| REC-01 | Reception | Triage/search/filter queue | /bookings | Five lanes, search, priorities/counts | front-desk board | Queue/detail | Stacked queue | UI_COMPLETE | E-REC, E-BOARD |
| REC-02 | Reception | Select arrival, validate, check in | Arrival row / primary action | Guided task, guest count/checklist/readiness | check-in command | Centered Dialog | Full-screen Drawer | UI_COMPLETE | E-CHECK, E-LIFE, H-CHECK |
| REC-03 | Reception | Recover stale check-in | Task 409 | Refresh in task; retry only after authoritative read | conflict/no partial write | Task error | Task error | UI_COMPLETE | E-CHECK, H-CHECK |
| REC-04 | Reception | Complete and advance next priority case | Successful task | Refreshed filtered queue, next focus/status | refreshed board | Same queue | Same queue | UI_COMPLETE | E-REC, H-CHECK |
| REC-05 | Reception | Refresh and restore queue/task context | Refresh/focus/URL | q/lane/task; background refresh; draft not reload-persisted | board/context | Local continuity | Same URL logic | UI_PARTIAL | E-REC, E-HOOK |
| REC-06 | Reception | Record late-arrival ETA/note | No action | Overdue arrival is not ETA recording | Schema fields only; no command | Absent | Absent | MISSING | E-BOOK, E-NEG, V11-19/06 |
| REC-07 | Reception | Mark no-show | No action | Status may display, no transition | Enum only; no command | Absent | Absent | MISSING | E-BOOK, E-NEG, V11-19/06 |
| RES-01 | Reservation | Find available room/date range | Create/edit reservation | Date inputs + availability query | rooms/available | Inline form | Reflowed form | UI_COMPLETE | E-REC, E-INV |
| RES-02 | Reservation | Create with existing guest | Create reservation | Guest/room/dates/notes, no pre-submit total | POST bookings | Expandable form | Reflowed form | UI_COMPLETE | E-REC, E-BOOK |
| RES-03 | Reservation | Create guest and booking atomically | No action | Guest creation separate module | No with-guest command | Absent | Absent | MISSING | E-INV, E-NEG, V11-19 |
| RES-04 | Reservation | Edit confirmed booking | Selected case / secondary menu | Guest/room/dates/notes | PATCH confirmed booking | Inline form | Inline form | UI_COMPLETE | E-REC, E-BOOK |
| RES-05 | Reservation | Cancel confirmed booking | Selected edit form | Browser confirm; no terminal reason | PATCH CANCELLED; no V11 terminal evidence | Native confirm | Browser-specific confirm | UI_PARTIAL | E-HOOK, E-BOOK, V11-19 |
| STAY-01 | Stay | View in-house booking/context | Queue in-house lane | Guest, room, dates, lifecycle forms | board/list | Selected detail | Stacked detail | UI_COMPLETE | E-REC, E-BOARD |
| STAY-02 | Stay | Reassign room with repricing | Selected checked-in case | Reason, availability, selected-case maintenance, financial preview | remaining-night/D11 command | Inline form | Reflowed inline form | UI_PARTIAL | E-REC, E-HOOK, E-LIFE, H-REASSIGN |
| STAY-03 | Stay | Extend in-house stay | No action | Confirmed edit is not extension | No extend-stay command | Absent | Absent | MISSING | E-BOOK, E-LIFE, E-NEG, V11-19 |
| STAY-04 | Stay | Checkout and handoff | Selected checked-in case | Payment policy/reference and three confirmations | check-out command, room DIRTY | Inline beside reassign | Stacked form | UI_PARTIAL | E-REC, E-LIFE |
| STAY-05 | Stay | Inspect historical room moves | No dedicated action | Only current room visible | inventory history + lifecycle/audit records | Absent | Absent | BACKEND_ONLY | E-LIFE, E-ADMIN |
| GUEST-01 | Guest | Search/filter/select guest | /guests | Name/email/phone search; situation filters | guests + capped bookings list | Master/detail | Detail reordered above list | UI_COMPLETE | E-GUEST, E-INV |
| GUEST-02 | Guest | Create guest | Add guest | Name/email/optional phone | POST guests | Expandable form | Reflow | UI_COMPLETE | E-GUEST, E-INV |
| GUEST-03 | Guest | Read contact/history | Selected guest | Contact; up to five recent bookings; no contextual links | list + first 100 bookings | Detail | Detail first | UI_PARTIAL | E-GUEST |
| GUEST-04 | Guest | Determine active/arrival/upcoming situation | Guest list/detail | Browser-local derived situation | No authoritative guest-situation read model | Badges/detail | Same derivation | UI_ONLY_OR_ASSUMED | E-GUEST; derived truth, not missing guest API |
| GUEST-05 | Guest | Edit contact | No action | Create/read only | No PATCH guest | Absent | Absent | MISSING | E-INV, E-NEG; user-requested guest-edit check |
| ROOM-01 | Room | Inspect/search operational room board | /rooms | Status/type/rate/derived guest/stay | room list + capped bookings | Cards/detail | Reflowed cards | UI_PARTIAL | E-ROOM, E-INV |
| ROOM-02 | Room | Create room | Add room | Number/free-text type/cents price | POST rooms | Inline form | Full-width fields | UI_COMPLETE | E-ROOM, E-INV |
| ROOM-03 | Room | Edit room/rate | Selected room | Number/type/current cents price | PATCH rooms; not lifecycle status CRUD | Detail form | Reflow | UI_COMPLETE | E-ROOM, E-INV |
| ROOM-04 | Room | Inspect per-room holds | Selected room | Hold dates/reason | GET room holds | Detail list | Reflow | UI_COMPLETE | E-ROOM, E-INV |
| ROOM-05 | Room | Create hold | Selected room | Dates/reason; type hardcoded OTHER | POST supports type/validation | Inline form | Reflow | UI_PARTIAL | E-ROOM, E-INV |
| ROOM-06 | Room | Edit hold | No action | No edit control | PATCH hold | Absent | Absent | BACKEND_ONLY | E-INV, E-NEG |
| ROOM-07 | Room | Remove hold | Hold row | Delete | DELETE hold | Inline action | Inline action | UI_COMPLETE | E-ROOM, E-INV |
| ROOM-09 | Room | Follow occupant/arrival to booking/guest | Room detail | Display-only context; no link | Entities separately readable | Absent relation | Absent relation | MISSING | E-ROOM; relationship visible but unnavigable |
| HK-01 | Housekeeping | Date board/search/filter | /housekeeping | Room/departure queue; five filters | hotel-local board | Queue/workspace | Stacked/task variant | UI_COMPLETE | E-HK, E-HKAPI |
| HK-02 | Housekeeping | Select/advance next task | Queue/next | Rank; next visible actionable after finish | board | Detail | Dialog-like article below768 | UI_COMPLETE | E-HK |
| HK-03 | Housekeeping | Start cleaning | DIRTY selection | Start | DIRTY→CLEANING | Primary action | Task action | UI_COMPLETE | E-HK, E-HKAPI |
| HK-04 | Housekeeping | Finish cleaning | CLEANING selection | Finish; refresh/next | CLEANING→AVAILABLE | Primary action | Task action | UI_COMPLETE | E-HK, E-HKAPI |
| HK-05 | Housekeeping | Recognize blocked departure | Departure selected | Checked-in departure blocks cleaning; no booking link | departure board | Context warning | Task warning | UI_PARTIAL | E-HK, E-HKAPI |
| MAINT-01 | Maintenance | Read open case/operational impact | HK detail or arrival/reassign context | Impact explicit in arrival; omitted in HK summary | read/report board | Embedded | Embedded | UI_PARTIAL | E-HK, E-CHECK, E-HKAPI |
| MAINT-02 | Maintenance | Report BLOCKING case | HK room task | Reason/priority/owner, hardcoded BLOCKING | report case | Inline form | Task form | UI_COMPLETE | E-HK, E-HKAPI |
| MAINT-03 | Maintenance | Report NON_BLOCKING case | No control | No impact selector | report accepts NON_BLOCKING | Absent | Absent | BACKEND_ONLY | E-HK, E-HKAPI |
| MAINT-04 | Maintenance | Escalate NON_BLOCKING to BLOCKING | No action | No escalation | case-specific escalate+note | Absent | Absent | BACKEND_ONLY | E-HKAPI, E-NEG |
| MAINT-05 | Maintenance | Resolve case/return physical state | HK detail | Note; label resolves to DIRTY regardless impact | canonical resolve + legacy dirty alias, state-preserving rules | Embedded | Task form | UI_PARTIAL | E-HK, E-HKAPI |
| MAINT-06 | Maintenance | Report on occupied room | No direct occupied-room entry | HK board excludes normal occupied rooms except departures | API supports occupied with unchanged physical state | Incomplete reachability | Same | UI_PARTIAL | E-HKAPI, E-HK |
| MAINT-07 | Maintenance | Review affected future reservations | No dedicated list/action | Arrival blocker is not impact-review queue | Guards prevent sale; no dedicated affected-booking workflow | Unknown completeness | Unknown | UNCERTAIN | E-INV, E-HKAPI, V11-07; impact guard ≠ review UI |
| ACC-01 | Account | View booking account/invoice | Billing below Reception | Separate selector; total/paid/remaining/status | booking invoice | Landing section | Stacked section | UI_PARTIAL | E-BILLUI, E-BILLAPI |
| ACC-02 | Account | Add extra charge | Billing selected booking | Description/integer cents; category OTHER | atomic charge + D11 | Inline form | Reflow | UI_COMPLETE | E-BILLUI, E-BILLAPI |
| ACC-03 | Account | Review charges | Billing selected booking | Description/amount; no time/category | extra-charge list | Text rows | Text rows | UI_PARTIAL | E-BILLUI, E-BILLAPI |
| ACC-04 | Account | Inspect invoice portfolio | No page | Booking-by-booking only | GET invoices includes remaining/credit | Absent | Absent | BACKEND_ONLY | E-BILLAPI, E-NEG |
| ACC-05 | Account | Understand credit after repricing | Reassign preview / billing | Credit in reassign preview, absent ordinary account summary | credit=max(paid-total,0) | Inconsistent exposure | Same | UI_PARTIAL | E-REC, E-BILLUI, E-BILLAPI |
| PAY-01 | Payment | Register amount/method/reference/note | Billing selected booking | Cents/CASH,CARD,TRANSFER/ref/note | immutable entries + invoice update | Inline form | Reflow | UI_COMPLETE | E-BILLUI, E-BILLAPI |
| PAY-02 | Payment | Retry uncertain payment outcome | Payment error | Retains token on non4xx; refresh/hint; editable form | token correlation and remaining guard | Shared alert | Same | UI_PARTIAL | E-BILLUI, E-BILLAPI; no new reliability certification |
| PAY-03 | Payment | Review payment history | Billing selected booking | Amount/method only | timestamp/actor/ref/note also returned | Text list | Text list | UI_PARTIAL | E-BILLUI, E-BILLAPI |
| PAY-04 | Payment | Settle exact remaining balance | No settlement action | Manual amount payment; checkout policy is not settlement | POST settle-payment | Absent | Absent | BACKEND_ONLY | E-BILLAPI, E-REC |
| SHIFT-01 | Shift | Read balance/count/pending/opening | Cash section below Billing | Total/cash/noncash/count/pending/opening | balance derived since closure/first payment | Cards | Reflow | UI_COMPLETE | E-BILLUI, E-BILLAPI |
| SHIFT-02 | Shift | Count/difference/handoff/close | Cash form | Expected/count cents/handoff/notes, success difference | close-cash snapshot guard | Inline form | Reflow | UI_COMPLETE | E-BILLUI, E-BILLAPI |
| SHIFT-03 | Shift | Review closures history | No control | No history | GET billing/closures | Absent | Absent | BACKEND_ONLY | E-BILLAPI, E-NEG |
| SHIFT-04 | Shift | Explicit opening/session ownership | No action | Opening timestamp only | No explicit opening command/session model found | Absent | Absent | MISSING | E-BILLAPI; requested opening/shift model check, product obligation undecided |
| REPORT-01 | Report | Choose range/preset and inspect revenue | /reports | Date range/presets/daily revenue | reports/revenue by booking check_in | KPI/series | Reflow/inner list scroll | UI_COMPLETE | E-REPORT, E-ANALYTICS |
| REPORT-02 | Report | Inspect occupancy/daily series/peak | /reports | Rooms occupied/rate/peak signal | reports/occupancy | KPI/series | Reflow | UI_COMPLETE | E-REPORT, E-ANALYTICS |
| REPORT-03 | Report | Read dashboard operational KPIs | No caller | Reports builds its own KPIs | GET analytics/kpis | Absent | Absent | BACKEND_ONLY | E-ANALYTICS, E-NEG |
| ADMIN-01 | Administration | Search/filter memberships | /users | Search/role/status filters/list | GET users | Master/detail | Fixed detail sheet | UI_COMPLETE | E-USERS, E-ADMIN |
| ADMIN-02 | Administration | Create membership | Add user | Subject/email/role | POST users | Expandable form | Reflow | UI_COMPLETE | E-USERS, E-ADMIN |
| ADMIN-03 | Administration | Change role | Selected member | Four tenant roles; select immediately submits | PATCH role | Detail | Detail sheet | UI_COMPLETE | E-USERS, E-ADMIN |
| ADMIN-04 | Administration | Deactivate membership | Selected active member | Browser confirm; backend self-action restrictions | DELETE membership deactivates | Detail/browser confirm | Detail/browser confirm | UI_COMPLETE | E-USERS, E-ADMIN |
| ADMIN-05 | Administration | Reactivate membership | No explicit action | Inactive displayed, no activation control | No explicit activate route; POST behavior not a proved UX | Absent | Absent | UNCERTAIN | E-USERS, E-ADMIN |
| ADMIN-06 | Administration | Inspect audit trail | No page | No event viewer | GET audit/events | Absent | Absent | BACKEND_ONLY | E-ADMIN, E-NEG |
| ADMIN-07 | Administration | Capability-aware landing/navigation | All shell links | No server-capability filtering/direct-route guard | auth role/context; no capability arrays | All links | All links | MISSING | E-SHELL, E-INDEX, V11-19 |
| ADMIN-08 | Administration | Authentication/login/logout experience | Cloudflare Access boundary | No in-app login/logout flow | Access middleware; local fixture separate | External | External | UNCERTAIN | E-INDEX; external Access UX not inspected |
| NET-01 | Network | Search/select hotels | /network | Property cards/detail/binding/plan | GET hotels, network capability | Two panels | Stacked ≤560 | UI_COMPLETE | E-NET, E-ADMIN |
| NET-02 | Network | Register hotel | Register details form | ID/slug/name/binding; no timezone/address/features input | POST hotels supports extra metadata; configured bindings only | Expandable form | Reflow | UI_PARTIAL | E-NET, E-ADMIN |
| NET-03 | Network | Change plan | Selected hotel | Native select immediately PATCHes | PATCH hotel plan | Detail | Detail | UI_COMPLETE | E-NET, E-ADMIN |
| NET-04 | Network | Compare network metrics | Range/refresh/ranking | Revenue/active bookings/occupancy/ADR/RevPAR | network-kpis | Cards/ranking | Reflow | UI_COMPLETE | E-NET, E-ANALYTICS |
| NET-05 | Integration | Agent availability | Internal service binding | No browser surface (intentional channel) | RPC checkAvailability | N/A | N/A | BACKEND_ONLY | E-RPC |
| NET-06 | Integration | Agent quote | Internal service binding | No browser surface (intentional channel) | RPC getQuote | N/A | N/A | BACKEND_ONLY | E-RPC |
| NET-07 | Integration | Agent reservation creation | Internal service binding | No browser surface (intentional channel) | RPC createReservation | N/A | N/A | BACKEND_ONLY | E-RPC |
| NET-08 | Integration | Agent reservation cancellation | Internal service binding | No browser surface (intentional channel) | RPC cancelReservation | N/A | N/A | BACKEND_ONLY | E-RPC |

Endpoint coverage, status counts and reviewer corrections are recorded in the audit/evidence. Some backend read endpoints (booking/room detail, housekeeping dirty list, cross-room holds board) have no direct frontend caller, but the UI composes data via lists/board; those endpoints alone are not separate backend-only workflows. Runtime failure, missing viewport proof or an imperfect layout alone does not turn an implemented principal operation into `MISSING` or `UI_PARTIAL`.
