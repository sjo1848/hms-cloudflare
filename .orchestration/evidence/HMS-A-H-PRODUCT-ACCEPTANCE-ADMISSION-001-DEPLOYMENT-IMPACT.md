# A–H Candidate — Deployment and Data Impact Audit

Task: `HMS-A-H-PRODUCT-ACCEPTANCE-ADMISSION-001`
Source candidate: `106b4e98faceaf53a1a0e69650124fff863a9157`
Current deployed staging checkpoint: `074804329f487c2cfb0a9e5123f1f90b1a0e0252`
Classification: read-only local repository/workflow audit plus anonymous HTTP Access probes. No workflow was dispatched; no ref or remote D1 was changed.

## Exact candidate impact

- The staging→candidate diff has **no** API/Worker source, hotel/control migration, Wrangler configuration, deployment workflow, package manifest/lockfile, fixture renderer, or Access provisioner changes.
- Accepted G changes are Web Guests, hotel-user administration, localization, and corresponding regression/evidence assets. Accepted H changes are the shared DropdownMenu keyboard focus behavior, Reception Check-in task-local reset, and regression/evidence assets.
- API and D1 behavior are therefore byte-identical to the currently deployed source across this 12-commit delta. G/H introduce no schema migration and no API contract change.
- Source snapshot in H includes hotel migration files through `0030_extra_charge_operation_identity.sql` and control migrations through `0005_hotel_timezone.sql`; Issue #52's post-deploy inventory reports all three staging DBs at their expected migration heads with no pending migrations.
- Local production web builds from exact staging base and exact H candidate both passed using the same installed dependency tree/lockfile. The existing H Controller-accepted build result is reproduced locally.

### Bundle baseline → result

Measured from `npm run web:build`; gzip uses the canonical `gzipSync` method in `scripts/check-cloudflare-budgets.mjs`. There is one initial JS and CSS entry, so raw/gzip asset totals equal initial entry payload.

| Measure | Staging 074 baseline | H candidate 106b result | Delta bytes | Delta % | Ceiling | Result |
|---|---:|---:|---:|---:|---:|---|
| JS raw / entry | 338266 B | 339979 B | +1713 B | +0.5067% | 350000 B | PASS |
| JS gzip / entry | 95036 B | 95395 B | +359 B | +0.3778% | 100000 B | PASS |
| CSS raw / entry | 56587 B | 57024 B | +437 B | +0.7728% | 60000 B | PASS |
| CSS gzip / entry | 10490 B | 10564 B | +74 B | +0.7054% | 15000 B | PASS |
| Aggregate raw | 394853 B | 397003 B | +2150 B | +0.5445% | n/a | — |
| Aggregate gzip | 105526 B | 105959 B | +433 B | +0.4103% | n/a | — |

No budget or package/lockfile changed. `npm ci` emitted the existing lock-tree advisory summary (7 advisories: 3 moderate, 4 high); this admission did not run remediation or change dependencies. H accepted gates remain those in Issue #54 final PASS.

## Existing deploy workflow — exact future effects, not executed here

`.github/workflows/deploy-staging.yml` is unchanged in the candidate. A future push to `acceptance/staging` triggers it automatically (workflow_dispatch also exists, but is not the proposed mechanic). It uses Node 24, `npm ci`, repository Cloudflare secrets and a concurrency group `hms-cloudflare-staging`.

Workflow order:

1. Validate Cloudflare account/token and D1 list access.
2. `scripts/cloudflare/ensure-staging-access.mjs` discovers the exact `hms-cloudflare-web-staging.<workers-subdomain>.workers.dev` Access app; creates it only if absent, otherwise reuses it. On creation it configures one `cloudflare_account_member` allow policy and an eight-hour session. For an existing app it verifies exact host/type, ID/audience and that at least one policy exists; the code does not independently compare every existing policy predicate. It writes only local generated workflow environment values.
3. Find or create the three named D1 databases, then render local ignored `apps/api/wrangler.staging.generated.jsonc` binding CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB to those IDs and pinning the exact Access audience. No new DB is expected because the three staging databases already exist.
4. Run `wrangler d1 migrations apply --remote` for each of the three bindings. Current Issue #52 evidence reports CONTROL_DB at 5 migration records and both hotel D1s at 30, with no pending migrations; candidate adds/changes zero migration files. If that state remains true, the apply commands have no migrations to apply. A fresh read-only migration/fixture preflight is mandatory before any future authorized trigger.
5. Evaluate the `migration_rehearsals` marker count in all three DBs. If all are zero, render and write the synthetic fixture to all three DBs. If all are positive, preserve existing data and do not reseed. A mixed/partial state aborts the workflow. Current Issue #52 evidence reports the initialized synthetic fixture marker and preservation path; promotion preflight must confirm this remains true. This workflow has no rollback for a partial migration/deploy.
6. Dry-run and deploy the API Worker, build the web app, then dry-run and deploy the Web Worker. The two Wrangler configs and workflow are unchanged in H. The API configuration render uses the existing Access audience and D1 bindings.
7. Anonymous probes require both staging web root and `/api/v1/auth/me` to be non-2xx. Last deployed workflow recorded `302` for both, and live anonymous `curl` recheck during this admission also returned `302` for each.

