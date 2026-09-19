# 21 — App interaction, navigation and flow-transition contract

Status: `BINDING PRODUCT/UX CONTRACT / IMPLEMENTATION LOCKED`

Purpose: HMS must behave like an operational application, not a collection of CRUD pages. Domain safety remains authoritative, but navigation, task focus, overlays, filters, feedback and motion must reduce operator context switching.

## 1. Persistent application shell

The application shell remains mounted while modules change. Sidebar/header/mobile navigation do not remount with page content.

Desktop:
- persistent left navigation with the same capability-aware module visibility as mobile;
- persistent hotel/role context;
- main workspace changes inside the shell;
- module switch does not produce a blank/full-page flash.

Mobile:
- primary navigation is role-aware and exposes direct entries only for authorized core operational modules among Reception, Rooms, Guests and Housekeeping;
- direct navigation visibility is driven by server-derived effective capabilities from the application bootstrap contract; the frontend must not copy an independent role/capability authorization matrix;
- admin/ops may see the full core set when their effective capabilities allow it; receptionist/housekeeping see only authorized modules;
- secondary authorized areas (Reports, Users, Network, settings/language) live behind a `More` sheet/menu;
- opening/closing navigation chrome must preserve the active task;
- selecting another module while a dirty task is open invokes the same discard guard as closing that task; clean task exit may navigate normally.

Navigation motion:
- module content transition target: 140–220 ms, opacity + small horizontal/vertical translation;
- selection/detail transition target: 100–160 ms;
- drawer/sheet transition target: 160–240 ms;
- no animation library is required; prefer CSS/native browser capability because Wave 0 has a strict JS budget;
- `prefers-reduced-motion` disables non-essential movement.

Progressive enhancement may use the View Transitions API, but correctness cannot depend on it.

## 2. Navigation and history semantics

Top-level module navigation and contextual navigation are different:

- top-level module switch may place the new workspace at its remembered/top position;
- contextual navigation to a known booking/room/guest focuses that entity instead of dumping the operator at an unrelated page top;
- Back/Forward restores route, query context, selected entity, filter/search state and prior list/queue scroll; if reflow invalidates the exact offset, restore the prior selected item into view;
- no unconditional global `scrollTo(0,0)` is allowed for contextual navigation;
- invalid/deleted selected IDs fail safely and keep valid filters.

Query IDs remain authorization-neutral.

The root/unknown-safe landing is capability-derived using the canonical map in `19`; the app must not default every authenticated identity to Reception.

Navigation is capability-aware for presentation. The shell/bootstrap chrome may render while access is resolving, but a protected module must not mount/fetch before effective capabilities are known. Unauthorized direct URLs render an in-shell Forbidden/access-denied state rather than briefly exposing the module and failing later. Backend capability checks remain authoritative.

When a backend 403 reveals that previously bootstrapped access has changed, refresh bootstrap capabilities once, update visible navigation and route state, and never auto-retry the denied mutation.

## 3. Desktop master/detail and mobile focused-task model

Desktop >= 1024 px:
- operational lists/queues use master/detail where useful;
- selecting a row keeps the queue visible and opens/updates the detail/work panel;
- queue scroll position and filters remain stable while working the selected case.

Tablet/mobile:
- selection opens a focused full-screen detail/sheet;
- Back/close returns to the exact prior list position and filters;
- only one primary task surface is visible at a time.

A selected case changing after mutation must not cause a visible jump to an arbitrary row.

## 4. Overlay taxonomy

Use a consistent overlay hierarchy.

### Drawer / full-screen sheet
Use for multi-field or multi-step work that belongs to current context:
- new reservation;
- edit reservation;
- check-in;
- reassignment;
- extension;
- checkout;
- maintenance report/escalation;
- room/guest detail when entered contextually.

Desktop: right-side drawer where space permits.
Mobile: full-screen sheet with sticky header and sticky primary action.

### Confirmation dialog
Use only for destructive, irreversible or materially financial actions:
- cancellation;
- no-show;
- final checkout/release;
- admin pending-balance override;
- destructive maintenance consequence when confirmation is materially useful.

Dialog must state what changes, not merely ask “Are you sure?”.

