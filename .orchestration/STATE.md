# HMS Cloudflare — Orchestration State

## BLOCK F — F-ACCOUNT IMPLEMENTATION VALIDATED; ARTIFACT A CANDIDATE READY

- **Authorization:** GitHub Issue #52 latest Controller decision is `CONTROLLER_DECISION: START`, from exact base `39ee0a2b38e7205b8e041e792e16ee469c996241`. Dedicated branch `impl/hms-block-f-account-finance-cash`; F-account only is active. Blocks G–H, promotion, real data and environments remain unauthorized.
- **Frozen Task Contract:** `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`; pre-implementation inventory and requirement/evidence matrix are frozen in `.orchestration/evidence/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-{INVENTORY,EVIDENCE-MATRIX,PRECRITIC}.md`. The final Pre-Critic applies only to F-account and is not an Independent Critic PASS. All 24 registry invariants are classified, and applicable evidence is recorded as PASS.
- **Scope boundary:** Booking/Stay-grain account, charges, payment history/operations and Receivables presentation. Preserve D11, F0.7 settlement, F0.9 charge recovery, server-owned capabilities and F0.11 authoritative refresh. F-cash is not authorized for implementation: real-hotel cashbox owner validation OD-1 remains its separate Product Acceptance/Human Gate. Do not alter Cash behavior or infer shift semantics.
- **Budgets:** JS raw 350000 B; JS gzip 100000 B; CSS raw 60000 B; CSS gzip 15000 B. Any active ceiling breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`; no increase is authorized.
- **Required method:** frozen contract/inventory/evidence matrix/invariants/Pre-Critic → implementation and full evidence → immutable Artifact A → exact orchestration-only Boundary B → fresh Independent Critic → final reconciliation → publish only the dedicated Block F branch → report exact remote SHA/evidence in Issue #52.
- **Current phase:** F-account implementation and local validation are complete under the frozen contract. Browser Back focus is asserted after the scheduled restoration frame by bounded runner repair `HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001`; the integrated Worker/D1/Vite regression passes. This commit freezes the Artifact A candidate; the immediate orchestration-only Boundary B must record its exact full SHA and require a fresh separate read-only Independent Critic. No substantive PASS is self-declared. F-cash remains gated by OD-1; do not claim all of Block F complete. G–H remain unauthorized.
- **Issue #52 is the canonical Controller channel; do not use the Human as relay.**

## HISTORICAL STATE

The following prior Block E and Blocks A–E records are preserved as immutable project history; they are not the active dispatch.

### Block C — initial Artifact A review returned bounded REWORK

- Artifact A: `3e0ea41a53b471993cc60f1f0421b0237ef54055` (`feat: deliver Block C Reception workflows`).
- Boundary B: `e83154dfd0e549fa494e8c90754afe70acd0f9f4`; orchestration-only; exact A identity recorded.
- Independent Critic returned `REWORK` with two MEDIUM findings: duplicate browser-history entry on task close and ineffective initial focus on Reassignment/Checkout headings. Bounded QA also found browser Forward restores Case content without returning focus to the Case heading; this was added to the same frozen continuity/focus repair contract before this follow-up change. Exact record: `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INDEPENDENT-CRITIC-A-B.md`. No ROADMAP_BLOCKER.
- Bounded repair contract `.orchestration/contracts/HMS-BLOCK-C-REPAIR-HISTORY-FOCUS-001.md` was frozen before changes. Repair is validated in replacement Artifact A2. Checkout's bounded rerun reached HTTP 200 and authoritative refresh but its later synthetic local Wrangler reads disconnected; this rerun is explicitly incomplete, while the complete initial Worker/D1 checkout evidence remains and checkout mutation code did not change.
- Replacement Artifact A2 `56e8680b11c6770d409b1d68de2e65924e37e808` + Boundary B2 `091bc86eb31290dc6d18dd7496b7bfe2e96e2d9b` received Independent Critic `PASS`. Exact read-only verdict and closure of the two prior findings: `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INDEPENDENT-CRITIC-A2-B2.md`. The initial A1+B1 `REWORK` remains historical and is not overwritten. Block C is complete and awaits Controller review; this closeout is orchestration/evidence-only.
- Blocks D–H remain NOT AUTHORIZED. Promotion is BLOCKED; no PR, push, merge, main, staging, deploy, production or real-data operation.

### Historical Block B handoffs (superseded)

Artifact A1 `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B1 `903436fcb69e3e412db7a41aeaacde3a8cfa1504` received Independent Critic `REWORK` for the WIDE 1280×600 Queue filter collision. That handoff and its pending-review language are historical only; A1 was replaced by A2, and the finding was repaired. A2+B2 later received `PASS_WITH_CONDITIONS`; the LOW documentation condition was discharged by A2+B3 follow-up `PASS`. B4 is the historical Block B closure; B5 reconciles handoff metadata only. See the exact review records below.

