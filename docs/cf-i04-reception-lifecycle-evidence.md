# CF-I04 Reception Lifecycle — Implementation Evidence

Implementation scope is limited to the accepted Reception Lifecycle contract: checklist-gated check-in, in-house room reassignment and checkout/housekeeping handoff. Billing, payment settlement, standalone housekeeping and later increments are not implemented.

## Requirement → Expected Surface → Acceptance → Evidence

- Check-in → `/api/v1/bookings/{id}/check-in` and `/bookings` case workspace → all four confirmations are required; `Confirmed → CheckedIn`, room becomes `OCCUPIED`, actor/request/hotel event is recorded → `npm run test:cf-i04`; `scripts/cf-i04-browser-regression.mjs`.
- Reassignment → `/api/v1/bookings/{id}/reassign` and reception room picker → destination room is tenant-local, available and not held/claimed; failed reassignment preserves the in-house booking and old room state; success replaces claims and room occupancy atomically → `npm run test:cf-i04` adversarial hold/preservation and success path.
- Checkout/handoff → `/api/v1/bookings/{id}/check-out` and reception checkout form → all policy/review/release/handoff confirmations are required; `CheckedIn → CheckedOut`, claims release and room becomes `DIRTY` → `npm run test:cf-i04`; browser journey.
- Validation/integration → API, D1, web and worker → no partial lifecycle result or scope drift → `npm run check`, `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, `git diff --check`.

## Executed evidence

- `npm run check`: 16/16 tests PASS.
- `npm run test:cf-i04`: named CF-I04 harness composing the CF-I03 foundation plus lifecycle D1/API regression PASS, including incomplete checklist rejection, hold-blocked reassignment with preservation, concurrent check-in/reassignment/checkout serialization, lifecycle event/claim/room consistency and checkout release/dirty-room handoff.
- Deterministic stale-state SQL regressions PASS: checkout guard aborts after a stale room-state predicate with booking, claims, room and event count preserved; reassignment guard is enforced by the same batch event boundary. A valid `A → B → A → C` sequence records three reassignment events, proving audit history does not impose lifetime room uniqueness.
- Lifecycle-specific authorization regression covers forbidden `housekeeping`, unknown binding and cross-tenant ID attempts (`403/404`) with unchanged lifecycle event count.
- `scripts/cf-i04-browser-regression.mjs`: Playwright browser check-in checklist validation, typed backend `409` error observability and recovery, reassignment and checkout/handoff journey PASS at 375/390/430/768/1024. Each width reaches the source-parity reception case workspace, queue and selected-case surface; screenshot persisted at `output/playwright/cf-i04-reception-lifecycle.png`.
- Web build, generated types, API/web Wrangler dry-runs and diff check PASS.
- Migration `0006_lifecycle_transition_guards.sql` retains one check-in/checkout transition guards; migration `0007_lifecycle_atomic_guards.sql` removes lifetime reassignment-room uniqueness and adds SQLite abort triggers at the final lifecycle event boundary. Lifecycle side effects are guarded by the same transition preconditions inside D1 batches.
- No production deployment, remote D1 mutation, real-data access, paid Cloudflare resource or Human Gate occurred.

Runtime note: `RUNTIME_CAPABILITY_FALLBACK` remains explicit; this adapter exposed no separate Specialist contexts. Domain/Lifecycle, Reception UX and QA/Security responsibilities remain separated in the Task Contract and evidence plan without a false multiagency claim.
