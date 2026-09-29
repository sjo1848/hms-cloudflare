# Task Contract — HMS Block A: App Shell + Navigation/Context

Status: `FROZEN BEFORE IMPLEMENTATION`
Task ID: `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001`
Authorization: `HMS-BLOCK-A-AUTHORIZATION-014`, Human Gate BA1–BA7 APPROVED.
Base: Foundation 0 closure `1bfa20bb5f9bf1db421afbb88bf77b87a97f5d18`.
Branch: `impl/hms-block-a-shell`.
Controlling design: Blueprint 001, Reconciliation 007, Final Disposition 008; roadmap Artifact A2 `b2581e4c370eeb6f74e9380af010e48386642b4f`, Boundary B2 `c6a4bcb9a2939505f7ddf8e72c02ec9b825f00f3`, and Block A contract in `docs/implementation-roadmap/HMS-BLOCK-CONTRACTS-A-H-V1.md`.

## Objective and boundary

Deliver the application-level shell/navigation/context contract only: discoverable capability-aware routes; server-authoritative hotel and user identity context; direct-link, reload, Back/Forward continuity; responsive WIDE/COMPACT/NARROW composition; and integration of F0.11 capability refresh/invalidation. Existing module workflows remain their owners. This is not permission to start Blocks B–H.

No backend authorization changes, schema/migrations, real/customer data, real-data cutover/bootstrap, PR, merge, push to protected branches, `main`, staging, deploy or production operation. Backend authorization remains authoritative; hiding/guarding a client route is UX only and never grants or substitutes for API authorization.

## Verified current surfaces (repository audit at accepted base)

All paths below exist at the base commit. Exact files, not conceptual route names:

