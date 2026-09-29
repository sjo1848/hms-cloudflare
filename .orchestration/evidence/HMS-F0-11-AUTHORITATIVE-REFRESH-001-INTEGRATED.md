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

## Built/minified Rooms → Worker/D1 → authoritative refresh

Runner: `scripts/cf-f0-11-built-local.sh` (synthetic isolated D1; built production bundle served locally).

Result from `output/playwright/f0-11-built-browser.log`:

```json
{"minifiedBundle":true,"localWorkerD1":true,"mutation":201,"authoritativeRead":200,"room":"711","viewports":["375x812","1280x900"],"preservedSearch":"711"}
```

Room create and subsequent GET used the actual local Worker/D1; search survived authoritative refresh at mobile and desktop. Screenshots: `output/playwright/f0-11-built-rooms-mobile.png` and `output/playwright/f0-11-built-rooms-desktop.png`.

## Scope of this evidence

This integrated evidence proves representative local Worker/D1 state convergence and built/minified runtime execution. It does not claim every resource mutation listed in the Task Contract was individually executed end-to-end; deferred-route browser tests exercise the remaining read-order/error cases and are labeled mock. The full executing-D1 suite and CF-I03..06 regression scripts are separate evidence.
