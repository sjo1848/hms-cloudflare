# F0.11 Integrated Local Evidence

Environment: synthetic isolated D1 fixtures under `.hms-local/p0-1-f0-11-*`; local Wrangler Worker + Vite; no real hotel data, staging, remote database or deployment.

## Reception check-in → authoritative refresh

Runner: `scripts/cf-f0-11-reception-local.sh <fresh-isolated-fixture> 375` and `scripts/cf-f0-11-reception-local.sh <fresh-isolated-fixture> 1280`, each with a separately seeded fixture.

Mobile result from `output/playwright/f0-11-reception-integrated-mobile.log`:

```json
{"integratedWorkerD1":true,"mutation":200,"authoritativeBoardRead":200,"bookingStatus":"CheckedIn","nextPriorityCase":"z-priority","viewport":"375x812","preservedLane":"arrivals","preservedSearch":"Arrival"}
```

Desktop result from `output/playwright/f0-11-reception-integrated-desktop.log`:

```json
{"integratedWorkerD1":true,"mutation":200,"authoritativeBoardRead":200,"bookingStatus":"CheckedIn","nextPriorityCase":"z-priority","viewport":"1280x900","preservedLane":"arrivals","preservedSearch":"Arrival"}
```

Both fresh synthetic fixtures' combined HOTEL_DEMO_DB files were opened read-only with Node `node:sqlite`. The desktop assertion output is:

```json
{"booking":{"id":"a-next","room_id":"p01-room-b","status":"CHECKED_IN","check_in_guests_count":2},"event":[{"event_type":"CHECK_IN","actor_subject":"source-user:14000000-0000-0000-0000-000000000002","hotel_id":"10000000-0000-0000-0000-000000000001","details_json":"{\"checklist\":[\"document_verified\",\"contact_confirmed\",\"stay_confirmed\"],\"check_in_guests_count\":2,\"occupancy_before\":\"VACANT\",\"occupancy_after\":\"OCCUPIED\",\"housekeeping_state_before\":\"READY\",\"housekeeping_state_after\":\"READY\",\"maintenance_impact_before\":\"NON_BLOCKING\",\"maintenance_impact_after\":\"NON_BLOCKING\",\"service_state_before\":\"IN_SERVICE\",\"service_state_after\":\"IN_SERVICE\",\"room_state_version_before\":0,\"room_state_version_after\":1}"}],"invoice":{"amount_cents":36000,"paid_amount_cents":0,"status":"PENDING"},"payment_entry_count":0,"room":{"id":"p01-room-b","status":"OCCUPIED"}}
```

The operation persisted exactly one CHECK_IN history record for the expected actor/hotel; the invoice was unchanged and no payment entry was created. Runner reported owned Worker/Vite/Playwright process cleanup verified on both viewports. Screenshots are `output/playwright/f0-11-reception-integrated-mobile-success.png` and `output/playwright/f0-11-reception-integrated-desktop-success.png`.

The final runner captures browser console/page-error categories. Both viewports returned an empty `pageErrors` list and no console messages of type `error`; only Vite debug and React DevTools informational messages were present. See `.orchestration/evidence/HMS-F0-11-RECEPTION-CONSOLE-CLASSIFICATION.md` and the final logs.

## Built/minified Rooms → Worker/D1 → authoritative refresh

Runner: `scripts/cf-f0-11-built-local.sh` (synthetic isolated D1; built production bundle served locally).

Result from `output/playwright/f0-11-built-browser.log`:

```json
{"minifiedBundle":true,"localWorkerD1":true,"mutation":201,"authoritativeRead":200,"room":"711","viewports":["375x812","1280x900"],"preservedSearch":"711"}
```

Room create and subsequent GET used the actual local Worker/D1; search survived authoritative refresh at mobile and desktop. Screenshots: `output/playwright/f0-11-built-rooms-mobile.png` and `output/playwright/f0-11-built-rooms-desktop.png`.

Fresh final run used a newly seeded isolated fixture and the exact bundle built by the captured `npm run web:build` + `npm run architecture:fitness` invocation. Raw budget output: JS `299990 / 300000` bytes, gzip `86226 / 100000`; CSS `43399 / 50000` bytes, gzip `8383 / 15000`. Full raw output is retained in `output/playwright/f0-11-web-build.log` and `output/playwright/f0-11-architecture-budgets.log`. The final built-browser result and owned-process cleanup are in `output/playwright/f0-11-built-integrated.log` and `output/playwright/f0-11-built-browser.log`.

One earlier attempt against a previously used local fixture returned HTTP 409 for room creation. Read-only inspection confirmed that the fixture already contained room `711`; this was fixture reuse, not an application regression. The attempt was not counted as PASS. The final run used a fresh seeded fixture and passed with create `201` and authoritative read `200`.

## Critic-condition repair browser evidence

The fresh deterministic mock browser result is in `output/playwright/f0-11-refresh-races.log`; the runner completion/cleanup marker is in `output/playwright/f0-11-refresh-races-runner.log`. It proves Rooms retain-while-present/clear-after-removal, Billing booking identity and error recovery, Reception authoritative 200/404/500 handling, and Housekeeping date/filter/search/selected-room/scroll retention plus fixed `Next task` identities and failed-read recovery. This is explicitly mock-only evidence.

That mock intentionally returns 404/500 responses to exercise failure UX. Playwright consequently records expected failed-resource console entries for those injected responses; these are not JavaScript page errors and are not represented as a clean-console integrated run. The integrated Reception runs separately capture `pageErrors: []` and no console errors on both widths.

## Fresh regression matrix

| Gate | Result | Evidence |
|---|---|---|
| `npm run check` | PASS — 33 files / 168 tests | `output/playwright/f0-11-check.log` |
| `npm run types:check` | PASS | `output/playwright/f0-11-types.log` |
| `npm run web:build` | PASS | `output/playwright/f0-11-web-build.log` |
| Architecture fitness, i18n, Cloudflare budgets | PASS | `output/playwright/f0-11-architecture-budgets.log` |
| D1 critical query plans | PASS | `output/playwright/f0-11-query-plans.log` |
| Wrangler API/Web/staging-SPA dry-runs | PASS; no deployment | `output/playwright/f0-11-wrangler-{api,web,staging-spa}.log` |
| CF-I03 / CF-I04 | PASS | `output/playwright/f0-11-cf-i03.log`, `output/playwright/f0-11-cf-i04.log` |
| CF-I05 | PASS | `output/playwright/f0-11-cf-i05.log` |
| CF-I06 | PASS | `output/playwright/f0-11-cf-i06.log` |
| Script syntax and scoped whitespace check | PASS | Pre-Critic and invariant evidence |

## Scope of this evidence

This integrated evidence proves representative local Worker/D1 state convergence and built/minified runtime execution. It does not claim every resource mutation listed in the Task Contract was individually executed end-to-end; deferred-route browser tests exercise the remaining read-order/error cases and are labeled mock. The full executing-D1 suite and CF-I03..06 regression scripts are separate evidence.