### Quick dialog / popover
Use for low-risk contextual updates:
- late-arrival ETA/note;
- small metadata edit;
- quick filter/date chooser.

### Toast
Use for non-blocking success/background confirmation:
- payment recorded;
- note updated;
- filter preference saved;
- ordinary successful refresh.

Toast is never the only evidence for a blocking failure.

Native `window.confirm` / `window.alert` are not accepted product UX.

Overlay stack rules:
- one primary task drawer/sheet at a time;
- do not open a second drawer on top of a drawer;
- subordinate work such as inline guest creation stays inside the parent reservation flow as a step/subview;
- a confirmation dialog may temporarily overlay the current task and returns focus/state to that task if cancelled;
- closing a child confirmation never silently closes the parent task.

## 5. Reception flow transitions

Reception is a queue-driven workspace.

### New reservation
`New reservation` opens a drawer/sheet, never expands a large inline form into the queue.

Steps:
1. search/select guest or create guest inline;
2. dates;
3. availability + room;
4. review/price/notes;
5. confirm.

The stepper keeps completed information visible as a compact summary. Inline guest creation is subordinate and returns directly to the reservation flow.

### Check-in
Open from the selected arrival. Use focused stepper:
1. identity/document;
2. stay/contact confirmation;
3. room readiness;
4. final review.

Desktop may show steps together only if the operator still perceives one task. Mobile is one step at a time. Success closes the task surface, refreshes authoritative state and advances to the next queue case by server/accepted priority.

### Reassignment
Drawer shows:
- current room;
- valid destination rooms only;
- visible NON_BLOCKING advisory;
- BLOCKING destinations unavailable with reason;
- price/Billing consequence;
- required reason;
- old-room consequence after move.

Final confirmation is explicit because room/inventory/Billing all change.

### Extension
Drawer shows:
- current checkout;
- requested checkout;
- added nights;
- room availability;
- recalculated total;
- remaining/credit consequence;
- explicit confirmation.

Conflict keeps the drawer open, explains what changed and refreshes availability/Billing without discarding the operator’s requested date unless invalid.

### Checkout
Focused drawer/dialog combines:
- room release/checklist;
- authoritative Billing summary;
- remaining/credit;
- maintenance consequence;
- housekeeping handoff.

Normal settled checkout is one final confirmation. `pending-approved` exposes the admin-only override path explicitly and never looks like an ordinary checkbox.

### Late arrival
Compact dialog/popover:
- ETA;
- note;
- current booking/room summary.

No lifecycle-style wizard and no price UI.

### Cancellation / no-show
Danger dialog:
- booking/guest/room summary;
- consequence summary;
- required reason;
- explicit destructive action label.

No browser-native confirmation.

## 6. Rooms, Guests and Housekeeping

Rooms:
- grid/list supports filters for physical state, readiness and maintenance impact;
- selecting a room opens detail without losing grid position;
- active/upcoming stay and maintenance are contextual actions;
- room status changes are never exposed as generic CRUD when a domain command owns the transition.

Guests:
- search + operational filters remain visible;
- guest detail is master/detail on desktop and focused sheet on mobile;
- “Open stay in Reception” carries booking context;
- creating a guest from standalone Guests remains separate from inline reservation creation.

Housekeeping:
- filters distinguish turnover, cleaning, maintenance and occupied-maintenance attention;
- task detail opens without losing board position;
- state-changing actions use local pending feedback and authoritative refresh;
- BLOCKING occupied maintenance provides a direct contextual route to Reception.

## 7. Filter contract

Filters are first-class application state, not disposable component state.

Common behavior:
- search input;
- filter chips/toggles with counts;
- category counts represent the authoritative selected board/date scope before free-text search; the currently visible filtered-result count is shown separately when useful;
- active-filter indicator;
- one-click `Clear filters`;
- filters do not reset after ordinary mutation/refresh;
- selected entity remains selected while it still belongs to the visible result;
- if mutation removes it from the active filter, select the next item by canonical operational priority.

URL/query state:
- shareable/meaningful filters and selected context use query parameters;
- Back/Forward restores them;
- last-used workspace filters may be remembered for the current browser session when the URL does not specify them;
- URL parameters never authorize data.

Reception minimum filters:
- attention / arrivals / departures / in-house / all;
- text search;
- operational date when the board supports non-today inspection.

