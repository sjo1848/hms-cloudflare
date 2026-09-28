# HMS Cloudflare — Orchestration State

## ACTIVE TASK — HMS FOUNDATION 0 IMPLEMENTATION

Active task: implement F0.8 under frozen Task Contract `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md` (clarified before product changes to use truthful operation-stage provenance instead of fabricating agent-session audit fields). F0.7 repair exact-pair Independent Critic returned `PASS` on A2 `715e6a593e967f70ff9c6fd5adb2d2d4db3efd1a` + B2 `604b36d1b34eb7db342df2813613c784530ef7d7`; verdict/evidence is `.orchestration/evidence/HMS-F0-07-REPAIR-BOOKING-PRICING-ABA-001-INDEPENDENT-CRITIC.md`. That is F0.7 increment acceptance only. Preserve disclosed direct-synthetic-SQL ABA interposition limitation and broad product-flow runner missing-`playwright` caveat. F0.8 is permitted after F0.2 by the approved DAG. No finite retention or cleanup policy is inferred for incomplete operation records; they remain discoverable without expiry. Foundation 0 is not closed. Real data/cutover/bootstrap remain prohibited. No PR/push/merge, main, staging, deploy, production, or Blocks A–H.

### F0.8 — Recoverable guest + reservation creation — replacement Artifact A2 awaiting fresh Critic

