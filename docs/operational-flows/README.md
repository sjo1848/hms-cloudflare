# HMS — Operational Flow Definition Pack

Status: `ANALYSIS`  
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.

## Purpose

Define how HMS should behave as one hotel operating system before the next implementation wave.

Core rule: **the system follows the operator workflow; the operator must not reconstruct state the system already knows.**

Domain rule: **physical room state and sellable availability are different concepts.** A room can be physically clean but unavailable for future dates, or inventory-free but not ready for immediate check-in.

## Pack

- `01-domain-model.md` — booking, room, inventory and maintenance semantics.
- `02-p0-flows.md` — reassignment, occupied-room maintenance, no-show and stay extension.
- `03-cross-module-flows.md` — reservation/guest, readiness, Billing, Housekeeping, navigation and refresh.
- `04-acceptance-and-sequencing.md` — acceptance scenarios and rollout order.
- `.orchestration/decisions/CF-OPS-FLOWS-001.md` — binding and deferred decisions.
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md` — current-code evidence.

## Current gaps

- Reassignment releases the old occupied room directly to available.
- Occupied rooms cannot currently hold a normal maintenance incident.
- No-show has no explicit Reception transition.
- Checked-in stays cannot be extended.
- Reception and Billing can hold different booking selections.
- New reservation requires a pre-existing guest.
- Check-in readiness is discovered too late.
- Cross-screen refresh and deep-link context are not standardized.

P0 fixes domain correctness. P1 fixes cross-module continuity. P2 optimizes speed and architecture after correctness.