# CF-I03 REWORK — D1/API adversarial evidence

This evidence is local-only and uses Wrangler D1 plus the API Worker in `wrangler dev --local`.
No remote D1, production deployment, real data or paid resource was used.

## Schema

Applied the control-plane and hotel migrations with:

```text
CI=1 npx wrangler d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc
CI=1 npx wrangler d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc
```

`sqlite_master` showed `bookings`, `room_inventory_nights` with primary key `(room_id, stay_date)`, and `idx_room_inventory_nights_booking`.

## API/D1 regression run

The local Worker ran with `LOCAL_DEV_AUTH=true`, a seeded control-plane membership and two rooms. Requests used the authorized Access subject and hotel membership.

| Case | Result |
|---|---|
| Create booking `2026-08-23` → `2026-08-25` with blank notes | `201`; `notes: null`; two claims created |
| Adjacent availability `2026-08-25` → `2026-08-26` | `200`; room remains available (exclusive end) |
| Overlap create on `2026-08-24` → `2026-08-26` | `409 CONFLICT`; no booking/claims persisted |
| PATCH room/date to room B, `2026-08-26` → `2026-08-28` | `200`; only the two new room-B claims remained |
| PATCH with unknown guest | `409 CONFLICT`; the two prior claims remained |
| Hold over active booking claims | `409 CONFLICT` |
| Cancellation | `200`; claims deleted; room available again for the cancelled interval |

The final local validation also ran `npm run check`, `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, and `git diff --check` successfully. Wrangler emitted only the known read-only `.wrangler` log warning during dry-run.

## REWORK-4 executable evidence

- `npm run test` now includes the zero-row guarded-update regression (`16/16` tests).
- `npm run test:cf-i03` applies local migrations, asserts the `booking_id → bookings(id)` foreign key, rejects an orphan claim, and exercises overlap rollback, half-open adjacency, PATCH replacement, failed-update preservation, hold exclusion and cancellation release through the local API Worker.
- `scripts/cf-i03-browser-regression.mjs` was run with Playwright CLI against the local Vite app and covered empty state, required validation, date-scoped availability, create, detail/edit and typed backend error; screenshot: `output/playwright/cf-i03-bookings.png`.
- `scripts/cf-i03-browser-loading.mjs` was run with a delayed API response and observed the loading state; screenshot: `output/playwright/cf-i03-bookings-loading.png`.

Browser reproduction uses a local Vite server plus the Playwright CLI wrapper:

```text
npx vite --host 127.0.0.1 --port 4173 --config apps/web/vite.config.ts
bash /home/sjo1848/.codex/skills/playwright/scripts/playwright_cli.sh -s=cf-i03-browser run-code --filename scripts/cf-i03-browser-regression.mjs
bash /home/sjo1848/.codex/skills/playwright/scripts/playwright_cli.sh -s=cf-i03-loading run-code --filename scripts/cf-i03-browser-loading.mjs
```

The booking PATCH now asserts that the guarded booking UPDATE changed exactly one row. A zero-row concurrent invalidation returns typed `409 CONFLICT`; the conditional claim statements remain no-ops and preserve the existing booking/claims. Migration `0004_booking_claim_fk.sql` rebuilds the claim table with `FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE`.
