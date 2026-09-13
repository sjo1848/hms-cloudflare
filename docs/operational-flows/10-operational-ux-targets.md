# 10 — Operational UX acceptance targets

Status: `BINDING PRODUCT TARGETS`

The workflow pass succeeds only if primary hotel work completes without unnecessary module switching while preserving backend safety.

## Zero-required-switch primary paths

From Reception:
- normal check-in;
- normal checkout with authoritative embedded Billing context;
- in-stay room reassignment;
- report/escalate occupied-room maintenance;
- new reservation with existing or inline-created guest;
- checked-in stay extension with availability/pricing/balance preview;
- cancellation/no-show when eligible;
- record/rerecord late-arrival ETA/note.

From Housekeeping:
- dirty -> cleaning -> available;
- maintenance inspect/resolve where role permits.

Cross-module links remain available for inspection/specialist work but are not mandatory detours for the primary flow.

## Operator-memory rule

If HMS already knows guest, booking, room, balance, readiness, maintenance blocker, selected case, operational date or late-arrival context, the operator must not re-enter/reselect it solely because another component owns it internally.

## Pricing transparency

State/evidence-only actions under D9 (check-in, cancellation, no-show, late arrival, checkout, metadata-only booking edits) must not display a fabricated price delta. Pricing-affecting actions (room/date edit, reassignment, extension, extra charge) show resulting total/balance before confirmation where material.

## High-risk confirmations

Explicit confirmation remains appropriate for no-show, cancellation, checkout/release, room reassignment, BLOCKING maintenance consequences/relocation and irreversible cash/financial actions. Low-risk metadata such as late-arrival recording should not be burdened with unrelated lifecycle confirmations.

## Post-action continuity

After action: authoritative refresh; filters/search stable; item changes according to state; next case follows operational priority; conflict explains what changed and refreshes affected context.

## Simulation measurements

Record module switches, confirmations, duplicate entry, re-selection of known entities, stale conflicts and whether next action is evident. No arbitrary click-count KPI; optimize unnecessary context switching/redundant input without removing safety confirmations.