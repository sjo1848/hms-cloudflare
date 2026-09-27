# UX-UI-RECEPTION-CHECKIN-001 — Invariant Evidence

Artifact candidate: Controller-directed centered-desktop-Dialog rework; exact A will be recorded in publication boundary B
Task Contract: `.orchestration/contracts/UX-UI-RECEPTION-CHECKIN-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

## Invariant mapping

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Real local Worker/D1 browser race in `scripts/p0-1-arrival-integrated.playwright.js`; 409 snapshot plus `scripts/p0-1-assert-local.mjs` | UI never reports success on stale readiness; server command remains authoritative. |
| INV-AUDIT-001 | APPLIES | PASS | Integrated D1 assertion: exactly one CHECK_IN event for each successful booking, none for blocked booking. | No event write path added. |
| INV-DOMAIN-001 | APPLIES | PASS | `ReceptionPage.tsx` invokes the existing `checkIn` command; changed-file audit finds no API/domain mutation. | No generic CRUD transition introduced. |
| INV-TENANT-001 | APPLIES | PASS | Integrated flow uses the seeded receptionist identity and hotel binding; existing `npm run check` includes tenant/routing regression tests. | No tenant routing or object access implementation changed. |
| INV-RBAC-001 | APPLIES | PASS | Existing API authorization tests in `npm run check`; integrated Worker/D1 command succeeds as receptionist. | UI visibility is not an authority boundary. |
| INV-PARITY-001 | APPLIES | PASS | P0.1 check-in form validation and state-preserving browser journey; rework contract maps existing workflow to centered Dialog/Drawer. | No lifecycle/API semantic change. |
| INV-ENUM-001 | APPLIES | PASS | Real BLOCKING and NON_BLOCKING maintenance fixtures exercise their distinct readiness predicates and text. | Canonical values remain from the front-desk board. |
| INV-UX-001 | APPLIES | PASS | Controller-directed rework contract plus integrated browser at 375px and 1280px; centered desktop Dialog/backdrop and mobile Drawer evidence under `output/playwright/ux-ui-checkin-*.png`. | The Human rejected the right-side Sheet; the corrected task surface preserves Reception behind the dialog. |
| INV-ORDER-001 | APPLIES | PASS | Scrambled real fixture; browser asserts known `a-next` selection after success; mock asserts known priority identities. | Expected IDs are independent of rendered first row. |
| INV-RESP-001 | APPLIES | PASS | Integrated Worker/D1 browser asserts mobile full-screen Drawer geometry, stable header/footer, internal scrolling and >=44px CTA; desktop Dialog centering, bounded geometry, dim backdrop and stable header/footer. | 375px mobile; 1280x900 desktop. |
| INV-EVID-001 | APPLIES | PASS | This evidence map separates real Worker/D1, mocked browser, D1 assertions, static gates and current rework screenshots. | Final integrated run PASS; console output was inspected for application failures. |
| INV-LEGACY-001 | N/A | N/A | No legacy/synthetic operational history is created or recovered. | Not applicable to the UI task. |
| INV-MONEY-001 | APPLIES | PASS | Integrated D1 snapshot before retry and after completion asserts invoice totals unchanged and zero payment rows. | No financial mutation or payment creation. |
| INV-STATE-001 | APPLIES | PASS | Publication protocol: centered Dialog rework artifact A followed by orchestration-only boundary B recording exact A SHA and requiring independent review. | Exact A SHA and B verification are recorded after freeze; no verdict is prefilled. |
| INV-CF-I07-001 | N/A | N/A | No role-name shortcut or protected route changed. | Outside task scope. |
| INV-CF-I07-002 | N/A | N/A | No administrative/no-op mutation changed. | Outside task scope. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade changed. | Outside task scope. |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/p0-1-integrated-browser.sh` stops Worker, Vite and Playwright, checks owned process groups, and only then emits PASS; final run output is retained in task evidence. | No broad process killing. |
| INV-CF-I08-001 | N/A | N/A | No report arithmetic changed. | Reports explicitly untouched. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changed. | Outside task scope. |
| INV-CF-I08-003 | N/A | N/A | No report date/state query changed. | Reports explicitly untouched. |
| INV-CF-I08-004 | N/A | N/A | No expanded report state changed. | Outside task scope. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/default behavior changed. | Outside task scope. |
| INV-SCOPE-001 | APPLIES | PASS | `git diff --name-only` audit: Reception check-in UI, local UI primitives, i18n, focused browser scripts and evidence only. | No API files, Reports, Users, migration, staging, main or production changes. |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Check-in | Existing backend lifecycle command; unchanged in this task. | Backend conflict is rendered in-task; retry stays disabled until fresh readiness is available. | Existing backend remains sole CHECK_IN event writer. | Real Worker/D1 409→refresh→success; exact event and persisted-state assertions. |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| UI mock supports guided check-in, 409/refresh failure states, dirty Back/Forward, next case and no-next focus | `scripts/p0-1-arrival-browser.playwright.js` | Mock browser; explicitly not integration evidence |
| Real stale maintenance change conflicts before mutation; refresh then permits one successful retry | `scripts/p0-1-arrival-integrated.playwright.js` against local Wrangler Worker/D1 | Integrated browser/API |
| Booking and room persist authoritatively; event occurs exactly once; invoice remains unchanged; no payments fabricated | `scripts/p0-1-assert-local.mjs` on the retained local fixture | Executing local D1 |
| Desktop Dialog is centered/bounded with a dim backdrop and stable header/footer; Reception page heading remains visible outside it and queue state is retained; mobile Drawer is full-screen, scrollable and has fixed task controls | Browser geometry/accessibility assertions in `scripts/p0-1-arrival-integrated.playwright.js`; screenshot shows Reception title/navigation around the backdrop | Integrated browser |
| Requested visual states are inspectable | `output/playwright/ux-ui-checkin-*.png` | Diagnostic screenshots; not substitutes for assertions |
| Unit/type/build/architecture/budget/query-plan/Wrangler checks | Final task commands recorded in `STATE.md`/`STATUS.json` | Automated gates |