- Frozen Task Contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`; all 24 registry invariants are classified. Local/synthetic only; incomplete stages have no inferred expiry; no Blocks A–H or real-data action.
- Initial immutable substantive Artifact A1: `298545b23e59f8aabfef5a766f76249ee71e856b`. It adds forward migration `0029_reservation_creation_recovery.sql`, a focused operation repository and typed recovery API, stable token/payload replay, truthful guest/booking stage provenance, a Reception new-guest/recover-existing-guest task, executing-D1 tests, integrated Worker/D1/Vite runner and desktop/mobile evidence.
- Validation: `npm run check` 33 files / 151 tests; F0.8 + F0.3 executing-D1 9/9; `npm run types:check`; `npm run web:build`; `npm run architecture:fitness`; `npm run test:d1-query-plan`; API/Web and staging-SPA Wrangler dry-runs; CF-I03/04, CF-I05, CF-I06 serial; `git diff --check`; integrated `scripts/cf-f0-08-reservation-recovery-integrated.sh` exit 0 at 1280×900 and 390×844. JS budget 299642/300000 raw, 86895/100000 gzip; CSS 40668/50000 raw, 8000/15000 gzip. Latest integrated log and screenshots are in Artifact A under `output/playwright/f0-08-*`; owned Worker/Vite process cleanup was verified.
- Internal QA reviewer Beauvoir (read-only GPT-6 Luna Medium) identified seven technical/evidence gaps; each was repaired and directed/integrated evidence rerun. This reviewer is not the Independent Critic. Pre-Critic and invariant evidence are included in A. The broad product-flow runner's missing-`playwright` caveat remains explicitly unclaimed; F0.8 has its own Playwright CLI integration.
- Fresh separate Independent Critic Jason (GPT-6 Luna Medium, read-only) reviewed A1+B1; verdict `REWORK`, with no architecture contradiction or ROADMAP_BLOCKER. HIGH: an original GUEST_CREATED operation became invisible if a distinct booking for that guest succeeded; MEDIUM: integrated mobile ran at 390px instead of the contract's 375px. Reviewer ran no tests and made no edits. Exact evidence is `.orchestration/evidence/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001-INDEPENDENT-CRITIC-A1-B1.md`.
- Bounded Rework Contract `.orchestration/contracts/HMS-F0-08-REPAIR-RECOVERY-LIST-375-001.md` was frozen before code changes. Repairs preserve the original GUEST_CREATED operation in recovery list after a distinct booking and prove the same browser operation at 375×844. Fresh F0.8 D1 7/7, full suite 33/151, types/build/architecture/budgets/query plans/Wrangler dry-runs and integrated Worker/D1/Vite/browser all pass; CF-I03/04, CF-I05, CF-I06 passed immediately before the narrow correction and did not cover the changed list predicate.
- Replacement immutable substantive Artifact A2: `abd9afdd7537ecef29ad4ae099d769c38b137f6d`. It contains the bounded repair and fresh evidence. Its exact A2+B2 Independent Critic review is recorded below; the A1 verdict remains historical and is not carried forward. Foundation 0 remains open.
- Locke (fresh separate read-only GPT-6 Luna Medium) reviewed exact A2 `abd9afdd7537ecef29ad4ae099d769c38b137f6d` + B2 `9492f6ba4b866e2e4fefa0fd5a1ae921c1f1ef60`, verdict `PASS_WITH_CONDITIONS`: confirms both A1 findings closed; only MEDIUM condition is B2 `runtime_status=RUNNING` while awaiting Critic. No product edits/tests by reviewer, no architecture contradiction/ROADMAP_BLOCKER. Evidence: `.orchestration/evidence/HMS-F0-08-INDEPENDENT-CRITIC-A2-B2.md`.
- Metadata-only condition repair contract `.orchestration/contracts/HMS-F0-08-REPAIR-REVIEW-HANDOFF-STATUS-001.md` is frozen. A2 remains byte-for-byte unchanged. The B3 dispatch uses `READY_TO_RESUME` only as a stopped-runtime marker, with `resume_authorized=false`, `external_review.required=true`, and a stop reason naming the blocking Critic confirmation; existing dispatcher source independently checks all gates and will not auto-resume. Bounded exact A2+B3 handoff confirmation is pending.

Human approved Foundation 0 implementation (RG1–RG7) via Drive authorization `18JGIQxyl8Bh6_w7H3eW1qdPL7jfUsdSLk43aE-G-90A`. Roadmap authority is Artifact A2 `b2581e4c370eeb6f74e9380af010e48386642b4f` and Boundary B2 `c6a4bcb9a2939505f7ddf8e72c02ec9b825f00f3`.

- Dedicated branch: `impl/hms-foundation-0`, based exactly on roadmap Boundary B2. Replacement F0.2 Artifact A with finalized evidence is `25656bec8fcc125544934e63756df371d7b7ad79`; its orchestration-only Boundary B is `a84d9ab74aabc116878fd320e5e38588b372b666` and received Independent Critic PASS for F0.2 only.
- Active contracts: `.orchestration/contracts/HMS-FOUNDATION-0-START-001.md`, `.orchestration/contracts/HMS-F0-02-SHARED-ROOM-INVARIANTS-001.md`, `.orchestration/contracts/HMS-F0-03-ROOM-STATE-CUTOVER-001.md`, and `.orchestration/contracts/HMS-F0-04-REASSIGNMENT-INTERVAL-001.md`. F0.1 is complete internally; F0.2 has exact-pair Independent Critic PASS. F0.3 Artifact A3 + Boundary B6 received Independent Critic `PASS_WITH_CONDITIONS`; B7 records the historic B3 reference distinction. F0.4 Task Contract and all-registry invariant map are complete and reviewed by read-only GPT-6 Luna Medium Contract and DB/Concurrency specialists; their identified acceptance details were incorporated before code work.
- Scope: F0.1–F0.12 in approved DAG order, local/synthetic only. Do not begin Blocks A–H.
- Real customer data mutation, live room cutover and active-stay pricing bootstrap are not authorized. No PR, merge, main, staging, deploy or production action.
- F0.1/F0.3 risk confirmed by read-only DB review: legacy scalar room state and migration 0020 do not preserve enough evidence to reconstruct overwritten Housekeeping state for every record. Treat such records as unresolved/quarantined; never infer READY. No ROADMAP_BLOCKER found.
- F0.1 implementation/evidence: forward migration `0022_room_state_dimensions.sql`; independent dimensions and fail-closed projection exposed read-only from Rooms API; legacy rows left unresolved, including contradictory `MAINTENANCE + NON_BLOCKING` evidence. Synthetic executing-D1/API tests, suite, types and Wrangler dry-runs pass. A Luna Medium Contract Reviewer found one HIGH legacy readiness defect; it was repaired and verified; no further findings. This is not an Independent Critic verdict.
- F0.2 replacement Artifact A `25656bec8fcc125544934e63756df371d7b7ad79` plus orchestration Boundary B `a84d9ab74aabc116878fd320e5e38588b372b666` received fresh Independent Critic `PASS` (Raman, GPT-6 Luna Medium). The reviewer confirmed both substantive findings closed, corrected boundary handoff, bounded F0.2 version semantics and synthetic-only evidence. This is F0.2-only acceptance, not Foundation 0 global PASS. Fresh code validation from that repair: `npm run check` 27/98, types, web build, architecture/i18n/budgets, D1 query plans, API/Web Wrangler dry-runs, CF-I05, directed tests, `bash -n` and diff checks pass. F0.3 Task Contract now exists with all registry invariants classified; a read-only Luna Medium DB/Data review found no contract contradiction, but confirmed existing migration scripts do not implement room-state shadow mapping/checkpoint recovery. Implementation may proceed only against synthetic disposable D1. Live activation mechanism, source write-freeze policy and real-data adjudication remain unchosen and prohibited here. No Blocks A–H or real data.

### F0.3 — Artifact A3 / Independent Critic boundary

- Initial immutable Artifact A: `c4af224c0454b34ea2201db7f5726de446668aad`; initial orchestration Boundary B: `23de5ab46f68ce2a5c060bc9ff11c7c22ed6475d`. Pauli (fresh read-only GPT-6 Luna Medium) returned `REWORK` with two HIGH findings: stale digest was not exercised as an actual request with exact zero-write assertions; staged checkpoint restart was not proven. Both findings are preserved in the evidence record.
- A2 `3980ef3db3a4e0cb96f7102705d2719777d84f26` + B2 `80177b1a64aa993e983748366de74c4f49557084` received `REWORK` from Lorentz (fresh read-only GPT-6 Luna Medium): the stale-request zero-write proof closed; HIGH finding remained because `SOURCE_SNAPSHOT_CAPTURED` was staged directly instead of resumed through the recovery helper; MEDIUM finding: B2 used `HUMAN_ACTION_REQUIRED` for automated Independent Critic review. Both routine findings are repaired; no Human Gate.
- Immutable Artifact A3: `176345d44bdc75f5e2beef9e765ebbca99e715df`; it changes only the executing-D1 recovery test and F0.3 invariant/Pre-Critic evidence. The recovery helper is invoked from INCOMPLETE and advances one checkpoint per invocation. B3 was orchestration-only; B4 is an orchestration-only correction of the handoff references.
- Archimedes (fresh read-only GPT-6 Luna Medium) reviewed A3+B3 and confirmed stale rejection, both checkpoint transitions, synthetic D1 rollback, scope, and running/external-review status. Verdict `REWORK`: HIGH because the STATE summary still named A2+B2 as pending and STATUS labeled the Pre-Critic evidence as in A2. B4 corrected those references.
- McClintock (fresh read-only GPT-6 Luna Medium) reviewed A3+B4. Verdict `REWORK`: HIGH because the active STATE summary still said B4 was being recorded and STATUS label/next_action still described A3+B3 REWORK instead of A3+B4 awaiting review. B5 corrected those active handoff fields.
- Arendt (fresh read-only GPT-6 Luna Medium) reviewed A3+B5. Verdict `REWORK`: dispatch/runtime mismatch—the exact pair was labeled awaiting review while `runtime_status` was RUNNING. B6 explicitly recorded active reviewer dispatch and result collection.
- Cicero (fresh read-only GPT-6 Luna Medium) reviewed exact A3 `176345d44bdc75f5e2beef9e765ebbca99e715df` + B6 `023cc2be00b02f4d2064fa3a3518d5f7735c90f0`; verdict `PASS_WITH_CONDITIONS`. Technical claims for stale no-write rejection, actual INCOMPLETE recovery, STAGING restart, rollback and COMPLETE replay were supported. Sole condition: A3 names B3 in its frozen evidence; B3 was historically the immediate boundary after A3, while B6 is the exact reviewed current boundary. The reviewer required this distinction and verdict to be persisted and continuation explicitly authorized. `.orchestration/evidence/HMS-F0-03-ROOM-STATE-CUTOVER-001-INDEPENDENT-CRITIC-A3-B6.md` records the review; this is not an aggregate Foundation 0 PASS.
- Implementation remains the pure deterministic shadow mapper/reconciliation in `apps/api/src/modules/room-state/legacy-cutover.ts`; seven mapping-relevant source reads use one D1 batch; no forward migration or production activation surface was added. Rooms displays authoritative unresolved readiness instead of treating legacy AVAILABLE as ready.
- Final rework validation: `npm run check` 29 files / 116 tests (including 4 D11 billing tests); `npm run types:check`; `npm run web:build`; architecture/i18n/budgets (JS 296,633 raw / 86,178 gzip; CSS 39,735 / 7,838); D1 query plans; Wrangler dry-runs; and diff check all PASS. Product code is unchanged, so prior local Worker+D1 desktop/mobile browser evidence remains applicable.
- F0.3 remains synthetic-only. No live/customer D1 was read or mutated; no cutover/pricing bootstrap, migration change, PR/merge/main/staging/deploy, or Blocks A–H. F0.3 Development Gate is `PASS_WITH_CONDITIONS`, with the sole condition documented/resolved by B7. Next action is to read frozen F0.4 authority and author its Task Contract before any F0.4 code change.

### F0.4 — Reassignment remaining-night interval (active)

- Contract: `.orchestration/contracts/HMS-F0-04-REASSIGNMENT-INTERVAL-001.md`; scope is hotel-local `[max(check_in, hotel_local_date), check_out)`, preserve elapsed inventory history, connect F0.1/F0.2 dimensions and room versions, and prove atomic stale/concurrent behavior on synthetic local D1.
- F0.5 exclusively owns non-retroactive segmented pricing. Existing whole-stay destination-rate calculation is recorded as a known deferred mismatch; F0.4 must not infer elapsed prices or implement a second pricing truth. Foundation aggregate cannot close until F0.5 resolves it.
- Pre-code Contract Reviewer and DB/Concurrency Reviewer were GPT-6 Luna Medium and read-only; their source-claim, event-version, race and API acceptance findings were incorporated before implementation. They are not the Independent Critic.
- First Independent Critic reviewed A `726bcecf9dfad0e8000bd2eab10249055d0d32c8` + B `4b1cf693590dacc0e17fac82d6557f13610f8ed1` and returned `REWORK`: HIGH count-only source-claim validation could accept an equal-count wrong-date substitution; MEDIUM visible-state ABA was not directly exercised; the reviewer could not independently rerun the integrated script. Routine technical rework is authorized and completed: application and D1 event guard compare exact elapsed/remaining date sets; executing-D1 tests exercise same-count substitution and destination `AVAILABLE → OUT_OF_ORDER → AVAILABLE` version ABA; fresh integrated runner exit 0 verifies clean migrations, Worker/D1/browser. Root pattern is added to `INV-ATOMIC-001`.
- Replacement Artifact A `69bd08b8fd194a9565b426b66f03ff638993304f` + Boundary B `a5326be2695b7a4cff0ad24cff784d5fc4c516cc` received fresh Independent Critic `PASS`: Curie's only condition (independent integrated browser/migration reproduction) was satisfied by Maxwell's separate detached-worktree Worker/D1/browser run, exit 0. Dalton's initial `REWORK` findings were repaired. Review evidence: `.orchestration/evidence/HMS-F0-04-REVIEW-DISPOSITION.md`. F0.4 fresh results: executing-D1 9/9; full `npm run check` 30 files/125 tests; types/build/architecture/budgets/query plans/Wrangler dry-runs PASS; CF-I03/04 PASS; integrated Worker/D1 desktop+mobile exit 0 including RBAC and true two-tenant isolation.
- Repaired findings: Wrangler scalar-CASE trigger parser `incomplete input`; 409 message erased by authoritative refresh; stale date/queue selectors and browser harness assumptions; fixed-date CF-I03 fixture; two regression runners now isolate local Wrangler state rather than deleting `.wrangler/state`.
- F0.4 Development Gate: `PASS` after exact A+B Independent Critic PASS and independent QA fulfillment of the sole condition. This does not close Foundation 0. Continue automatically to F0.5 under the approved DAG; no Block A–H. Preserve booking totals and billing rows in F0.4; F0.5 owns segmented active-stay pricing. Real data remains prohibited; no PR, push, merge, main, staging, deploy or production.

### F0.5 — Segmented Reassignment Pricing (Independent Critic PASS)

- Frozen Task Contract: `.orchestration/contracts/HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001.md`; 24 registry invariants mapped. Bounded shared-room race repair contract: `.orchestration/contracts/HMS-F0-05-REPAIR-HOUSEKEEPING-AUDIT-RACE-001.md`.
- Artifact A: `0bafe4875de759869760cc4abdb08319c70e6b7a`. It adds migration `0025_segmented_stay_pricing.sql`, append-only per-night rate segments and pricing versions, server-authoritative reassignment quote/commit, current destination rate for remaining hotel-local nights, D11 reconciliation while preserving extra charges and payment ledger, Reception price impact, directed/executing-D1 tests and evidence. No historical active stays were bootstrapped; F0.6 remains separate.
- Fresh validation: `npm run check` 31 files / 133 tests PASS (D11 4/4; reassignment interval 14/14); `npm run types:check` PASS; `npm run web:build` PASS (JS raw 296651/300000 B, gzip 86095 B); `npm run architecture:fitness` PASS; `npm run test:d1-query-plan` PASS; API/Web Wrangler dry-run PASS; staging SPA config dry-run PASS (no staging mutation); CF-I03/04 PASS; CF-I05 PASS after bounded race repair; CF-I06 PASS on unique temporary D1. Integrated Worker+D1+Vite reassignment browser PASS, exit 0, desktop+375px mobile: quote/remaining-interval parity, BLOCKING, NON_BLOCKING, reason, repricing, persistence, authoritative UI refresh and stale 409 recovery. `git diff --check` PASS.
- Browser finding disposition: an initial assertion observed old room text while Reception's three-request queue load (board/rooms/guests) was still in flight. This was a test synchronization race; condition-based DOM evidence now waits for authoritative room rendering without sleep/retry/timeout inflation. The integrated run passes.
- Shared correctness finding discovered by CF-I05: two stale housekeeping callers could both record CLEANING_START although only one transition won. A narrow version-bound event `INSERT … SELECT` guard fixes the false loser event without `changes()` chaining. Directed executing-D1 and CF-I05 pass. This repair is explicitly scoped as inherited INV-ATOMIC/AUDIT correctness, not a new Housekeeping feature.
- Earlier local-only caveat: the first CF-I06 attempt before its isolation repair used Wrangler's default local synthetic fixture store and changed named fixture rows. The runner now confines every operation to a unique temp persistence directory; subsequent CF-I06 passes. No remote/customer/staging/production data, real cutover or active-stay bootstrap was accessed or mutated; no attempt was made to reconstruct disposable local fixtures.
- Pre-Critic and invariant evidence are in `.orchestration/evidence/HMS-F0-05-SEGMENTED-REASSIGNMENT-PRICING-001-{PRECRITIC,INVARIANTS}.md`. Independent Critic verdict and exact pair are in `.orchestration/evidence/HMS-F0-05-INDEPENDENT-CRITIC.md`. F0.5 Development Gate: `PASS`. This is not aggregate Foundation 0 PASS.

### F0.6 — Active-Stay Pricing Bootstrap (bounded Independent Critic rework repaired; replacement artifact pending)

- Approved source: F0.6 section in `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` and `docs/implementation-roadmap/HMS-ACTIVE-STAY-PRICING-BOOTSTRAP-PLAN-V1.md`.
- DB/Data inventory reviewer Peirce (read-only GPT-6 Luna Medium) confirmed existing migration tooling has no row-level active-stay pricing classifier or resumable/replayable shadow bootstrap. The F0.3 checkpoint test is a pattern, not evidence for F0.6.
- Material design guard: `booking_pricing_segments` is operational pricing input and inserts advance booking pricing version. Any F0.6 shadow/candidate state must be stored separately and must not alter quote output or canonical totals/invoices/charges/payment rows. Historical rate evidence cannot be inferred from current room price. Only explicit synthetic evidence can be classified `TRACEABLE_SEGMENTS`; missing evidence remains aggregate-only/held.
- Frozen implementation Task Contract: `.orchestration/contracts/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001.md`; all 24 registry invariants are classified and mapped. It includes a narrow, provenance-bound forward guard path for activation of explicit synthetic historical rate versions while preserving the ordinary F0.5 current-rate guard.
- Read-only DB/Data reviewer Laplace (GPT-6 Luna Medium) found F0.6-R1: duplicate room IDs could collapse through `INSERT OR IGNORE` without an explicit identity conflict/cardinality proof. Fixed by classifying duplicate room IDs as `ORPHAN_OR_CONFLICT` and checking every persisted snapshot-child cardinality against its original JSON array inside the D1 activation guard. Follow-up executing-D1 coverage also proves concurrent activation convergence, per-hotel independent D1 isolation and rollback/recovery from an injected staging interruption.
- Galileo's fresh Independent Critic verdict on exact A1 `ac0b42cb6bdc787726b3160957464af1298eb52a` + B1 `3f1d8dc9c1767f7d5009633c27dff16ecec43beb` was `REWORK`, HIGH `F0.6-IC-01`: canonical `booking_pricing_segments` were missing from baseline snapshot/activation guard. This is ordinary technical rework, not a product/Human Gate. Full finding is preserved in `.orchestration/evidence/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001-INDEPENDENT-CRITIC.md`; repair contract is `.orchestration/contracts/HMS-F0-06-REPAIR-CANONICAL-PRICING-SNAPSHOT-001.md`.
- Bounded repair now snapshots the exact canonical segment rows into manifest/digest, holds pre-segmented bookings without bootstrap candidates, and adds forward-only `0027_active_stay_bootstrap_segment_snapshot_guard.sql` to compare the exact set inside the activation batch. Adversarial executing-D1 coverage restores booking version/token/timestamp after an injected segment-set change and proves fail-closed behavior and zero drift.
- Fresh validation after the repair: F0.6 executing-D1 11/11; F0.3 synthetic cutover rehearsal 2/2; `npm run check` 32 files / 144 tests; clean local Wrangler chains 0001–0027 on CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB; `npm run types:check`, web build, architecture/i18n/budgets (JS 296651/300000 raw; 86095 gzip), D1 query plans, Wrangler API/Web dry-runs and staging SPA dry-run; CF-I03–I06 sequential PASS; `scripts/cf-wave12-reassignment-integrated.sh` exit 0 with Worker/D1/Vite/browser and unchanged remaining-stay interval across search/quote/mutation, desktop persistence/refresh and mobile stale 409 recovery. No remote or real data accessed.
- Updated invariant and Pre-Critic records include the finding and repair; complete fresh evidence is in `.orchestration/evidence/HMS-F0-06-REPAIR-CANONICAL-PRICING-SNAPSHOT-001.md`. These are internal publication gates only and do not self-declare Independent Critic PASS or F0.6 Development Gate.
- A1+B1 remain immutable and retain `REWORK`. Replacement Artifact A2 is frozen at `1b83cc1a6832e8fb4f95dfdfa7b134021075775d`. B2 recorded A2 but retained stale next-action wording; B3 corrected the dispatch and is the exact boundary reviewed with A2.
- Hooke (fresh separate Independent Critic, GPT-6 Luna Medium) reviewed exact A2 `1b83cc1a6832e8fb4f95dfdfa7b134021075775d` + B3 `e4c2cf2f91ec6c3da159e1adcbb50c026459d3ce`; verdict `PASS_WITH_CONDITIONS`. F0.6-IC-01 HIGH is closed. Conditions were documentation-only: A2's embedded B2 references are historical (B2 was superseded by B3 only to correct current dispatch wording), and the F0.3 digest note describes its first refresh for 0026 while A2 also refreshes cumulative fingerprints for 0027. B4 records both distinctions without modifying A2. The bounded follow-up confirmed both conditions satisfied but found one stale STATE sentence; B5 corrects that sentence and asks for a final bounded state consistency confirmation before resuming F0.7.
- Unknown real-source history/currency completeness remains deferred to the separately required Human Gate before any real-data bootstrap. The current increment reads/writes only synthetic disposable fixtures. No real data/cutover.

### F0.7 — Checkout Settlement Guard (implementation/evidence complete; exact-pair review pending)

- Frozen Task Contract: `.orchestration/contracts/HMS-F0-07-SETTLEMENT-GUARD-001.md`; all 24 durable invariants classified before implementation. Forward migration `0028_checkout_settlement_guard.sql`; no historical migration edited.
- Checkout now evaluates current Booking Account/Folio and D11 ledger truth at the conditional D1 mutation boundary. It guards invoice/booking amount, VOIDED and ledger mismatch, binds account/version snapshot, records exact account snapshot including `paid_at`, and preserves atomic room/inventory/invoice/event transition. No payment ledger mutation or fabricated payment.
- Executing-D1 assertions cover unpaid/partial/paid/credit/VOIDED/mismatch, zero-total/no-invoice, stale intervening payment and extra charge, serial/concurrent checkout/payment behavior, exact rollback on late event failure, and exact event/account state.
- Integrated real local Worker + D1 + Vite/browser evidence: desktop 1280×900 settlement conflict then authorized pending-approved checkout and authoritative refresh; mobile 375×844 successful checkout and refresh; post-state verified directly in local D1. Fresh migration chain through 0028 applied on isolated local CONTROL_DB and both hotel bindings.
- `npm run check`: 32 files / 144 tests PASS; types, web build, architecture/i18n/budgets, query plans, Wrangler API/Web dry-runs, staging SPA dry-run, CF-I03–I06 and `git diff --check` PASS. The broad product-flow runner limitation (missing npm `playwright`) is recorded; it is not counted PASS. Required checkout browser flow was executed separately through Playwright CLI against real Worker/D1.
- Pre-Critic found the response-loss assertion needed explicit response discard. Regression now discards successful checkout response, resolves via authoritative read, retries and verifies one CHECK_OUT event/invoice and no fabricated payment. Final amended CF-I03 rerun exited 0; final `npm run check` passed 32 files / 144 tests; `git diff --check` passed. Evidence is committed in Artifact A.
- No remote/customer data was read or mutated, and no cutover/bootstrap occurred. No PR, push, merge, main, staging mutation, deploy, production or Blocks A–H.
- Prior A/B remain immutable as reviewed history; their verdict does not apply to the replacement artifact. Replacement Artifact A2 is `715e6a593e967f70ff9c6fd5adb2d2d4db3efd1a`; Boundary B2 is the current orchestration-only commit. Fresh separate Independent Critic is required on the exact pair; no self-approval. No aggregate Foundation 0 PASS is claimed.
- Fresh Independent Critic Hooke reviewed exact A2+B2 and returned `PASS` with no conditions. The review notes the bounded direct-SQL ABA interposition limitation and confirms the supported version-advancing pricing write path separately; see the exact-pair report. Foundation continuation is authorized by the existing F0 DAG, not by an aggregate Foundation PASS.
- F0.8 Task Contract is frozen before implementation. Contract reviewer Peirce (read-only GPT-6 Luna Medium) found no retention blocker; exact operation stages, semantic payload, lookup authorization and audit constraints were closed in the contract. Next: implement only recoverable Reception guest + reservation creation, local/synthetic.

## HISTORICAL BOUNDARY — HMS-ROADMAP-CTRL-REWORK-001

Bounded corrections CTRL-RM-01..04 completed under Controller Review Drive `1xbNP7RWTriKXGqWMTwFV3xoRIFYPvJwENn3tsozHHlM`. Branch `planning/hms-implementation-roadmap-f0-a-h`.

- Corrected immutable roadmap Artifact A2: `b2581e4c370eeb6f74e9380af010e48386642b4f`.
- Orchestration-only Boundary B2: recorded by the immediately following commit; contains only this file and `.orchestration/STATUS.json`.
- Fresh independent critic: Hypatia, GPT-6 Luna Medium, `PASS`; exact A2 candidate and final path audit verified. Evidence: `.orchestration/evidence/HMS-ROADMAP-CTRL-REWORK-001-INDEPENDENT-CRITIC.md`.
- Path audit: 111 unique explicit path references; 102 exist, 9 explicitly absent/negated, zero unexplained missing paths. Pre-Critic and invariant records are in `.orchestration/evidence/HMS-ROADMAP-CTRL-REWORK-001-{PRECRITIC,INVARIANTS}.md`.
- CTRL-RM-02 reconciles E start after Foundation 0 + A + E's room/capability contracts; B remains a later integration checkpoint before dependent C/H flows.
- CTRL-RM-03 excludes all Booking Account receivables from cash reconciliation arithmetic. CTRL-RM-04 confirms Booking Account/Folio grain is Booking/Stay; Guest has no global account.

At that historical boundary, implementation authorization was false and Controller review was required. This was superseded by the later Foundation 0 Implementation Authorization recorded above; the A2/B2 artifacts remain unchanged and authoritative.

## HISTORICAL DISCOVERY — HMS-SYSTEM-UX-DISCOVERY-ASIS-001

Human authorized full-system AS-IS discovery only. Branch `analysis/hms-system-ux-discovery-v1`, audited baseline `b9197e278e227a8e3da5ecb867d6d430f69c1d2f`; PR #50 remains Draft and unpromoted. Current task contract: `.orchestration/contracts/HMS-SYSTEM-UX-DISCOVERY-ASIS-001.md`.

Status `DISCOVERY_COMPLETE_AWAITING_CONTROLLER_REVIEW`; runtime `WAITING_HUMAN_GATE`; resume_authorized=false. Artifact A: `8b4ff2839e15ee123318af01f2d1e163f87db9c3`, containing the documentary audit/catalog/journey/evidence. Boundary B is orchestration-only and records A. External Controller review is the next action. No TO-BE or product implementation is authorized by this discovery. Previous check-in review and all promotion restrictions below remain historical/pending, not waived by discovery. Drive copy is stored in folder `13hYWjlt3gFpcIsa0fMXdEAC-zAJ0MeLr`, document `1EouqroCp_WR6FUB6MQno3FMBStUMoKs5edI4E1gHK-w`.

The prior implementation state below is retained as audited history, not the active dispatch.

## HISTORICAL IMPLEMENTATION STATE (SUPERSEDED BY ROADMAP TASK ABOVE)

Project: HMS Cloudflare  
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`
Active branch: `impl/ux-ui-reception-checkin`
Definition artifact A: `23b7da3c9836edfaefa2bcf4943ee27f479b2f2a`
Base snapshot: `6ffd6f9aa8e6836d60cbeba5383494605e5611cc` on `review/ux-operational-current`
Active task: `UX-UI-RECEPTION-CHECKIN-001`
Task Contract: `.orchestration/contracts/UX-UI-RECEPTION-CHECKIN-001.md`
Phase: `Reception + Guided Check-in post-artifact independent review`
Status: `INDEPENDENT CRITIC PASS_WITH_CONDITIONS; DOCUMENTATION CONDITION ADDRESSED; AWAITING CONTROLLER CHECKPOINT`
Runtime: `HUMAN_ACTION_REQUIRED`, `resume_authorized=false`; exact A+B have been independently reviewed. No other workflow is authorized.

