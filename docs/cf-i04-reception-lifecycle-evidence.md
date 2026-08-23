# CF-I04 Reception Lifecycle — Implementation Evidence

Implementation scope is limited to the accepted Reception Lifecycle contract: checklist-gated check-in, in-house room reassignment and checkout/housekeeping handoff. Billing, payment settlement, standalone housekeeping and later increments are not implemented.

## Requirement → Expected Surface → Acceptance → Evidence

- Check-in → `/api/v1/bookings/{id}/check-in` and `/bookings` checklist → all four confirmations are required; `Confirmed → CheckedIn`, room becomes `OCCUPIED`, actor/request/hotel event is recorded → `npm run test:cf-i04`; `scripts/cf-i04-browser-regression.mjs`.
- Reassignment → `/api/v1/bookings/{id}/reassign` and reception room picker → destination room is tenant-local, available and not held/claimed; failed reassignment preserves the in-house booking and old room state; success replaces claims and room occupancy atomically → `npm run test:cf-i04` adversarial hold/preservation and success path.
- Checkout/handoff → `/api/v1/bookings/{id}/check-out` and reception checkout form → all policy/review/release/handoff confirmations are required; `CheckedIn → CheckedOut`, claims release and room becomes `DIRTY` → `npm run test:cf-i04`; browser journey.
- Validation/integration → API, D1, web and worker → no partial lifecycle result or scope drift → `npm run check`, `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, `git diff --check`.

## Executed evidence

- `npm run check`: 16/16 tests PASS.
- `npm run test:cf-i04`: CF-I03 foundation plus CF-I04 lifecycle D1/API regression PASS, including incomplete checklist rejection, hold-blocked reassignment with preservation, successful reassignment, incomplete checkout rejection, checkout release and dirty-room handoff.
- `scripts/cf-i04-browser-regression.mjs`: browser reassignment and checkout/handoff journey PASS; screenshot persisted at `output/playwright/cf-i04-reception-lifecycle.png`.
- Web build, generated types, API/web Wrangler dry-runs and diff check PASS.
- No production deployment, remote D1 mutation, real-data access, paid Cloudflare resource or Human Gate occurred.

Runtime note: `RUNTIME_CAPABILITY_FALLBACK` remains explicit; this adapter exposed no separate Specialist contexts. Domain/Lifecycle, Reception UX and QA/Security responsibilities remain separated in the Task Contract and evidence plan without a false multiagency claim.
