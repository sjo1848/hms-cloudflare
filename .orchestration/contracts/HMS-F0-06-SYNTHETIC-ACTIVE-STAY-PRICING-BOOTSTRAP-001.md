# Task Contract — HMS-F0-06 Synthetic Active-Stay Pricing Bootstrap

Status: `AUTHORIZED / CONTRACT FROZEN BEFORE IMPLEMENTATION`
Branch: `impl/hms-foundation-0`
F0.5 Artifact A: `0bafe4875de759869760cc4abdb08319c70e6b7a`
F0.5 Boundary B: `2be85fa0d2d9f1a4656c3b608927af33726d2062`

## Objective and authority

Implement the F0.6 synthetic/local classifier and shadow-bootstrap rehearsal defined by `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` and `docs/implementation-roadmap/HMS-ACTIVE-STAY-PRICING-BOOTSTRAP-PLAN-V1.md`, under Foundation 0 authorization and frozen Blueprint 001 / Reconciliation 007 / Final Disposition 008. This contract does not authorize inspection or mutation of real active stays, live cutover, or a product decision about aggregate-only historical allocation.

The source history inventory is unknown for real records. Only explicit provenance supplied by the synthetic fixture can establish `TRACEABLE_SEGMENTS`; a current room rate, booking aggregate, or even split is never evidence of historical nightly prices. Synthetic fixture currency/provenance must be explicit in its own inputs; no currency or source authority is inferred from target rows.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Classify each synthetic checked-in booking with explainable source-backed status. | **PROPOSED NEW SURFACE:** `scripts/migration/active-stay-pricing-bootstrap.mjs`; **PROPOSED NEW SURFACE:** explicit F0.6 synthetic fixture and directed classifier tests. Existing `scripts/migration/{migration-core,rehearse,reconcile}.mjs` are inspected references, not assumed to implement F0.6. | Emit a canonical, versioned, row-level manifest with tenant/booking identity, class, reasons, source-evidence references, source digest, explicit currency basis, baseline cents/account and D11 checks, candidate cents only when traceable. Classifier phase is read-only. | Five-class synthetic matrix; assert exact manifest/hash and zero writes to all D1 tables. Current-rate-only case must never become traceable. |
| Preserve all existing operational pricing/account truth while storing a separate shadow candidate. | **PROPOSED NEW SURFACE:** forward migration `apps/api/schema/hotel-migrations/0026_active_stay_pricing_bootstrap_shadow.sql` (exact filename provisional until migration inventory); candidate/run/checkpoint tables separate from `booking_pricing_segments`. Existing read surface `apps/api/src/modules/billing/d1-stay-pricing.ts` must continue reading only operational segments. | Shadow rows are not visible to booking pricing projection/quotes. No shadow write changes `bookings.total_cents`, invoice, charges, payment entries, room/inventory claims, booking lifecycle state, or the operational pricing version/token. | Executing-D1 before/after snapshots for booking, room, exact inventory keys, segments, charges, invoice, complete payment rows/paid_at, and quote projection; quote stays unchanged before activation. |
| Bootstrap only a traceable, internally consistent synthetic stay candidate. | **PROPOSED NEW SURFACE:** isolated synthetic activation/rehearsal helper and D1 tests; forward migration may add a bootstrap-evidence branch to the `0025` segment insert guard only when exact candidate provenance/source digest is in `ACTIVATING` state. The normal F0.5 current-room pricing-version guard remains unchanged. | Explicit evidence covers every date in `[check_in, check_out)` exactly once, all room assignments/rate intervals are source-backed, integer-cent lodging plus unchanged existing charges equals the existing booking total, D11 invoice/ledger truth is valid, invoice is not VOIDED, and source digest/snapshot remains exact. Historical source rate version is recorded as source provenance and is not replaced with today's target room version. Rehearsal never changes booking total/invoice/charges/payments/room/inventory/lifecycle. Any activation into canonical segment storage is permitted only in a disposable synthetic D1 and must be a single guarded D1 business transaction; candidates never become operational quote input before that transaction commits. | Synthetic traceable segment activation with an explicit historical rate version that differs from the current room version, plus exact canonical segment projection; failure injection at each batch write proves rollback; ordinary F0.5 quote/mutation guard remains tested; real API quote before/after maintains expected source truth. |
| Quarantine unsupported or unsafe cases without false activation. | Classifier, shadow manifest and per-hotel rehearsal report. | Primary classes: `TRACEABLE_SEGMENTS`, `TRACEABLE_AGGREGATE_ONLY`, `ACCOUNT_MISMATCH`, `VOIDED`, `ORPHAN_OR_CONFLICT`. Missing/overlapping rate evidence, unresolved room/claim identity or conflicts hold the stay. Aggregate-only totals remain unchanged; no averaging/current-rate inference. VOIDED remains VOIDED. Report retains secondary blockers when a row meets multiple conditions. | Fixtures for each class and overlapping blockers; exact no-write snapshots; exact class counts/checksums; no row silently omitted. |
| Provide per-hotel digest-bound replay and interruption recovery. | **PROPOSED NEW SURFACE:** F0.6 run/checkpoint/candidate storage and explicit runner requiring caller-owned `--persist-to`; existing F0.3 checkpoint test is only a pattern. | Idempotency key `(hotel_id, booking_id, source_digest, segment_model_version)`. Same unchanged input resumes/replays deterministically. Changed digest/version or mutable booking/account/invoice/charge/payment/inventory state conflicts and cannot activate stale shadow data. No cross-D1 atomicity claim; incomplete hotel remains blocked. | Injected interruption before and after shadow checkpoint; restart through recovery branch; identical replay; changed-input rejection; two synthetic hotel DB isolation; owned temp D1 only. |
| Bind any canonical synthetic activation to stable, exact source and account truth. | Existing `booking_pricing_segments`, D11 triggers, room/booking version guards; additive forward migration only if necessary. | Snapshot includes booking status/room/date/total/pricing version, exact room-night key set, every extra-charge ID/value, invoice ID/status/amount/paid_at, ordered payment IDs/amount/method/reference/timestamps and sum, and source-evidence digest. Concurrent booking/room/account/charge/payment/inventory/checkout mutation fails closed. Preserve total and every preexisting financial value. | Executing-D1 winner/stale races; equal-count altered-keyset test; rate/version and source-digest ABA; zero drift/event assertions; complete baseline comparison. |