This task is limited to the Reception + Guided Check-in interaction reference implementation. The named UI Contract & Wireframes v1 and parent UI Interaction System v1 were found in connected Drive and read in full; IDs and the Human implementation authorization are recorded in the Task Contract. No other workflow is authorized.

Controller finding: Human rejected right-side Sheet for Check-in desktop and requested a centered task surface. Rework is limited to Desktop Dialog / Mobile full-screen Drawer while preserving P0.1 behavior and the existing UI logic. Task Contract records the correction; backend, other workflows, promotion and deployment remain out of scope.

## UX-UI-RECEPTION-CHECKIN-001 — SUPERSEDED PRE-REWORK ARTIFACT

- Prior artifact A: `a090b283c2303871af25375c66050117efafbeb2` on this branch; its right-side desktop Sheet was rejected by the Human and is superseded for acceptance by the current rework. Do not treat its review boundary as satisfying this rework.
- Draft PR `#50` remains open against `review/ux-operational-current`.

## UX-UI-RECEPTION-CHECKIN-001 — SUPERSEDED REWORK ARTIFACT

- Human feedback: `Human rejected right-side Sheet for Check-in desktop and requested a centered task surface.`
- Artifact A: `f73c64102ab411fbd3883d006cd22aec5f8dfc1b` on `impl/ux-ui-reception-checkin`.
- Boundary B: `e29804774ad2f0f25f0c8c81eab58c56e6529613` recorded this A; it contains no product behavior changes. The Independent Critic verdict on this pair was `PASS_WITH_CONDITIONS`, now superseded by the repaired artifact below.
- Draft PR `#50` remains open against `review/ux-operational-current`.
- Current interaction contract: centered desktop Dialog with dimmed Reception backdrop; mobile remains full-screen Drawer. No other workflow or backend change is authorized.
- `npm run check`: PASS, 23 files / 91 tests. `types:check`: PASS. Current web build: 296,282 raw JS / 86,084 gzip and 39,586 raw CSS / 7,817 gzip. Cloudflare raw JS budget PASS at 296,282 / 300,000; CSS budget PASS.
- Architecture fitness, i18n, D1 query plans and API/Web Wrangler dry-runs: PASS.
- Original integrated browser validation: `output/playwright/ux-ui-checkin-integrated.log`, fixture `.hms-local/p0-1-8CFfxo`; retained as historical artifact evidence.
- Persisted state: `z-priority` and `a-next` are `CHECKED_IN`; exactly one CHECK_IN event each; `m-blocked` remains confirmed in MAINTENANCE; invoices unchanged and zero payment rows.
- QA/UX reviewer (separate read-only Luna Medium subagent) found missing keyboard evidence and stale Sheet/budget claims. Assertions and evidence were repaired; latest integrated log verifies assertions executed and the reviewer confirmed keyboard/invariant findings resolved. Exact build measurement is now recorded consistently for this artifact; prior `291301` measurement belongs to P0.1 historical evidence below.
- Component policy: source-local native Dialog/Drawer/Sheet wrappers share one `<dialog>` lifecycle; not generated shadcn components. External runtime was removed to preserve the binding 300 KB raw JS budget. The adaptation was disclosed to the prior reviewer and remains part of the current review scope.
- Multi-agent capability: `true`; separate Luna Medium Engineering and QA/UX reviewer used. The fresh, non-participating Independent Critic reviewed this superseded pair and returned `PASS_WITH_CONDITIONS`; the condition is documented and repaired in the current artifact.
- Mandatory Pre-Critic and invariant evidence were complete for this artifact; separate QA/UX follow-up confirmed its keyboard, stale-evidence, and budget findings resolved. Fresh Independent Critic verdict was `PASS_WITH_CONDITIONS` as recorded below.
- Development gate is at the post-artifact review boundary. Promotion remains `BLOCKED` by the shared Reports/Users/workerd finding and inherited `P01-EXT-01`; neither is in this scope.
- No merge, `main`, `acceptance/staging`, deploy or production action occurred.