The target's migration/seed commands are potentially mutating capabilities even though no changes are expected from the exact audited source and current recorded DB state. They must not be run until a separate promotion authorization is recorded. Any unexpected pending migration, missing/partial fixture marker, unexpected database binding, credential/policy change, or partial Worker deploy is a stop condition; do not reseed, rollback D1, force-move a branch, or retry a mutation without Controller direction.

## Data preservation requirements

Issue #52's recorded Phase 5 evidence for the exact current staging checkpoint states:

- CONTROL_DB: 5 migrations, no pending; each hotel DB: migrations 0019–0030 applied once, 30 total, no pending.
- `cf-i09-synthetic-v1` is `APPLIED` in each DB with source digest `33a75aa4ddc207af46e6697eae7fc4228f105ea90620385ae124887fce387359`; the workflow detected all three markers and preserved the pre-existing fixture instead of reseeding.
- Hotel invoice/payment/charge counts and row hashes remained preserved across that deployment; `foreign_key_check` was clean and isolated read-only SQLite export checks reported `integrity_check=ok`.
- This is historical exact-checkpoint evidence from Issue #52, not a new remote D1 read. No remote D1 was queried or mutated in this admission.

Future promotion preflight must re-read the three ledgers/markers read-only immediately before authorization. Expected migration delta is zero; expected seed behavior is preserve. Any different state returns to Controller before deploy.

## Access/runtime and prior smoke blocker

Issue #52 comments `5946243589` / `5946431862` report the prior authenticated smoke did not run because the Browser skill's `node_repl` failed at initialization with `Importing module "node:process" is not allowed in node_repl`. It was classified as `EXTERNAL_TEST_HARNESS_BLOCKER`; no product failure was inferred.

In this admission the Chrome DevTools MCP browser is available: `list_pages`, `navigate_page`, and `evaluate_script` operate successfully. Anonymous staging requests for both web and API return `302`. Browser navigation reaches the Cloudflare Access sign-in page, which offers Cloudflare account-member or email-code login. There is no authenticated Access session in this browser; no login, code, bypass, or protected HMS page was attempted. Therefore:

- the old Node REPL initialization failure is no longer present in this runtime path;
- the supported browser-capable runtime is usable for navigation/inspection;
- the authenticated A–H staging smoke remains **unverified**, because no authenticated session was available and this task authorizes admission only;
- Cloudflare Access remains fail-closed; no bypass was attempted.

Before an authorized promotion, an operator/controller must verify the exact existing Access application and allow policy against the intended Cloudflare account-member identity, not just rely on non-2xx anonymous probes. After separately authorized deploy, run the matrix in `...-INVENTORY-EVIDENCE-MATRIX.md` through the Access-protected URL and record the authenticated identity/capability/tenant context without exposing credentials or tokens.

## Controller boundary and rollback

Proposed promotion is one fast-forward of `acceptance/staging` from `074804329f487c2cfb0a9e5123f1f90b1a0e0252` to `106b4e98faceaf53a1a0e69650124fff863a9157`; that push invokes the existing workflow. This is only a proposal. No ref, deployment, Access application, D1, fixture or hosted environment changed here.

Git ref reversal cannot undo D1 migrations or a seed write; deployment is not atomic across API and Web Workers. Stop on any failure and retain exact run/SHA/data evidence. Do not try an automatic code rollback, D1 restore, or workflow retry unless Controller separately authorizes a reviewed recovery plan.
