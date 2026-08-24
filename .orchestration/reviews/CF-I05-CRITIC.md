# CF-I05 — External Independent Critic

Reviewed artifact: `02421a19985fa71408e52be2a253b9082292dd78`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`
Diagnosis: `CONCURRENCY_DEFECT + DOMAIN_PARITY_DEFECT + UX_PARITY_DEFECT + EVIDENCE_DEFECT`

## Summary

The accelerated CF-I05 wave is directionally better than the earlier micro-boundary model: schema, API, UI, regressions and parity evidence arrived as one coherent artifact, and the implementation covers the intended Housekeeping + Maintenance domain without pulling CF-I06 forward.

The artifact does not yet satisfy the CF-I05 Task Contract or binding `CF-UX-PARITY-001`. The remaining issues are bounded technical/product-parity repairs and do not require a Human Gate.

## Blocking findings

### P1 — Stale concurrent cleaning transitions can return false success and duplicate audit events

`transition()` pre-reads the room state, then executes a D1 batch containing:

1. guarded room `UPDATE ... WHERE status = expected`;
2. housekeeping event insert.

The route does not verify that the room update changed exactly one row. The `housekeeping_event_state_guard` only verifies that the room is in the requested **final** state and that the declared transition pair is legal.

Concrete interleaving for two concurrent `POST /housekeeping/{id}/start` requests:

1. both requests pre-read `DIRTY`;
2. request A changes the room to `CLEANING` and records `CLEANING_START`;
3. request B's guarded UPDATE affects zero rows because the room is already `CLEANING`;
4. request B's event insert still passes the trigger because the room is currently `CLEANING` and the event declares `DIRTY -> CLEANING`;
5. request B commits and returns success despite not owning the transition, producing a duplicate audit event.

The same pattern applies to `CLEANING -> AVAILABLE`.

Required repair:
- make stale/concurrent start/finish requests either perform a defined no-op **without falsely recording a second transition**, or fail cleanly;
- tie the event to the mutation that actually won the guarded transition rather than only to the final room state;
- add deterministic stale/concurrent regressions with exact room status and event-count assertions.

### P1 — Concurrent maintenance resolution can also false-succeed and duplicate `MAINTENANCE_RESOLVE`

Two requests can both pre-read the same `MAINTENANCE` room and open case. After the first request resolves the case and moves the room to `DIRTY`, the second batch can have both guarded UPDATEs affect zero rows. Its final audit insert can still pass because the trigger sees:

- room already `DIRTY`;
- case already `RESOLVED` with `return_status='DIRTY'`.

The second request can therefore commit a second resolve event and return the already-resolved case as success.

Required repair:
- stale resolution must not create a second successful resolve/audit event;
- add deterministic concurrent/stale resolution evidence asserting one durable resolution event and one authoritative resolver transition.

### P1 — Legacy maintenance recovery loses the source reporter/actor ownership

The accepted source legacy path synthesizes an open maintenance case with `reported_by_user_id = actor_user_id` before resolving it. The target legacy insert omits `reported_by_user_id`, leaving it `NULL`.

This conflicts with the source behavior and the CF-I05 contract requirement that maintenance evidence retain actor/timestamp ownership, including the explicit legacy recovery path.

Required repair:
- synthesize the legacy case with the current adapted actor identity in `reported_by_user_id`;
- assert reporter and resolver ownership in regression evidence.

### P1 — Housekeeping UX is still a materially different workflow from the accepted source

The source Housekeeping experience is operationally queue-oriented:

- prioritized/filtered task queue;
- selected room workspace;
- summary/action/maintenance information architecture;
- mobile "Siguiente tarea" entry point;
- mobile bottom-sheet room workspace;
- explicit focus/selection behavior around the current task.

The target renders all rooms as independent cards with Summary, Action and Maintenance sections inline. Although the same underlying actions exist, this changes the accepted information architecture and mobile operating model rather than merely adapting it to Cloudflare.

Under `CF-UX-PARITY-001`, this is still migration-time UX drift.

Required repair:
- port/adapt the source queue -> selected-room workspace model, or an operationally equivalent structure that preserves the same task-selection and focused-room interaction model;
- preserve mobile next-task/focused workspace behavior rather than showing the entire board as a flat collection of action cards;
- do not import guided-mode extras unless already required for parity; keep this repair bounded to CF-I05.

### P1 — Maintenance form draft state is shared across rooms

Target `Housekeeping()` keeps `reason`, `priority`, `assignedTo` and `resolution` as component-global state while potentially rendering multiple room maintenance forms/cards.

Consequences:
- resolution text typed for one maintenance room mirrors into every visible maintenance-room resolution field;
- switching the expanded maintenance-open form from one room to another can carry the previous room's reason/owner/priority draft into the new room;
- an operator can therefore submit evidence intended for one room against another room.

This is an operational correctness defect, not cosmetic styling.

Required repair:
- scope maintenance drafts to the selected room/case or reset them on room switch/cancel/success;
- add browser coverage with at least two maintenance-capable rooms proving drafts do not leak between rooms.

### P1 — Browser evidence does not satisfy the Task Contract and is not durable/reproducible enough

The evidence document records:

- screenshots only at 375x812 and 1024x768;
- width checks at 375/390/430/768/1024 for no horizontal overflow and rendered cards;
- one successful **mocked Start cleaning** interaction.

The CF-I05 Task Contract requires browser evidence for the actual Housekeeping + Maintenance flow at all accepted widths, including start cleaning, finish cleaning, open maintenance, resolve-to-dirty, validation, typed errors/success states and maintenance evidence fields.

No committed CF-I05 Playwright/browser regression script exists in the artifact, so the browser assertions are not reproducible from the repository. The design package also states that mock-only evidence does not prove real integration.

Required repair:
- persist a reproducible CF-I05 browser regression harness;
- exercise start, finish, maintenance open and maintenance resolve through the real local API for an integrated journey;
- cover validation/error/recovery and per-room draft isolation;
- exercise the relevant controls at 375/390/430/768/1024, using mocks only for bounded cases that cannot reasonably be produced through the local API;
- make evidence claims exactly match what the committed harness proves.

## Findings already acceptable

- Scope remains correctly bounded to Housekeeping + Maintenance; no CF-I06 billing work was pulled forward.
- Dirty queue and board endpoints cover source-eligible room states and departure context.
- Maintenance case schema enforces one open case per room and durable resolved-state fields.
- Reason, assignee, priority and resolution validation match the intended source ranges/enums.
- Backend role denial is fail-closed for receptionist and housekeeping routes use the authorized operational D1.
- Maintenance open is transactionally coupled to room state, case and audit via the D1 batch/trigger boundary.
- Legacy maintenance rooms are explicitly recoverable rather than orphaned.
- Generic room metadata PATCH does not expose a room-status bypass.
- No production, remote D1, real-data, paid-resource or cutover action occurred.
- `RUNTIME_CAPABILITY_FALLBACK` remains accurate.

## Required next action

Under `PM-AUTONOMY-001`, Codex consumes this review directly and repairs CF-I05 autonomously as one bounded accelerated rework wave:

1. fix stale/concurrent start-cleaning, finish-cleaning and maintenance-resolution semantics so false success/duplicate transition audit is impossible;
2. add deterministic exact-state/event-count concurrency regressions;
3. restore reporter ownership in the legacy maintenance synthesized case;
4. port/adapt the source queue/focused-room Housekeeping interaction model under `CF-UX-PARITY-001`;
5. isolate maintenance draft state per selected room/case;
6. add committed, reproducible browser/integration evidence for start, finish, open maintenance and resolve at the accepted widths, including validation/error/recovery;
7. run full CF-I03/CF-I04/CF-I05 regressions, tests, build, types, Wrangler and diff checks;
8. publish one fresh immutable CF-I05 artifact and stop at the next Independent Critic boundary.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.