## UX-UI-RECEPTION-CHECKIN-001 — REPAIRED ARTIFACT A

- Rework artifact A: `1dee1ce1cdb50f0c4f2dd72693e63b604b69bcb9` on `impl/ux-ui-reception-checkin`.
- Replaced the misleading queue intersection test with a two-dimensional visibility assertion on the Reception heading, and narrowed evidence claims: queue state is retained/restored, not claimed to remain unobscured through the modal. No product layout/backend behavior changed.
- The first test expression treated horizontal alignment as overlap despite the heading sitting above the Dialog; this assertion defect was corrected and the full rerun then passed.
- Latest integrated run: `output/playwright/ux-ui-checkin-integrated.log`, exit 0, fixture `.hms-local/p0-1-QBRoTK`; real local Wrangler Worker + migrated D1 + Vite, mobile 375px and desktop 1280px; integrated plus mock directed flows PASS. D1 assertions confirm two successful CHECK_IN events (one per booking), no event for BLOCKING case, unchanged invoices, and zero payment rows.
- Re-run gates: `npm run check` 23 files / 91 tests PASS; `types:check`, web build, architecture fitness, Cloudflare budgets, D1 plans and API/Web Wrangler dry-runs PASS. Current measured JS raw/gzip 296,282/86,084 bytes; CSS raw/gzip 39,586/7,817 bytes.
- Mandatory Pre-Critic and invariant evidence updated for the critic condition and rerun; this is internal readiness only, not an acceptance verdict.
- New orchestration boundary B records this exact A and requires a fresh Independent Critic. Prior `PASS_WITH_CONDITIONS` does not transfer; no new verdict is claimed.

