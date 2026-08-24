# CF-I05 REWORK-3 — External Independent Critic

Reviewed artifact: `97cd5536efa632bb30536fdfd106b69ee14687fd`  
Reviewer: ChatGPT External Independent Critic  
Verdict: `REWORK`  
Human Gate: `NONE`  
Diagnosis: `OPERATIONAL_QUEUE_PRIORITY_PARITY_DEFECT + ORPHAN_DEPARTURE_PARITY_DEFECT + EVIDENCE_OVERCLAIM`

## Summary

REWORK-3 closes the three findings from the prior review: `Siguiente tarea` now selects the target queue head, mobile focus enters the focused task and returns on close, and the browser explicitly proves selected-room draft clearing without leaking to another room. The previously accepted ABA/domain/security work remains intact.

CF-I05 still cannot PASS because the target queue head is not the source queue head. The accepted HMS does not define queue priority as API/room-number order: `buildHousekeepingQueue()` computes an operational rank from maintenance priority, turnover, blocking and room state, then sorts by rank and numeric room number. It also synthesizes an orphan-departure queue item when a departure exists for a room absent from the eligible board-room list. The target renders only `board.rooms` in API `room_number` order and its browser test dynamically treats the first target button as the expected source-priority task. That proves internal consistency, not parity.

These are bounded CF-I05 repairs. No Human Gate is required and CF-I06 remains unauthorized until a fresh CF-I05 PASS.

## Blocking findings

### P1 — Target Housekeeping queue does not implement the source operational priority ranking

Source `housekeepingQueue.ts` assigns priority in this order:

1. maintenance case priority: Urgent, High, Medium, Low;
2. Dirty + turnover today;
3. Cleaning + turnover today;
4. blocked tasks;
5. ordinary Dirty;
6. ordinary Cleaning;
7. ordinary Maintenance fallback;
8. Available;
9. numeric room-number tie-break within the same rank.

The target `HousekeepingRework` derives `visible` directly from `board.rooms` and never computes this ranking. The API board query orders rooms by `room_number`, so target queue order is room-number order.

The committed browser fixture already demonstrates why this matters: room 904 has an open HIGH maintenance case while room 901 is ordinary DIRTY. Under the source algorithm room 904 must outrank room 901; the current target can place room 901 first because 901 sorts first numerically.

`Siguiente tarea -> visible[0]` therefore fixes selection relative to the target list but still does not preserve the accepted source `nextRoom = visibleQueue[0]` semantics because the target `visibleQueue` itself is wrong.

Required repair:
- port/adapt `buildHousekeepingQueue` priority semantics into the target frontend (or an equivalent server-side representation with the same observable order);
- keep filtering/search after the ranked queue is built, as in the source;
- preserve numeric room-number tie-break behavior for equal rank;
- add deterministic browser/unit evidence with fixture data whose numeric room order conflicts with operational priority, asserting the expected source-priority task is first and is opened by `Siguiente tarea`;
- do not make the test derive the expected answer from the target queue itself.

### P1 — Source orphan-departure queue tasks are missing from the target

The source board intentionally separates eligible board rooms from `departures_today`, then `buildHousekeepingQueue()` adds a synthetic queue item when a departure's room is not present in the eligible room list. This covers cases such as a departure-today booking whose room is still `Occupied`: it remains operationally visible as a blocked/attention task even though the room is not Dirty/Cleaning/Available/Maintenance.

The target API also returns `departures_today`, but `HousekeepingRework` builds its queue only from `board.rooms`. `board.departures_today` is not used to synthesize missing queue items, so those operational tasks disappear from the target UI.

Required repair:
- reproduce the source orphan-departure queue behavior or an operationally equivalent representation;
- the synthetic item must retain room/guest/booking context and be visibly non-cleanable/blocked as appropriate;
- add deterministic API/browser evidence with a departure-today room excluded from `board.rooms` (for example Occupied) and prove it remains visible in the Housekeeping queue without exposing an invalid cleaning/maintenance mutation.

### P1 — Evidence currently labels target-first-button consistency as source-priority parity

`docs/cf-i05-housekeeping-maintenance-parity.md` and invariant evidence claim `source-priority queue-head selection`, but the browser harness computes:

`expectedRoom = first rendered target queue button`

and then proves `Siguiente tarea` opens that same room. This cannot establish that target ordering matches the source ranking algorithm.

Required repair:
- define the expected priority from a known source-parity fixture or explicit expected room identity/rank;
- prove queue order, not only open-button consistency;
- add orphan-departure evidence;
- update evidence language so `INV-UX-001`, `INV-PARITY-001` and `INV-EVID-001` PASS only when source ranking and synthetic departure behavior are executable assertions.

## Findings accepted in REWORK-3

- `Siguiente tarea` no longer advances from the selected room; it opens the first item in the target visible queue.
- Mobile focused-task entry is a distinct dialog/bottom-sheet surface.
- Mobile task heading receives focus and the opener receives focus on close in the committed browser evidence.
- Draft state remains keyed by room; browser evidence now proves room-B Clear form does not erase room-A draft.
- Maintenance ABA correlation remains repaired with stale K1 rejected against newer K2.
- Simple start/finish/resolve concurrency and exact event behavior remain covered.
- Legacy maintenance ownership, backend capability enforcement and authorized D1 routing remain intact.
- Scope remains CF-I05-only; no CF-I06 billing, production, remote-D1, real-data or paid-resource work entered the artifact.

## Required next action

Under `PM-AUTONOMY-001`, this is routine autonomous REWORK-4:

1. implement source-equivalent Housekeeping operational queue ranking;
2. synthesize source-equivalent orphan-departure queue items from `departures_today` when the room is absent from eligible board rooms;
3. make blocked/orphan items operationally safe and context-complete;
4. add deterministic priority evidence where room-number order conflicts with source rank;
5. add deterministic orphan-departure visibility/safety evidence;
6. make `Siguiente tarea` assert a known expected source-priority room rather than deriving expectation from the target queue;
7. update parity/invariant/Pre-Critic evidence so claims exactly match executable proof;
8. run complete CF-I03/CF-I04/CF-I05 regressions, browser, tests, build, types, Wrangler dry-runs and diff checks;
9. publish one fresh immutable CF-I05 artifact with `external_review.required=true` and stop at Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.
