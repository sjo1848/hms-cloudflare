# 04A — Implementation sequencing refinement

Status: `BINDING`; supersedes the numeric order in `04-acceptance-and-sequencing.md` where different.

## Wave 0 — prerequisites

0.1 **JS headroom** — reduce total generated raw JS to `<= 300000` without raising budgets or removing accepted behavior.

0.2 **Hotel operational timezone** — persist valid IANA timezone, expose trusted context, add server helper for hotel-local date.

These may be implemented in separate small contracts. No feature UI expansion should consume the current near-zero bundle margin.

## Wave 1 — domain correctness

1.1 Reassignment remaining-night semantics + old-room turnover + source-parity repricing/invoice reconciliation.

1.2 Occupied maintenance schema/events/capabilities + checkout/reassignment vacancy behavior.

1.3 Arrival-exception parity: no-show from hotel-local arrival date, cancellation/check-in without invented calendar cutoffs, plus target command/evidence hardening.

1.4 Checked-in stay extension + source-parity repricing + invoice/payment consistency.

## Wave 2 — operational read/context

2.1 Front-desk read model: temporal classification, room readiness, maintenance blockers, deterministic priority.

2.2 Reception lifecycle UI: readiness, no-show, extension, maintenance report, reassignment consequences, next-case continuation.

2.3 Reception-selected Billing coupling.

2.4 Atomic inline guest + reservation composition.

2.5 Contextual deep links and focus/interval revalidation.

## Wave 3 — optimization and acceptance

3.1 Performance/code splitting where it improves initial load after total-budget compliance.

3.2 Keyboard/focus refinements.

3.3 Full synthetic hotel-shift simulation and product acceptance.

## Review rule

Each Wave 1 item gets its own bounded Task Contract and independent critique because each changes authoritative business state. Do not combine all P0 migrations/endpoints in one large implementation PR. Source-parity evidence is mandatory for any lifecycle or financial predicate changed by the increment.