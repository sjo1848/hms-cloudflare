# HMS Staging Phase 5 — Deployment and Verification Status

Status: `STOP — STAGING_DEPLOY_GATE_REQUIRED` (authenticated UI smoke evidence blocked)

## Authority and exact deployed checkpoint

- Controller disposition: Issue #52 comment `5946029814`, `CONTROLLER_DISPOSITION: PASS_D1_REPAIR_RESUME_STAGING_PHASE5`.
- Canonical checkpoint: `074804329f487c2cfb0a9e5123f1f90b1a0e0252`.
- Remote `acceptance/staging` was verified at `0e78050999550d193ff0d352672b233e2f3da472`; that exact ref is an ancestor of the checkpoint.
- Local `acceptance/staging` was 243 commits behind the remote, but was itself an ancestor. It was advanced only with `git merge --ff-only` to the exact checkpoint and pushed normally, without force. Remote verification returned the exact checkpoint SHA.
- No other branch/ref was pushed in the deployment operation.

## Existing staging workflow

- Workflow: `.github/workflows/deploy-staging.yml`.
- Run: `36968916971`, [GitHub Actions run](https://github.com/sjo1848/hms-cloudflare/actions/runs/36968916971).
- Run head: exact checkpoint `074804329f487c2cfb0a9e5123f1f90b1a0e0252`; conclusion `success`.
- URL: `https://hms-cloudflare-web-staging.sjo1848.workers.dev/`.
- API Worker version: `fa51609b-1810-4999-bc7f-5ed73b354539`.
- Web Worker version: `276dbc99-9cc6-4d2f-bdc6-c8351969a98b`.
- Cloudflare Access application: `0fd81d55-cc88-4af9-8705-c4fbab062828`; workflow confirmed one policy.
- Workflow anonymous probes: web root `302`; `/api/v1/auth/me` `302`. Access is fail-closed to anonymous requests.
- The workflow verified Cloudflare credentials, applied migrations, preserved the existing initialized fixture, deployed both Workers and completed its Access probe.

## D1 migration and financial preservation

Pre-deploy inventory and exact financial row snapshots were read-only and stored temporarily under `/tmp`; only row counts and hashes are recorded here. All three staging databases had the synthetic fixture marker `cf-i09-synthetic-v1`, `APPLIED`, source digest `33a75aa4ddc207af46e6697eae7fc4228f105ea90620385ae124887fce387359`. The digest matches the checked-in synthetic fixture source. The workflow's seed guard found one marker in each DB and preserved the initialized fixture; it did not reseed.

| D1 binding | D1 ID | Ledger before → after | Migration 0019–0030 | Result |
|---|---|---:|---|---|
| CONTROL_DB | `d750ebf7-5edf-4057-aa56-8d1482f4647a` | 5 → 5 | Not applicable | No pending migrations |
| HOTEL_DEMO_DB | `00c66a21-16c2-488e-ba35-e98e46b20323` | 18 → 30 | 12 unique entries, once each | No pending migrations |
| HOTEL_SECOND_DB | `87137928-e56c-4660-bc12-7f00a07ccb1b` | 18 → 30 | 12 unique entries, once each | No pending migrations |

Post-deploy canonical Wrangler `d1 migrations list --remote` reports no pending migrations for all three bindings. Each hotel ledger contains 30 unique migration names and exactly the 12 expected names 0019 through 0030.

| Hotel fixture | Invoices | Payments | Extra charges |
|---|---|---|---|
| HOTEL_DEMO_DB | 4 → 4; every original field preserved (SHA-256 `69f89733e40ada279f2cc36be05f432b434fc4ee85f1b8ffa76d580a895dd17c`) | 2 → 2; byte/value projection identical (SHA-256 `23bbae0225704b8e57f08eef1b4a6cf40aae388dfe2ed050825cb8f0e448c54d`) | 1 → 1; every original field preserved (SHA-256 `6740ed6792a38368cc26193160bfaeeb810f2d50c091e3db34e18e19497b245d`); 0030-added `operation_token` is NULL as expected |
| HOTEL_SECOND_DB | 1 → 1; every original field preserved (SHA-256 `11c4714c6f9c6662af9a7962db745a5d699d471f2e3fad0adb7d6d35b03f12cb`) | 1 → 1; byte/value projection identical (SHA-256 `bac01e8280fc148a756ce6facfee02986e69dca5c299d0c01cc719448cc99ed9`) | 0 → 0 |

`PRAGMA foreign_key_check` returned zero rows for both hotel DBs. The remote D1 API rejects direct `PRAGMA integrity_check` with `SQLITE_AUTH` (code 7500); to obtain an equivalent read-only check, exact Wrangler remote exports were loaded into isolated in-memory SQLite databases. Both report `integrity_check=ok`, 29 tables and zero FK violations. No D1 write occurred outside the existing migration and workflow fixture-preservation path.

## Smoke test blocker

The required authenticated UI smoke tests for login/access, Reception, Booking/Stay Case, reservation/check-in, Rooms, Housekeeping, Maintenance, Account/charges/payments, navigation/browser Back and desktop/mobile were **not run**. Anonymous fail-closed probes are not substitutes for authenticated functional acceptance.

Browser runtime initialization was attempted using the installed Browser skill and `mcp__node_repl__js`; setup failed before browser discovery/navigation with the exact tool error:

`Importing module "node:process" is not allowed in node_repl`

No alternate browser-control path, bypass, credentials, user data or manual mutation was used. The deployed app remains behind Cloudflare Access. Therefore this evidence does **not** claim `STAGING_DEPLOYED_AWAITING_HUMAN_ACCEPTANCE` and does not satisfy Issue #53's prerequisite to begin Block G.

## Stop disposition

`STOP — STAGING_DEPLOY_GATE_REQUIRED`. The code checkpoint is deployed successfully and all migration/data/Worker/anonymous-Access checks above pass, but the authorized authenticated UI smoke suite remains unverified because the supported browser runtime failed to initialize. Do not begin Block G until the browser evidence is completed and the exact staging success handoff is reported. No main, PR/merge, production, real hotel data, F-cash or Block G operation occurred.
