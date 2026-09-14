# 09 — Technical prerequisites for the next workflow wave

Status: `BINDING DELIVERY GATE`

## Frontend JavaScript headroom
Accepted staging is approximately `319858 / 320000` raw JS and the budget script sums all generated JS assets. Before material new workflow UI, reduce total raw JS to `<=300000` without raising the budget or removing accepted behavior. Existing gzip/CSS/browser gates remain green.

## Operational timezone / instant foundation
Before date-sensitive P0/late-arrival behavior ships, persist server-owned valid IANA timezone, configure current Mendoza data explicitly, expose trusted context, derive hotel-local date server-side, and enforce explicit-offset RFC3339 for absolute ETA inputs. Browser/server timezone must not alter eligibility.

## Pricing / Billing foundation — D8/D9/D11
Backend update paths must distinguish priced from non-priced mutations. State/evidence-only commands never call generic repricing. Every real total change reconciles existing invoice atomically under D11.

A forward Billing migration is required before priced workflows can claim completeness:
- historical migration `0010_billing.sql` remains immutable;
- remove the legacy constraint that forbids a prior paid amount from being above a later invoice amount;
- preserve invoice status vocabulary `PENDING|PAID|VOIDED`;
- expose D11 derived Billing values through domain/API views rather than inventing a new status;
- centralize D11 reconciliation so room/date edit, reassignment, extension and extra charge cannot diverge;
- priced mutations detect an ineligible VOIDED invoice before any partial domain write.

## Other migration coordination
Incremental changes also include hotel timezone configuration; no-show/extension/arrival lifecycle events; maintenance impact/occupied semantics/capabilities; and reassignment remaining-night/history guards.

## Delivery rule
Historical migrations are never rewritten. Forward migrations/backfills are rehearsal-tested. No UI increment can claim E2E correctness before the prerequisite invariants it depends on are available.