**Prior completed checkpoint (history):** Block A Artifact A `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867` + Boundary B4 `059044abf4478d624d52a7a412aabf306a1ccfce` received Independent Critic PASS. Historical F0 progress below remains historical and does not change current B0 dispatch state. Pending older P0.1/Wave 1.2 reviews remain separate promotion/integration records.

### F0.8 — Recoverable guest + reservation creation — implementation validated; handoff condition closed

- Frozen Task Contract: `.orchestration/contracts/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001.md`; all 24 registry invariants are classified. Local/synthetic only; incomplete stages have no inferred expiry; no Blocks A–H or real-data action.
- Initial immutable substantive Artifact A1: `298545b23e59f8aabfef5a766f76249ee71e856b`. It adds forward migration `0029_reservation_creation_recovery.sql`, a focused operation repository and typed recovery API, stable token/payload replay, truthful guest/booking stage provenance, a Reception new-guest/recover-existing-guest task, executing-D1 tests, integrated Worker/D1/Vite runner and desktop/mobile evidence.
- Validation: `npm run check` 33 files / 151 tests; F0.8 + F0.3 executing-D1 9/9; `npm run types:check`; `npm run web:build`; `npm run architecture:fitness`; `npm run test:d1-query-plan`; API/Web and staging-SPA Wrangler dry-runs; CF-I03/04, CF-I05, CF-I06 serial; `git diff --check`; integrated `scripts/cf-f0-08-reservation-recovery-integrated.sh` exit 0 at 1280×900 and 390×844. JS budget 299642/300000 raw, 86895/100000 gzip; CSS 40668/50000 raw, 8000/15000 gzip. Latest integrated log and screenshots are in Artifact A under `output/playwright/f0-08-*`; owned Worker/Vite process cleanup was verified.
- Internal QA reviewer Beauvoir (read-only GPT-6 Luna Medium) identified seven technical/evidence gaps; each was repaired and directed/integrated evidence rerun. This reviewer is not the Independent Critic. Pre-Critic and invariant evidence are included in A. The broad product-flow runner's missing-`playwright` caveat remains explicitly unclaimed; F0.8 has its own Playwright CLI integration.
- Fresh separate Independent Critic Jason (GPT-6 Luna Medium, read-only) reviewed A1+B1; verdict `REWORK`, with no architecture contradiction or ROADMAP_BLOCKER. HIGH: an original GUEST_CREATED operation became invisible if a distinct booking for that guest succeeded; MEDIUM: integrated mobile ran at 390px instead of the contract's 375px. Reviewer ran no tests and made no edits. Exact evidence is `.orchestration/evidence/HMS-F0-08-GUEST-RESERVATION-RECOVERY-001-INDEPENDENT-CRITIC-A1-B1.md`.
- Bounded Rework Contract `.orchestration/contracts/HMS-F0-08-REPAIR-RECOVERY-LIST-375-001.md` was frozen before code changes. Repairs preserve the original GUEST_CREATED operation in recovery list after a distinct booking and prove the same browser operation at 375×844. Fresh F0.8 D1 7/7, full suite 33/151, types/build/architecture/budgets/query plans/Wrangler dry-runs and integrated Worker/D1/Vite/browser all pass; CF-I03/04, CF-I05, CF-I06 passed immediately before the narrow correction and did not cover the changed list predicate.
- Replacement immutable substantive Artifact A2: `abd9afdd7537ecef29ad4ae099d769c38b137f6d`. It contains the bounded repair and fresh evidence. Its exact A2+B2 Independent Critic review is recorded below; the A1 verdict remains historical and is not carried forward. Foundation 0 remains open.
- Locke (fresh separate read-only GPT-6 Luna Medium) reviewed exact A2 `abd9afdd7537ecef29ad4ae099d769c38b137f6d` + B2 `9492f6ba4b866e2e4fefa0fd5a1ae921c1f1ef60`, verdict `PASS_WITH_CONDITIONS`: confirms both A1 findings closed; only MEDIUM condition is B2 `runtime_status=RUNNING` while awaiting Critic. No product edits/tests by reviewer, no architecture contradiction/ROADMAP_BLOCKER. Evidence: `.orchestration/evidence/HMS-F0-08-INDEPENDENT-CRITIC-A2-B2.md`.
- Bounded condition follow-up on A2 `abd9afdd7537ecef29ad4ae099d769c38b137f6d` + B3 `482c8f782087f8cc195ca74d3aee43b887c58d50` returned `PASS`: exact artifact retained, stopped status explicit, resume disabled while review required, and existing dispatcher denies resume. Evidence: `.orchestration/evidence/HMS-F0-08-INDEPENDENT-CRITIC-A2-B3-FOLLOWUP.md`. The A2+B2 verdict remains historically `PASS_WITH_CONDITIONS`; its sole condition is discharged, not rewritten as an unconditional verdict. F0.8 continuation is authorized.
- Metadata-only condition repair contract `.orchestration/contracts/HMS-F0-08-REPAIR-REVIEW-HANDOFF-STATUS-001.md` was frozen before B3. A2 remains unchanged; no tests were needed for this metadata-only follow-up. Next step is the next approved Foundation 0 contract increment, not Blocks A–H.

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

