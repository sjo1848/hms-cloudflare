# CF-I05 REWORK-2 — External Independent Critic

Reviewed artifact: `462bd0519c7224dc996f23825dbbc8c5afc10aec`  
Reviewer: ChatGPT External Independent Critic  
Verdict: `REWORK`  
Human Gate: `NONE`  
Diagnosis: `NEXT_TASK_SEMANTIC_PARITY_DEFECT + MOBILE_FOCUS_BEHAVIOR_GAP + EVIDENCE_OVERCLAIM`

## Summary

REWORK-2 closes the previously blocking maintenance ABA defect: resolution is now correlated to the exact case mutation and an open newer case prevents the stale room transition/event. The deterministic K1/K2 regression is materially stronger. The mobile target also now exposes a fixed bottom focused-task surface and the browser harness checks open/close behavior and two-room draft isolation.

The artifact still cannot PASS because the target `Siguiente tarea` action does not select the same task as the accepted source, the focused mobile surface does not preserve the source focus-return behavior required by the previous Critic, and the browser evidence still claims reset/clear coverage that it does not execute. These are bounded routine repairs. No Human Gate is required and CF-I06 remains unauthorized until fresh CF-I05 PASS.

## Blocking findings

### P1 — `Siguiente tarea` skips the source-priority task

Accepted source HMS:

- derives `nextRoom = visibleQueue[0]`;
- the mobile `Siguiente tarea` / `Abrir` action opens exactly that first visible queue item.

Target REWORK-2:

- automatically selects `visible[0]` as the default selected room;
- `nextTask()` finds the current selected index and opens `(index + 1) % visible.length`.

Therefore, on a fresh board the first press of `Siguiente tarea` opens `visible[1]`, skipping `visible[0]`, which is the task the source explicitly presents as next. This changes task-priority semantics rather than presentation only.

Required repair:
- make `Siguiente tarea` open the source-equivalent current priority item (`visible[0]`, or the exact source queue-head rule if queue ordering changes);
- do not use cyclic navigation as the meaning of `Siguiente tarea`;
- add browser evidence asserting the room number opened by `Siguiente tarea` equals the first visible queue task.

### P1 — Mobile focused-task close does not preserve source focus-return semantics

The target now renders the selected mobile task as a fixed bottom `role="dialog"` surface, which is a substantial improvement. However, opening only toggles state and closing only sets `mobileFocus=false`; it does not move focus into the focused task or restore focus to the originating queue task / next-task control.

The accepted source explicitly restores focus to the corresponding room task on close, and its Sheet provides modal focus behavior. The previous Critic required source-equivalent `focus/close behavior`, not only visual visibility.

Required repair:
- capture/identify the task control that opened the focused workspace;
- move focus into an appropriate control/heading in the focused task when opened, or use an accessible dialog/sheet primitive that does this;
- on close, restore focus to the originating room task (or equivalent source queue control);
- browser assert actual focus transition/return, not only dialog visible/hidden.

### P1 — Browser evidence still overclaims draft reset/clear proof

The REWORK-2 browser harness now correctly proves:

- draft typed for room 903 does not leak to room 905;
- returning to room 903 retains its own draft;
- the maintenance action can then succeed.

But it does **not** subsequently assert that a successful action cleared only room 903's draft, and it never executes the `Clear form` control. The invariant evidence nevertheless claims `per-room draft isolation/reset` and says a successful action clears the intended draft.

Required repair:
- after a successful action, return the room to a state where the relevant draft field is observable and assert the successful room's draft is reset while another room's draft is unchanged; and/or use the explicit `Clear form` path and assert it only clears the selected room;
- keep evidence language no stronger than those executable assertions.

## Findings accepted in REWORK-2

- Exact-case maintenance ABA correlation is materially repaired.
- Deterministic stale K1 against newer open K2 returns conflict and preserves room/K1/K2/event state.
- Legacy maintenance recovery ownership remains preserved.
- Simple concurrent cleaning/resolve exactly-once semantics remain intact.
- Mobile task workspace is now a distinct bottom focused surface rather than merely stacked content.
- Room selection can open the focused mobile task.
- Per-room draft isolation and retention are now browser-tested.
- Integrated browser evidence remains local real API + D1 + Vite, not mock-only.
- No CF-I06, production, remote D1, real data or paid-resource scope drift is present.

## Required next action

Under `PM-AUTONOMY-001`, execute one bounded autonomous REWORK-3:

1. make `Siguiente tarea` open the source-equivalent first/prioritized visible task;
2. implement and test mobile focus entry + close focus restoration;
3. add exact browser proof for draft reset/clear isolation;
4. update `INV-UX-001` / Pre-Critic evidence so task-target semantics and focus behavior are explicitly checked;
5. run complete CF-I03/CF-I04/CF-I05 regressions, browser, tests, build, types, Wrangler dry-runs and diff checks;
6. publish one fresh immutable CF-I05 artifact with `external_review.required=true` and stop at Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.