### Independent Critic result on the repaired A+B

- Reviewer: Confucius, fresh read-only subagent; GPT-6 Luna, medium reasoning. The reviewer did not implement or participate in Pre-Critic or the prior review.
- Exact reviewed pair: A `1dee1ce1cdb50f0c4f2dd72693e63b604b69bcb9`; B `50e23a75133fe2b99bd94bcf5ac38b49039dcdf4`. Reviewer verified remote branch and PR #50 head resolve to B and B's parent is A.
- Verdict: `PASS_WITH_CONDITIONS`. The prior queue-visibility condition is resolved. The sole current condition was stale wording in PR #50 claiming desktop uses a right-side Sheet. The Draft PR description was corrected through the GitHub API to centered, bounded Dialog / full-screen mobile Drawer and re-verified; no artifact A/B blobs changed.
- Critic found the remaining contract, responsive surfaces, keyboard/focus, BLOCKING/NON_BLOCKING, real Worker/D1 409 recovery, success/next case, scope, native-wrapper disclosure, budget and evidence claims supported.
- This remains the Independent Critic's `PASS_WITH_CONDITIONS` verdict; correcting its documentation condition does not convert it to `PASS`. Controller checkpoint is the next and only boundary. Development gate is `PASS_WITH_CONDITIONS (conditions addressed; Controller checkpoint pending)`; promotion remains blocked.

