# Task Contract — F0.10 mobile Network keyboard evidence repair

Task ID: `HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001`
Parent: `.orchestration/contracts/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001.md` and `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-WRITES-KEYBOARD-001.md`
Rework trigger: Tesla's fresh Independent Critic verdict `REWORK` on A2 `3b4a9ea687e6ddc7a184b8cb3b13cc5e2f5d006f` + B2 `a6bdd79576d37de6b5f9ad78becc8ae806d85ef4`; finding F0.10-IC-04 (Medium) — Network keyboard evidence missing at mobile width.
Status: `FROZEN BEFORE EVIDENCE REPAIR`.

## Bounded objective

Add integrated browser evidence for the existing, already capability-gated Network controls at mobile width `375×844`. Do not change product code or permission semantics unless the browser establishes an actual responsive defect, in which case diagnose under this contract before any additional implementation. A2/B2 remain immutable and retain their `REWORK` verdict.

## Requirements → surface → acceptance → evidence

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Authorized Network keyboard access on desktop and mobile | `scripts/cf-f0-10-capabilities.playwright.js` | At both 1280×900 and 375×844, the `saas_admin` fixture can Tab/Enter to register form input and Tab to the plan selector | Integrated real local Worker/D1/Vite browser assertions at each viewport |
| Unauthorized Network write affordances absent on desktop and mobile | same browser runner, direct `/network` for ops hotel member with no network role | At both 1280×900 and 375×844, registration details and plan editor are absent from DOM; 40 Tab presses never focus a registration/plan write control; plan remains read-only visible | Integrated browser assertions with server `/auth/me`; labeled synthetic hotel-list GET only to display/select the property; real denied POST returns 403 |
| Evidence attribution | runner/result/screenshots | Record each role×viewport check separately; no desktop assertion is relabeled mobile; preserve actual Worker/D1 authorization and clean owned process trees | Structured JSON/log/screenshots, final D1 counts and cleanup marker |

## Non-goals

No Network layout redesign, new role/capability, API/guard/identity change, CSS/JS product change unless an actual behavior regression is proven, migration, unrelated UI change, F0.11, Block A–H, real data, PR/push/merge/main/staging/deploy/production.

## Invariant classification (all 24)

| Invariant | Classification | Reason/evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation semantics change. |
| INV-AUDIT-001 | N/A | No audit implementation changes; denied network POST must cause no hotel/audit mutation. |
| INV-DOMAIN-001 | N/A | No domain transitions. |
| INV-TENANT-001 | APPLIES | No-write hotel member and separate network-only identity retain disjoint scopes; real Worker context assertions. |
| INV-RBAC-001 | APPLIES | Same server capability drives DOM; direct denied network write remains 403 with zero effect. |
| INV-PARITY-001 | N/A | No business behavior or grants change. |
| INV-ENUM-001 | N/A | No enums or serialized values change. |
| INV-UX-001 | APPLIES | Keyboard-accessible allowed task; forbidden controls not discoverable/focusable; read-only plan remains legible. |
| INV-ORDER-001 | N/A | No operational queue or ranking change. |
| INV-RESP-001 | APPLIES | Prove Network behavior at both 1280×900 and 375×844 for allowed and disallowed contexts. |
| INV-EVID-001 | APPLIES | Distinguish real auth/POST from synthetic hotel-list GET; report exact viewport assertions. |
| INV-LEGACY-001 | N/A | No historical data changes. |
| INV-MONEY-001 | N/A | No monetary behavior. |
| INV-STATE-001 | APPLIES | Replacement A3/B3 and fresh review; after exact verdict, orchestration-only follow-up closes this row. |
| INV-CF-I07-001 | APPLIES | No role map; server capability source remains sole authority. |
| INV-CF-I07-002 | N/A | No admin mutation behavior. |
| INV-CF-I07-003 | N/A | No downgrade implementation change. |
| INV-CF-I07-004 | APPLIES | Browser runner must verify its owned processes stop. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network KPI aggregation. |
| INV-CF-I08-003 | N/A | No reporting dates/state predicates. |
| INV-CF-I08-004 | N/A | No booking/room predicates. |
| INV-CF-I08-005 | N/A | No reporting clocks/continuity. |
| INV-SCOPE-001 | APPLIES | Evidence-only browser coverage; if product code changes, full prior F0.10 test/build/browser/regression suite reruns. |

## Validation and boundary

At minimum run browser runner with distinct desktop/mobile assertions, inspect structured result and screenshots, verify actual denied POST and D1 zero effect, verify cleanup, run `git diff --check` and confirm no product file changed. If only evidence changes, no need to rerun unrelated full D1 suite; if product code changes, rerun types, full suite, build/budget, architecture, query plans, Wrangler dry-runs, integrated E2E, and CF-I03–I07 serial. Update invariant/precritic; freeze replacement A3, then orchestration-only B3 naming A3 and this review result. Obtain a fresh critic. Foundation remains incomplete through F0.11/F0.12.

## Frozen Pre-Critic

`PRE-CRITIC: PASS FOR BOUNDED EVIDENCE REPAIR`

The finding is an evidence/viewpoint omission only; prior critic found no responsive product defect, route/contract gap, architecture blocker or security change. Assertions will use the already frozen real Worker/D1 test fixture and current page; product semantics are unchanged.
