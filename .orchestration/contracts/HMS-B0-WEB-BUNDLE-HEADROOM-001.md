# Task Contract — B0 Web Bundle Headroom

Status: `FROZEN AFTER BASELINE DIAGNOSIS; IMPLEMENTATION NOT ADMITTED`
Task ID: `HMS-B0-WEB-BUNDLE-HEADROOM-001`
Authorization: `HMS Cloudflare — B0 Web Bundle Headroom Authorization`, Drive `1werTEK4vxmoOkzHi0qxJjHD555_iyAIejQbDDBB1pQ8`.
Base: `3d40b82353ce747d9b79100e0d28e7f9348764fc` (Block A exact checkpoint).
Branch: `impl/hms-b0-bundle-headroom`.
Working directory: `/home/sjo1848/dev/hms-elite-cloudflare/hms-b0-bundle-headroom`.

## Objective and scope

Diagnose and, only where a bounded behavior-preserving change can be evidenced, reduce emitted web JS/CSS through deduplication, deletion of proven dead code, or legitimate existing build/tree-shaking configuration. Preserve current application behavior and the existing budget script/limits. Preferred post-change targets are JS raw `<=285,000 B` and CSS raw `<=45,000 B`; they are not authorization to remove product behavior or redefine the metric. If either target requires broad refactoring or the current aggregate static-asset measure is shown not to express the intended risk, stop with `BUNDLE_BUDGET_POLICY_GATE_REQUIRED`.

No Block B work. No backend/schema/API changes, workflow redesign, feature removal, route splitting solely to disguise aggregate bytes, build-budget changes, dependency substitution, paid-cost change, real data, PR, merge, protected branch, staging, deploy or production.

## Verified surfaces at base

- Build and aggregate budget: `apps/web/vite.config.ts`, `scripts/check-cloudflare-budgets.mjs`, `package.json` (`web:build`, `architecture:fitness`).
- Entry and route reachability: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/router.tsx`, `apps/web/src/app/navigation.ts`.
- Global and feature CSS: `apps/web/src/styles.css`; `apps/web/src/features/{billing,guests,housekeeping,reception,reports,rooms,users}/*.css`.
- Material feature modules imported into the route shell: `apps/web/src/features/{billing,guests,housekeeping,network,reception,reports,rooms,users}/`.
- Existing frontend test/browser surfaces to use if a bounded product change is admitted: `apps/web/src/app/navigation.test.ts`, `apps/web/src/i18n/index.test.ts`, `scripts/cf-ux-mobile-browser-ci.mjs`, and current architecture/browser runners. No new product surface is proposed.

## Requirements and acceptance

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Establish reproducible baseline | Vite production build + unchanged budget checker | Record aggregate raw/gzip JS and CSS, emitted chunk count, exact command and base | `.orchestration/evidence/HMS-B0-WEB-BUNDLE-HEADROOM-001-BASELINE.md` |
| Attribute material bytes | source imports, CSS sources and emitted output | Identify route reachability, duplicate emitted bytes and safe dead-code candidates; distinguish emitted savings from source-only cleanup | Same baseline evidence; CLI build inventory and CSS parser output |
| Preserve behavior and budget semantics | all web surfaces; `scripts/check-cloudflare-budgets.mjs` | No behavior deletion, no threshold/metric edit; any substantive optimization must pass current required route, interaction, responsive and regression evidence | Exact tests/browser evidence if implementation proceeds |
| Do not force an unsafe target | Task Contract / Pre-Critic | If bounded, behavior-preserving work cannot credibly reach preferred targets, stop for policy decision | This contract and Pre-Critic record |

## Baseline findings / disposition

- Production output: one JS chunk `299,976 B raw / 86,915 B gzip`; one CSS chunk `48,615 B raw / 9,193 B gzip`. Existing hard limits remain `300,000 / 100,000` JS and `50,000 / 15,000` CSS.
- Preferred headroom requires at least `14,976 B` emitted-JS reduction and `3,615 B` emitted-CSS reduction.
- The unchanged checker aggregates all emitted `.js` and `.css` assets. `AppShell.tsx` statically imports all route components; the emitted JS contains the reachable product routes. Route code splitting would change chunk boundaries, not satisfy the aggregate raw-byte criterion, and can add loader/chunk overhead.
- Source `styles.css` contains repeated Rooms/Guests rules (~4.7 KB source by AST comparison), but the built CSS contains only ~290 B exact duplicate rules. Removing source duplication alone cannot reach the preferred CSS target. Possible rule removal also needs responsive/cascade proof.
- No clear safely removable JS dead code was established. Locale catalogs are fetched as JSON, not embedded in the JS bundle. The unused Sheet wrapper appears tree-shaken already.
- A static selector-text scan produced candidates whose names are not literal in source, but several are generated dynamically; this is not proof of dead CSS and is not authorized removal evidence.
- Therefore the current bounded diagnosis does not establish a behavior-preserving path to both preferred margins. Proceeding would require broad feature-by-feature CSS/JS refactoring or an explicit decision about risk/metric, outside the current bounded mandate.

## Invariant classification

| Registry invariant | Classification | Rationale / evidence obligation |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation. |
| INV-AUDIT-001 | N/A | No audit/event mutation. |
| INV-DOMAIN-001 | N/A | No domain transitions. |
| INV-TENANT-001 | N/A | No tenant routing or data access changes. |
| INV-RBAC-001 | N/A | No authorization changes. |
| INV-PARITY-001 | N/A | No migrated source capability or behavior is to change; if any feature behavior is proposed, stop and remap. |
| INV-ENUM-001 | N/A | No enum/state representation changes. |
| INV-UX-001 | APPLIES | Bundle-only work must preserve all current workflows; any browser-visible behavior change blocks this task. |
| INV-ORDER-001 | N/A | No queue/order logic changes. |
| INV-RESP-001 | APPLIES | CSS removal/optimization must preserve desktop, compact and narrow responsive behavior; diagnostic alone is not visual acceptance. |
| INV-EVID-001 | APPLIES | Byte claims must tie to the unchanged production build/checker; source estimates cannot be presented as emitted savings. |
| INV-LEGACY-001 | N/A | No recovery/backfill data. |
| INV-MONEY-001 | N/A | No financial logic. |
| INV-STATE-001 | APPLIES | If a substantive artifact becomes eligible, publish non-circular A then orchestration-only B; do not invent a SHA. |
| INV-CF-I07-001 | N/A | No protected admin/network authorization path changes. |
| INV-CF-I07-002 | N/A | No admin mutation changes. |
| INV-CF-I07-003 | N/A | No downgrade authorization proof changes. |
| INV-CF-I07-004 | N/A | No regression runner starts services in this diagnostic task. |
| INV-CF-I08-001 | N/A | No reporting arithmetic changes. |
| INV-CF-I08-002 | N/A | No network aggregation changes. |
| INV-CF-I08-003 | N/A | No report semantics changes. |
| INV-CF-I08-004 | N/A | No expanded state changes. |
| INV-CF-I08-005 | N/A | No date defaults/continuity changes. |
| INV-SCOPE-001 | APPLIES | Keep B0 separate from Block B and avoid absorbing broad application refactors. |

## Pre-implementation stop

This contract authorizes diagnosis only after the baseline demonstrated that the target margin cannot be reached by an established bounded safe change. No product source change is admitted under this contract. A Controller/policy decision would be required to broaden the optimization scope or revisit the intended headroom measurement; current budget limits remain untouched.
