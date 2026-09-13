# 10 — Operational UX acceptance targets

Status: `BINDING PRODUCT TARGETS`

The second pass is successful only if primary hotel work can be completed without unnecessary module switching.

## Zero-required-switch primary paths

The following flows should complete from their owning surface without requiring navigation to another module:

- normal check-in from Reception;
- normal checkout from Reception, including billing context needed for the checkout decision;
- in-stay room reassignment from Reception;
- reporting an occupied-room maintenance issue from Reception;
- new reservation with a new guest from Reception;
- extending a checked-in stay from Reception;
- marking an eligible no-show from Reception;
- dirty -> cleaning -> available from Housekeeping.

Cross-module links remain available for inspection and specialist work, but are not mandatory detours for the primary flow.

## Operator-memory rule

If HMS already knows guest, booking, room, balance, readiness, maintenance blocker or prior selected context, the user must not be required to remember/reselect that information solely because another component owns it internally.

## High-risk confirmations

Clicks are not minimized at the expense of safety. Explicit confirmation remains appropriate for:

- no-show;
- cancellation;
- checkout/release;
- room reassignment;
- relocation-required maintenance consequence;
- cash/financial irreversible actions.

## Post-action continuity

After an action:

- authoritative data is refreshed;
- filters/search remain stable;
- successful item changes/disappears according to state;
- next case is obvious and follows operational priority;
- a conflict explains what changed and refreshes the affected case.

## Simulation measurements

For each synthetic shift scenario record:

- module switches required;
- explicit confirmations;
- duplicate data entry;
- re-selection of already-known entities;
- stale-state conflicts;
- whether the next action is evident without scanning unrelated controls.

No hard click-count KPI is imposed. The optimization target is unnecessary context switching and redundant input, not removal of safety confirmations.