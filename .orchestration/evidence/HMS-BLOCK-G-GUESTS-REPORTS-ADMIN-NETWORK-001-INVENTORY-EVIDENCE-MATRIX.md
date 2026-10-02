# Block G — Frozen Inventory and Requirement → Evidence Matrix

Task: `HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001`
Base: `d9ff3325709633d7760dd236977b90f582b1b144`
Branch: `impl/hms-block-g-guests-reports-admin-network`
Scope authority: Issue #53 comments `5946432195`, `5946441901`.

## Inspected current product inventory

| Surface | Existing UI | Backend/data authority | Capability | Known evidence baseline / gap to prove |
|---|---|---|---|---|
| Guest directory | `GuestsPage.tsx`, `guests-operational.css`; list/filter/search/detail/create/refresh; `Promise.allSettled` for guest + booking context, booking failure currently becomes empty context | `/guests` in `routes/inventory.ts`; guest and booking rows in server-routed hotel D1 | `guests.read`, `guests.write`; booking context `bookings.read` | Existing `/guests` D1/API parity; prove selected guest retention, truthful partial booking-read state, create/idempotency/duplicate semantics only as existing route provides, route UX across widths |
| Reports | `ReportsPage.tsx`, `OperationalReportsPage.tsx`, CSS; date presets, date edit, revenue + occupancy, refresh, loading/error/empty | `/analytics/kpis`, `/reports/revenue`, `/reports/occupancy` in `routes/analytics.ts`; hotel operational D1 | analytics/revenue/occupancy read capabilities | `cf-i08-analytics-reporting-parity.md`; `CF-I08-INVARIANTS.md`, `CF-I08-PRECRITIC-GATE.md`; rerun current reports and tests; independently calculate cents/date/state/zero fixtures |
| Hotel membership administration | `UsersPage.tsx`, `OperationalUsersPage.tsx`, CSS; search/filter/create/change role/deactivate | `/users` GET/POST, `/:subject/role` PATCH, `/:subject` DELETE in `routes/admin.ts`; memberships/identities/control audit in CONTROL_DB | `users.read/write/delete` | CF-I07 regression and browser runner; rerun API D1 and browser assertions for no-op, exact audit, denied write, downgrade same-subject before/after |
| SaaS hotel administration / Network | `NetworkPage.tsx`; list/search/select, metrics/range, registration, plan change | `/hotels` GET/POST, `/hotels/:id/plan` PATCH in admin routes; `/hotels/network-kpis` in analytics; CONTROL_DB registry + configured hotel D1 reads | network `saas.hotels.read/write` | `network-metrics.test.ts`, CF-I08 regression; rerun two-D1 exact totals/ranking, allow-list/unavailable store, admin audit/no-op/binding ownership |
| Shell/nav/context | `AppShell.tsx`, `navigation.ts`, `router.tsx`, `capabilities.ts` | `/auth/me`, server middleware/membership and CONTROL_DB | `/auth/me` capability payload; hotel/network arrays | A/CF-I07 inherited tests; direct route/reload/history/focus/capability refresh; preserve server-owned authority |

### Explicit boundary

- Guest directory's current booking summary is not evidence of a complete guest profile or guest merge; no merge or global identity semantics are authorized.
- Reports are read models; no client-side source-of-truth calculations or new report kinds.
- Hotel users are tenant memberships over Access identities, not a second authentication system.
- Network surfaces consume CONTROL_DB registry and configured per-hotel D1 reads; they do not enter hotel operational workflow or change schema.
- F-cash, Blocks H and staging acceptance smoke remain outside this task.

## Frozen requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Required evidence |
|---|---|---|---|
| G-01 Guest directory remains tenant-scoped and useful with active/upcoming/history context | Guests page + `/guests`, `/bookings` | Reads use authorized tenant; booking-context read failure is visible and not mislabeled as no booking; refresh preserves selection/search/filter | executing-D1 API fixture with second tenant; browser failure injection only on context request + retry; browser list/detail and context assertions WIDE/COMPACT/NARROW |
| G-02 Existing guest creation remains safe and explicit | Guests create form + POST `/guests` | Existing validation/duplicate contract retained; no cross-tenant side effect; response and refresh select created row | API/D1 success/duplicate/denied assertions; browser create and visible authoritative result at contracted widths |
| G-03 Report dates and revenue semantics are source-correct | Reports + revenue endpoint | inclusive start/end; excludes CANCELLED/NO_SHOW; valid same-day, invalid inverted range; integer cents | executing D1 deterministic fixtures, exact rows and cents; API valid/invalid/empty assertions; browser filters/results/retry |
| G-04 Occupancy semantics and zero-safe math | Reports + occupancy endpoint | distinct room occupancy on `check_in <= date < check_out`; all rooms denominator; no-room/empty gives 0; averages only from server semantics | executing D1 dates/status/zero-room assertions with independent expected values; browser zero/empty and displayed results |
| G-05 Hotel user admin is capability- and tenant-safe | Users + admin routes/CONTROL_DB | capability denial on protected writes; same-subject privileged operation allowed before and denied after downgrade; cross-hotel scope not leaked | CF-I07 executing D1 API sequence, assert actual identity/membership/role/capabilities/hotel before each request and zero side effects on denial |
| G-06 Admin writes are exact and audited | Users role/deactivate; hotel plan where supported by frozen CF-I07 | conditional winner; no-op/stale/rejected writes yield no extra audit; event exactly one on success | concurrent/stale/no-op executing-D1 route tests with exact state/event counts |
| G-07 Network authority and control/operational separation | Network + admin/analytics routes | only network capability allows access; binding chosen from active CONTROL_DB allowlist; no partial aggregate success | two isolated local D1 bindings; allowed identity positive context; missing configured store returns truthful unavailable; unconfigured/reused binding denied; inspect control and hotel DB writes |
| G-08 Network aggregates are reproducible and deterministic | Network + `network-metrics.ts` | exact totals, arithmetic mean occupancy, integer cents, revenue descending then stable ID tie order | independently authored two hotel fixture expected values and row ranking; tests include unavailable binding and zero denominator |
| G-09 Routes/capability visibility preserve authority | AppShell/navigation/router + APIs | no role name in UI authorization; unauthorized direct route has denial; `/auth/me` stale response cannot restore old privilege; direct links and reload match current cap | static role-bypass scan; auth race tests and browser direct route/reload/history; actual `/auth/me` identity/hotel/cap arrays captured |
| G-10 Responsive interaction and accessibility | all four Block G pages + shell | WIDE/COMPACT/NARROW/reduced-height/mobile landscape execute controls; keyboard/focus visible; errors and status are announced | executable browser assertions, viewport dimensions, keyboard navigation and focus; screenshots diagnostic only |
| G-11 No forbidden scope | source diff / route inventory | no F-cash/H scope, no migration, no staging/deploy/real data/main/PR/merge | allowlist diff, route uniqueness/static authority scan, git ancestry and orchestration status audit |
| G-12 Budget / artifact evidence | build output and checker | active ceilings unchanged; baseline→result→bytes/percent; aggregate raw/gzip and entry payload measured | build report + active `check-cloudflare-budgets.mjs`; raw/gzip/entry measures and exact SHA artifact/boundary evidence |
