# Task Contract — HMS-F0-05 Segmented Reassignment Pricing

Status: `AUTHORIZED / CONTRACT FROZEN BEFORE IMPLEMENTATION`
Branch: `impl/hms-foundation-0`
Baseline: F0.4 Artifact A `69bd08b8fd194a9565b426b66f03ff638993304f`, Boundary B `a5326be2695b7a4cff0ad24cff784d5fc4c516cc`; current orchestration continuation commit `570dc5a8b0061faab45b5b46a86a66f0b3e2c2a3`.

## Objective and authority

Implement F0.5 of `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` under the approved Foundation 0 authorization and the frozen Blueprint 001, Reconciliation 007 (including Amendment C), and Final Disposition 008. Persist non-retroactive lodging-price segments; price only the remaining stay interval on reassignment using the destination room's current authoritative rate; preserve consumed-night prices, existing extra charges, D11 reconciliation, immutable payment ledger, audit provenance, and the shared quote/commit contract.

F0.5 depends on F0.2 and F0.4. The exact effective interval remains `[max(check_in, hotel_local_date), check_out)`. F0.6 owns the active-stay pricing bootstrap/classifier. Work is local and synthetic only.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Store a traceable, deterministic lodging price basis by stay-night interval. | **PROPOSED NEW SURFACE:** additive hotel migration and append-only pricing-segment persistence/read model. Existing booking/lifecycle repositories consume it. | Segments use integer cents, half-open intervals bounded by the stay, immutable provenance, unique operation identity and deterministic latest-effective pricing per night. No gaps/out-of-stay coverage for a supported priced stay. | Executing-D1 schema/constraint tests; exact ordered per-night projection and provenance assertions; denied mutation of historical segments. |
| Establish segment basis for newly created or edited CONFIRMED bookings. | Existing `apps/api/src/modules/bookings/d1-booking-repository.ts`, `apps/api/src/routes/bookings.ts`; booking create/update tests. | A new confirmed booking has exactly one initial priced interval. A valid edit replaces/revises the entirely unconsumed reservation interval atomically with booking dates/room/claims/total. Generic edit remains limited to CONFIRMED; CHECKED_IN changes use lifecycle commands. | Executing-D1 create/edit, overlap/conflict, injected rollback tests; route/domain negative test for non-CONFIRMED edits. |
| Reassign without repricing consumed nights. | Existing `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/routes/lifecycle.ts`, F0.4 migration/event guards; **PROPOSED NEW SURFACE:** shared pricing quote/domain code and quote fields/API response. | Quote and command use `[effective_date, check_out)` and the same authoritative calculation. Earlier nights and their effective rates remain unchanged across repeated reassignment. Destination rate is the rate version captured for this operation. | Multi-reassignment D1 fixtures with exact per-night values, local-date boundaries, destination rate changes and quote/persisted parity. |
| Keep booking account total equal to effective lodging segments plus existing charges. | Existing `apps/api/src/modules/billing/d1-payment-repository.ts`, `apps/api/src/modules/billing/domain.ts`, migrations 0010/0019; **PROPOSED NEW SURFACE:** forward D1 segment/rate-version migration and guarded reconciliation operation. | `bookings.total_cents = effective lodging segment cents + SUM(existing extra_charges.amount_cents)`. Charges remain distinct, same IDs/values; no charge recreation. D11 alone derives invoice amount/status/paid_at from booking total and immutable payment ledger. | Exact-cent arithmetic and complete before/after snapshots of booking, segments, charges, invoice, payment rows and financial events. D11 four-scenario regression stays green. |
| Make preview and commit one quote/version contract. | Existing `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/lifecycle.ts`, reception API/UI; **PROPOSED NEW SURFACE:** authoritative quote function/typed response and any narrowly required preview endpoint. | Quote binds booking/status/current assignment, effective interval, destination, room rate + monotonic pricing version, segment/account/charge state, invoice and ledger truth. Command validates/recomputes those same inputs inside the atomic write boundary. Stale/ABA input returns conflict with zero drift. | API+executing-D1 quote/command parity, rate-away-and-back ABA, booking/room/account staleness, replay and concurrent winner tests; integrated local Worker+D1 browser only if changed UI needs it. |
| Fail closed for unsupported historical basis and unsafe billing states. | Existing lifecycle/billing guards and D11; F0.6 classifier boundary. | No historical prices inferred from current rates. An active stay without an explicitly traceable segment basis is not silently activated or repriced; F0.6 owns bootstrap. VOIDED invoice, missing/inconsistent D11 state or paid-ledger mismatch rejects before durable changes. Payment entries are never inserted/updated/deleted by repricing. | Synthetic aggregate-only/unresolved fixtures; VOIDED/mismatch zero-write tests; exact unchanged ledger assertions. No real-data reads or writes. |

