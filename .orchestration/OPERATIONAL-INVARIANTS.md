# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT`

- ROOM: occupied vacancy becomes DIRTY or MAINTENANCE, never directly AVAILABLE.
- AVAIL: physical state, future sellability and immediate readiness are distinct.
- MAINT: NON_BLOCKING preserves physical state; BLOCKING prevents new occupancy; v1 has one open case per room.
- NOSHOW: eligible CONFIRMED from hotel-local arrival date; release inventory; room unchanged.
- TIME: genuine date predicates use server hotel-local date; D10 owns late-arrival instant semantics.
- HISTORY: reassignment moves only remaining nights and preserves elapsed room history.
- OVERRUN: checked-in overrun must extend or checkout before reassignment.
- EVIDENCE: material reasons and notes are enforced by backend.
- PRICING: D9 exclusively defines which operations may alter booking total.
- BILLING: D11 in `docs/operational-flows/20-intentional-target-departures.md` is the single reconciliation invariant for every priced command. No command may implement a different outcome or rejection rule.
- LEDGER: after every successful payment or reconciliation, `invoice.paid_amount_cents` equals the sum of immutable payment entries for that invoice. Repricing creates no payment row, changes no payment row and fabricates no payment method/reference.
- RECONCILE-AUDIT: price reconciliation is audited distinctly from payment receipt; ledger mismatch or VOIDED state fails closed before priced domain mutation.
- CHECKOUT: settlement uses authoritative Billing and cannot bypass D11/ledger validity.
- CONTEXT: Reception-selected booking governs embedded Billing.
- REVALIDATE: stale previews yield conflict plus authoritative reload.
- RBAC: maintenance/cleaning permissions follow `05-maintenance-data-rbac.md`.
- FRONTDESK: board requires bookings.read under the canonical role map.
- API: `19-api-command-contract-map.md` owns routes, payloads, capabilities and side effects; no shadow/direct-state shortcut.
- CONTRACT: additive API/Billing fields must be represented in OpenAPI/client types before browser acceptance.
- DEPARTURE: only `20-intentional-target-departures.md` authorizes source divergence.