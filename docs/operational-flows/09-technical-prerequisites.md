# 09 — Technical prerequisites for the next workflow wave

Status: `BINDING DELIVERY GATE`

## Frontend JavaScript headroom

Accepted staging is approximately `319858 / 320000` raw JS. The current budget script sums **all generated JavaScript assets**, so route-level code splitting alone does not create budget headroom.

Before material new workflow UI is merged, create net total-JS headroom through simplification, deduplication, dead-code removal or other behavior-preserving refactoring.

Target gate for the prerequisite increment:

- total raw JS `<= 300000` bytes;
- existing gzip/CSS budgets remain green;
- no accepted behavior or browser regression is removed to hit the target;
- the 320000 budget itself is not raised.

The 300 KB target creates approximately 20 KB of working margin rather than operating within a few hundred bytes of failure.

Code splitting may still be used for initial-load performance, but it does not count as budget reduction unless total generated JS also falls.

## Operational timezone foundation

Before date-sensitive P0 mutations ship:

- each hotel has an authoritative IANA timezone in server-owned configuration;
- existing Mendoza hotel fixtures/staging receive an explicit Mendoza timezone;
- trusted application context can read it;
- backend lifecycle helpers can derive hotel-local date without client input.

Exact schema/helper organization is implementation latitude.

## Schema migration coordination

P0 work will require coordinated changes to current constraints/triggers, including:

- lifecycle events for no-show/extension;
- reassignment atomic guard no longer expecting old room `AVAILABLE`;
- maintenance case `impact` and occupied open/resolve semantics;
- maintenance event guards that allow truthful same-state case events;
- hotel timezone configuration.

Migrations must be incremental and rehearsal-tested; do not rewrite historical migration files.

## Why prerequisites precede feature UI

They remove two systemic blockers: no safe JS growth margin and no authoritative operational day. Domain backend work may be developed with the prerequisite branch, but no date-sensitive behavior should claim correctness without the timezone foundation.