Rooms minimum filters:
- state;
- readiness;
- maintenance impact;
- text/room search.

Guests minimum filters:
- active / arrivals / upcoming / all;
- text search.

Housekeeping minimum filters:
- turnover/cleaning/maintenance attention;
- room search;
- state/impact where represented by the read model.

Search filtering should feel immediate; local search may use a short debounce only when needed.

## 8. Loading, success, error and conflict behavior

Do not replace whole workspaces with plain “Loading…” text when prior data is already available.

- first load: skeletons sized like final rows/cards;
- refresh: keep stale-but-known data visible with subtle refreshing indicator;
- mutation: spinner/progress only on affected action/surface; prevent duplicate submit;
- success: authoritative refresh + lightweight success feedback;
- validation error: inline adjacent to the relevant control;
- infrastructure error: workspace/banner with retry;
- stale/concurrent conflict: dedicated conflict banner explaining that authoritative state changed and offering refreshed state;
- never auto-replay a state-changing command after conflict.

Typed form data should survive a recoverable conflict when safe; fields made invalid by refreshed authoritative state must be marked.

## 9. Unsaved work and close behavior

A drawer/sheet with unsaved meaningful changes:
- can close immediately when pristine;
- asks to discard only when dirty;
- Back/Escape follows the same rule;
- a focused drawer/full-screen task opened from a workspace participates in app history: Back closes the top confirmation first, then the focused task, before leaving the underlying workspace;
- successful submit clears dirty state before close.

Do not add confirmation prompts to harmless navigation when there are no unsaved changes.

## 10. Action hierarchy

Each focused task has:
- one visually primary next action;
- secondary actions clearly subordinate;
- destructive action visually separated;
- disabled actions explain their blocker where useful.

Avoid stacks of several same-weight submit buttons in one long case panel.

Action labels state the outcome: “Complete check-in”, “Move to room 204”, “Confirm checkout”, not generic “Save” where the operation is domain-specific.

## 11. Focus, keyboard and accessibility

- opening modal/drawer moves focus to heading/first meaningful control;
- closing returns focus to its trigger or selected queue row;
- dialogs trap focus;
- Escape closes non-destructive overlays subject to dirty-state rule;
- keyboard can move through operational queue and activate selected case;
- status is not conveyed by color alone;
- motion respects reduced-motion preference;
- live regions announce mutation success/conflict without excessive verbosity.

## 12. Responsive behavior

Target browser proof at representative widths:
- mobile ~360–390 px;
- tablet ~768 px;
- desktop ~1280 px.

Acceptance is task execution, not screenshot reachability.

At mobile width prove:
- bottom/primary navigation;
- queue -> focused task -> return preserving position/filter;
- drawer becomes full-screen sheet;
- sticky task action remains reachable above browser chrome/keyboard.

## 13. Performance constraints

App-like behavior cannot solve UX by importing a heavy component/animation framework.

Before material UI growth the existing raw JS headroom gate still applies. Prefer:
- native `dialog`;
- CSS transitions;
- existing router;
- small reusable primitives;
- progressive browser APIs with fallback.

Transitions must never delay an operation or block input longer than their visual duration.

## 14. Browser acceptance scenarios

The UX contract is not complete until browser tests prove at least:

1. as an authorized admin/ops user, switch Reception -> Rooms -> Back with shell stable and prior Reception filters/context restored;
2. mobile primary navigation directly exposes the current user's authorized core operations without hamburger-only dependency; unauthorized core modules are absent, and direct URL access shows Forbidden while backend remains protected;
3. new reservation opens focused sheet/drawer and returns to queue after success;
4. check-in step transition + success -> authoritative next case;
5. reassignment shows price/room consequence before confirmation;
6. cancellation/no-show use product dialog with required reason, not native confirm;
7. checkout uses selected Reception booking and embedded Billing, no independent booking reselection;
8. stale conflict keeps operator in task with refreshed context;
9. filters survive refresh/mutation and Back/Forward;
10. reduced-motion mode performs the same flows without non-essential animations.

## Completion rule

A screen is not “app-like” merely because it animates. It passes only when task context, filter state, navigation history, overlays, feedback, focus and authoritative refresh form one continuous operational experience.
