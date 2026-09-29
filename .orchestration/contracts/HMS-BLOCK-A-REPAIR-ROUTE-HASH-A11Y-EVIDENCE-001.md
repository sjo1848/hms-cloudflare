# Task Contract — Block A bounded route/hash/accessibility evidence repair

Status: `FROZEN BEFORE REWORK`  
Task ID: `HMS-BLOCK-A-REPAIR-ROUTE-HASH-A11Y-EVIDENCE-001`  
Parent: `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001`  
Branch: `impl/hms-block-a-shell`  
Scope: close read-only internal QA findings before Block A Artifact A.

## Objective and bounded scope

Repair only the following findings against the existing frozen Block A design:

1. Unknown nested paths currently match known modules by prefix. Only exact canonical route paths and the existing `/` Reception entry resolve; unknown nested paths render Not Found. Query strings remain module context, not route identity.
2. A direct or history-restored URL fragment must scroll to its matching element when present, without breaking browser history-entry scroll restoration or async-render waiting. Missing fragments must fail safely. No new app destinations or module-owned workflow state.
3. Extend the local integrated browser proof for keyboard reachability/semantics at COMPACT and NARROW and operation at reduced height; assert accessible names/roles, current-route marker and navigation focus. This is evidence/test work only unless it reveals a scoped shell defect.
4. Capture the exact current build's architecture/i18n/raw+gzip budget output as a durable receipt. Do not alter budgets. Existing optimizer target remains aligned to the app's ES2022 target; any additional size change requires this Task Contract's normal acceptance and full build/browser regression.

No backend/API/schema/migration/domain changes, real data, Blocks B–H, PR, merge, main, staging, deploy or production. Budget repair may use only a safe, auditable shell-local improvement if needed; never weaken the configured ceiling or omit required code/tests.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Exact route resolution | `apps/web/src/app/navigation.ts`, `apps/web/src/app/navigation.test.ts`, `scripts/cf-block-a-shell.playwright.js` | `/rooms/room-123`, `/bookings/booking-123` and another unknown nested path resolve null and render Not Found; seven canonical routes and `/` still work. | Unit and local Worker browser tests. |
| Fragment navigation | `apps/web/src/app/router.tsx`, `scripts/cf-block-a-shell.playwright.js` | On direct/hash history navigation, an existing fragment target is scrolled into view after render; Back/Forward restores saved per-entry scroll when available; no-hash navigation still begins at top; no arbitrary sleep. | Browser asserts actual target geometry and existing Back/Forward scroll receipt. |
| Accessible responsive shell | `scripts/cf-block-a-shell.playwright.js`, `apps/web/src/styles.css` only if a concrete defect appears | COMPACT and NARROW primary/secondary navigation is traversable by keyboard; links have accessible names, route current state is exposed, More has named button/dialog semantics and focus restoration; reduced-height viewport has no horizontal overflow and keeps More controls usable/scrollable. | Real local Worker/D1 browser assertions at exact contract viewports plus 390×560 reduced height. |
| Final budget provenance | `output/playwright/block-a-final-architecture-fitness.log` | The current build's architecture, i18n and raw/gzip budget command completes PASS with measured values. No ceiling change. | Captured command exit status and output, then full integrated build/browser test. |

## Invariants — all 24 registry entries

Classification is inherited from the parent Block A Task Contract; no semantic scope changes:

| Invariant | Classification | Required repair evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No conditional business mutation. |
| INV-AUDIT-001 | N/A | No product audit/event write path. |
| INV-DOMAIN-001 | N/A | No domain transition. |
| INV-TENANT-001 | APPLIES | Parent local Worker identity/hotel/out-of-order proof remains required and is rerun. |
| INV-RBAC-001 | APPLIES | Parent same-subject allowed→403, no-replay and capability route guard remain required and are rerun. |
| INV-PARITY-001 | N/A | No source-domain behavior migration. |
| INV-ENUM-001 | N/A | No business enum change. |
| INV-UX-001 | APPLIES | Canonical navigation/deep-link/history semantics and unknown-route truthfulness asserted. |
| INV-ORDER-001 | N/A | No queue ordering change. |
| INV-RESP-001 | APPLIES | Keyboard/accessibility and reduced-height controls exercised at COMPACT/NARROW. |
| INV-EVID-001 | APPLIES | Build budget receipt plus executable direct-fragment/route/accessibility assertions. |
| INV-LEGACY-001 | N/A | No legacy data/cutover. |
| INV-MONEY-001 | N/A | No financial behavior. |
| INV-STATE-001 | APPLIES | New rework evidence precedes immutable Artifact A; exact A then orchestration-only B. |
| INV-CF-I07-001 | N/A | No server capability implementation change. |
| INV-CF-I07-002 | N/A | No administrative mutation semantics. |
| INV-CF-I07-003 | APPLIES | Same-subject same-operation allowed/denied downgrade proof rerun. |
| INV-CF-I07-004 | APPLIES | Integrated runner cleanup and terminal success verification rerun. |
| INV-CF-I08-001 | N/A | No reporting calculations. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No reporting date predicates. |
| INV-CF-I08-004 | N/A | No cross-module domain-state change. |
| INV-CF-I08-005 | N/A | No report clock/continuity behavior. |
| INV-SCOPE-001 | APPLIES | Diff remains confined to parent Block A shell/test/evidence scope. |

## Pre-Critic risks / recovery

- Do not infer nested resource-detail routes: no such route exists in the approved seven-route inventory. Exact routing is safe and contract-aligned.
- Hash target lookup must decode the fragment safely, not treat arbitrary URL text as a CSS selector, and must not override a saved numeric scroll position on browser Back/Forward.
- Browser tests must create a deterministic local-only target and assert actual geometry, not merely URL fragment retention.
- Keyboard proof must exercise browser Tab sequence and semantic names/roles rather than call `.focus()` on each destination.
- Reduced-height proof must check usable controls/scroll and overflow rather than assert only viewport size.
- Budget evidence must be from the final current build; an older log or a passing build alone is insufficient.
- Re-run complete serial suite, types, build, architecture/budget, query plans, Wrangler dry-runs and integrated Worker/D1/dev+minified browser after code changes. Any applicable invariant failure blocks artifact publication and is repaired.

## Gate

This bounded repair is authorized within Block A and does not authorize Blocks B–H or promotion. After evidence and final Pre-Critic pass, publish one immutable Artifact A and an orchestration-only Boundary B, then obtain a separate Independent Critic on that exact pair. Codex does not self-approve substantive PASS.
