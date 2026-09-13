# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT`

- **ROOM-001:** occupied room never becomes AVAILABLE directly on checkout/reassignment; vacancy is DIRTY or MAINTENANCE when blocking maintenance remains.
- **AVAIL-001:** physical state, future sellability and immediate readiness are distinct.
- **MAINT-001:** maintenance impact is `NON_BLOCKING | BLOCKING`, independent from priority/state.
- **MAINT-NB-001:** NON_BLOCKING may coexist with OCCUPIED, AVAILABLE, DIRTY or CLEANING; open/resolve keeps physical state unchanged and adds no independent sale/readiness block.
- **NOSHOW-001:** eligible CONFIRMED only when `hotel_local_date >= check_in`; inventory released; room unchanged; no automatic money policy.
- **LATE-001:** late arrival is context on CONFIRMED, not lifecycle; future ETA inside stay + note min 6/max 250; actor/time/audit; no room/inventory/total/invoice mutation.
- **ETA-WIRE-001:** late-arrival ETA must be RFC3339/ISO-8601 with explicit `Z` or numeric offset. Server parses an absolute instant, converts it to hotel IANA timezone and validates hotel-local date inside `[check_in,check_out)`. Timezone-less input is rejected; browser timezone cannot authorize eligibility. This is D10.
- **EXTEND-001:** extension, added-night claims, repricing, invoice reconciliation and audit succeed/fail atomically.
- **CONTEXT-001:** Reception-selected booking governs embedded Billing.
- **REVALIDATE-001:** every write revalidates authoritative state; stale previews yield conflict+refresh.
- **TIME-001:** genuine date predicates use server hotel-local date; timezone correction cannot invent check-in/cancellation cutoffs.
- **HISTORY-001:** reassignment moves only remaining nights; elapsed nights retain actual room history.
- **OVERRUN-001:** checked-in stay with `hotel_local_date >= check_out` must extend or checkout before reassignment.
- **EVIDENCE-001:** backend enforces terminal reason min 6, reassignment reason min 6, maintenance escalation/resolution note min 6 and late-arrival note min 6.
- **PRICING-BOUNDARY-001:** only explicit pricing mutations may change booking total: room/date changes, reassignment, extension, extra charges or future expressly priced commands. Guest/name/ordinary notes-only edits, check-in, cancellation, no-show, late arrival and checkout preserve stored total. Checkout may alter invoice/settlement state against that total but cannot reprice accommodation. This is D9.
- **PRICE-001:** when a room/date pricing mutation occurs, use the accepted current-selected-room pricing rule plus extras unless superseded by future decision.
- **BILLING-001:** any authoritative total change reconciles existing invoice atomically; payments remain immutable evidence.
- **CHECKOUT-001:** `settled` means fully paid; positive balance requires `pending-approved`, accepted reference and admin-only override.
- **RBAC-001:** maintenance: admin/ops/housekeeping read-report-resolve; receptionist read-report/escalate but not resolve; saas_admin none. Cleaning remains `housekeeping.write`.
- **MAINT-READ-001:** room maintenance detail uses `maintenance.read`; no case returns null.
- **FRONTDESK-READ-001:** front-desk board requires `bookings.read`; admin/ops/receptionist allowed, housekeeping/saas_admin denied.
- **API-001:** `19-api-command-contract-map.md` owns routes/payloads/capabilities/pricing/date-time effects; no shadow/direct-status shortcut.
- **COMPAT-001:** legacy `/housekeeping/:id/dirty` is only a compatibility alias for historical blocking maintenance resolution.
- **CONTRACT-001:** additive API surface must be represented in OpenAPI/client types before browser acceptance.
- **DEPARTURE-001:** source divergence is authorized only by `20-intentional-target-departures.md`; otherwise BUILD stops and returns to definition.
- **POLICY-001:** BUILD cannot invent refund/penalty/retention, contracted-rate migration or unsupported commercial automation.