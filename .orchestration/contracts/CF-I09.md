# CF-I09 — Data Migration Rehearsal + Local Operational Readiness

Status: `ACTIVE / AUTHORIZED`  
Phase: `BUILD → VALIDATE readiness`  
Human Gate: `NONE` at start  
Cost guard: `$0/month / Cloudflare Free`; no paid transition without Human Gate.

## Objective

Complete the Cloudflare migration build by proving that accepted HMS semantics can be migrated from the immutable source model into the local Cloudflare control-plane/per-hotel D1 architecture, reconciled, restored and operated locally as one complete product before any remote Cloudflare deployment.

CF-I09 ends with a complete **local HMS candidate ready for Human Product Acceptance**. It does not authorize production, remote D1 creation/mutation, real customer data migration or cutover.

## Binding execution method

Codex MUST follow:

- `.orchestration/MULTIAGENT-EXECUTION.md`
- `.orchestration/PRECRITIC-MULTIAGENT.md`
- `.orchestration/PRECRITIC-GATE.md`
- `.orchestration/INVARIANTS.md`

Required internal lanes, at minimum:

1. **Migration/Mapping Implementer** — source→target mapping and rehearsal tooling.
2. **Data Integrity / Adversarial QA Critic** — independent reconciliation, malformed/stale/duplicate/import-negative paths.
3. **Operational Readiness Implementer** — local startup/health/backup/restore/runbook.
4. **Integration Reviewer** — full product, cross-module, security, inherited regressions, evidence/scope audit.

These may run concurrently where dependencies allow. Rework loops are autonomous. Before publication, persist `.orchestration/evidence/CF-I09-INTERNAL-REVIEW.md` with exact role receipts/findings/dispositions. No routine Human relay is allowed.

## Canonical source/target

Source baseline:
` sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629 `

Target:
` sjo1848/hms-cloudflare `

Accepted target foundation: CF-I01 through CF-I08 PASS, including control-plane identity/RBAC/audit, per-hotel D1 isolation, inventory/lifecycle, Housekeeping/Maintenance, Billing and Analytics/Reports.

## Required migration semantics

Create a source→target mapping package and executable local rehearsal that explicitly covers:

- PostgreSQL UUID → D1 `TEXT` identity preservation/mapping;
- `BIGINT`/money → safe D1 integer cents with exact totals;
- `DATE` → canonical `YYYY-MM-DD` semantics;
- `TIMESTAMPTZ` → canonical UTC timestamp representation;
- JSONB → valid JSON without semantic loss;
- source enum/state → target canonical enum/state mapping;
- `NO_SHOW` preservation as a terminal booking state;
- hotel/tenant relationships moving from source tenant columns/RLS semantics to CONTROL_DB + one operational D1 per hotel;
- users/roles moving to Access-subject mapping + hotel/network memberships without importing/recreating source passwords;
- room/guest/booking/room-night inventory relationships;
- lifecycle/check-in/check-out operational data;
- Housekeeping/Maintenance state and provenance;
- invoices, extra charges, payments, cash closures and financial events;
- audit/event provenance where representable/required by the accepted target model;
- hotel plan/admin metadata required by the target control plane.

Any source field that is intentionally not migrated must be explicitly classified as `derived`, `deprecated`, `reconstructed`, `not-applicable`, or `Human Gate required`; silent dropping is forbidden.

## Rehearsal dataset

Use deterministic local/synthetic migration fixtures representative of the source model. Do not connect to or mutate production/real hotel data.

The fixture MUST include at least:

- two hotels/tenants with distinct operational D1 bindings;
- multiple rooms and guests;
- overlapping calendar ranges that expose inventory correctness;
- booking states `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`;
- lifecycle data sufficient to exercise accepted check-in/reassign/check-out semantics;
- Housekeeping/Maintenance history;
- integer-cent financial data with extra charge, invoice, payment and cash-close/event relationships;
- tenant users/roles plus network/admin metadata;
- source rows intentionally ordered differently from target operational ranking where ordering semantics matter.

## Migration execution safety

The local migration/rehearsal process must be deterministic and repeatable.

Required behavior:

- clean-target migration succeeds;
- a second execution against the same target must not duplicate business data or events; either it is idempotent or it detects prior application and fails **before mutation** with a truthful explicit result;
- partial/failed migration cannot be presented as successful reconciliation;
- no client-supplied arbitrary D1 binding may influence tenant routing;
- source hotel A data cannot appear in hotel B operational D1 and vice versa;
- unknown/unmapped enum or invalid relationship fails explicitly rather than being silently coerced;
- migration logs/evidence must not contain passwords, tokens or secrets.

## Reconciliation acceptance

Produce machine-checkable source-vs-target reconciliation for each hotel/control plane.

At minimum assert:

- row counts by material entity/table;
- IDs and foreign-key/reference integrity;
- room-night inventory count and ownership;
- booking-state counts including `NO_SHOW`;
- financial totals in exact integer cents;
- invoices/payments/charges/closures/event consistency;
- user/role membership counts and tenant ownership;
- plan/hotel metadata counts;
- audit/event counts/provenance where migrated;
- zero cross-tenant leakage;
- `NO_SHOW` contributes neither report revenue/occupancy nor Housekeeping departure/turnover work according to accepted source semantics;
- accepted reporting outputs for a deterministic migrated fixture reconcile with source-equivalent expected values.

