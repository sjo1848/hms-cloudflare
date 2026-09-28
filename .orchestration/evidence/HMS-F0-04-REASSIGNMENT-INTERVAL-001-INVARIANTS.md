# HMS-F0-04-REASSIGNMENT-INTERVAL-001 — Invariant Evidence

Artifact candidate: local uncommitted F0.4 implementation; immutable A/B publication follows this gate.
Task Contract: `.orchestration/contracts/HMS-F0-04-REASSIGNMENT-INTERVAL-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

## Invariant matrix

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `reassignment-interval.executing-d1.test.ts`: event-failure rollback, equal-count wrong-date source-claim substitution between snapshot and batch, destination visible-state ABA with version advance, same-booking race, shared-destination race; exact booking/room/claim/event snapshots | Both application write predicate and final D1 event guard validate exact date sets, not only counts. |
| INV-AUDIT-001 | APPLIES | PASS | Same executing-D1 tests assert exactly one REASSIGN event for the winner and zero for rejected/stale/loser operations; event details include actor/request/hotel, effective interval and room versions | |
| INV-DOMAIN-001 | APPLIES | PASS | `domain.test.ts`, executing-D1 tests and `scripts/cf-i03-regression.sh`: CHECKED_IN/date/reason/destination/maintenance/ledger transition behavior | Command remains the lifecycle domain operation. |
| INV-TENANT-001 | APPLIES | PASS | `cf-wave12-reassignment-integrated.sh`: a booking persisted only in HOTEL_SECOND_DB returns 404 when addressed under hotel A; second-tenant booking, three night claims and event table are checked unchanged | Two synthetic hotel D1s; no real data. |
| INV-RBAC-001 | APPLIES | PASS | Same integrated Worker runner sends an authenticated housekeeping membership to reassignment, expects 403, then asserts booking room/status, destination status and lifecycle event count unchanged | Receptionist/admin allow path completes integrated mutation. |
| INV-PARITY-001 | APPLIES | PASS | Domain and executing-D1 boundary cases cover `max(check_in, hotel_local_date)`, strict checkout overrun, elapsed history preservation, remaining half-open interval, blocking/advisory semantics and truthful history | Pricing remains F0.5 per approved authority. |
| INV-ENUM-001 | APPLIES | PASS | Executing-D1 tests cover canonical CHECKED_IN, OCCUPIED/VACANT, DIRTY/MAINTENANCE, AVAILABLE and BLOCKING/NON_BLOCKING values; API serialization verified in integrated Worker run | |
| INV-UX-001 | APPLIES | PASS | Integrated Reception flow selects an in-house booking, preserves task on 409, refreshes authoritative state, keeps the actionable conflict visible and shows the confirmed destination on return | Bounded correction to existing task; no redesign. |
| INV-ORDER-001 | N/A | N/A | No queue ordering, ranking, next-item or synthetic item behavior changed | |
| INV-RESP-001 | APPLIES | PASS | `cf-wave12-reassignment-integrated.playwright.js` executes destination selection and 409/recovery at desktop 1280×900 and mobile 375×812; screenshots captured | `f04-reassignment-desktop-success.png`, `f04-reassignment-mobile-conflict.png`. |
| INV-EVID-001 | APPLIES | PASS | This matrix and `HMS-F0-04-REASSIGNMENT-INTERVAL-001-PRECRITIC.md` map claims to D1/API/browser commands; final D1 assertions and Worker responses are executable, not mocks | Expected console 404 (no preexisting case/favicon) and deliberate 409 are disclosed. |
| INV-LEGACY-001 | N/A | N/A | No historical maintenance/event recovery or synthesized record | Elapsed room-night claims are preserved. |
| INV-MONEY-001 | APPLIES | PASS | D1 snapshot assertions plus integrated final-state queries preserve booking total, invoice amount/paid/status, charges, payment entries and financial events; CF-I03 checks VOIDED/mismatch fail closed | No repricing/ledger writes in F0.4; F0.5 owns segmented pricing. |
| INV-STATE-001 | APPLIES | PASS AFTER A/B | This invariant file is in Artifact A; the immediately following orchestration-only Boundary B records A's exact SHA, requires external review and disables resume | Exact identity is recorded in B; no self-SHA. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/network/audit route or central capability implementation changed | Existing `bookings.write` enforcement exercised. |
| INV-CF-I07-002 | N/A | N/A | No admin/network plan/role no-op mutation | |
| INV-CF-I07-003 | N/A | N/A | No privileged downgrade flow | |
| INV-CF-I07-004 | APPLIES | PASS | Integrated runner tracks its owned API/Vite process trees, verifies termination in cleanup, uses a disposable `mktemp` persistence directory and exits 0 only after browser plus D1 assertions | Existing 4174/4175 servers and `.wrangler/state` are not touched. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic | |
| INV-CF-I08-002 | N/A | N/A | No network aggregation | |
| INV-CF-I08-003 | N/A | N/A | No report date/state behavior | |
| INV-CF-I08-004 | N/A | N/A | No report state predicate expansion | |
| INV-CF-I08-005 | N/A | N/A | No report clock default or continuity behavior | Reassignment uses existing authoritative hotel-time middleware. |
| INV-SCOPE-001 | APPLIES | PASS | Diff and contract audit limits code to F0.4 interval/room assignment, truthful event, current Reception candidate/conflict behavior and synthetic regression runners; no pricing, Blocks A–H or real data | |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| In-stay reassignment | Repository batch conditions booking identity/status/token, exact source and target versions/dimensions, complete old/new claim sets, maintenance/hold/billing eligibility; trigger guards validate the final event | No successful response; D1 batch aborts and leaves no partial booking/room/inventory/event changes | One REASSIGN event only after exact winner; includes effective local date, interval, reason, actor, hotel, request and before/after room versions | D1 stale source-claim, trigger failure rollback, same-booking and shared-destination race cases |
| Role-denied reassignment | Central `bookings.write` capability guard before domain write | HTTP 403; no D1 mutation | No event | Integrated Worker API 403 plus unchanged D1 assertions |
| Cross-tenant reassignment lookup | Membership selects hotel A operational D1; object ID is not used to select hotel B | HTTP 404 in hotel A context | No event in hotel B | Integrated Worker lookup plus HOTEL_SECOND_DB before/after assertions |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Migration 0024 applies from a clean database | `wrangler d1 migrations apply HOTEL_DEMO_DB --local ... --persist-to <fresh-temp>` showed migrations 0001–0024 applied | Local executing D1 |
| Search, UI date preview and command use one remaining interval | Browser asserts available-room URL `[max(check_in, hotel_local_date), check_out)`, visible preview date and API response effective/remaining interval | Integrated Worker + D1 + browser |
| Booking assignment, room dimensions, exact inventory history, billing and event agree | `reassignment-interval.executing-d1.test.ts` and integrated script final D1 queries | Executing D1 |
| Desktop/mobile conflict and success paths work | `cf-wave12-reassignment-integrated.playwright.js` | Integrated browser |
| RBAC and tenant isolation fail closed | Integrated runner 403/404 plus zero-drift queries against two synthetic hotel D1s | Integrated Worker + D1 |
| CF-I03 regression passes with deterministic local-date fixture | `bash scripts/cf-i03-regression.sh` | Integrated Worker + D1 |
| Equal-count substitution and visible-state ABA fail closed | `reassignment-interval.executing-d1.test.ts` (cases “equal-count wrong-date source claim” and “destination room visible-state ABA”) | Executing D1 with deterministic interleaving |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN; INV-STATE-001 is fulfilled by the next orchestration-only B commit after A.
- [x] F0.4 Task Contract validation and scope audit passed for the evidence recorded here.
- [x] No real/customer data was accessed or mutated; all D1 fixtures were local and synthetic.
- [ ] Replacement Artifact A and exact orchestration Boundary B published locally.
- [ ] Fresh Independent Critic review of replacement A+B; Codex does not self-approve F0.4.
