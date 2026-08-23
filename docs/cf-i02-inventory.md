# CF-I02 Inventory, Guests and Holds

This increment implements the approved rooms, guests and room-holds parity seam on the CF-I01 foundation.

- API routes are mounted under `/api/v1` and resolve the operational D1 only after Access identity and Control_DB membership authorization.
- `0002_rooms_guests_holds.sql` keeps rooms, guests and holds in the hotel database, with local uniqueness and foreign-key ownership.
- Hold conflicts use half-open intervals: `existing.start_date < requested.end_date AND existing.end_date > requested.start_date`.
- Availability excludes held intervals and existing `room_inventory_nights`, preserving a later booking-claim seam.
- The Vite UI exposes `/rooms` and `/guests`, same-origin API calls, loading/empty/error states, room creation, hold creation/deletion and guest creation.

Validation evidence for the artifact:

```text
npm run typecheck       PASS
npm run test            PASS (13 tests)
npm run web:build       PASS
npm run types:check     PASS
npm run wrangler:dry-run PASS (API + web)
git diff --check        PASS
```

No remote deployment, remote D1 mutation, real hotel data access or paid Cloudflare resource was performed.
