# HMS Block D Rooms Operational Workspace — Results

Task Contract: `.orchestration/contracts/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001.md`  
Base: `044ad756b0081d2a54083ea89c782557e97a351f`  
Branch/worktree: `impl/hms-block-d-rooms` / `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-d-rooms`  
Classification: local synthetic data only. No promotion, production, staging, or real-data operations.

## Delivered surface

`/rooms` is now a query-backed operational board and selected-room case. The board retains search, four canonical dimension filters (including explicit `UNRESOLVED`), and optional date range. The detail shows independent Occupancy, Housekeeping, Maintenance Impact and Service, F0-derived readiness/reasons, and separately evaluated interval sellability. Booking and maintenance facts load as independent optional context and remain read-only. Room metadata and room holds use the existing `rooms.write` capability and existing API commands only. No Housekeeping or Maintenance mutation was added.

The selected room is addressed by `room_id`; search, filters, and range remain URL state. Direct room links and reload restore the selected room. Browser Back/Forward and the in-app `Volver a la lista` restore the board, selected card focus, and scroll context. Late selected-room detail responses are ignored after a newer room selection. On `rooms.search` capability downgrade, range query state is cleared and `/rooms` is re-read without a range, preserving the `rooms.read` board. The range endpoint itself still requires the server-owned `rooms.search` guard.

## Validation

| Gate | Result / concrete evidence |
|---|---|
| Full Vitest suite | PASS — `npm exec -- vitest run --maxWorkers=1`; 35 files, 175 tests. Includes executing-D1 room dimension, date range, hold, metadata, tenant and capability tests. |
| Room route executing D1 | PASS — `apps/api/src/modules/room-state/room-state-route.executing-d1.test.ts`; two tenant D1s; canonical dimensions; `[start,end)` room-night and hold boundaries; blocking/unresolved maintenance; invalid range; hold overlap/stale/create/edit/delete; denied mutation zero drift; metadata validation and dimension preservation; indexed query plan; test-only authenticated `rooms.read`-without-`rooms.search` identity proves un-ranged GET 200 and ranged GET 403. |
| TypeScript | PASS — `npm exec -- tsc -b --pretty false`. |
| Wrangler generated types | PASS — `npm run types:check`, API and Web configurations up to date. |
| Production build | PASS — `npm run web:build`. |
| Architecture / i18n / budgets | PASS — `npm run architecture:fitness`: architectureFitness, Architecture II, i18n coverage, bundle budgets. |
| D1 query plan regression | PASS — `npm run test:d1-query-plan`; arrival and checkout indexes found; inventory keyed. |
| Worker + Web Wrangler dry-runs | PASS — `npm run wrangler:dry-run`; API and static Web bundles accepted by Wrangler dry-run. No deploy performed. |
| Patch whitespace | PASS — `git diff --check`. |

The room range route calls `requireCapability(context, "rooms.search")` after `rooms.read`; no API contract or production role map was changed. A test-only active identity/membership temporarily binds to a synthetic test role with exactly `rooms.read` to isolate this route boundary; after the test, that entry is removed. The test proves the same authenticated tenant can read the base board (200) and is denied a ranged request (403). The UI downgrade independently clears the unsupported interval and preserves un-ranged room reads.

## Integrated browser evidence

Run surface: local Vite at `http://127.0.0.1:4181` with local Wrangler Worker at `http://127.0.0.1:8787`, synthetic acceptance identity/data and the local D1 fixture. The runtime was restarted after an earlier daemon exit and returned HTTP 200 for the local app/API routes. Browser actions below were executed using Playwright CLI against that live app; the UI was not treated as evidence of persistence by itself. Persistent API semantics are independently asserted in the executing-D1 suite above.

