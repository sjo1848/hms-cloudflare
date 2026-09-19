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
- UX-SHELL: module changes preserve one mounted application shell; protected workspaces wait for capability bootstrap before mount/fetch.
- UX-NAV-RBAC: desktop/mobile navigation visibility and canonical landing derive from server effective capabilities; frontend visibility never substitutes backend authorization.
- UX-HISTORY: meaningful filters/selection/context survive refresh and Back/Forward; contextual return restores prior scroll or selected item into view; contextual navigation cannot globally reset scroll.
- UX-TASK: one primary focused task surface at a time; multi-step work uses drawer/sheet, destructive/material confirmation uses product dialog, and native browser confirm/alert is forbidden.
- UX-DIRTY: dirty task close, Escape, Back or module exit requires discard confirmation; pristine task closes without unnecessary prompt.
- UX-BILLING-CONTEXT: Reception-embedded Billing is controlled exclusively by Reception-selected booking and cannot independently reselect another booking.
- UX-REFRESH: after initial load, revalidation keeps known data visible; stale/conflict refresh never auto-replays a state-changing command or unnecessarily loses safe operator input.
- UX-FILTER: category counts use authoritative base scope before text search; ordinary refresh/mutation preserves active filters; next item follows canonical priority when current item leaves the view.
- UX-MOTION: motion is short, functional, reduced-motion aware and never gates authoritative completion; heavy animation/component frameworks cannot bypass the raw-JS budget.
- UX-FOCUS: focused overlays move focus in and restore it on close; modal focus containment and mobile focused-task return are browser-tested.
