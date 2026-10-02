# TASK CONTRACT — HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001

Status: FROZEN FOR IMPLEMENTATION ADMISSION
Authorized base: `d9ff3325709633d7760dd236977b90f582b1b144`
Dedicated branch: `impl/hms-block-g-guests-reports-admin-network`
Authority: Issue #53, Controller comments `5946432195` (`START_BLOCK_G_WITH_STAGING_SMOKE_PENDING`) and `5946441901` (`CONTROLLER_NORMALIZATION_COMPLETE`).
Staging product SHA remains `074804329f487c2cfb0a9e5123f1f90b1a0e0252`; no redeploy is authorized or needed.

## Objective

Deliver Block G on the existing approved foundations: keep Guests directory/detail connected to Booking/Stay context; preserve Reports source date/state/integer-cent semantics; provide capability-authorized hotel membership administration; and keep SaaS Network administration and aggregation separated from hotel operational data. Repair only attributable, contract-covered defects and close gaps required by the Block G roadmap. No semantic feature expansion.

## Frozen requirements and surfaces

| Requirement | Expected surface | Acceptance/evidence |
|---|---|---|
| Guest directory, search, operational context and recent booking history | `apps/web/src/features/guests/GuestsPage.tsx`, `guests-operational.css`; `/api/v1/guests`, `/api/v1/bookings`; inventory handlers in `apps/api/src/routes/inventory.ts` | Guest list is tenant scoped; detail/context reflects existing booking truth; partial booking read is truthfully distinguished from no booking; search/filter/selection and refresh keep the selected guest stable; API + D1 + WIDE/COMPACT/NARROW browser assertions. Creation only if existing `guests.write` contract is retained and duplicate-safe. |
| Revenue/occupancy reports and dashboard semantics | `apps/web/src/features/reports/{ReportsPage,OperationalReportsPage}.tsx`, `reports-operational.css`; `apps/api/src/routes/analytics.ts`; `docs/cf-i08-analytics-reporting-parity.md` | Inclusive date range; explicit default dates; excludes `CANCELLED`/`NO_SHOW` per source; integer-cent sums/truncation; zero-safe denominator; range validation; empty data and retry are visible; executable D1 fixtures independently assert values. |
| Hotel user/membership administration | `apps/web/src/features/users/{UsersPage,OperationalUsersPage}.tsx`, `users-operational.css`; `apps/api/src/routes/admin.ts`; `apps/api/src/auth/capabilities.ts`; CONTROL_DB | Only canonical server capability authority grants protected routes; tenant membership scope; role change/deactivation mutation exact-winner and audit iff applied; semantic no-op rejects with zero audit; same subject is allowed before and denied after downgrade; denied writes have zero side effects. |
| SaaS Network hotel directory/plan/metrics | `apps/web/src/features/network/NetworkPage.tsx`; admin routes `/hotels`, `/hotels/:id/plan`; `apps/api/src/routes/analytics.ts` `/hotels/network-kpis`; `apps/api/src/modules/analytics/network-metrics.ts`; CONTROL_DB + configured operational D1 bindings | Explicit `saas.hotels.read/write`; network membership independent from hotel membership; only configured active hotels are queried; every configured store contributes or request fails truthfully; aggregate/revenue ranking reconciles to independent fixtures; no operational D1 cross-write. |
| App shell and route/capability continuity | `apps/web/src/app/{AppShell,navigation,router,capabilities}.tsx/ts` | Routes remain server-capability-derived; direct deep links/reload and browser history remain coherent; identity/capability stale refresh fails closed; no role-name map added to browser. |
| Responsive/accessibility and inherited regression | Exact surfaces above; existing `scripts/cf-i07-browser-regression.sh`, `scripts/cf-ux-mobile-browser-ci.mjs`, `scripts/cf-product-flow-browser-ci.mjs` as applicable | WIDE, COMPACT, NARROW, reduced height, mobile landscape, keyboard/focus and direct route execution; no screenshot-only PASS; executable integrated local Worker/D1 where claimed; inherited unrelated/external findings attributed, not relabeled. |

## Exact initial inventory

### User-visible surfaces/workflows

1. Guests: capability-filtered `/guests`; guest list; search; All/Active/Arrivals/Upcoming filters; selected guest detail; current/next/history context; up to five recent stays; add guest using existing fields; refresh/error/empty.
2. Reports: `/reports`; preset and editable start/end; refresh; daily occupancy and arrival-date revenue summaries; zero/empty, invalid date range, loading/error/retry.
3. Hotel administration: `/users`; user/membership list; active/inactive/role filters; search; create membership; role change; deactivate; confirmation; refresh and recovery.
4. Network: `/network`; configured hotel list/search/select; read plan/metrics; date range refresh; register configured hotel where capacity and `saas.hotels.write` allow; plan change; error/unavailable state; deterministic revenue ranking.
5. Shell: navigation groups Directory, Insights, Administration, Platform; capability-filtered links, direct-route denial, identity/capability refresh, responsive more-menu and focus return.

