# 04 — Acceptance and sequencing

Status: `BINDING DEFINITION`

## Acceptance strategy

Each future implementation increment must prove the domain transition first, then the browser workflow, then cross-module continuity. Green UI tests alone are insufficient.

Minimum evidence per P0 flow:

- positive API/domain path;
- invalid-state rejection;
- deterministic concurrency/stale-state rejection;
- exact DB/state assertions;
- audit/event assertion;
- responsive browser journey at contracted widths;
- cross-surface consequence where applicable.

## End-to-end operational scenarios

### Scenario A — Normal departure

Checked-in guest -> review balance/charges -> confirm room vacated -> checkout -> booking checked out -> room dirty -> housekeeping sees room -> start cleaning -> finish cleaning -> room available -> Reception refresh sees room ready.

### Scenario B — Reassignment without maintenance

Checked-in guest in 101 -> select valid 104 -> confirm -> guest/booking moves to 104 -> 104 occupied -> 101 dirty -> housekeeping cleans 101 -> 101 available.

### Scenario C — Relocation-required incident

Guest in 102 -> urgent relocation-required maintenance case -> Reception attention item -> reassign to 105 -> 102 maintenance -> resolve maintenance -> 102 dirty -> clean -> 102 available.

### Scenario D — Non-blocking occupied incident

Guest remains in 103 -> open non-blocking maintenance case -> booking and room remain occupied -> resolve case -> room remains occupied -> later normal checkout sends room dirty.

### Scenario E — No-show

Confirmed arrival reaches check-in date -> mark no-show -> booking no-show -> inventory released -> physical room unchanged -> arrival item disappears -> availability refreshes.

### Scenario F — Stay extension

Checked-in guest requests extra night -> added interval available -> extension commits -> booking remains checked in -> room remains occupied -> added inventory claimed -> billing/availability refresh.

Conflict variant: another reservation/hold owns an added night -> extension rejects atomically.

## Implementation sequence

1. **P0.1 Reassignment correctness** — old room must not become available after occupancy.
2. **P0.2 Occupied maintenance model** — add incident impact/coexistence rules and relocation linkage.
3. **P0.3 No-show command** — explicit booking transition and queue behavior.
4. **P0.4 Stay extension command** — atomic added-night claim.
5. **P1.1 Front-desk readiness/read model** — centralize blocker/priority context.
6. **P1.2 Reception-Billing selected-case coupling.**
7. **P1.3 New guest inside reservation flow.**
8. **P1.4 Contextual deep links + revalidation policy.**
9. **P1.5 Next-case continuation after lifecycle actions.**
10. **P2 architecture/interaction** — code splitting, keyboard/focus refinement, operational simulation metrics.

## Why this order

The first four steps change business truth and must be correct before UI continuity builds on them. Read-model/navigation work comes after domain semantics so it does not codify the current incorrect transitions.

## Stop conditions

Stop and return to analysis if an increment discovers:

- a new state that changes financial policy;
- multiple simultaneous maintenance cases are required for one room;
- split-stay/multi-room extension becomes required;
- a transition needs cross-D1 atomicity;
- WebSockets/paid services appear necessary;
- a requested UX would weaken backend lifecycle guards.

## Product simulation gate

Before calling the second flow pass complete, execute a synthetic hotel shift covering all scenarios above and record:

- number of module switches;
- number of operator confirmations;
- stale/conflict outcomes;
- points where the operator must remember information not shown by HMS;
- whether the next actionable case is obvious after every transition.

The target is not minimum clicks at any cost; it is minimum unnecessary context switching while preserving explicit high-risk confirmations.