| Viewport | Browser assertion |
|---|---|
| WIDE `1280×900` | Board and case both rendered; document width matched viewport; case heading focus was `H3`. |
| Reduced-height `1280×600` | Board and case remained in the two-pane workspace; no horizontal overflow; document/inner scrolling remained available. |
| COMPACT `900×700` | Two-pane layout remained within viewport; no horizontal overflow. |
| NARROW `390×844` | Board was hidden while case selected; explicit Back was present; case heading was focused; no horizontal overflow. |
| NARROW `320×700` | Same Queue→Case model; no horizontal overflow. |
| Landscape `844×390` | Compact two-pane layout; detail bounds were `x=470.5`, `y=376`, `355.5×290`; internal detail scroll was `537/288` px; no horizontal overflow. |

Browser assertions executed after final UI changes:

- Direct `/rooms?room_id=p01-room-c` followed by reload restored `Habitación 103`, left the board visible at COMPACT width, focused the selected heading, and had no horizontal overflow.
- Selecting Room 103 changed URL to `?room_id=p01-room-c`; browser Back restored `/rooms` and focus to the Room 103 card; Forward restored the same selected Room 103 and focus to the `H3` case heading.
- At NARROW, in-app `Volver a la lista` removed `room_id`, restored focus to the Room 103 card, and retained board scroll (`scrollY=660`).
- Reception capability profile retained read-only room state and optional booking context; no `rooms.write` metadata/hold controls were present. Admin profile exposes those existing controls.
- Four dimension filters expose `Sin resolver`; filtering compares the explicit canonical `UNKNOWN` representation rather than coercing it to a valid state.
- Booking context link resolves to the supported `/bookings?booking_id=…` route. Maintenance information is shown only when `maintenance.read` is present. No E workflows were present.
- A delayed-response selection race (Room 102 followed by Room 101) ended with Room 101 selected and no Room 102 holds/maintenance rebound to it. Both actual Worker detail requests occurred; stale responses were ignored.

The viewport checks are local synthetic interaction evidence, not performance targets or a claim about production device latency. No absolute localhost timing gate was used.

## Bundle baseline → result → delta

Ceilings remain unchanged: JS `330000` raw / `100000` gzip; CSS `55000` raw / `15000` gzip.

| Measure | Block D baseline | Result | Delta bytes | Delta % |
|---|---:|---:|---:|---:|
| JS raw | 321,619 | 329,618 | +7,999 | +2.485% |
| JS gzip | 91,486 | 93,456 | +1,970 | +2.154% |
| CSS raw | 54,937 | 54,297 | -640 | -1.165% |
| CSS gzip | 10,119 | 10,138 | +19 | +0.188% |
| Aggregate raw | 376,556 | 383,915 | +7,359 | +1.954% |
| Aggregate gzip | 101,605 | 103,594 | +1,989 | +1.958% |

Initial/entry asset from Vite production build: `index-lczUTugB.js` 329,618 raw / 93,456 gzip; `index-DoIhUsoA.css` 54,297 raw / 10,138 gzip. The measured initial JS is below its unchanged raw ceiling by 382 B. The budget gate passed; no limit was increased. No Chrome DevTools performance trace is claimed for this Block D increment.

Because this build emits one initial JS entry and one initial CSS entry, initial/entry payload equals the corresponding raw/gzip rows above: JS 321,619/91,486 → 329,618/93,456 (`+7,999`, `+2.485%` raw; `+1,970`, `+2.154%` gzip); CSS 54,937/10,119 → 54,297/10,138 (`-640`, `-1.165%` raw; `+19`, `+0.188%` gzip).

## Scope and remaining review

- No schema/migration, new backend/domain contract, new role/capability, or broad architecture was introduced.
- Housekeeping and Maintenance workflows remain outside this Block D surface.
- No Block E–H work started. No PR, push, merge, main, staging, deploy, production, or real-data activity occurred.
- This is implementation/runtime evidence, not an Independent Critic PASS. Exact Artifact A and Boundary B must be reviewed separately before canonical handoff closure.
