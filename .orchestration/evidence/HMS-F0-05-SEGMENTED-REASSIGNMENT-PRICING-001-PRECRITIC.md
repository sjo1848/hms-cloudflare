# HMS-F0-05 — Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001.md`
Invariant evidence: `.orchestration/evidence/HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001-INVARIANTS.md`
Scope: F0.5 segmented stay pricing plus one bounded correction required by the inherited shared-room atomicity regression.

## 1. Contract completeness

- F0.5 contract frozen before implementation; all 24 registry invariants classified.
- Separate bounded repair contract exists for the CF-I05 audit race; no product-policy choice or roadmap blocker is introduced.
- F0.6 remains the only owner of synthetic legacy active-stay bootstrap/classification. Real booking history is untouched.

## 2. Source parity / domain surface

- Reassignment preview and command use the F0.4 hotel-local effective date and half-open remaining interval `[max(check_in, hotel_local_date), check_out)`.
- Quote is API-authoritative; UI only formats its integer-cent values. Destination current rate/version is bound to the operation.
- Lodging segments remain separate from existing extra charges; Booking Account/Folio total remains the D11 input; payment entries are not fabricated or edited.
- No new booking/invoice/room status or user-facing workflow was added. Housekeeping repair preserves existing state transition predicates and only prevents a stale loser from persisting an event.

## 3. Mutation/concurrency sweep

- F0.5 D1 write boundary covers segment append, booking total, D11 invoice reconciliation, room/inventory changes and financial/lifecycle audit. Quote binds versions and exact claim/charge/ledger snapshots.
- Executing-D1 tests cover upward/downward repricing, repeated reassignment, hotel-local interval, rate-away-and-back ABA, exact source/destination keysets, same-operation/shared-destination concurrency, payment-after-quote, ledger mismatch, VOIDED invoice and injected final-event rollback.
- CF-I05 exposed a real inherited shared-room defect: the conditional room update was followed by an unconditional housekeeping audit insert. The stale concurrent caller returned 409 after committing a second event. Repair now makes the event an `INSERT … SELECT` conditioned on the target room version/state and absence of an event for that room/type/version; no SQLite `changes()` dependency. Directed executing-D1 race and CF-I05 now pass with one transition/event.
- Initial browser assertion raced React state publication by waiting for only the board response while board/room/guest loads run in parallel. Replaced it with a state-based UI condition; real API persistence and visible room are both asserted. No arbitrary sleep, inflated timeout, or retry was added.

## 4. Security sweep

- Tenant routing and capabilities remain backend authoritative. Integrated fixture proves foreign booking not-found under the selected tenant and authorized local reassignment.
- No authorization boundary or identity mapping was weakened. Existing suite and integrated API checks retain tenant and capability negative paths.

## 5. UI / responsive sweep

- Reassignment quote and delta are shown in the existing Reception task; no mock-only evidence is used for the acceptance claim.
- Worker+D1+Vite browser run proves desktop quote/success refresh, BLOCKING rejection, NON_BLOCKING advisory/elegibility, reason minimum, destination pricing, persisted invoice/segments/inventory/events and payment-ledger preservation; mobile 375px stale 409 keeps context and refreshes authoritative state.
- The row assertion waits for the authoritative room to render after the complete queue load; it does not infer UI freshness from an API response alone.

## 6. Evidence claim audit

| Claim | Executable evidence |
|---|---|
| Pricing segments and quote equal committed remaining-stay price | `apps/api/src/modules/lifecycle/reassignment-interval.executing-d1.test.ts`; `scripts/cf-wave12-reassignment-integrated.sh` |
| D11 status/paid time/ledger/extra-charge preservation | `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`; `scripts/cf-i06-regression.sh` |
| Reassignment success, conflict and visible refresh | `scripts/cf-wave12-reassignment-integrated.sh`; screenshots under `output/playwright/` are diagnostic only |
| One event for one shared-room winner | `apps/api/src/modules/room-state/shared-room-commands.executing-d1.test.ts`; `scripts/cf-i05-regression.sh` |
| Build/type/budgets/query plans/Wrangler | recorded command outputs from this validation run; see final exact gate ledger in `.orchestration/STATE.md` |

## 7. Full regression and scope

- `npm run check`: PASS, 31 files / 133 tests.
- `npm run types:check`: PASS.
- `npm run web:build`: PASS; JS raw 296,651 bytes / 300,000 ceiling; gzip 86,095 bytes.
- `npm run architecture:fitness`: PASS, boundaries/i18n/budgets.
- `npm run test:d1-query-plan`: PASS.
- `npm run wrangler:dry-run`: API and Web PASS; no deployment.
- CF-I03 and CF-I04: PASS; CF-I05: initially exposed duplicate-event defect, then PASS after repair; CF-I06: PASS on isolated temp D1.
- `scripts/cf-wave12-reassignment-integrated.sh`: PASS, exit 0; fresh local Wrangler Worker, disposable D1, Vite and desktop/mobile browser.
- No remote or real data access, live cutover, production migration, push, PR, merge, staging, deploy or Blocks A–H.
- The migration chain is applied by the integrated runner to fresh disposable D1 for all configured local databases. Existing synthetic F0.3 digest assertions and CF-I06 pass after the additive F0.5 migration.

## 8. Findings and disposition

| Finding | Disposition |
|---|---|
| F0.4 migration 0024 originally failed Wrangler `incomplete input` | Previously corrected with equivalent trigger predicates; clean Wrangler chain is exercised by current integrated runner. |
| D1 booking batch reports trigger-inflated changes (`[1,2,1,1]`) | Preserved as known behavior; no exact-one assumption or `changes()` causal chain reintroduced. |
| Browser success row initially displayed old room at assertion time | Root cause was test synchronization racing the three-request queue load; condition-based DOM wait added and integrated run passes. |
| CF-I05 could persist stale losing caller's event | Real shared invariant defect fixed via version-bound guarded event insert; executing-D1 and CF-I05 pass. This is the only scope deviation and is bounded by INV-ATOMIC/AUDIT. |
| First pre-isolation CF-I06 attempt used Wrangler's default local fixture DB | Harness subsequently moved every migration/mutation/worker/query to unique temp persistence. Later CF-I06 execution passes; only named local synthetic fixtures were changed in that earlier attempt. No remote/real data was touched; no unsafe attempt was made to reconstruct those disposable local fixtures. |
| Early parallel test runs had fixed-port contention/timeout | Replaced by serial validation; these attempts are not counted as PASS. |

## Gate result

`PRE-CRITIC: PASS` for publication eligibility only. This is not an Independent Critic verdict or a self-issued F0.5 Development Gate PASS. A fresh exact Artifact A + Boundary B Independent Critic is required before continuing to F0.6.