## F0.11 — Refresh/invalidation and authoritative UI continuity (Development Gate PASS)

- Frozen Task Contract: `.orchestration/contracts/HMS-F0-11-AUTHORITATIVE-REFRESH-001.md`; all 24 registry invariants classified before implementation.
- Pre-implementation Contract Reviewer Laplace (separate read-only GPT-6 Luna Medium) returned eight bounded precision/evidence findings and no blocker; amendments and disposition are in `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-PRECRITIC.md`.
- Implementation: Rooms latest-response guard; Billing booking/account identity guard and atomic account snapshot; Reception selected-booking detail GET fallback when absent from queue (clear only on authoritative 404). No backend/API contract or schema mutation. Existing Housekeeping sequencing retained and regression-tested.
- Final mandatory Pre-Critic: PASS, `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-PRECRITIC-FINAL.md`; all 24 invariants mapped in `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-INVARIANTS.md`, with no applicable UNPROVEN entry.
- Mock-only deferred response browser: PASS across Rooms, Billing (including every account subread failure), Reception (200/404/500 and late selection response), and Housekeeping recovery. Evidence `output/playwright/f0-11-refresh-races.log`; explicitly MOCK ONLY.
- Integrated local Reception→check-in→Worker/D1→authoritative board read: PASS on fresh synthetic fixtures at mobile 375×812 and desktop 1280×900. Both returned mutation 200/read 200, CHECKED_IN, preserved arrivals lane/search, selected `z-priority`; read-only D1 checks prove one actor/hotel CHECK_IN event, room OCCUPIED, invoice unchanged at 36,000/PENDING, no payment entries. Evidence `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-INTEGRATED.md` and paired browser logs/screenshots.
- Bounded Critic evidence repair contract closed the four prior conditions. Its deterministic browser now proves Rooms retain/clear, Billing stale identity/failure recovery, Reception authoritative 200/404/500 behavior, and Housekeeping date/filter/search/selected room/scroll/Next behavior. A real `scrollY 600→0` defect discovered by that test was repaired under separate frozen contract `HMS-F0-11-HOUSEKEEPING-REFRESH-CONTINUITY-002`; loaded board stays visible during refresh and task/mutation actions are disabled until the authoritative read completes.
- Built/minified UI + local Worker/D1 Rooms mutation/read: fresh fixture PASS at 375×812 and 1280×900; create 201, authoritative read 200, search preserved. Final bundle uses existing Terser compression settings `passes: 4`, `pure_getters: true`.
- Fresh final validation: `npm run check` PASS, 33 files/168 tests; `npm run types:check` PASS; `npm run web:build` PASS; architecture fitness/i18n/Cloudflare budgets PASS; D1 query plans PASS; explicit API/Web/staging-SPA Wrangler dry-runs PASS; CF-I03–CF-I06 regressions PASS; syntax/process cleanup PASS. Detailed logs are in the replacement A2.
- Final budget binding unchanged: JS raw 299,990/300,000 bytes, gzip 86,226; CSS raw 43,399/50,000, gzip 8,383/15,000. The 10-byte raw-JS headroom is recorded as a maintenance risk, not a waiver.
- A mistaken `npm run wrangler:dry-run` invocation exposed that the package script does not validate web/staging (it ends with `--help`). It was not counted; explicit three-config dry-runs passed. No package-script scope expansion.
- Original immutable F0.11 Artifact A1 is `ef4d9ee39e04229fafcfdcc44fcfbf37977e0306`; its reviewed boundary B2 is `d7b2067a9e891607f4860c07916559a0782eb041`. The A1+B2 Critic conditions are preserved as history and do not carry to A2.
- Initial orchestration-only boundary commit `58c4c6cdd563790b591d57119a0f09cbbe9e7059` set `external_review.required=true` and pointed at exact A, but its human-readable `f0_11_boundary_b` field incorrectly remained `PENDING`. It is retained as immutable history.
- Reconciled orchestration-only B2 `d7b2067a9e891607f4860c07916559a0782eb041` names exact Artifact A `ef4d9ee39e04229fafcfdcc44fcfbf37977e0306`. Fresh Independent Critic Lorentz (`gpt-6-luna`, medium, read-only) returned `PASS_WITH_CONDITIONS`: four bounded evidence gaps, no demonstrated product defect/blocker. Full finding is `.orchestration/evidence/HMS-F0-11-INDEPENDENT-CRITIC-A-B2.md`.
- Bounded evidence and Housekeeping repair contracts, admission/final Pre-Critic and all-24 invariant evidence are frozen in `.orchestration/contracts/` and `.orchestration/evidence/`. Euler's fresh A2+B4 `REWORK` was limited to the stale review pointer and immutable historical B3 wording; Euler also verified the prior substantive evidence conditions and found no product defect or blocker. Ohm's separate fresh read-only review of exact A2+B5 returned `PASS`, closing those handoff conditions. The reports are linked above; this combined disposition closes F0.11 only and is not a Foundation 0 aggregate verdict.
- Replacement immutable Artifact A2 is `f7c8d28db1ce1dd6839f1f182260537f0e2d4898` (commit `test: close F0.11 critic evidence conditions`); it contains the scoped Housekeeping refresh correction, exact budget/browser/regression output, scripts and Pre-Critic evidence. Unrelated working-tree changes are excluded.
- Unrelated working-tree edits to historical F0.9/P0.1 evidence/harness and non-final F0.11 diagnostics remain uncommitted and excluded from A; they are preserved, not silently discarded.
- Foundation 0 remains NOT complete. F0.12 is still required after F0.11 and must have its own Task Contract. No Blocks A–H, real data, PR/push/merge, main, staging mutation, deploy or production.