- Shell/bootstrap: `apps/web/src/App.tsx`, `apps/web/src/main.tsx`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/styles.css`.
- Navigation and URL: `apps/web/src/app/navigation.ts`, `apps/web/src/app/router.tsx`; Reception currently owns its query-backed queue state in `apps/web/src/features/reception/ReceptionPage.tsx`.
- Capability and identity client: `apps/web/src/app/capabilities.tsx`, `apps/web/src/api/client.ts`, `apps/web/src/app/LocalDevIdentitySelector.tsx`.
- Server authority inspected but not expected to change: `apps/api/src/index.ts` (`/api/v1/auth/me` and auth middleware), `apps/api/src/auth/capabilities.ts`, `apps/api/src/auth/membership.ts`.
- Localized shell/navigation: `apps/web/src/i18n/locales/en/common.ts`, `apps/web/src/i18n/locales/es-AR/common.ts`.
- Existing test surface: `apps/web/src/features/reception/queue.test.ts`, `apps/web/src/i18n/index.test.ts`; neither currently exercises AppShell/router. Browser/regression runners to inspect before reuse include `scripts/cf-product-flow-browser-ci.mjs`, `scripts/cf-ux-mobile-browser-ci.mjs`, `scripts/cf-web-arch-browser.playwright.js`, and `scripts/p0-1-integrated-browser.sh`.

No new production API, migration, or schema surface is needed or authorized. Any new production client component/file, test, or browser runner discovered necessary during implementation must be named and labeled `PROPOSED NEW SURFACE` in evidence before creation; prefer the verified existing shell/router/navigation files and existing runner infrastructure.

## As-is facts and acceptance contracts

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Product contexts remain discoverable and separated | `apps/web/src/app/navigation.ts`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/styles.css`, both `common.ts` locale files | Hotel operations (Reception, Rooms, Housekeeping), directory (Guests), insights (Reports), hotel administration (Users/Admin), and platform/network administration are distinct semantic groups where currently exposed. Existing route inventory is the `navigation` table (`/bookings`, `/rooms`, `/guests`, `/housekeeping`, `/reports`, `/users`, `/network`); this task adds no destination. On NARROW, primary destinations are Reception/Rooms/Housekeeping/More and existing secondary destinations move under More. Only server-authorized entries render. No Billing/Cash shell destination is added; no global Guest account is introduced. | Focused nav model tests; desktop/compact/mobile browser assertions; static scope/diff audit. |
| Capabilities are server-owned | `apps/api/src/index.ts` `/auth/me` is authority; `apps/web/src/app/AppShell.tsx`, `navigation.ts`, `api/client.ts` consume it | No frontend role→capability table. Nav and route affordances derive only from effective capability arrays returned by `/auth/me`; loading/error/unknown data fails closed. API authorization remains unchanged and is separately asserted for at least allowed and denied identities using existing local synthetic fixtures. | Contract/model tests plus local Worker/API `/auth/me` matrix and denied protected request; no mock is called integrated evidence. |
| Hotel/user context is truthful | `/auth/me`; `AppShell.tsx`; `capabilities.tsx`; `api/client.ts` | Shell identifies current hotel and signed-in subject using server-returned `hotel_name`/`hotel_id` and `email`/`subject`; no client-derived role/capabilities. The dev-only profile selector is test tooling, not production identity UI. No production hotel-switcher is added. Pending/unauthorized/error states are distinguishable from an empty hotel. On identity/hotel change, old capabilities/context are cleared before the new authority resolves. Older responses cannot overwrite newer identity/hotel context. | Deferred response race test; local Worker `/auth/me` and synthetic identity switch browser evidence. |
| Direct routes and refresh remain addressable | `router.tsx`, `navigation.ts`, `AppShell.tsx` | Each route in the current `navigation` inventory survives direct load and refresh with pathname/search/hash. Existing aliases are retained only when found in source/tests; no hypothetical alias is added. A route requiring a missing capability displays a clear inaccessible state and safe authorized recovery affordance, not protected module data; a visible link is never the security boundary. Unknown paths render a truthful not-found/recovery state and do not silently masquerade as Reception. Existing URLs remain compatible. | Browser direct-link/refresh tests for every canonical navigation route and a query+hash Reception deep link; denied route plus protected API check; unknown path assertion. |
| Browser navigation preserves context | `router.tsx`; existing Reception URL-state owner `ReceptionPage.tsx` remains unchanged unless a verified integration defect forces a minimal shell adapter | Internal navigation creates coherent history; browser Back/Forward restores URL pathname/search/hash, existing URL-backed selected view/query state, and useful scroll position for the originating history entry; reload preserves URL-backed state. App-level Back, if introduced, is not a substitute for browser history and has accessible label/focus. No rewrite of module-local workflow state. | Browser sequence with independently seeded path/query/hash states; Back, Forward and reload assertions at WIDE and NARROW. |
| Capability refresh/invalidation follows F0.11 and Final Disposition 008 §2 | `api/client.ts`, `AppShell.tsx`, `capabilities.tsx`, `LocalDevIdentitySelector.tsx` | Bootstrap and identity/hotel change fetch `/auth/me`; stale authorization response (403, excluding `/auth/me` itself) triggers a deduplicated authoritative capability refresh. Downgrade proof uses one synthetic subject and the same protected read/write operation, allowed before and denied after; do not substitute two different profiles. Navigation/direct-route affordances update only after authoritative refresh. A denied business request remains denied; refresh does not retry/replay the business request or turn a 403 into success. Failed refresh remains visibly unavailable and fail-closed; no blind retry loop. | Deferred out-of-order authority responses; local Worker/D1 authorization downgrade on same subject and operation using existing synthetic control-plane fixture; browser asserts menu/route state and no mutation replay. |
| WIDE / COMPACT / NARROW are compositional | `AppShell.tsx`, `styles.css`, `navigation.ts` | WIDE (1440×900): persistent primary shell with distinct navigation groups. COMPACT (1024×700): reduced shell and one dominant module surface without losing route/context recovery. NARROW (390×844): touch-first primary destinations Reception/Rooms/Housekeeping/More; secondary Guests/Finance/Reports/Admin and capability-authorized Network are reachable from More; no hover-only critical navigation. Modes change hierarchy/navigation/focus, not only CSS stacking. Exact implementation breakpoint remains an implementation detail; these viewports are the evidence contract. | Playwright at all three exact viewports, interacting with each navigation tier and route; reduced-height and keyboard/focus assertions. |
| Keyboard/accessibility and meaning | shell navigation in `AppShell.tsx` and `styles.css` | All nav entries and open/close controls keyboard reachable; visible focus; Escape closes mobile nav and restores focus; current route uses `aria-current` or equivalent; active/access state is not color-only; mobile keyboard does not obscure focused nav/context; reduced-height remains operable. | Browser keyboard assertions at NARROW and COMPACT; accessibility snapshot/assertions for roles, names, focus, current and unavailable states. |

