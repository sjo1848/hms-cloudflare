# F0.8 Critic Rework — Recovery Visibility and 375px

Task Contract: `.orchestration/contracts/HMS-F0-08-REPAIR-RECOVERY-LIST-375-001.md`
Reviewed prior pair: A1 `298545b23e59f8aabfef5a766f76249ee71e856b` + B1 `5d6e9b37a58554a5b3d4e74bdf13ed7db7a09219`
Reviewer: Jason, independent/read-only GPT-6 Luna Medium. Verdict `REWORK`; no architecture contradiction or ROADMAP_BLOCKER.

## Findings → repair → evidence

### F0.8-IC-A1-01 (HIGH): incomplete operation became invisible

Cause: `D1ReservationCreationRepository.listIncomplete()` filtered out a staged guest whenever a different confirmed booking for that guest existed. Reception's explicit recovery flow intentionally creates a distinct operation token for that guest, so the original operation could remain `GUEST_CREATED` forever while vanishing from the persisted recovery list.

Repair: removed the unrelated-booking `NOT EXISTS` predicate. The recovery list now reflects only the original operation's own stage; no new stage, auto-completion, expiry or cleanup behavior was introduced.

Evidence:

- `reservation-creation.executing-d1.test.ts` now creates an incomplete guest operation, creates a successful reservation for the same guest under a different operation token, and asserts the original token remains `GUEST_CREATED`, listed and byte-for-byte financially untouched. The distinct completed token is absent from the incomplete list. F0.8 executing-D1 suite: 7/7 PASS.
- Integrated browser creates a BLOCKING-room conflict, reloads Reception, uses that guest in a separate operation, observes successful booking and refreshed queue, and asserts the original operation still appears in the recovery list.
- Final isolated D1 assertion requires exactly one remaining `GUEST_CREATED` operation for the recovery guest after the second booking; it no longer reuses the predicate that caused the defect.

### F0.8-IC-A1-02 (MEDIUM): wrong mobile width

Cause: browser used 390×844 instead of the frozen contract's required 375px.

Repair: the same actual mobile create interaction now runs at 375×844.

Evidence: latest integrated run completes new guest creation, availability selection, booking mutation and authoritative queue refresh at 375×844. Updated screenshot: `output/playwright/f0-08-reception-recovery-mobile.png`.

## Fresh validation after the repairs

- F0.8 executing-D1: 7/7 PASS.
- `npm run check`: 33 files / 151 tests PASS.
- `npm run types:check`: PASS.
- `npm run web:build`: PASS; JS 299,642 bytes raw / 86,895 gzip; CSS 40,668 raw / 8,000 gzip.
- `npm run architecture:fitness`: PASS, including architecture-II, i18n coverage and Cloudflare budgets.
- `npm run test:d1-query-plan`: PASS.
- Wrangler API + Web `--dry-run`: PASS; staging SPA config `--dry-run`: PASS, no staging mutation.
- Integrated local Worker + clean migrated D1 + Vite + Playwright at desktop 1280×900 and mobile 375×844: exit 0; exact output/screenshot evidence in `output/playwright/f0-08-*`; process cleanup verified.
- CF-I03/04, CF-I05 and CF-I06 were run serially and passed immediately before this list/viewport-only critic repair. The repaired behavior is directly covered by the fresh full suite and integrated Worker/D1 browser above; no checkout, housekeeping, billing or report behavior was changed.
- Route methods are unique: one GET incomplete-list handler, one GET token-detail handler and one POST create handler in `apps/api/src/routes/bookings.ts`.
- `git diff --check`, `bash -n` integrated runner and STATUS JSON parsing pass.

## Transparent harness note

Two early rework test attempts failed because the new D1 case reused operation tokens from later cases in the same shared synthetic database. The fixture now uses unique token IDs and the final directed/full suites pass. An initial browser pass exposed a stale final-D1 oracle retaining the old hiding predicate; the oracle now asserts exactly one unresolved original stage, and the integrated runner was rerun successfully after that correction.

No real/customer data, remote D1, cutover/bootstrap, Blocks A–H, PR, push, merge, main, staging mutation, deploy or production was used. This is F0.8 rework evidence, not an Independent Critic verdict or Foundation 0 aggregate PASS.
