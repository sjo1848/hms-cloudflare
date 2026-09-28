# F0.7 Pricing-Version ABA Repair — Evidence

## Directed execution

Test: `apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts`
Command: `npx vitest run apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts`
Result: PASS, 1/1 test file/test, including the deterministic same-visible-value pricing ABA interleaving.

The test captures checkout account total 10,000 with no invoice and zero ledger, then interposes two booking repricing-generation advances while the visible total changes to 12,500 and back to 10,000. At the write boundary, checkout returns conflict because `pricing_version` no longer matches. Assertions prove: booking remains CHECKED_IN at 10,000 cents with pricing version 2; room remains OCCUPIED/READY at state version 1; two inventory nights remain; invoice count is zero; CHECK_OUT event count is zero. This is synthetic executing D1 state.

Implementation binds `bookings.pricing_version` from the same account snapshot into the conditional D1 booking update. No new version mechanism or migration was added; the generation is the existing F0.5 append-only pricing-segment version.

## Real local Worker/D1/browser regression on repaired checkout

Local Worker `127.0.0.1:8787` and Vite `127.0.0.1:4175`; separate temporary Wrangler persistence `/tmp/hms-f07-aba-browser.76YSjI/state`; all migrations through 0028; local acceptance profile and hotel identity were synthetic. No mocks.

- Reception loaded the in-house booking `f07-aba-browser-booking` / guest `F07 ABA Browser Guest`, room 970, at desktop viewport. Selecting `settled` with all three confirmations returned HTTP 409 and rendered an inline checkout conflict; queue/context remained visible.
- Retrying with authorized `pending-approved` and reference `browser-approved-aba` returned HTTP 200. Authoritative Reception refresh changed the in-house queue from 1 to 0 and returned to the queue surface.
- Direct local D1 verification after success: booking `CHECKED_OUT`, total 10000 cents, `pricing_version=0`; room `DIRTY`; inventory claims 0; one invoice `PENDING`, amount 10000, paid 0; payment entries 0; exactly one CHECK_OUT event.
- Screenshot: `output/playwright/f0-7-aba-browser-success.png`. The browser console showed expected 409 resource logging for the deliberately rejected settled attempt and a missing local favicon (404); neither was represented as a product success signal.
- Browser, Worker and Vite were closed; ports 8787 and 4175 were confirmed free; the exact synthetic temporary D1 directory was removed.

## Inherited F0.7 evidence still applicable

Artifact A1 (`c356fd04563513859e1f6f919b02aeb48f7264c7`) retains the forward migration 0028 and unchanged checkout/domain/UI behavior. Its real local Worker + D1 + Vite browser evidence covers desktop 1280×900 conflict and successful authorized checkout with authoritative Reception refresh, and mobile 375×844 success/refresh. Clean local Wrangler migrations through 0028 were applied to CONTROL_DB and both hotel bindings. No product UI or migration changed in this repair.

The broad product-flow runner failed to import unavailable npm `playwright`; this remains a disclosed runner limitation and is not claimed PASS. The scoped real local checkout browser runs used the Playwright CLI and real Worker/D1, not mock API. The prior A1 mobile viewport test remains applicable because this repair changed no UI, API response shape, or mobile-specific behavior.

Validation commands on the repaired code: `npx vitest run apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts` PASS; `npm run check` PASS (32 files/144 tests); `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, and staging SPA `wrangler deploy --dry-run` PASS. Sequential `npm run test:cf-i03`, `npm run test:cf-i04`, `npm run test:cf-i05`, and `npm run test:cf-i06` all PASS on isolated local state. `output/playwright/f0-7-aba-cf-i06.log` contains the final CF-I06 runner output; command outcomes and integrated browser assertions are recorded here and in the Pre-Critic. No staging mutation occurred.