## Context ownership and concurrency

- Durable navigable context belongs in the URL/history: pathname, search and hash; preserve current Reception-owned URL semantics and do not duplicate them in a parallel shell store.
- Server identity/hotel/effective capability truth comes only from `/api/v1/auth/me`. Current local acceptance identity selector remains dev-only and triggers the same invalidation path. No client role matrix or inferred hotel name is authoritative.
- Router owns location/history and per-history-entry scroll restoration. Domain entities, queue ranking, task drafts, room dimensions and resource refresh remain their existing module/F0 owners; this task cannot redefine them.
- Every identity/hotel capability request is generation-bound. Stale response cannot restore old context, old nav entries, or old authorized route state. Refreshes are single-flight/deduplicated; failed refresh is not reported as success; 403 handling never blindly resubmits the failed request.
- No persistence beyond existing URL/history and dev-only local identity selection; no server write/audit event or D1 mutation is introduced.

## Non-goals / explicit exclusions

- Blocks B–H and all module workflow redesign; no broad Reception/Rooms/HK/Finance/Guests/Reports/Admin changes.
- No new capability taxonomy, client role map, authentication/topology, API endpoint, route authorization policy, backend RBAC change or tenant routing change.
- No global Guest account, Billing/Cash shell nav, room-state/domain changes, real data or migrations.
- No unrelated visual redesign/design system. Existing shell may change only as needed to meet frozen IA/responsive semantics.

## Validation and evidence matrix

1. Focused tests: navigation grouping/required capabilities/route resolution; denied/unknown route; router query/hash and popstate; stale `/auth/me` generation; identity/hotel clearing; 403 single-flight refresh/no business replay.
2. API integration: local synthetic Worker/D1 `/auth/me` for hotel and network identity, effective capabilities; same protected endpoint allowed then denied after fixture role change where accepted test fixtures permit. No customer data.
3. Browser: WIDE 1440×900, COMPACT 1024×700, NARROW 390×844; direct deep link/reload; Back/Forward; context and scroll continuity; authorized/denied route; capability downgrade/refresh; mobile keyboard, reduced height and focus return; no hover dependency.
4. Standard validation: `npm run check`, `npm run types:check`, `npm run web:build`, architecture fitness, i18n and Cloudflare budgets (binding existing budgets unchanged); changed-scope browser/integration tests; inspect exact diff and owned-process cleanup for any runner that starts Worker/Vite/Playwright.
5. Evidence claims explicitly label unit/mock vs integrated Worker/D1 vs browser. No global flaky browser suite is sole proof. Every required assertion maps to a committed executable receipt or immutable artifact.

## Development Gate, critic, recovery, stop

Development Gate requires all rows above evidenced; no blocker or route/capability/context regression; exact changed-surface inventory; all applicable learned invariants proven; mandatory Pre-Critic passed; then immutable Artifact A plus orchestration-only Boundary B and a fresh separate Independent Critic on exact A+B. This contract does not authorize self-declared PASS.

