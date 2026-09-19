# 22 — Interaction flow matrix and current-to-target UX gaps

Status: `BINDING UX REFINEMENT / IMPLEMENTATION LOCKED`

Companion authority: `21-app-interaction-contract.md`.

This matrix converts the interaction contract into implementation-sized behavioral changes. Domain/API semantics remain owned by `16/19/20`.

## A. Current shell/navigation gaps

| Area | Current behavior | Target behavior |
|---|---|---|
| Module switch | page component replacement inside shell, router always calls `scrollTo(0,0)` | persistent shell + short content transition; contextual navigation restores target entity and Back restores prior list position |
| Mobile primary navigation | hamburger dialog contains all modules | role-aware direct primary navigation for authorized core modules among Reception, Rooms, Guests, Housekeeping; More sheet for authorized secondary modules |
| Filter/history | most filters live only in component state | meaningful filter/selection state survives refresh and Back/Forward; shareable pieces use query params |
| Loading refresh | several workspaces replace content with text loading | first-load skeleton; refresh preserves known data with subtle refreshing state |
| Feedback | plain error/status blocks dominate | inline validation, blocking banner, conflict state, toast for non-blocking success |

## B. Reception transition matrix

| Trigger | Surface | Entry context | Primary sequence | Success exit | Conflict/error |
|---|---|---|---|---|---|
| Select queue case | desktop detail / mobile focused sheet | queue row + filters + scroll | inspect summary/actions | stay selected | keep queue/context |
| New reservation | drawer / mobile full-screen sheet | Reception filters preserved | guest -> dates -> availability/room -> review | close + board refresh + select created/relevant case | keep draft; refresh invalid availability |
| Edit confirmed reservation | drawer/sheet | selected booking | fields -> availability/pricing preview if room/date priced -> confirm | close + refresh selected/queue | mark invalid fields; keep safe draft |
| Check-in | focused drawer/sheet | selected arrival | identity -> stay -> readiness -> review | close + refresh + next priority case | remain at failing step with blocker |
| Late arrival | compact dialog/popover | selected confirmed booking | ETA + note -> save | close + toast + board refresh | inline field error; no queue loss |
| Cancellation | danger dialog | selected confirmed booking | consequence + required reason -> cancel | close + refresh + next case | keep dialog/reason |
| No-show | danger dialog | eligible selected confirmed booking | consequence + required reason -> mark no-show | close + refresh + next case | keep dialog/reason |
| Reassign | focused drawer/sheet | selected in-house stay | destination candidates -> advisory/blockers -> D11 consequence -> reason -> confirm | close + refresh Reception/Rooms/Billing + next/selected stay | refresh candidate/Billing state without discarding valid reason |
| Extend | focused drawer/sheet | selected in-house stay | new checkout -> added nights -> availability -> price/D11 consequence -> confirm | close + refresh stay/Billing | keep requested date if still meaningful |
| Checkout | focused drawer/sheet + final confirm | selected in-house stay | checklist + Billing + room consequence + handoff -> confirm | close + refresh + next departure | remain in task; show updated Billing/blocker |
| Report maintenance | compact/focused sheet | selected room/stay | impact + priority + reason + assignee -> submit | close + refresh readiness/board | preserve draft on recoverable failure |

Reception detail must not display all lifecycle forms simultaneously. The selected case shows a concise summary plus context-valid actions; each action opens its own task surface.

## C. Billing transition matrix

### Embedded Reception Billing

- receives `booking_id` from Reception selection;
- no independent booking selector;
- summary remains visible while lifecycle task is open when space permits;
- payment/charge mutations refresh the same selected booking only;
- D11 remaining/credit state is visible.

### Register payment

Surface: compact financial drawer/dialog.

Flow:
`amount -> method/reference -> review remaining after payment -> confirm -> register`.

Because it creates financial evidence, duplicate submit is prevented and the final action label is explicit.

### Add extra charge

Surface: compact financial drawer/dialog.

Flow:
`description/category/amount -> resulting booking/invoice total preview -> confirm`.

It is a priced mutation and shows D11 consequence before commit.

### Cash close

Surface: focused drawer/full-screen sheet.

Flow:
`authoritative shift snapshot -> counted cash -> handoff -> difference preview -> final confirmation`.

Success closes the shift surface and shows durable result. It must not look like an ordinary inline form below booking Billing.

## D. Rooms

Current gaps:
- only text search;
- create room expands inline;
- detail editing/holds are stacked inside one long detail column;
- contextual Reception/Guest navigation is not first-class.