## Classifier contract

The fixture describes only `CHECKED_IN` stays. The classification rules are:

- `TRACEABLE_SEGMENTS`: explicit provenance uniquely covers the entire `[check_in, check_out)` interval with non-overlapping, gap-free room/rate intervals, explicit source references and explicit fixture currency; exact lodging cents plus existing extra-charge cents equals current booking total; invoice amount/status and paid ledger satisfy D11; room-night claims match the stay. Produce a deterministic shadow segment candidate with provenance.
- `TRACEABLE_AGGREGATE_ONLY`: booking/account total and D11 truth are internally consistent but complete historical per-night/room/rate allocation evidence is absent or ambiguous. Preserve aggregate; no candidate activation.
- `ACCOUNT_MISMATCH`: booking total, charges, invoice derivation/status, or paid amount/payment ledger disagree, or required invoice/account truth is missing. Quarantine; do not repair via bootstrap.
- `VOIDED`: invoice is VOIDED. Preserve state; no bootstrap activation or repricing. Other inconsistencies remain in a secondary `blockers` field.
- `ORPHAN_OR_CONFLICT`: missing/foreign room identity, duplicate or overlapping stay-night claims, conflicting provenance, malformed intervals, or other unresolved identity/history conflict. Hold for later explicit adjudication.

Class precedence must be deterministic and preserve secondary findings: identity/interval conflict is `ORPHAN_OR_CONFLICT`; otherwise VOIDED is `VOIDED`; otherwise account/D11 inconsistency is `ACCOUNT_MISMATCH`; consistent but incomplete history is `TRACEABLE_AGGREGATE_ONLY`; only fully evidenced and reconciled rows are `TRACEABLE_SEGMENTS`. The class affects synthetic rehearsal only and does not establish real-data policy.

## Mutation, atomicity and isolation rules

- The classifier performs no database writes. Shadow persistence is separate from operational pricing tables and must not influence quote/reassignment reads.
- For synthetic activation, capture per-hotel baseline/digest and revalidate the complete current snapshot inside the guarded D1 batch. Do not treat a JavaScript post-commit check as rollback.
- A D1 batch must either append all authorized canonical synthetic segment rows plus exact activation provenance/checkpoint, or leave all target rows unchanged. Candidate rows cannot authorize themselves; the activation path must validate manifest digest and exact segment payload against persisted shadow evidence.
- Per-hotel checkpoints and local databases are isolated. Never claim cross-hotel transactional atomicity.
- No write, read query, fixture, CLI default, or migration runner may target configured customer/default persistent Wrangler state. Require an explicitly owned temporary persistence path for the regression entry point and prove process/temp cleanup.
- No generic product API, frontend, permissions, booking status, payment/invoice mutation, payment-entry fabrication, charge recreation, price inference, live cutover, or source-of-truth change.