## REWORK REVIEW BOUNDARY

The Independent Critic reviewed exact artifact A `1dee1ce1cdb50f0c4f2dd72693e63b604b69bcb9` with boundary B `50e23a75133fe2b99bd94bcf5ac38b49039dcdf4`. Its `PASS_WITH_CONDITIONS` verdict and the corrected Draft PR description are recorded above. Stop at the post-critic Controller checkpoint; no subsequent workflow is authorized.

## P0.1 CURRENT EVIDENCE AND PRE-CRITIC

- Task Contract: `.orchestration/contracts/P0.1-RECEPTION-ARRIVAL-CHECKIN.md`.
- Evidence: `.orchestration/evidence/P0.1-RECEPTION-ARRIVAL-CHECKIN.md` and its `-INVARIANTS.md` companion.
- `npm run check`: `23 files / 91 tests PASS`, including D11 executing D1 `4/4`, front-desk board `2/2`, and concurrent check-in exact-winner `1/1`.
- Historical P0.1 evidence (not the current Dialog rework build): `npm run types:check`, web build, architecture fitness, i18n, budgets, D1 critical query plans, Wrangler dry-runs and staging SPA config dry-run: PASS. P0.1 JS raw was `291301` bytes against `300000` ceiling.
- Directed mock browser at 375/1280: PASS, including dirty Back/Forward, 409/failed refresh, double-submit, no-next focus and URL selection. CF-I04 mock browser at 375/390/430/768/1024: PASS.
- Real local Wrangler Worker + migrated D1 + Vite browser at mobile 375 and desktop 1280: PASS. Actual BLOCKING race returns 409, repairs/refresh then succeeds; NON_BLOCKING advisory succeeds; blocked booking stays unchanged; persisted D1 has exactly one CHECK_IN event per winner and intact invoices/payments. Final isolated fixture `.hms-local/p0-1-aCKaJg`; screenshots under `output/playwright/p0-1-integrated-*`.
- Multi-agent runtime capability: `true`. Separate UX/contract, backend engineering, UX adversarial, DB/Data and final read-only UX review were used; final reviewer findings on URL and no-next focus were repaired and retested. Luna Medium reviewers/engineering; no Sol escalation. Pre-Critic is internal only.
- No schema migration or new lifecycle write path. Front-desk board is the sole runtime queue authority; the unused client/browser-date ranking helper was removed.