A simple row-count PASS is insufficient when semantic totals/relationships can still be wrong.

## Backup / restore / rollback rehearsal

Implement and execute a **local** backup/restore rehearsal for CONTROL_DB and each operational hotel D1.

Prove:

1. baseline migrated state reconciles;
2. backup/export is created locally;
3. target is intentionally changed or recreated locally;
4. restore reconstructs the expected state;
5. post-restore reconciliation equals the pre-change baseline;
6. no remote Cloudflare resource is touched.

Document rollback boundaries honestly: cross-D1 all-or-nothing atomic rollback must not be fabricated.

## Operational readiness

Provide a reproducible local full-product startup path for Human Product Acceptance after CF-I09 PASS.

It must include:

- local API Worker startup;
- local frontend startup;
- CONTROL_DB + both hotel D1 migrations/seed/migrated fixture;
- controlled `LOCAL_DEV_AUTH` identities/roles for acceptance;
- health/readiness checks that fail truthfully if required local dependencies/bindings are unavailable;
- documented local ports/commands and clean shutdown;
- no production-only secret requirement to browse the local product;
- a reset/reseed path so Product Acceptance can be repeated deterministically.

Prefer a small number of explicit repo commands/scripts over a long manual sequence.

## Local complete-product acceptance smoke

Before publication, execute a real local integrated smoke across the accepted product, including representative material actions/readback for:

- Rooms / Guests / Bookings;
- check-in / reassignment / check-out;
- Housekeeping / Maintenance;
- Billing / cash / invoices;
- Users / RBAC / tenant/network admin;
- Reports / analytics;
- two-hotel tenant isolation and network read.

The smoke must use real local Worker + D1 surfaces, not mocks. It is technical evidence, not the Human Product Acceptance itself.

## Security/readiness guards

- `LOCAL_DEV_AUTH` must remain a local-development path and must not become an accidental production bypass.
- Cloudflare Access remains the production authentication perimeter.
- source passwords are never migrated/recreated.
- no paid resource, production deployment, remote D1, DNS, Access policy, real user provisioning, real-data migration or cutover action is authorized in CF-I09.
- no secret may be committed to Git.

## Required inherited evidence

Fresh required regression/integration after migration/readiness changes:

- CF-I03 / CF-I04;
- CF-I05;
- CF-I06;
- CF-I07 focal + browser;
- CF-I08 focal + browser;
- unit/type/build/Wrangler/static route/diff checks;
- CF-I09 focal migration/reconciliation/backup-restore/local-product-smoke.

Any interrupted/ambiguous runner is `UNPROVEN` and blocks publication.

## Applicable invariants

At minimum:

- `INV-TENANT-001`
- `INV-RBAC-001`
- `INV-PARITY-001`
- `INV-ENUM-001`
- `INV-UX-001`
- `INV-ORDER-001`
- `INV-EVID-001`
- `INV-MONEY-001`
- `INV-STATE-001`
- `INV-CF-I07-004`
- `INV-CF-I08-004`
- `INV-CF-I08-005`
- `INV-SCOPE-001`
- binding multi-context/internal-review protocol.

CF-I09 evidence must explicitly mark every registry invariant `APPLIES` or `N/A` with rationale.

## Mandatory internal review admission

Before artifact A, `.orchestration/evidence/CF-I09-INTERNAL-REVIEW.md` must prove:

- lane decomposition;
- Implementer receipt(s);
- separate Internal QA/Critic receipt;
- all blocking findings repaired/retested;
- Integration Reviewer receipt;
- zero open P0/P1/P2;
- any P3 debt listed without undermining contracted acceptance;
- exact evidence claim audit complete.

If this receipt is absent, the artifact MUST NOT be published for External Independent Critic.

## Exit criteria

CF-I09 is eligible for External Independent Critic only when all are true:

1. executable local source→target migration rehearsal exists;
2. two-hotel/control-plane reconciliation is exact and machine-checkable;
3. money/inventory/state/tenant/user relationships reconcile;
4. `NO_SHOW` migration is safe across reporting and Housekeeping;
5. duplicate/replay and failure behavior are explicit and tested;
6. local backup/restore rehearsal passes;
7. complete local startup/reset path is documented and executable;
8. full local integrated product smoke passes;
9. fresh inherited regressions pass;
10. internal multi-context review receipt closes all P0/P1/P2 findings;
11. invariant/Pre-Critic evidence contains no `FAIL`/`UNPROVEN`/overclaim;
12. no remote/paid/real-data/cutover action occurred;
13. fresh substantive artifact A is followed by one orchestration-only boundary B, then execution stops for External Independent Critic.

## After CF-I09 PASS

Next stage is **complete local HMS Human Product Acceptance**. The Human should be able to pull the accepted repository, run the documented local command(s), and test the complete application before any Cloudflare remote deployment.

Remote Cloudflare test environment is a later stage and requires a new explicit authorization boundary; production/cutover remains separately gated.