## F0.11 CRITIC HANDOFF RECONCILIATION

- Fresh Independent Critic Euler reviewed exact A2 `f7c8d28db1ce1dd6839f1f182260537f0e2d4898` + B4 `173aed525d42198012d89d386ff60eafe3138e78`; verdict `REWORK` for two metadata/evidence-handoff findings only. No product defect, `ROADMAP_BLOCKER`, architecture contradiction, data-risk finding or scope issue. Full review: `.orchestration/evidence/HMS-F0-11-INDEPENDENT-CRITIC-A2-B4.md`.
- Frozen bounded contract `.orchestration/contracts/HMS-F0-11-CRITIC-HANDOFF-RECONCILIATION-001.md` and Pre-Critic `.orchestration/evidence/HMS-F0-11-CRITIC-HANDOFF-RECONCILIATION-001-PRECRITIC.md`; all 24 invariants recorded in the matching `-INVARIANTS.md` file.
- A2's B3 references remain immutable historical packaging text. B4 superseded B3 for the stale F0.10 field; orchestration-only B5 identified exact A2 and recorded the B4 `REWORK`; Ohm reviewed that exact A2+B5 pair and passed the handoff reconciliation. The review record is `.orchestration/evidence/HMS-F0-11-INDEPENDENT-CRITIC-A2-B5.md`. No product artifact changed after A2.

