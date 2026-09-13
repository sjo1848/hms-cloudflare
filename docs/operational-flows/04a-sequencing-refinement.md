# 04A — Implementation sequencing refinement

Status: `BINDING`; supersedes older numeric ordering where different.

## Wave 0 — prerequisites

0A **JS headroom** — reduce total generated raw JS to `<=300000` without raising budget/removing accepted behavior.

0B **Operational timezone foundation** — persist valid hotel IANA timezone; expose trusted context; add absolute-instant + hotel-local-date helpers needed by D1/D10.

No material feature UI growth before 0A. Date-sensitive/ETA work depends on 0B.

## Wave 1 — domain/accounting correctness

1.0 **Pricing-mutation boundary + Billing truth** — implement D9/D8 foundation: only explicit priced mutations change total; metadata/status-only writes preserve total; invoice reconciliation is atomic whenever total actually changes; checkout settlement uses stored authoritative total.

1.1 **Reassignment** — remaining-night semantics, history, old-room turnover, reason evidence, overrun guard, destination repricing/invoice reconciliation.

1.2 **Maintenance** — independent NON_BLOCKING/BLOCKING cases, occupied/vacant behavior, events, capabilities, boards, checkout/reassignment vacancy routing.

1.3 **Arrival/check-in exceptions** — no-show from hotel-local arrival date; cancellation/check-in without invented cutoffs; late-arrival RFC3339 ETA + hotel-local validation; terminal/arrival audit; D9 no-repricing regressions.

1.4 **Stay extension** — explicit command, added-night atomicity, source pricing, invoice/payment consistency.

Each Wave 1 item gets a bounded Task Contract and independent critique. 1.0 may be split into narrowly scoped backend contracts if needed but its invariant must precede relying on D9 in later flows.

## Wave 2 — operational read/context

2.1 Extend canonical front-desk board with operational date, deterministic priority, readiness/blockers, late arrival and maintenance context.

2.2 Reception lifecycle UI: check-in readiness, arrival exceptions/late arrival, reassignment, extension, maintenance report and post-action continuation.

2.3 Reception-selected Billing coupling.

2.4 Atomic inline guest + reservation.

2.5 Stable-ID deep links + focus/interval revalidation.

## Wave 3 — optimization / acceptance

3.1 Initial-load/code-splitting optimization after total-budget compliance.

3.2 Keyboard/focus refinements.

3.3 Full synthetic hotel-shift acceptance covering all E2E rows, financial regressions, RBAC, timezones, conflicts and contracted responsive widths.

## Review rule

Do not combine all domain changes into one PR. Every state/financially material increment gets its own Task Contract, engineering QA, independent critic and acceptance evidence. Any newly required source departure returns to definition.