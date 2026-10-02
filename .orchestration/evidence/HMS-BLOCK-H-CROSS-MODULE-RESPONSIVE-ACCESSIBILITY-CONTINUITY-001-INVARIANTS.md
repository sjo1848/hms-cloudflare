# HMS Block H — Invariant Evidence

Artifact candidate: Block H substantive candidate; exact full SHA is recorded by Boundary B and Issue #54.
Task Contract: `.orchestration/contracts/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Registry: `.orchestration/INVARIANTS.md` (24 invariants)

Final evidence for the bounded hardening candidate. Successful, failed, integrated and synthetic runs are distinguished in `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-RESULTS.md`. Publication state is verified again against exact A+B before requesting independent review.

| Invariant | Applies? | Status | Concrete evidence | Rationale |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | P0.1 Worker/D1 canonical 409→refresh→success plus persisted booking/room/event state; F0.9 same-token response-loss recovery, changed-payload 409, atomic audit failure and final ledger D1 assertions; CF-I07 no-op/rejected mutations | H crosses accepted lifecycle, account and admin mutations; no write semantics may falsely succeed. |
| INV-AUDIT-001 | APPLIES | PASS | CF-I05/I06/I07 executing-D1 exact event/ledger/audit assertions; F0.9 successful/rejected charge event counts; H-07 admin audit/no-op regressions | Cross-module UI must display only authoritative successful mutation and preserve exact audit pairing. |
| INV-DOMAIN-001 | APPLIES | PASS | No API/domain/schema files changed; CF-I03..08 and P0.1/Wave12 existing domain transition regressions pass | Lifecycle, room and housekeeping actions remain domain transitions, never generic CRUD. |
| INV-TENANT-001 | APPLIES | PASS | CF-I03..08 tenant-isolation tests; F0.9 true Hotel A/B object lookup/write denials and zero foreign D1 rows; H-02/06/08 local identity/binding fixtures | All routed hotel reads remain server-tenant scoped; CONTROL_DB and operational DB responsibilities stay separate. |
| INV-RBAC-001 | APPLIES | PASS | `/auth/me` identity/capability fixtures; F0.9 denied housekeeping charge read/write; CF-I07/08 denied protected routes and mutation fixtures | UI visibility cannot substitute for authoritative server capability enforcement. |
| INV-PARITY-001 | APPLIES | PASS | No business/API/domain/schema diff; accepted A–G Task Contract surfaces consumed; P0.1, Wave12, CF-I05..08 and F0.9 existing behavior assertions pass | H consumes accepted behavior and cannot alter source semantics. |
| INV-ENUM-001 | APPLIES | PASS | CF-I05 target `CHECKED_IN`/canonical maintenance-state queue assertions; P0.1 persisted `CHECKED_IN` plus UI readiness/maintenance guard | State encodings crossing module boundaries preserve meaning. |
| INV-UX-001 | APPLIES | PASS | Results matrix: focused Case/tasks, retry/error, focus/return, Account, Rooms, Housekeeping and accepted G workflows; no product flow redesign | H is cross-module UX hardening; infra/runner constraints cannot redesign flows. |
| INV-ORDER-001 | APPLIES | PASS | P0.1 natural-order-conflicting `z-priority` fixture selects known next `a-next`; CF-I05 known housekeeping priority/advance and orphan/risk fixtures | Operational queue order and next-case selection remain accepted semantics. |
| INV-RESP-001 | APPLIES | PASS | H-02..H-08 material controls executed at `1280×900`, `768×812`, `375×812`, `375×600`, `844×390`; no-overflow/reachability assertions in P0.1, CF-I05, Guest, F0.9, CF-I07 and CF-I08 runners | Operation reachability and context are proven at each contracted size. |
| INV-EVID-001 | APPLIES | PASS | Results claim→runner/log/D1/capture table separates Worker/D1 from synthetic errors and screenshots; both Wrangler 4.125.0 P0.1 integrated failures are preserved and not counted PASS; Wrangler 4.146.0 P0.1 integrated PASS is separately identified | Integrated, synthetic, API/D1 and diagnostic screenshot claims remain distinct; the runtime version differential does not establish product attribution. |
| INV-LEGACY-001 | N/A | N/A | Diff audit | No legacy import, backfill, migration or ownership-recovery implementation is in H. |
| INV-MONEY-001 | APPLIES | PASS | F0.9 executing Worker/D1 integer-cent totals, same-token retry, rollback/audit failure and authoritative invoice/charge final state; no Cash scenario | Existing Booking Account values/operations retain integer-cent and atomic ledger semantics; no Cash scenarios. |
| INV-STATE-001 | APPLIES | PASS* | Non-circular method: immutable Artifact A is followed by orchestration-only Boundary B recording exact A and review flags; verify exact ancestry/diff before publishing B | Publication must be non-circular and exact A+B must be reviewed. |
| INV-CF-I07-001 | APPLIES | PASS | Static canonical-capability scan and CF-I07 protected API/UI route tests; no new authorization implementation | User/network administration has no role-name bypass. |
| INV-CF-I07-002 | APPLIES | PASS | CF-I07 same-value/no-op role/plan requests assert unchanged state and zero audit rows | Admin no-op does not create false audit activity. |
| INV-CF-I07-003 | APPLIES | PASS | CF-I07 same-subject privileged request succeeds before downgrade and is denied after it, with unchanged durable state | Downgrade denial is causal and not due to missing identity/routing. |
| INV-CF-I07-004 | APPLIES | PASS | All newly executed integrated shell runners verify owned process cleanup before PASS; isolated CLI sessions closed | All tests H uses prove owned processes exit before PASS. |
| INV-CF-I08-001 | APPLIES | PASS | CF-I08 executing-D1 exact integer-cent, empty/zero-denominator and independently reconciled report assertions | Reports and Network aggregate remain exact and zero-safe. |
| INV-CF-I08-002 | APPLIES | PASS | CF-I08 two configured D1s, exact allowlist/ranking reconciliation and unavailable-store fail-closed assertions | Aggregation uses complete configured bindings and fails truthfully. |
| INV-CF-I08-003 | APPLIES | PASS | CF-I08 valid/invalid/inclusive date/state fixtures and Worker SQL assertions | Date and state filters remain explicit and source-correct. |
| INV-CF-I08-004 | APPLIES | PASS | P0.1/CF-I05 target `CHECKED_IN`, `NO_SHOW` and blocking-maintenance predicates across board/availability tests | Expanded serialized states trigger the canonical cross-module predicate. |
| INV-CF-I08-005 | APPLIES | PASS | H date query deep link reload/Back/Forward; hotel-local date from Worker and CF-I08 date-default tests | Clock defaults and route/date continuity remain deterministic. |
| INV-SCOPE-001 | APPLIES | PASS | Changed-path/route audit: no Cash/F-cash, staging, deploy, production, real data, main, PR/merge or Block I+ work | The accelerated cross-module wave has not absorbed forbidden scope. |

## Mutation inventory (frozen)

| Existing operation exercised | H changes mutation? | Expected winner/conflict proof | Evidence |
|---|---|---|---|
| Reservation/check-in/reassignment/checkout | No | Existing authoritative API/D1 result; stale/conflict cannot display success; verify durable booking/room state | H-02 existing C/P0.1 integrated Worker/D1 and executing-D1 tests |
| Housekeeping/Maintenance transition | No | Existing E winner/version and state dimensions remain exact | H-04 CF-I05 executing D1 and browser |
| Booking Account extra charge/payment retry | No | Existing F-account operation identity and ledger winner; no duplicate | H-03 F0.9 integration and CF-I06 D1 tests; omit Cash runner sections |
| Guest creation if traversed | No; creation flow not necessary for cross-module continuity | Existing G route contract/tenant isolation | H-05 focuses on read/context retry; do not add mutation semantics |
| User role/deactivation | No | Existing CF-I07 exact identity/capability/winner/audit behavior | H-07 CF-I07 D1 and existing G browser |
| Network plan/registration | No | Existing network capabilities, exact audit and allow-list | H-08 CF-I07/I08 Worker/D1 |

## Evidence claim audit

| Claim | Exact evidence | Classification |
|---|---|---|
| Accepted lifecycle conflict/recovery is durable | `scripts/p0-1-integrated-browser.sh` + its final local D1 assertions | Integrated Worker/D1/browser; successful run with Wrangler 4.146.0, pinned 4.125.0 failures preserved separately |
| Delayed guest-context UI recovers | `scripts/cf-block-g-guest-context-browser.sh` | Synthetic browser (mocked 503), five exact viewports |
| Guest authorization/tenant predicates hold | `npm run test:cf-i03`, `npm run test:cf-i04` | Executing API/D1 |
| Reports/network aggregates and admin capabilities are authoritative | `scripts/cf-i07-regression.sh`, `scripts/cf-i08-regression.sh`, browser runners | Integrated Worker/D1 with CONTROL_DB + two configured operational D1s |
| Cash is excluded | Changed-path/route audit and accepted F0.9 Account runner | Static + browser; no Cash request/UI mutation |

## Final invariant status

- All 24 registry invariants remain classified; 23 applicable statuses are PASS/PASS* and INV-LEGACY-001 is N/A with rationale.
- PASS* on INV-STATE-001 means the two-commit non-circular method is frozen; immediately after Artifact A, Boundary B must record the exact A SHA, contain only orchestration/evidence metadata, and be ancestry/diff checked before external review. If that exact check fails, do not publish the handoff.
- Runtime classification is `LOCAL_RUNTIME_VERSION_DIFFERENTIAL — PRODUCT_ATTRIBUTION_UNPROVEN`: both P0.1 integrated runs on repository-pinned Wrangler 4.125.0 failed from local Miniflare crashes (one after 409, one before Queue-ready); neither is represented as PASS. P0.1 integrated Worker/D1/Vite/Chromium passed on Wrangler 4.146.0 with the same source/config/schema/fixture bytes. `package.json` and `package-lock.json` were unchanged; no Wrangler upgrade occurred. Wrangler 4.125.0 PASSes only the other separately rerun listed gates, not this P0.1 integrated scenario. The Independent Critic must adjudicate claim validity, tooling/runtime limitation attribution, upgrade necessity before Controller PASS, and integrated-versus-synthetic evidence boundaries.
- No applicable implementation invariant remains unproven; the final publication-method check is performed mechanically at the Boundary B step.
