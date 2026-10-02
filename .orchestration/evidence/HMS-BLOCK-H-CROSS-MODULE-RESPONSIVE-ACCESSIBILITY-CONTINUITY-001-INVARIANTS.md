# HMS Block H — Invariant Evidence

Artifact candidate: `NOT CREATED — pre-implementation admission record`
Task Contract: `.orchestration/contracts/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Registry: `.orchestration/INVARIANTS.md` (24 invariants)

This frozen admission mapping is not final invariant evidence. Status is `UNPROVEN` until the contracted tests and evidence are executed; no substantive artifact may be published with an applicable invariant still `UNPROVEN`.

| Invariant | Applies? | Status | Concrete evidence planned | Rationale |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | UNPROVEN | H-02/03/07 executing D1 canonical stale/conflict/retry and durable target state | H crosses accepted lifecycle, account and admin mutations; no write semantics may falsely succeed. |
| INV-AUDIT-001 | APPLIES | UNPROVEN | CF-I05/I06/I07 exact event/ledger/audit assertions; H-07 | Cross-module UI must display only authoritative successful mutation and preserve exact audit pairing. |
| INV-DOMAIN-001 | APPLIES | UNPROVEN | H-02/04 source-contract command/status fixtures | Lifecycle, room and housekeeping actions remain domain transitions, never generic CRUD. |
| INV-TENANT-001 | APPLIES | UNPROVEN | CF-I03..I08 tenant isolation tests plus H-02/06/08 fixture identity checks | All routed hotel reads remain server-tenant scoped; CONTROL_DB and operational DB responsibilities stay separate. |
| INV-RBAC-001 | APPLIES | UNPROVEN | H-01/07/08 `/auth/me`, allowed and denied direct-route/write fixtures | UI visibility cannot substitute for authoritative server capability enforcement. |
| INV-PARITY-001 | APPLIES | UNPROVEN | Contracted A–G lifecycle/report/account evidence and no-semantic-change diff audit | H consumes accepted behavior and cannot alter source semantics. |
| INV-ENUM-001 | APPLIES | UNPROVEN | H-02/04 cross-module room/lifecycle target serialization fixtures | State encodings crossing module boundaries must preserve meaning. |
| INV-UX-001 | APPLIES | UNPROVEN | H-01..11 responsive journey assertions against frozen contracts | H is cross-module UX hardening; infra/runner constraints cannot redesign flows. |
| INV-ORDER-001 | APPLIES | UNPROVEN | H-02 queue fixture, next-case identity and queue-context assertions | Operational queue order and next-case selection remain accepted semantics. |
| INV-RESP-001 | APPLIES | UNPROVEN | H-10 per-journey five-viewport matrix with executable controls | Operation reachability and context must be proven at each contracted size. |
| INV-EVID-001 | APPLIES | UNPROVEN | H result claim→runner/log/capture audit | Integrated, synthetic, API/D1 and diagnostic screenshot claims must remain distinct. |
| INV-LEGACY-001 | N/A | N/A | Diff audit | No legacy import, backfill, migration or ownership-recovery implementation is in H. |
| INV-MONEY-001 | APPLIES | UNPROVEN | H-03 F-account-only executing D1 integer-cent and retry assertions; exclude Cash | Existing Booking Account values/operations must retain integer-cent and atomic ledger semantics; no Cash scenarios. |
| INV-STATE-001 | APPLIES | UNPROVEN | Exact immutable Artifact A plus immediate orchestration-only Boundary B | Publication must be non-circular and exact A+B must be reviewed. |
| INV-CF-I07-001 | APPLIES | UNPROVEN | H-07 canonical capability scan and CF-I07 protected routes | User/network administration must have no role-name bypass. |
| INV-CF-I07-002 | APPLIES | UNPROVEN | H-07 no-op/rejected mutation and exact audit D1 assertions | Admin no-op must not create false audit activity. |
| INV-CF-I07-003 | APPLIES | UNPROVEN | H-07 same-subject before/after downgrade with same protected request | Downgrade denial must be causal and not due to missing identity/routing. |
| INV-CF-I07-004 | APPLIES | UNPROVEN | Executed regression process-tree cleanup assertions | All tests H uses must prove owned processes exit before PASS. |
| INV-CF-I08-001 | APPLIES | UNPROVEN | H-06/08 exact integer-cent/zero-denominator expectations | Reports and Network aggregate must remain exact and zero-safe. |
| INV-CF-I08-002 | APPLIES | UNPROVEN | H-08 two configured D1s, allowlist and unavailable store assertions | Aggregation must use complete configured bindings and fail truthfully. |
| INV-CF-I08-003 | APPLIES | UNPROVEN | H-06 valid/invalid/inclusive-range and state fixture | Date and state filters remain explicit and source-correct. |
| INV-CF-I08-004 | APPLIES | UNPROVEN | H-02/04 NO_SHOW/maintenance/room state cross-module predicate fixtures where accepted | Expanded serialized states must trigger the canonical cross-module predicate. |
| INV-CF-I08-005 | APPLIES | UNPROVEN | H-01/06 deterministic hotel-clock, route and date continuity assertions | One captured date/default and continuity semantics must remain deterministic. |
| INV-SCOPE-001 | APPLIES | UNPROVEN | Changed-path/route/scope audit, including Cash and deployment command exclusion | The accelerated cross-module wave must not absorb F-cash or staging scope. |

## Mutation inventory (frozen)

| Existing operation exercised | H changes mutation? | Expected winner/conflict proof | Evidence |
|---|---|---|---|
| Reservation/check-in/reassignment/checkout | No | Existing authoritative API/D1 result; stale/conflict cannot display success; verify durable booking/room state | H-02 existing C/P0.1 integrated Worker/D1 and executing-D1 tests |
| Housekeeping/Maintenance transition | No | Existing E winner/version and state dimensions remain exact | H-04 CF-I05 executing D1 and browser |
| Booking Account extra charge/payment retry | No | Existing F-account operation identity and ledger winner; no duplicate | H-03 F0.9 integration and CF-I06 D1 tests; omit Cash runner sections |
| Guest creation if traversed | No; creation flow not necessary for cross-module continuity | Existing G route contract/tenant isolation | H-05 focuses on read/context retry; do not add mutation semantics |
| User role/deactivation | No | Existing CF-I07 exact identity/capability/winner/audit behavior | H-07 CF-I07 D1 and existing G browser |
| Network plan/registration | No | Existing network capabilities, exact audit and allow-list | H-08 CF-I07/I08 Worker/D1 |

## Evidence claim audit (planned)

| Claim | Planned evidence | Classification |
|---|---|---|
| Accepted lifecycle conflict/recovery is durable | P0.1 integrated runner plus D1 state assertions | Integrated Worker/D1/browser |
| Delayed guest-context UI recovers | `cf-block-g-guest-context-browser.sh` | Synthetic browser (mocked 503) |
| Guest authorization/tenant predicates hold | CF-I03/04 executing D1 tests | API/D1 |
| Reports/network aggregates and admin capabilities are authoritative | CF-I07/I08 regressions with local CONTROL_DB + operational D1s | Integrated Worker/D1 |
| Cash is excluded | H-03 path/route assertions and scope audit; no Cash request/UI mutation | Static + browser path evidence |

## Admission status

- All 24 registry invariants are classified before hardening.
- Applicable final statuses remain UNPROVEN pending contracted implementation/evidence.
- Admission Pre-Critic may authorize bounded hardening only; final Pre-Critic is mandatory before Artifact A.