## NEXT ACTION

F0.12 Task Contract and admission Pre-Critic are frozen after separate read-only Contract and DB/Data review. Build the row-level evidence crosswalk, run the required clean synthetic rehearsals and full authorized local validation, and keep any unsupported criterion UNPROVEN. Leave real-data execution prohibited. Foundation 0 is NOT complete until F0.12's aggregate evidence gate closes and its exact artifact is independently reviewed.

## MODEL ROUTING

- Orchestrator: Luna LOW.
- Browser investigation/QA: Luna MEDIUM.
- Repair: Luna LOW or MEDIUM according to demonstrated complexity.
- Sol MEDIUM only after a substantive Luna MEDIUM investigation is insufficient.

## F0.12 ARTIFACT A / CRITIC BOUNDARY

- At the original A/B boundary, F0.1–F0.11 were individually closed and F0.12 was still pending; this was the historical state before A2+B2 review.
- F0.12 immutable Artifact A: `2d814a71c7a6e0d6cfc3e9dadb36eaabb84ee1c2` (`docs: assemble F0.12 aggregate evidence artifact`). It contains the exact input/evidence index, row-level cutover/bootstrap crosswalk, deterministic manifest validator and tests, generated aggregate report, invariant evidence, final Pre-Critic, DB/Data review, and fresh validation receipts.
- Aggregate report: `.orchestration/evidence/HMS-F0-12-AGGREGATE-EVIDENCE-MANIFEST-A.json`; SHA-256 `6dfab6de24a2f20bba784967549a34f413374a57201f6f239a581228f59511d0`. It records 24 criteria, 16 validation receipts, 7 synthetic records and 64 hash-pinned evidence files; candidate `PASS_PENDING_INDEPENDENT_CRITIC`, no aggregate blockers, `foundation0Complete=false`. `stay-a` is the only synthetic activation candidate; held/unresolved rows stay excluded.
- Final evidence: repository check 33 files/168 tests PASS; types, web build, architecture/i18n/budgets, D1 query plans PASS; strict serial CF-I03–I06 PASS; F0.3 clean synthetic D1 rehearsal twice PASS; F0.6 executing-D1 11/11 PASS; Wrangler API/Web/staging-SPA dry-runs PASS. Two final report generations are byte-identical. The final Pre-Critic is internal only.
- Bounded evidence limits are preserved in the crosswalk and DB/Data review; no universal legacy-corpus, real-data readiness, production routing, or full-paid/overpaid activation-preservation claim is made.
- No real/customer data was read or mutated. No product source or migration changed; no Blocks A–H, PR, push, merge, main, staging mutation, deploy or production action occurred.
- Historical pair A `2d814a71c7a6e0d6cfc3e9dadb36eaabb84ee1c2` + B `4b5fd55aef69b68123b67352938445cab5f60e61` received Independent Critic `REWORK` (IC-F0.12-01); see `.orchestration/evidence/HMS-F0-12-INDEPENDENT-CRITIC-A-B.md`. This was an evidence-integrity finding, repaired without product changes.
- F0.12 replacement immutable Artifact A2: `7c443474923827343f1ec719d70f0734c1920fa3`. The final input-index SHA-256 is `f47b482a3bd4a7a455ab8b43043db7e85d7ac018932eca149dcfe4ea3552ad75`; the published aggregate report `.orchestration/evidence/HMS-F0-12-AGGREGATE-EVIDENCE-MANIFEST-A2.json` SHA-256 is `26f6d2d42dab9b6ce028dcc454b9573cd34b2d3e70a2e322e87866486d3099e7`. Two independent report generations, the replay output and the published report all match that exact digest; the immutable receipt is `.orchestration/evidence/f0-12-runs/aggregate-manifest-determinism-final-2026-09-29.log`.
- The reusable evidence-integrity rule is now recorded under INV-EVID-001 in `.orchestration/INVARIANTS.md`. Final Pre-Critic and invariant evidence document that IC-F0.12-01 was repaired and why the output digest receipt is deliberately excluded from its own input index.
- Independent Critic Parfit (fresh separate read-only GPT-6 Luna Medium) reviewed exact A2+B2 and returned `PASS`; the full report is `.orchestration/evidence/HMS-F0-12-INDEPENDENT-CRITIC-A2-B2.md`. It independently regenerated and compared both outputs to the exact A2 manifest; all three report SHA-256 values match. The previous A+B REWORK and its repair remain preserved.
- `F0.12 DEVELOPMENT GATE: PASS`; aggregate manifest candidate and exact-pair Independent Critic PASS satisfy the F0.12 gate. `FOUNDATION_0_COMPLETE_AWAITING_CONTROLLER_REVIEW`: PASS for F0.1–F0.12 only. Foundation 0 implementation is complete; no Blocks A–H are started or authorized by this boundary.
- Promotion/live-data gates remain blocked: no customer data access or mutation, real cutover/bootstrap, PR, push, merge, main, staging mutation, deploy or production action. `resume_authorized=false`; next action is Controller review of the completed Foundation 0 package. Do not begin Block A until a new Controller authorization.

