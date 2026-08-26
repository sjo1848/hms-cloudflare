# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-26  
Global Project Mode: `DELIVERY`  
Phase: `LOCAL PRODUCT ACCEPTANCE`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 A5 PASS / HUMAN PRODUCT ACCEPTANCE REQUIRED`

Runtime: `HUMAN_GATE` — CF-I09 REWORK-4 Artifact A5 passed External Independent Critic. Automatic Codex resume is disabled. The next decision belongs to the Human as Product/Risk Authority.

Current objective: run and exercise the complete accepted HMS candidate locally using the repaired deterministic three-D1 bootstrap before authorizing any remote Cloudflare test environment, production action, real-data migration or cutover.

## CANONICAL SOURCES

- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- CF-I09 contract: `.orchestration/contracts/CF-I09.md`.
- CF-I09 A5 Independent Critic: `.orchestration/reviews/CF-I09-A5-CRITIC.md`.
- Prior post-PASS REWORK-4 diagnosis: `.orchestration/reviews/CF-I09-POST-PASS-REWORK-4.md`.
- Local acceptance runbook: `docs/cf-i09-local-operational-readiness.md`.
- Machine state: `.orchestration/STATUS.json`.
- Method: `.orchestration/MULTIAGENT-EXECUTION.md`, `.orchestration/PRECRITIC-MULTIAGENT.md`, `.orchestration/PRECRITIC-GATE.md`.

## VALIDATED RESULTS

- CF-I01 through CF-I08 remain accepted.
- CF-I09 A1/B1 — REWORK-1.
- CF-I09 A2/B2 — REWORK-2.
- CF-I09 A3/B3 — REWORK-3.
- CF-I09 A4 `fcb4dd464e8d34f80c27c034e48ec9bc62c912f3` / B4 `5d315de8ed6cccb585b16929e56e7371f819bd5e` closed lifecycle/source/RBAC parity findings, but its local readiness PASS was later reopened by real Human bootstrap evidence.
- CF-I09 A5 `f18b35cfc6b48970f2b8842758fa025126f33407` / B5 `2b110e411a896fcd95bc839b25d7487a2f74c4bb` — **External Independent Critic PASS**. Review: `.orchestration/reviews/CF-I09-A5-CRITIC.md`.

## CF-I09 A5 ACCEPTED GUARANTEES

A5 preserves the previously accepted source parity, lifecycle exactness, tenant/RBAC, money, replay/failure and local-only scope, and additionally closes the actual Human acceptance runtime defect:

- reset/rehearsal uses clean temporary per-binding persistence under bounded timeout;
- checked-in D1 migration SQL is applied directly to the local SQLite stores, avoiding the known Wrangler 4.125 repeated three-D1 migration-process hang;
- the completed CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB are materialized into the normal shared Worker persistence root before reconciliation/startup;
- Worker startup therefore uses the same migrated database bytes produced by reset;
- backup/restore preserves checksummed local SQLite copies and no longer reintroduces sequential Wrangler migration/import calls;
- reconciliation remains exact after restore;
- Internal QA records focal rehearsal, backup/restore, real Worker+D1/browser smoke and two bounded reset/start/ready/stop repetitions with zero owned descendants;
- no remote D1, paid resource, production, real-data migration, DNS/Access production action or cutover occurred.

## HUMAN PRODUCT ACCEPTANCE GATE — ACTIVE

This is a real Human Gate. Technical work must not auto-resume around it.

Sync first:

```bash
git pull --ff-only
```

Then run the checked-in local acceptance preparation from repository root:

```bash
npm install
bash scripts/migration/test-rehearsal.sh
scripts/cf-i09-local-backup-restore-rehearsal.sh
node scripts/cf-i09-local-smoke.mjs
scripts/cf-i09-local-start.sh --reset
```

The final command must leave the clean reconciled candidate running at:

- Frontend: `http://127.0.0.1:4174`
- API: `http://127.0.0.1:8787`

Human Product Acceptance should exercise the visible complete product and return one of:

- `ACCEPT` — local HMS product accepted; authorize planning of the Cloudflare test environment as the next separate stage.
- `REWORK` — record concrete product/UX/functional defects and return them to autonomous technical repair before any remote stage.

When acceptance is finished:

```bash
scripts/cf-i09-local-stop.sh
```

If bootstrap fails again, Product Acceptance does not begin; report the exact failing command/output and reopen technical REWORK rather than accepting readiness.

## DELIVERY SEQUENCE

`CF-I09 A5 PASS → HUMAN LOCAL PRODUCT ACCEPTANCE → Cloudflare test environment authorization → Cloudflare validation → production-readiness/release gates`.

Remote Cloudflare provisioning/deployment, remote D1 mutation, paid resources, real-data migration, production Access/DNS changes and cutover remain unauthorized.

## NEXT AUTHORIZED ACTION

`HUMAN_LOCAL_PRODUCT_ACCEPTANCE_CF_I09_A5_ACCEPTED_CANDIDATE`

No Codex autonomous resume is authorized while this Human Gate is active.
