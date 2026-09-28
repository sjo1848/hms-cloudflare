# HMS-F0-04-REASSIGNMENT-INTERVAL-001 — Pre-Critic Gate

Status: `IMPLEMENTER GATE PASS AFTER CRITIC REWORK; FRESH INDEPENDENT CRITIC REQUIRED`
Artifact candidate: replacement F0.4 implementation plus its test/evidence files
Task Contract: `.orchestration/contracts/HMS-F0-04-REASSIGNMENT-INTERVAL-001.md`

This is the mandatory implementer Pre-Critic, not an Independent Critic verdict or aggregate Foundation 0 acceptance.

## 1. Contract completeness

- Active F0.4 Task Contract and 24-invariant map exist.
- The controlling pricing authority remains Foundation 0 Authorization §9 + Reconciliation 007 Amendment C: F0.4 preserves billing; F0.5 owns segmented pricing. No product ambiguity was invented.
- Scope remains remaining-night interval, existing room dimensions/versions, truthful reassignment event, current Reception interval/conflict behavior, and synthetic evidence only.
- No real-data/cutover/bootstrap access, Blocks A–H, PR, merge, main, staging or deployment occurred.

## 2. Source/contract parity

- `effective_date = max(check_in, hotel_local_date)` is authoritative and shared by candidate lookup, UI date preview, API command result, inventory movement and event.
- Only `[effective_date, check_out)` moves. Historical source claims remain intact. `hotel_local_date >= check_out` rejects.
- Destination is distinct, physically available, inventory/hold-free and not BLOCKING-maintained; NON_BLOCKING is advisory.
- Old room becomes DIRTY (or MAINTENANCE/OUT_OF_ORDER where canonical conditions require); destination becomes OCCUPIED. Unrelated unresolved source service dimension is preserved.
- F0.4 never changes booking total, invoice, extra charges, payment ledger or financial events; VOIDED/mismatched ledger still fails closed.

## 3. Mutation/concurrency sweep

- Repository snapshots are tied to conditional booking identity and exact room-state versions; the complete source date set is compared to the expected interval before mutation and revalidated by the first conditional write, while the final D1 event guard checks exact elapsed and destination date sets. Trigger guards bind the exact event to the server-only operation token.
- Competing same-booking/same-target requests and two bookings competing for one destination each prove at most one winner with loser state unchanged.
- ABA/version reuse is prevented by monotonic room state versions plus unique consumed-version indexes. A deterministic destination state ABA (`AVAILABLE → OUT_OF_ORDER → AVAILABLE`) advances the version and rejects the stale snapshot. Equal-count wrong-date source-claim substitution after snapshot rejects without partial state.
- Final event guard failure rolls back booking assignment, inventory, both room projections/versions and event.
- D1 result interpretation does not claim that an after-batch JavaScript check can roll back committed statements.

## 4. Security sweep

- Existing backend `bookings.write` capability remains authoritative; local Worker evidence establishes an active authenticated housekeeping membership, receives 403, and asserts zero booking/room/event drift.
- Hotel A request cannot retrieve/reassign a booking stored only in HOTEL_SECOND_DB; it receives 404, and the foreign booking, claims and event set are asserted unchanged.
- Successful receptionist/admin local Worker path is exercised through the app proxy and selected hotel D1.

## 5. UX and responsive sweep

- Existing Reception reassignment task is preserved; there is no redesign or new backend abstraction.
- Browser operation proves desktop selection, reason validation, BLOCKING-disabled destination, NON_BLOCKING advisory, success refresh to authoritative destination, and mobile stale 409 recovery without losing task context.
- The 409 message is asserted after refresh; this catches and repairs the actual error-clearing defect found in the integrated run.
- Exact widths: desktop 1280×900, mobile 375×812. Screenshots are diagnostic; executable assertions are the evidence.

## 6. Browser/integration evidence

Command: `bash scripts/cf-wave12-reassignment-integrated.sh`

The passing run used a fresh temporary Wrangler persistence directory, clean migrations through 0024, local API Worker + Vite, two synthetic hotel D1s and Playwright. It verified:

- same hotel-local half-open interval for availability query, visible date preview and API mutation response;
- successful destination update and authoritative Reception board refresh;
- BLOCKING rejection and NON_BLOCKING advisory eligibility;
- reason `minLength` client validation;
- housekeeping capability 403 with zero D1 drift;
- cross-tenant 404 with foreign D1 unchanged;
- post-snapshot BLOCKING case causes HTTP 409, refreshed current room and retained actionable UI conflict;
- final D1 booking, room status, exact room-night counts, invoice, payment ledger, lifecycle event and financial event assertions;
- desktop and mobile screenshots at `output/playwright/f04-reassignment-desktop-success.png` and `output/playwright/f04-reassignment-mobile-conflict.png`.

Three console error entries are not hidden: the browser records the expected missing favicon 404, the initial “no maintenance case” lookup 404 for the race fixture, and the intentionally asserted reassignment 409. The Worker log has no 5xx; the runner's explicit response assertions determine expected status.

## 7. Migration finding and repair

Finding `F0.4-MIG-01`: clean local Wrangler migration application stopped at `0024_reassignment_interval_room_versions.sql` with `incomplete input: SQLITE_ERROR`; tests in a different executing-D1 fixture were not accepted as sufficient evidence.