### Block B — bounded Independent Critic rework

Fresh read-only Independent Critic reviewed exact A `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B `903436fcb69e3e412db7a41aeaacde3a8cfa1504`; verdict REWORK, one MEDIUM finding: WIDE 1280×600 Queue filter labels/counts visually collide, and the runner lacks geometry/operation assertion at that width. Evidence is `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INDEPENDENT-CRITIC-A-B.md`.

Frozen bounded repair contract: `.orchestration/contracts/HMS-BLOCK-B-REPAIR-WIDE-QUEUE-FILTERS-001.md`. It authorizes only responsive Queue filter presentation, exact viewport executable assertion, evidence and orchestration. Artifact A/B above remain immutable. Fix, validate all required gates, publish replacement A + orchestration-only B, and request a fresh Independent Critic. This is routine rework, no Human Gate.

A required Wave12 reassignment run initially timed out waiting for the success status after HTTP 200. The frozen verification contract `.orchestration/contracts/HMS-BLOCK-B-REPAIR-REASSIGN-SUCCESS-NOTICE-001.md` records the initial diagnostic hypothesis. Reinspection of immutable Artifact A1 confirms the existing notice was already assigned after close and authoritative refresh; no source change was made for that check. A fresh isolated Worker/D1 rerun observed the success status, authoritative destination refresh and mobile stale 409. This non-reproduced timeout is classified as a transient runner observation, not a confirmed product defect; see `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-REWORK-DISPOSITION-001.md`.


### Replacement Artifact A2 / Boundary B2 handoff

- Artifact A2: `c11e3d667cdd2f54834ad07a06c4485755b0cfc0`; previous A1 `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B1 `903436fcb69e3e412db7a41aeaacde3a8cfa1504` received Independent Critic `REWORK` (one MEDIUM WIDE 1280×600 filter collision), repaired under frozen contract and fully revalidated.
- A2 changes only the Queue filter presentation and adds the missing exact viewport assertions, plus evidence. Wave12's first success-status timeout did not reproduce; immutable A1 source already had correct notice ordering and A2 adds no source change for that verification.
- Boundary B2 is orchestration-only, records exact A2 and requires a fresh separate read-only Critic. `resume_authorized=false`. Do not modify A2 during review.
- No C–H, real data, PR, push, merge, main, staging, deploy or production.


### Independent Critic condition on A2+B2