Finding `P01-EXT-01`: inherited `npm run test:cf-i04` shell regression fails after successful check-in at reassignment without an invoice (expected 200, got 409). Existing reassignment code conditionally omits `PRICE_RECONCILIATION` when no invoice exists; existing migration 0021 demands that event on repricing. The relevant repository, migration and shell regression script have no P0.1 diff. This is not a P0.1-introduced defect, is **not** represented as a green inherited shell gate, and remains outside check-in scope. Broader V11 Billing-selector coupling is separately deferred as `P01-DEFER-01`; P0.1 does not claim V11-wide Reception parity.

Wave 0.3 and Wave 1.1a are recorded as development passes with the shared/preexisting browser finding; promotion remains blocked. Wave 1.1 backend/domain work reached Controller checkpoint at artifact `b8ed06521d4221fcaac08b838887405339c9cd1e`, using the remote V11 definition branch as read-only contract authority. The external review for Wave 1.2 remains required and is not marked completed.

## PRIOR VALIDATED EVIDENCE (HISTORICAL)

- D11 executing D1: `4/4 PASS`.
- Foundation CI: PASS.
- Unit/integration suite: `21 files / 88 tests PASS`.
- TypeScript/types: PASS.
- Web build: PASS.
- Cloudflare budgets: PASS.
- D1 critical query plans: PASS.
- Wrangler dry-runs: PASS.
- Staging SPA configuration validation: PASS.
- `scripts/cf-i06-regression.sh`: PASS.
- `scripts/cf-i03-regression.sh`: PASS after final reassignment trigger and financial-event assertions.
- `scripts/cf-i05-regression.sh`: PASS.
- Extra-charge D1 atomic rollback: confirmed.
- `recordExtraCharge()` no longer uses SQLite `changes()` for causal chaining.