## Explicit technical model constraints

- Keep `bookings.total_cents` as the existing D11-reconciled Booking Account/Folio total; the segment projection is lodging only, and extra charges remain separate account movements.
- Use append-only pricing-operation/segment history with unique server-issued operation identity. A later authorized operation can supersede pricing only from its effective start; it cannot rewrite consumed history. Quote/request IDs supplied by clients are correlation only, never proof of mutation winner.
- Add a distinct monotonically increasing room pricing version, incremented atomically when `price_cents` changes. Do not reuse `room_state_version`. Same displayed rate after an away-and-back edit is stale if the version advanced.
- Validate safe integer-cent multiplication/addition and D1 integer bounds; fail closed on overflow.
- Reassignment segment append, booking total, D11-triggered invoice reconciliation, financial reconciliation event, booking/room/inventory changes and lifecycle event are one atomic business operation. A late guard must abort the D1 batch; post-commit JavaScript checks cannot claim rollback. Do not assume `meta.changes===1` where triggers inflate it.
- Event rows identify actor, hotel, request trace, quote/operation identity, old/new totals, segment delta and effective interval. Exactly one intended event set on success, none on rejection/replay conflict.
- Booking creation and CONFIRMED edit must maintain the segment basis if segment sums are authoritative for totals. They may not edit CHECKED_IN/terminal state through generic PATCH.
- Do not expose preview amounts that are independently calculated in UI. The response quote is the authority; frontend can format it only.

## Non-goals / forbidden

- No F0.6 historical active-stay bootstrap/classification execution; no reconstruction of ambiguous or aggregate-only legacy nightly history.
- No customer/production data access or mutation, real cutover, PR, push, merge, `main`, `acceptance/staging`, deploy, production, or Blocks A–H.
- No payment-entry writes, fabricated payments/method/reference, extra-charge recreation/reclassification, elapsed-night repricing, second financial source of truth, new invoice states, or changes to historical migrations 0010/0019/0021/0024.
- No unrelated billing, reception, cash/shift or UI redesign. Only the minimum UI/API quote integration explicitly required by F0.5 contract.

## Concurrency, idempotency and failure matrix

| Adversarial condition | Required result |
|---|---|
| Two identical quote commands race | At most one business operation wins; exact quote/operation persistence proves winner; loser has no partial state/events. A same-token identical replay may return the original result only if the idempotency contract can prove it; otherwise conflict. |
| Same operation token with changed payload | Conflict; no new segment, charge, payment, invoice drift, inventory or event. |
| Room rate changes after preview, including away-and-back to same cents | Conflict using monotonic pricing version; exact zero drift. |
| Booking room/date/status, room state, inventory exact key set, segments, charges, invoice or payment ledger changes after preview | Conflict; do not trust equal counts/visible values; exact set/version/truth checks and zero drift. |
| VOIDED invoice or ledger mismatch | Reject before durable domain/financial mutation; all snapshots unchanged. |
| Failure injected after segment append, booking update/D11 trigger, or event guard | D1 atomic rollback across financial, booking, room, claim and audit rows. |
| Retry after lost response | Unique operation identity prevents duplicate segments/events; result is deterministic and payload-bound. |
| Existing active stay has no authoritative segmented pricing basis | Fail closed; do not infer. F0.6 handles synthetic classification/bootstrap; no real rows touched. |

## All-registry invariant classification

Every registry invariant is classified here before implementation; acceptance is mapped above and each applies to implementation/evidence as specified.