Fresh separate read-only Critic reviewed exact A2 `c11e3d667cdd2f54834ad07a06c4485755b0cfc0` + B2 `c2c418628effc0af848090fe303eedecc4b0abc9`, verdict `PASS_WITH_CONDITIONS`: the prior MEDIUM WIDE filter finding is closed; one LOW traceability condition asks to clarify that the Wave12 success-status timeout was not a Critic finding and no code defect/source repair was confirmed. Full review is `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INDEPENDENT-CRITIC-A2-B2.md`. Repair is documentation-only in the Pre-Critic copy; A2 and B2 remain immutable. Boundary B3 requests bounded read-only confirmation of exact A2+B3.

### Boundary B3 — A2+B2 traceability condition correction

The A2+B2 Critic verdict remains historically `PASS_WITH_CONDITIONS`; its sole LOW condition identified inaccurate Pre-Critic wording that called the separate, non-reproduced Wave12 timeout a Critic finding. The Pre-Critic and invariant evidence now distinguish the closed A1+B1 MEDIUM filter finding from that regression-runner observation. Immutable A2 and B2 are unchanged; no product code or tests changed. Boundary B3 requests fresh bounded, read-only confirmation of exact A2 + B3. `resume_authorized=false`; external review remains required.

### BLOCK_B_COMPLETE_AWAITING_CONTROLLER_REVIEW — Boundary B4

The fresh separate read-only Independent Critic returned `PASS` for the bounded condition follow-up on exact Artifact A2 `c11e3d667cdd2f54834ad07a06c4485755b0cfc0` + Boundary B3 `35c4d71704632aa13a008bac20f90e337971a1ba`. The sole LOW wording condition from A2+B2 is discharged; the historical `PASS_WITH_CONDITIONS` verdict is preserved. Follow-up report: `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INDEPENDENT-CRITIC-A2-B3-FOLLOWUP.md`.

Block B is complete and awaits external Controller Review. This is not Human Product Acceptance. `resume_authorized=false`, `external_review.required=true`; no C–H work is started or authorized. No PR, push, merge, main, staging, deploy, production or real-data action occurred.

### Block C completion record — Artifact A2 and Boundary B2

- Block C implementation is complete under frozen Task Contract `.orchestration/contracts/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001.md`; frozen inventories, evidence matrix, invariant map and admission Pre-Critic are retained. Final implementation evidence and limitations: `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-RESULTS.md`.
- New Reservation, Edit Reservation, Check-in, Reassignment and Checkout are validated as focused Case tasks against current contracts. Extension, No-show and Late Arrival are `DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT`; no new backend/domain/API contract was introduced.
- Full validation: Vitest 35 files / 175 tests; TypeScript/API/Web generated types; production build; architecture/i18n/budgets; D1 query plans; Worker/Web Wrangler dry-runs; integrated local synthetic Worker/D1/browser flows, responsive states, keyboard/focus, navigation, stale/partial reads, conflicts and context restoration. All PASS. Exact receipts/screenshots are listed in the results report.
- Critical-path regression proves Queue visible at 2,601 ms and screenshot at 2,728 ms while `/rooms`, `/guests` and `/reservation-creation-operations` remain pending through 5,293/6,297/6,397 ms. This verifies causal independence; localhost timing is not a performance target. No after FCP/LCP measurement is claimed.
- Bundle baseline/result/delta is in the results report; all current ceilings pass and remain unchanged. A2 JS raw/gzip is 321,619/91,486 B and CSS raw/gzip is 54,937/10,119 B. Raw ceilings remain development growth guardrails.
- Fresh separate read-only Independent Critic returned PASS on exact A2 `56e8680b11c6770d409b1d68de2e65924e37e808` + B2 `091bc86eb31290dc6d18dd7496b7bfe2e96e2d9b`. Initial A1+B1 REWORK remains historical; the exact verdict is recorded in `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INDEPENDENT-CRITIC-A2-B2.md`. Block C is complete and awaits Controller review.
- Blocks D–H remain NOT AUTHORIZED; promotion remains blocked; `resume_authorized=false`. No PR, push, merge, main, staging, deploy, production or real-data action occurred.
