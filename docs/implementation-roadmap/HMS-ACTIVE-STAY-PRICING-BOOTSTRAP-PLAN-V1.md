# HMS Cloudflare — Active-Stay Pricing Bootstrap Plan v1

Status: **planning only; no migration or data mutation executed**. Authority: frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008; F0.5/F0.6. Current observed booking account stores `bookings.total_cents`; no persisted pricing-segment relation was found. Current reassignment derives a destination rate over total booking nights, which must not be mistaken for the frozen non-retroactive segmented rule.

## 1. Financial invariants

- Money is integer cents. A segment identifies the stay-night interval/rate basis and its immutable pricing provenance as defined by the frozen contract.
- Reassignment applies the destination room's current accepted rate only to remaining nights from the authoritative effective date; elapsed night economics do not change.
- Existing extra charges remain separate and unchanged. Repricing never mutates or fabricates payment entries/method/reference.
- `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)`; D11 derives remaining, credit, status and `paid_at` under its binding rules. VOIDED and ledger mismatch fail closed before domain/financial mutation.
- A bootstrap cannot infer a historical nightly price from today's room rate or derive fake segments merely to make totals appear balanced.

## 2. Inventory and classification

For each active stay, collect booking ID/tenant, check-in/out, current room, exact existing booking total and currency assumptions, invoice/status/paid, ledger entries, extra charges, booking/event history, rate history/source evidence, inventory-night claims and any existing repricing evidence. Classify:

| Class | Criteria | Treatment |
|---|---|---|
| `TRACEABLE_SEGMENTS` | Source evidence uniquely identifies historical intervals and amounts and reconciles to booking account total | Produce deterministic segment candidate with provenance; verify exact cents. |
| `TRACEABLE_AGGREGATE_ONLY` | Total is authoritative but per-night historic allocation is absent/ambiguous | Preserve aggregate; block operations needing historical allocation until policy/evidence resolves it. Do not split evenly. |
| `ACCOUNT_MISMATCH` | Booking total, invoice derivation or ledger invariant conflicts | Quarantine from bootstrap activation; reconcile through D11-authorized path only. |
| `VOIDED` | Invoice is VOIDED | Preserve; no automated repricing/activation that changes invoice state. |
| `ORPHAN_OR_CONFLICT` | Missing room/claim/rate identity or overlapping inconsistent histories | Hold out and escalate to explicit data adjudication. |

## 3. Staged bootstrap

1. Capture immutable per-tenant source digest and exact baseline aggregates (booking totals, charges, invoice columns, sum of payments, statuses, paid_at, nights).
2. Run read-only classifier and emit a row-level explainable manifest: source IDs, rule/version, classification, evidence, expected before/after cents. Nothing is written.
3. Review all class counts and independently reconcile calculations. Any unexplained amount difference stops activation.
4. Synthetic rehearsal includes check-in date boundaries, room changes, rate changes, extra charges, partial/full/overpaid accounts, VOIDED invoices, mismatch, duplicate retries, and missing history. Verify repeated execution and interruption recovery.
5. Additive forward schema/backfill only after separate implementation authorization. First write shadow segments/metadata; do not change canonical booking total or invoice during bootstrap. Compare segment + charge decomposition against existing authoritative total under approved semantics.
6. Activate per stay only when source digest is unchanged, segments are traceable and ledger/D11 checks pass. Unresolved stays remain unchanged and block repricing requiring missing history.
7. Post-activation compare each booking total, charges, invoice fields, payment rows and paid_at byte/value-equivalent to baseline; record exact row counts, checksums and provenance.

## 4. Concurrency and idempotency

- Bootstrap key `(hotel_id, booking_id, source_digest, segment_model_version)` with unique/idempotent replay.
- Bind activation to current booking/account/invoice version and source digest; concurrent repricing, payment, charge, checkout or room change aborts that row's activation.
- Do not claim cross-D1 atomicity. Each hotel operational DB has its own checkpoint; incomplete hotels remain blocked and visible.
- Any API repricing quote must bind effective date, interval, selected rate version, existing charges and account version; mutation revalidates every input at commit boundary.

## 5. Recovery, gates and questions

Pre-activation: discard shadow candidate, retain audit manifest, recompute after source changes. Post-activation: forward corrective segment with provenance and D11 reconciliation; never edit payment ledger or historical charges to force balance. Quarantine on unresolved cases.

**Development Gate:** synthetic exact-cent evidence; bootstrap idempotent; all activated stays preserve totals/invoice/ledger; no inferred historical allocation without evidence. **Critic:** independent DB/finance review. **Human Gate:** required before real-data bootstrap and for any aggregate-only historical allocation policy. **Unknown:** availability and completeness of source nightly-rate history by record; do not assume uniform availability.