| Invariant | Classification | Contract evidence obligation |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Stale/ABA, exact inventory key set, zero-row, concurrency and injected late rollback; no false success. |
| INV-AUDIT-001 | APPLIES | Exact-once correlated financial/lifecycle events on winner; zero events on every rejection/replay conflict. |
| INV-DOMAIN-001 | APPLIES | Repricing only through lifecycle command; generic booking update remains CONFIRMED-only; bypass scan + API rejection tests. |
| INV-TENANT-001 | APPLIES | Tenant-routed quote/command and foreign/unknown ID zero-drift tests across operational D1s. |
| INV-RBAC-001 | APPLIES | Existing reassignment capability remains backend-authoritative; authorized success and denied mutation with authenticated membership/role setup. |
| INV-PARITY-001 | APPLIES | Frozen non-retroactive pricing and D11 mappings, positive/negative regressions; no target convenience policy. |
| INV-ENUM-001 | N/A | F0.5 adds no cross-representation enum predicate; status predicates continue using canonical target values. Reassess if new status serialization is introduced. |
| INV-UX-001 | APPLIES | Quote/consequence belongs in existing Reception reassignment task; no unrelated journey redesign; targeted integrated proof if UI surface changes. |
| INV-ORDER-001 | N/A | Pricing does not change operational queue ranking/next-item selection; verify diff does not touch it. |
| INV-RESP-001 | APPLIES | If Reception quote UI/API changes, execute material quote/confirmation at contracted desktop and mobile widths; API-only evidence does not claim UI parity. |
| INV-EVID-001 | APPLIES | Every state/evidence claim points to named executable test/run/log and distinguishes synthetic/local from real data. |
| INV-LEGACY-001 | N/A | No legacy recovery record is synthesized; unresolved history fails closed and bootstrap remains F0.6. |
| INV-MONEY-001 | APPLIES | Integer cents, safe bounds, D11/ledger invariants, stale/concurrent/injected rollback and exact account snapshots. |
| INV-STATE-001 | APPLIES | Immutable Artifact A then orchestration-only Boundary B with exact A SHA and independent review required; no self-reference. |
| INV-CF-I07-001 | N/A | No admin/audit/network authorization surface is changed. Existing canonical capability authority remains in use. |
| INV-CF-I07-002 | N/A | No role/plan admin mutations in scope. |
| INV-CF-I07-003 | N/A | No role downgrade path in scope. |
| INV-CF-I07-004 | APPLIES | Any integrated regression runner that starts Worker/Vite/browser owns cleanup and proves process absence before PASS. |
| INV-CF-I08-001 | N/A | No reporting/ADR/RevPAR arithmetic in scope. |
| INV-CF-I08-002 | N/A | No network aggregation in scope. |
| INV-CF-I08-003 | N/A | No report date/state query in scope; hotel-local effective date follows F0.4. |
| INV-CF-I08-004 | N/A | No new room/booking status values are introduced. |
| INV-CF-I08-005 | APPLIES | Effective date uses the authoritative request hotel-local date; deterministic clock fixtures cover boundaries and date transition. |
| INV-SCOPE-001 | APPLIES | Keep F0.5 separate from F0.6 and Blocks A–H; scope audit and changed-path review. |

## Validation and gates

Required: directed domain and executing-D1 tests; full `npm run check`; `npm run types:check`; `npm run web:build` if web changes; architecture fitness/budgets; D1 critical query plans; Wrangler clean local migration dry-run/rehearsal; applicable CF-I03/04/05/06 financial/lifecycle regressions; API route uniqueness/security/tenant tests; integrated Worker+D1/browser at desktop/mobile if user-visible quote changes; exact migration-chain replay from fresh disposable persistence; `git diff --check`; invariant evidence and mandatory Pre-Critic Gate.

Development acceptance requires all of the following: exact per-night segment projection and quote/commit equality; existing extra charges unchanged; booking total equals lodging segments plus charges for supported seeded stays; D11 invoice/payment truth preserved; VOIDED/mismatch/stale/ABA cases fail closed with zero drift; atomic rollback and exactly-once events proven; migration chain applies through Wrangler; no unresolved contract contradiction or regression attributable to F0.5. Passing commands alone is insufficient.

After Pre-Critic and invariant evidence pass, publish immutable Artifact A and orchestration-only Boundary B, then stop for a fresh Independent Critic. Codex cannot declare substantive F0.5 PASS. A reviewer is specifically required to inspect segment arithmetic, D11/extra-charge interaction, transaction guards and migration behavior. Following accepted F0.5 review, continue to F0.6 under the approved DAG; do not begin Blocks A–H.

## Authority review

- Contract Reviewer: Chandrasekhar, GPT-6 Luna Medium, read-only; found no ROADMAP_BLOCKER or product-policy ambiguity. Recommendation incorporated: confirmed create/edit must establish the segment basis if segment totals are authoritative.
- DB/Finance Reviewer: Epicurus, GPT-6 Luna Medium, read-only; reviewed D11 triggers, batch winner proof, trigger-inflated changes, pricing ABA and complete rollback cases. No policy contradiction; technical design recommendations are represented above.
- These internal reviews are not Independent Critic acceptance.

## Open boundary

Historical rate evidence for existing checked-in stays remains unresolved by stay and belongs to F0.6/bootstrap and its separate data-risk authorization. This contract authorizes only synthetic fixtures and does not decide real-data adjudication.