Rollback: revert the isolated shell/router/client changes; no persistent product data changes exist. Preserve canonical URLs and server auth behavior. If satisfying responsive taxonomy or unauthorized-route behavior requires a new product destination/capability, stop that subproblem and document a `ROADMAP_BLOCKER` rather than inventing policy.

Stop only at a genuine `ROADMAP_BLOCKER`, frozen-architecture contradiction, new product policy, required real-data action, scope crossing into B–H, prohibited promotion action, or `BLOCK_A_COMPLETE_AWAITING_CONTROLLER_REVIEW` after exact-pair independent review.

## Durable invariant classification — all registry entries

| Invariant | Classification | Rationale / planned evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business conditional mutation or multi-write operation is added. API authorization tests assert no mutation side effects on denial only if existing protected test endpoint supports it. |
| INV-AUDIT-001 | N/A | No audit/event write path changes. |
| INV-DOMAIN-001 | N/A | No domain transition or generic CRUD path changes. |
| INV-TENANT-001 | APPLIES | Shell identity/hotel context must never cross-bind on hotel/identity switch; use local synthetic memberships and assert server-selected hotel/context; no cross-tenant business object IDs added. |
| INV-RBAC-001 | APPLIES | Navigation/route affordances consume effective server capabilities; backend remains authority. Verify allowed/denied API behavior and fail-closed unknown capabilities/route. |
| INV-PARITY-001 | N/A | No source domain workflow, fields or business rules are migrated. |
| INV-ENUM-001 | N/A | No domain enum representation/predicate changes. |
| INV-UX-001 | APPLIES | Preserve approved module ownership, URL/deep-link route and context behavior; responsive browser journey evidence. |
| INV-ORDER-001 | N/A | No operational queue/list ranking or next-item selection changes. |
| INV-RESP-001 | APPLIES | Exact WIDE/COMPACT/NARROW widths execute nav, direct route, Back/Forward and focus controls, not shell reachability alone. |
| INV-EVID-001 | APPLIES | Evidence matrix maps each claim to focused test, local Worker/D1 or browser executable; mock evidence labeled. |
| INV-LEGACY-001 | N/A | No historical data/case synthesis. |
| INV-MONEY-001 | N/A | No money, account, payment, charge or cash operation changes. |
| INV-STATE-001 | APPLIES | Publish Artifact A and later orchestration-only Boundary B with exact A; no self-referential commit, no source changes in B. |
| INV-CF-I07-001 | N/A | No admin/network/audit API authorization handler is modified; existing canonical server authority is tested, not altered. |
| INV-CF-I07-002 | N/A | No admin mutation changes. |
| INV-CF-I07-003 | APPLIES | Capability-downgrade proof is required for shell invalidation: same synthetic subject and protected operation allowed before, denied after; no role-downgrade mutation is added. |
| INV-CF-I07-004 | APPLIES | Any local browser runner that starts processes must own cleanup and verify them absent before terminal PASS. |
| INV-CF-I08-001 | N/A | Reports calculations are not changed; Reports link placement only. |
| INV-CF-I08-002 | N/A | No network aggregation changes; Network navigation is capability presentation only. |
| INV-CF-I08-003 | N/A | No report date/state query changes. |
| INV-CF-I08-004 | N/A | No domain state enum expansion. |
| INV-CF-I08-005 | N/A | No report clock defaults or cross-surface report mutation changes. |
| INV-SCOPE-001 | APPLIES | Diff audit explicitly excludes Blocks B–H, product-domain/backend/schema changes, data mutation and all promotion actions. |

## Contract review / admission Pre-Critic

Separate read-only Contract Reviewer result and dispositions are recorded in `.orchestration/evidence/HMS-BLOCK-A-CONTRACT-REVIEW-001.md`. The reviewer identified route authorization, invalidation, unknown paths, hash/scroll, context-source, viewport taxonomy, route inventory and focus details; the table above resolves them without adding product destinations, identity UI, or role policy. The admission Pre-Critic is recorded in `.orchestration/evidence/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001-PRECRITIC.md`.