Successful extra-charge batch observation: `[1, 2, 1, 1]`. The second result may be `2` because the booking update invokes the D11 invoice reconciliation trigger. Batch success must therefore prove the primary mutation and must not require every statement to report exactly `meta.changes === 1`.

## PROMOTION FINDING (NOT A P0.1 DEVELOPMENT BLOCKER)

Required promotion gate: `ux-mobile-browser` — FAIL / FLAKY SHARED RUNNER FINDING.

Housekeeping initial board/date and mutation-refresh race is repaired and the browser trace reaches the end of housekeeping successfully. The shared full gate fails afterward in Reports (`Daily occupancy`) or Users (`No users match this search`) depending on the run; prior runs also recorded concurrent report requests, local `workerd` `broken pipe`, and Vite `socket hang up`. This remains a shared/preexisting runner finding; Reports and Users code were not modified.

The A/B attribution is recorded in `.orchestration/evidence/CF-I06-WAVE-0.3-BROWSER-ATTRIBUTION.md`. The current run passes Housekeeping and fails in Reports; the baseline full run fails earlier in Housekeeping because the Wave 0.3 repair is absent. The Wave 0.3 diff contains no Reports or analytics implementation changes.

The V11 contracts were fetched read-only from `origin/analysis/operational-flow-definition-v11` and are not merged into the implementation branch. Wave 1.2 adds the Reception contextual reassignment surface and the minimum backend repair required by the real integrated flow; D11, Reports and Users remain otherwise unchanged. The separate discovery branch `definition/operational-ux-workflow-roadmap` has completed its documentation-only definition at artifact A `23b7da3c9836edfaefa2bcf4943ee27f479b2f2a`; it does not clear the Wave 1.2 independent-review requirement or promotion block.

The original investigation categories were:

1. test race;
2. application initialization race;
3. stale/duplicate fetch;
4. hotel-local date mismatch;
5. housekeeping domain/runtime regression;
6. local worker/runtime failure after housekeeping, at the Reports surface.

## GOVERNANCE

- No merge.
- No deploy.
- No acceptance/staging mutation.
- No main mutation.
- No production changes.
- PR remains isolated/draft.
- Wave 1.2 artifact A is published at `47b9fed9300d1a77f5f20ddafadbd79a5514b6b8`; the browser gate remains a promotion blocker and must not be hidden or promoted around.
- Real integrated E2E evidence is recorded for independent fresh success and conflict sessions against local Wrangler Worker/D1 plus Vite preview at mobile width 375px. The success path persisted the reassignment and D11 repricing; the conflict path preserved booking/billing truth and emitted no partial events.
- The integrated run exposed a duplicate `PRICE_RECONCILIATION` insert in the reassignment repository; artifact A removes the duplicate. The receptionist UI uses the existing per-room `maintenance.read` route because the receptionist role does not have `housekeeping.read`; no capability expansion was made.

## APPROVED ROADMAP DEFINITION

Task Contract: `.orchestration/contracts/UX-OPERATIONAL-WORKFLOW-ROADMAP-001.md`
Scope: workflow discovery/definition only; no production code changes.
Artifact: `docs/ux-operational-workflow-roadmap-001.md`.
Invariant evidence: `.orchestration/evidence/UX-OPERATIONAL-WORKFLOW-ROADMAP-001-INVARIANTS.md`.
Proposed P0: Reception/check-in continuity, reassignment, extension, checkout,
Housekeeping. Proposed P1: new/edit reservation, late arrival, no-show,
cancellation, payments, extra charges, Maintenance. Proposed P2:
administrative/read-only work. First workflow recommendation: Reception
arrival→check-in→next-case continuity.

Human Gate decision `UX-ROADMAP-HG-001` approved P0.1 Reception arrival / guided
check-in with conditions. Other P0 workflows remain outside this increment.
Operator frequency is a qualitative proxy because telemetry and interviews
were unavailable. The local acceptance-runtime attempt did not reach the
browser (`invalid maintenance resolve transition` during migration rehearsal);
this is an inspection limitation, not a production finding.

## NEXT ACTION

Obtain a bounded fresh confirmation of exact F0.8 A2 `abd9afdd7537ecef29ad4ae099d769c38b137f6d` + orchestration-only B3 handoff. After the condition is discharged, continue the approved Foundation 0 DAG at F0.9. Do not begin Blocks A–H or touch real data; no PR, push, merge, main, staging mutation, deploy or production.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.