Root cause was isolated by executing each trigger separately in disposable D1. Wrangler's local D1 SQLite parser returned `incomplete input` for trigger predicates containing scalar `CASE` expressions (the effective-date equality and old-room/maintenance projection predicates). Smaller guards without those predicates applied. Replacing those `CASE` expressions with equivalent explicit boolean branches and keeping each fail-closed check in its own `BEFORE INSERT` trigger made the complete clean chain 0001–0024 apply successfully. The business interval/projection semantics are unchanged.

After the Independent Critic repair, the full executing-D1 reassignment suite passed (9/9), synthetic room-state rehearsal passed (2/2 with deterministic schema/migration/source/report hashes refreshed), and the integrated Worker/D1 browser flow exited 0. No history migration was edited; 0024 remains additive/forward-only.

## 8. Full regression and scope audit

Fresh recorded results after the first Independent Critic REWORK and repair:

- `npm run check`: 30 files / 125 tests PASS.
- `npm run types:check`: PASS.
- isolated production web build directed to `/tmp/hms-f0.4-rework-web`: PASS; the existing `apps/web/dist` was preserved.
- `npm run architecture:fitness`: architecture boundaries, i18n, and Cloudflare budgets PASS (JS 296,633 raw / 86,178 gzip; CSS 39,735 / 7,838).
- `npm run test:d1-query-plan`: PASS on an isolated temporary DB; arrivals use `idx_bookings_status`; checkout uses `idx_bookings_status_checkout`; room nights use their composite key.
- `npm run wrangler:dry-run`: API and Web PASS; no deploy.
- `bash scripts/cf-i03-regression.sh`: `CF-I03 + CF-I04 lifecycle D1/API regression PASS` using a disposable D1 directory and a hotel-local-date-relative fixture.
- clean Wrangler migration chain: 0001–0024 PASS via the isolated integrated runner (exit 0); executing-D1 migration chain also passes in the directed tests.
- `git diff --check`, `bash -n` for changed regression runners: PASS.

The legacy regression's first re-run exposed a fixed 2026-09-27 assumption while hotel-local date was 2026-09-28. The fixture now derives check-in/check-out and expected elapsed/remaining claim ranges from `America/Argentina/Mendoza`; the same meaningful interval is asserted without sleeps or inflated timeouts.

## 9. Findings discovered and repaired

| Finding | Repair | Verification |
|---|---|---|
| `F0.4-MIG-01`: D1 `CASE` trigger predicates parsed as incomplete input | Equivalent boolean branches; split fail-closed trigger guards | Clean Wrangler migration chain 0001–0024 plus executing-D1 tests |
| `F0.4-UX-01`: `load()` cleared 409 error before it was visible | Refresh authoritative booking/room context first, then reassert the operational conflict | Integrated browser asserts retained 409 guidance and refreshed room |
| `F0.4-QA-01`: browser helper used unavailable URL global / stale queue endpoint / strict multi-match assumption | Read URL params with browser-safe string parsing, observe `/front-desk/board`, assert all newly blocked options | Passing targeted integrated Playwright run |
| `F0.4-QA-02`: browser context's extra headers overrode a simulated role change | Move RBAC proof to direct Worker request with explicit identity; assert 403 and zero drift | Integrated Worker/D1 script |
| `F0.4-CF-01`: CF-I03 expected fixed hotel date and used default Wrangler persistence | Date-relative fixture; all regression Wrangler operations use disposable `tmp_dir/wrangler-state` | CF-I03/CF-I04 PASS |
| `F0.4-QP-01`: query-plan runner recursively deleted repository `.wrangler/state` | Runner now uses an owned temporary persistence directory and only removes that exact temp fixture | `npm run test:d1-query-plan` PASS; repository `.wrangler/state` is not targeted |
| `F0.4-IC-01`: source room-night claims were validated by count, allowing an equal-count wrong-date substitution; ABA evidence was indirect | Compare the complete ordered source date set before the write, revalidate exact expected elapsed and destination date sets in the D1 event guard, add equal-count substitution and destination visible-state ABA interleaving tests; promote exact-set validation into `INV-ATOMIC-001` | Fresh executing-D1 9/9; `npm run check` 30/125; integrated Worker/D1/browser exit 0; `cf-i03` exit 0; query plans/build/budgets/types/Wrangler dry-runs PASS |

## 10. Scope audit and publication boundary

- Diff affects F0.4 lifecycle, local Reception interval/conflict behavior, forward migration 0024, deterministic synthetic runners, F0.3 pinned source/schema digests affected by the new migration, and orchestration evidence.
- No pricing logic, payment entries, unrelated modules, production data, migration history, promotion surface or Blocks A–H were added.
- First Independent Critic (Dalton, fresh read-only GPT-6 Luna Medium) reviewed A `726bcecf9dfad0e8000bd2eab10249055d0d32c8` + B `4b1cf693590dacc0e17fac82d6557f13610f8ed1` and returned `REWORK`: HIGH count-only room-night validation; MEDIUM direct visible-state ABA evidence missing; standalone rerun was not completed. Rework added exact-set checks and both adversarial cases; this replacement is a new artifact and requires a different fresh critic after publication.
- Replacement Artifact A will be frozen only after fresh complete rerun below. Boundary B will change orchestration/evidence only, record exact A, set `external_review.required=true`, and keep `resume_authorized=false` until the exact-pair Independent Critic verdict is persisted.
- No Codex substantive PASS is declared here. F0.4 remains pending Independent Critic; Foundation 0 remains open.