## All-registry invariant classification

| Invariant | Classification | Evidence obligation |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Shadow/run checkpoint exact winner, stale snapshot, replay and injected late rollback; no partial activation. |
| INV-AUDIT-001 | APPLIES | Each activated synthetic stay has one correlated provenance/checkpoint record; classifier/quarantine/rejected activation has no canonical financial/lifecycle side effects. |
| INV-DOMAIN-001 | APPLIES | Only CHECKED_IN synthetic stays enter classifier; no lifecycle/status change; canonical segment activation is separately guarded. |
| INV-TENANT-001 | APPLIES | Independent hotel D1 fixtures/checkpoints; foreign/missing tenant identity fails closed, no cross-tenant candidate or event. |
| INV-RBAC-001 | N/A | No product HTTP route or user capability surface is added; runner is local synthetic-only and requires explicit temp persistence. Reassess if any API is introduced. |
| INV-PARITY-001 | APPLIES | Historical rates require explicit source evidence; no current-rate inference, even split, or target convenience mapping. |
| INV-ENUM-001 | APPLIES | Classification/checkpoint values are closed, versioned sets validated at input and persisted output. |
| INV-UX-001 | N/A | No operational UI is changed. Manifest is migration evidence, not a new hotel workflow/UI. |
| INV-ORDER-001 | N/A | No queue ordering or next-case behavior changes. |
| INV-RESP-001 | N/A | No frontend or responsive surface changes. |
| INV-EVID-001 | APPLIES | Every class/count/activation claim maps to synthetic fixture, source digest, exact command/exit, report and complete snapshots; distinguish synthetic from real. |
| INV-LEGACY-001 | APPLIES | Never synthesize historical pricing provenance; unresolved aggregate-only/orphan cases remain held and unchanged. |
| INV-MONEY-001 | APPLIES | Integer cents and safe bounds; before/after booking/charges/invoice/payment rows/paid_at exactly equal; D11 truth. |
| INV-STATE-001 | APPLIES | Immutable Artifact A then orchestration-only Boundary B with exact A SHA; external review required, resume disabled; no self-SHA. |
| INV-CF-I07-001 | N/A | No admin/audit/network protected route changes. |
| INV-CF-I07-002 | N/A | No role/plan administrative mutation. |
| INV-CF-I07-003 | N/A | No role downgrade behavior. |
| INV-CF-I07-004 | APPLIES | Synthetic migration/browser/test runners use owned temp state and verify subprocess cleanup before PASS. |
| INV-CF-I08-001 | N/A | No report arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report dates/series. |
| INV-CF-I08-004 | N/A | No room or booking status values added or changed. |
| INV-CF-I08-005 | N/A | No operational effective-date predicate is introduced; exact explicit historical date intervals are validated as source evidence. |
| INV-SCOPE-001 | APPLIES | F0.6 only; no real data, live cutover, F0.7, Blocks A–H, unrelated UI/API, or promotion. |

## Validation and gate

Required: targeted classifier unit tests; clean Wrangler migration chain through F0.6 on unique temporary D1; executing-D1 classifier/shadow/activation, D11 snapshots, interruption/replay/digest drift, concurrency and rollback; synthetic per-hotel isolation; `npm run check`; types/build/architecture/budgets/query plans/Wrangler dry-runs; applicable CF-I03–06 regressions; `git diff --check`; invariant evidence; mandatory Pre-Critic Gate. No test command may default to a persisted user DB.

Development acceptance requires exact five-class manifest evidence; zero writes in classify-only mode; shadow invisibility to quote/reassignment; replay/restart without duplicate candidates/segments; stale source conflicts with zero canonical drift; any traceable synthetic activation preserves booking total, charges, complete invoice/payment/paid_at state, room/inventory/lifecycle; unresolved classes remain unchanged; all tests and migration chain are reproducible. A fresh Independent Critic reviews exact A+B before F0.7.

Human Gate: required before real-data inventory/bootstrap/cutover and any aggregate-only historical allocation policy. No such action is part of this task. No ROADMAP_BLOCKER is declared for synthetic implementation; real-source history coverage remains UNKNOWN and deferred.