## Pre-Critic review

- Centered Dialog vs rejected right-side Sheet: desktop geometry proves horizontal/vertical centering and bounded width/height; native backdrop dims Reception, and the Reception heading is asserted to remain visible outside the Dialog. The queue is retained in the underlying state and verified after close/success, but is not claimed to be unobscured behind the modal.
- Context continuity: search, selected lane, URL and next priority booking are asserted after real refresh; native dialog close returns focus to the next case or queue control.
- Information density: one stay-summary/readiness block and progressive check-in steps; no D11/inventory implementation detail is exposed.
- Primary action: sticky, visibly labeled Next step/Complete check-in; disabled for authoritative blockers.
- Mobile: full-height Drawer, independently scrollable body, fixed header/footer and >=44px action target; blocker detail is captured before and after internal scrolling.
- BLOCKING/NON_BLOCKING: distinct text labels, causes and actions; real fixtures verify BLOCKING rejects and NON_BLOCKING allows continuation.
- Component policy: source-local native Dialog/Drawer and Dropdown Menu wrappers share one modal lifecycle; no right Sheet for Check-in, alert dialog for normal check-in, workflow tabs, hover-only required facts or extra navigation system. These wrappers are native-element adaptations, not generated shadcn components.
- Interaction system consistency: header/title association remains present during discard confirmation; confirmation receives focus; Escape/Tab/focus restoration and Back/Forward are exercised.
- Known visual test-shell control: the local acceptance identity selector appears because real Worker/D1 local auth is enabled. Reception-scoped CSS makes that development-only control legible without changing authenticated product behavior or global shell structure.

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN.
- [x] Task Contract validation has passed; final integrated run and reviewer notes are attached to the canonical boundary.
- [x] Scope audit passed.
- [x] Canonical boundary records exact artifact A and Independent Critic requirement.
- [x] External review remains required; Codex does not self-approve substantive product acceptance.