Target:
- filter bar: text + physical state + readiness + maintenance impact;
- create/manage room uses drawer/sheet;
- selecting room preserves board position;
- detail shows current situation and contextual actions first;
- edit room metadata is a focused sub-surface;
- add/remove hold is a focused operation; destructive hold removal uses product confirmation;
- open active/upcoming stay in Reception with context;
- occupied/blocking maintenance exposes correct domain action rather than generic room status edit.

## E. Guests

Current gaps:
- create guest expands inline;
- operational filters/search are local only;
- selected guest detail is useful but contextual navigation is incomplete.

Target:
- Add guest -> drawer/sheet;
- filters/search preserved in URL/history/session semantics from `21`;
- master/detail desktop, focused detail mobile;
- direct `Open stay in Reception` and `Open room` actions;
- standalone guest creation remains separate intent from inline reservation guest creation.

## F. Housekeeping / Maintenance

The existing focused-task mobile pattern is a good base and should be generalized.

Target filter bar:
- shift/turnover;
- dirty;
- cleaning;
- maintenance attention;
- room search;
- impact filter when maintenance context exists;
- board date.

Transitions:
- select task -> desktop detail/mobile focused task;
- start cleaning -> local pending -> authoritative refreshed task;
- finish cleaning -> local pending -> task leaves/moves filter -> next canonical task;
- occupied maintenance -> no cleaning actions; maintenance context + Reception link;
- resolve/escalate -> focused maintenance sub-surface with reason/note;
- filter/date/search survive mutations and task close.

## G. Filter state contract by workspace

Suggested canonical query keys; exact implementation may normalize names but semantics are binding.

Reception:
- `q`
- `lane=attention|arrivals|departures|in-house|all`
- `date` when non-today inspection is supported
- `booking_id`

Rooms:
- `q`
- `state`
- `readiness`
- `maintenance`
- `room_id`

Guests:
- `q`
- `view=all|active|arrivals|upcoming`
- `guest_id`

Housekeeping:
- `q`
- `view`
- `state`
- `impact`
- `date`
- `room_id`

Rules:
- URL-provided state wins over remembered session preference;
- clearing filters removes the corresponding filter params but preserves selected context only if still valid;
- typing search may replace the current history entry to avoid one history entry per keystroke;
- changing major filter/date creates navigable history when useful;
- selection may create/replace history according to task intent, but Back from contextual navigation must restore the prior selection/list state.

## H. Overlay/back-stack rules

1. Opening a focused task creates a closeable task state without losing underlying workspace.
2. Browser Back while task is open closes the task before leaving the module when feasible.
3. Selecting another module while a dirty task is open triggers discard confirmation before navigation.
4. Dirty task intercepts explicit close/Back with discard dialog.
5. Success clears dirty state before closing.
6. Contextual cross-module navigation creates a real history entry so Back returns to the originating workspace state.
7. Escape follows the same close rules as explicit close.
8. No overlay may trap the operator after its underlying entity becomes invalid; conflict refresh provides a safe close/return path.

## I. Motion rules

- module transition: 140–220 ms;
- detail/selection: 100–160 ms;
- drawer/sheet: 160–240 ms;
- toast enter/exit: brief and non-blocking;
- no motion on every card/list refresh;
- no scale/bounce effects on operational data;
- reduced-motion removes translation and uses immediate/opacity-only state changes;
- data mutation completion waits for authoritative response, never for animation.

## J. Current implementation changes explicitly required

The later BUILD must remove or replace these behaviors:
- router unconditional `window.scrollTo({top:0})` for contextual navigation;
- Reception `showCreate` inline reservation form;
- Reception native `window.confirm` cancellation;
- simultaneous long-form lifecycle forms inside one selected case panel;
- Reception-embedded Billing independent booking selector;
- Rooms inline create form;
- Guests inline create form;
- hamburger-only mobile access to the current user's authorized core operational modules;
- plain loading replacement where authoritative prior data can remain visible;
- filter/search state that disappears on refresh/history navigation.

## K. Acceptance

A UX implementation increment fails if:
- a task technically works but loses filters/selection unnecessarily;
- Back returns to an unrelated top-of-page state;
- mobile requires reopening navigation repeatedly for core modules;
- destructive action uses native browser confirmation;
- Billing can drift to another booking than Reception selection;
- several unrelated lifecycle forms compete visually in one case panel;
- animations hide stale/conflict state or delay authoritative actions.

The target is an operational app: stable context, explicit task entry, focused action, truthful feedback, deterministic exit.
