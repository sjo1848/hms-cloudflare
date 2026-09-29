# Final Pre-Critic — F0.11 Critic Conditions Repair

Task Contracts: `.orchestration/contracts/HMS-F0-11-CRITIC-CONDITIONS-EVIDENCE-REPAIR-001.md` and `.orchestration/contracts/HMS-F0-11-HOUSEKEEPING-REFRESH-CONTINUITY-002.md`.

## Critic conditions

1. **Exact budget evidence — PASS.** Captured final build and budget invocation: JS raw 299,990/300,000 B; gzip 86,226/100,000 B; CSS raw 43,399/50,000 B; gzip 8,383/15,000 B. Exact output is in `output/playwright/f0-11-web-build.log` and `f0-11-architecture-budgets.log`.
2. **Rooms retain/clear selection — PASS.** The deterministic browser preserves Room 711 when its identity remains in the authoritative list and clears its selected details when the list no longer contains it.
3. **Housekeeping context/scroll/next — PASS.** The deterministic browser checks date 2026-09-28, Ready filter, STANDARD search, Room 800 selection and window scroll across in-place refresh. It asserts known `Next task` Room 713→712, no advancement after failed authoritative reread, explicit recovery and 712→713 next behavior. The first test reproduced actual scroll loss 600→0; the bounded HousekeepingPage repair keeps the loaded board rendered and disables stale task/mutation controls while the new read is pending. Mock evidence is explicitly not represented as integrated.
4. **Integrated console evidence — PASS.** Fresh 375×812 and 1280×900 Worker/D1 Reception runs return `pageErrors: []`; no console message has type `error`. Only Vite `debug` and React DevTools `info` are recorded. The mock test's expected injected HTTP 404/500 resource errors are separately classified and not confused with integrated runtime errors.

## Required validation

- `npm run check`: PASS, 33 files / 168 tests.
- `npm run types:check`: PASS.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS, including architecture II, i18n and exact Cloudflare budgets.
- `npm run test:d1-query-plan`: PASS.
- API, Web and staging-SPA Wrangler `deploy --dry-run`: PASS; no deployment performed.
- CF-I03, CF-I04, CF-I05 and CF-I06: PASS, serially using isolated local/synthetic state.
- Built/minified Worker/D1/browser: PASS, create 201 + authoritative GET 200; 375×812 and 1280×900; search retained; runner verified process cleanup.
- Reception Worker/D1/browser: PASS on 375×812 and 1280×900; check-in 200, authoritative board read 200, booking CHECKED_IN, URL lane/search and priority context retained; clean console/page-error assertions.
- Deferred-response mock browser: PASS at 1280×900 with each listed race/error and Housekeeping context assertion; runner verified owned Vite cleanup.
- `node --check` on changed Playwright scripts and `bash -n` on changed runners: PASS.
- Scoped `git diff --cached --check`: PASS on the explicit 33-path A2 stage set. Unrelated historical F0.9 evidence changes contain whitespace and remain unstaged/excluded.

## Adversarial and scope audit

- Reviewed refresh-pending rendering: a previously loaded Housekeeping task remains visible only as prior state while the explicit loading status is shown; queue/mutation controls are disabled until the read completes. The final browser asserts the state and preserved scroll, not merely source shape.
- Reviewed false success: failed post-action authoritative read retains Room 712 selection and alert; explicit refresh reconciles the server state before Next can advance.
- Reviewed source/data scope: no API, database, migration, domain transition, financial write, auth, routing or module expansion. Terser `passes: 4` changes only an existing permitted compression setting; no budget was raised or unsafe transform enabled.
- Reviewed integrated vs mock claims: both are separated by script and report. The reused-fixture attempt returning 409 is disclosed and excluded; read-only D1 proved Room 711 already existed. A new, freshly seeded fixture passed without relaxing assertions.
- Reviewed worktree boundary: F0.9 historical evidence and P0.1 harness edits, as well as diagnostic screenshots/scripts, are preserved and excluded from A2. Artifact staging is explicit-path only.
- No real/customer data, remote D1, cutover/bootstrap, PR, push, merge, main, staging mutation, deploy, production or Blocks A–H action occurred.

## Gate

`PRE-CRITIC GATE: PASS FOR F0.11 REPLACEMENT ARTIFACT A2`

This does not self-approve F0.11. A fresh Independent Critic must review exact A2+B3. Foundation 0 remains incomplete; F0.12 is still required.
