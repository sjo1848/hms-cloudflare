# 09 — Technical prerequisites for the next workflow wave

Status: `BINDING DELIVERY GATE`

## Frontend JavaScript headroom

Accepted staging is approximately `319858 / 320000` raw JS and the budget script sums all generated JS assets. Before material new workflow UI, reduce total raw JS to `<=300000` without raising the budget or removing accepted behavior. Existing gzip/CSS/browser gates remain green. Code splitting may improve initial load but does not count as total budget reduction by itself.

## Operational timezone / instant foundation

Before date-sensitive P0/late-arrival behavior ships:
- each hotel has a server-owned valid IANA timezone;
- existing Mendoza staging/demo data is explicitly backfilled/configured for `America/Argentina/Mendoza`;
- trusted application context can read it;
- backend helpers derive hotel-local date from authoritative instant/timezone;
- target date-time parser accepts RFC3339/ISO-8601 only with explicit Z/numeric offset where an absolute instant is required;
- timezone-less late-arrival ETA is rejected rather than guessed;
- tests prove browser/server timezone cannot alter eligibility.

Exact schema/helper organization is implementation latitude; semantics are not.

## Pricing mutation / Billing foundation — D8/D9

Before later flows rely on no-repricing guarantees, backend update paths must distinguish priced from non-priced mutations.

- priced mutation may recalculate total only under its explicit pricing contract;
- guest/name/notes-only, check-in, cancel, no-show, late-arrival and checkout preserve stored total;
- any actual total change reconciles existing invoice atomically;
- checkout settlement reads the preserved authoritative total;
- shared helpers must not accidentally call generic repricing for state/evidence-only commands.

## Schema / migration coordination

Likely coordinated incremental changes include:
- hotel timezone configuration;
- no-show/extension/arrival lifecycle events;
- maintenance case `impact`, occupied open/resolve/escalate semantics and same-state event guards;
- reassignment remaining-night/history guards;
- dedicated maintenance capabilities/routes;
- Billing reconciliation support where current paid invoices can become stale after a true total increase.

Do not rewrite historical migrations. Rehearse forward migration and backfill semantics.

## Why these precede feature UI

They remove systemic blockers: near-zero JS margin, ambiguous operational day/ETA instant semantics, and generic update paths that can cause hidden pricing drift. No feature should claim operational correctness until its prerequisite invariants are available.