### API/capability/backend inventory

- Guest reads/writes: `/api/v1/guests` GET/POST in `apps/api/src/routes/inventory.ts`; hotel `guests.read`/`guests.write`; operational D1 guest records; booking association reads via `/api/v1/bookings?limit=100` (`bookings.read`).
- Reports/dashboard: `/api/v1/analytics/kpis` (`analytics.kpis.read`), `/api/v1/reports/revenue` (`reports.revenue.read`), `/api/v1/reports/occupancy` (`reports.occupancy.read`); `apps/api/src/routes/analytics.ts`; tenant operational D1.
- Hotel user admin: `/api/v1/users` GET/POST, `/api/v1/users/:subject/role` PATCH, `/api/v1/users/:subject` DELETE in `apps/api/src/routes/admin.ts`; hotel `users.read/write/delete`; memberships/identity/audit in CONTROL_DB.
- Network admin: `/api/v1/hotels` GET/POST and `/api/v1/hotels/:id/plan` PATCH; network `saas.hotels.read/write`; CONTROL_DB.
- Network metrics: `/api/v1/hotels/network-kpis` GET; `saas.hotels.read`; bounded active-hotel list from CONTROL_DB, configured operational D1 reads, aggregation in `network-metrics.ts`.
- Canonical authorization is `apps/api/src/auth/capabilities.ts`, auth/membership and server routing. Browser gets capabilities from `/api/v1/auth/me` and may use them only for presentation/navigation.

## Invariants and domain rules

- Guest/history/report queries remain tenant-scoped to server-selected operational D1.
- CONTROL_DB owns identity, memberships, hotel registry, plans, and control audit. Operational D1 owns hotel stays and operational report source rows. Network aggregation reads only server-selected configured D1 bindings.
- Role/capability authority is centralized and server-side; no role-name bypass or client-selected tenant/binding.
- Admin audit mutation rows correspond exactly to the winning state change; no-op, denied, stale, cross-tenant or failed write leaves no mutation/audit side effects.
- Downgrade evidence uses the same identity and protected action before/after capability loss.
- Revenue/date/state/occupancy semantics match `docs/cf-i08-analytics-reporting-parity.md`; cents are integers; averages handle zero denominator as zero; no client aggregation redefines authoritative predicates.
- Unavailable configured hotel store fails the aggregate truthfully rather than returning a partial/empty-success report.
- No F-cash, cash ownership/session/closure, Block H, new backend/domain contract, schema or migration unless existing Task Contract/approved source already requires it. This task introduces no new policy or schema.
- Existing API route contracts remain compatible; UI must distinguish loading/error/empty and retain selected entity/filter/date context across refresh where supported.

## Baseline and bundle policy

At authorized base, active ceilings are JS raw/gzip `350000/100000 B`, CSS raw/gzip `60000/15000 B`; do not raise. Baseline must be freshly measured from this exact checkout before implementation and compared as `baseline → result → delta bytes → delta %` for JS raw, CSS raw, gzip, aggregate raw/gzip, and initial/entry payload where available. Any active ceiling breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`. Staging smoke is pending solely due the external browser test-harness initialization failure; do not claim or perform staging actions.

## Scope exclusions and stop conditions

Excluded: F-cash, Block H, production, main, PR/merge, staging deploy, real hotel data, new product policy, permission policy, schema/domain changes, paid cost, and broad redesign. Stop only on the Issue #53 conditions: `ROADMAP_BLOCKER`, new product/authority policy, material architecture change, new unapproved domain/backend contract, budget gate, real data or promotion. Block H cannot begin until Controller PASS for G.

## Validation / evidence gate

Run relevant and full required validation: unit/integration and executing-D1 route/security/report tests; `npm run check`; `npm run types:check`; `npm run web:build`; `npm run architecture:fitness`; Wrangler API/Web dry-runs; existing D1 query plan and CF-I07/CF-I08 gates; synthetic integrated Worker + D1 + Web browser flows; responsive and accessibility checks above; `git diff --check`; exact scope/API uniqueness audits; bundle baseline/result table. Add fresh G evidence and invariant evidence; no inherited historical PASS will be represented as a fresh run.

Before implementation, freeze the inventory/evidence/invariants and Pre-Critic artifacts alongside this contract. Before Artifact A, every applicable registry invariant must pass evidence, full regression must pass, and evidence claims must map to executable proof. Then immutable Artifact A, orchestration-only Boundary B with exact A SHA, fresh independent critic and final state reconciliation. Publish only the dedicated G branch and report the review handoff in Issue #53. No Block H pending Controller PASS.
