# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-26  
Global Project Mode: `DELIVERY`  
Phase: `LOCAL PRODUCT ACCEPTANCE`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 PASS / CF-I09 PASS / HUMAN PRODUCT ACCEPTANCE REQUIRED`

Runtime: `HUMAN_GATE` — CF-I09 Artifact A4 passed External Independent Critic. Automatic Codex resume is disabled. The next decision belongs to the Human as Product/Risk Authority.

Current objective: run and exercise the complete accepted HMS candidate locally before authorizing any remote Cloudflare test environment, production action, real-data migration or cutover.

## CANONICAL SOURCES

- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- CF-I09 contract: `.orchestration/contracts/CF-I09.md`.
- CF-I09 final Independent Critic: `.orchestration/reviews/CF-I09-A4-CRITIC.md`.
- CF-I09 review history: `.orchestration/reviews/CF-I09-CRITIC.md`.
- Local acceptance runbook: `docs/cf-i09-local-operational-readiness.md`.
- Machine state: `.orchestration/STATUS.json`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Method: `.orchestration/MULTIAGENT-EXECUTION.md`, `.orchestration/PRECRITIC-MULTIAGENT.md`, `.orchestration/PRECRITIC-GATE.md`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — Artifact A `17372d3200b8e88eec116e97672c12589005103d`, Boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — Artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, Boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — Artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, Boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`.
- CF-I08 Analytics / Reports / Integrated Responsive Product — PASS — Artifact A `ab0af4d70f05d507e80fb6a518f7eff890c239db`, Boundary B `0bd005850da7019162a87172c68b5daff139bbed`.
- CF-I09 A1 `a972bca40ed60505bc42f5ae560977886c2972ab` / B1 `54d8ad2e77b78f4101a14501b7e81ef014c9be2a` — REWORK-1.
- CF-I09 A2 `e483e6b3d973491caa7eb25d119e41d5804f2ae0` / B2 `f9c510c8c2bd6f5bdfc72a9f757e40a149e768e4` — REWORK-2.
- CF-I09 A3 `58ac2c5758795ae1b8257a8c313b31842e157993` / B3 `b0a8ea321a29ccf31d91375e42ef8f709ad47664` — REWORK-3.
- CF-I09 A4 `fcb4dd464e8d34f80c27c034e48ec9bc62c912f3` / B4 `5d315de8ed6cccb585b16929e56e7371f819bd5e` — **External Independent Critic PASS**.

## CF-I09 ACCEPTED GUARANTEES

The accepted local candidate preserves and proves:

- source→CONTROL_DB/per-hotel-D1 migration with explicit two-hotel routing;
- UUID/TEXT, exact integer-cent money, DATE/UTC/JSON normalization and explicit source-field disposition;
- `NO_SHOW` parity across migration, reporting and Housekeeping semantics;
- replay refusal before business mutation and explicit partial-failure handling;
- exact source-vs-target reconciliation beyond row counts;
- exact nullable booking lifecycle actor and timestamp snapshot parity;
- exact reconstructed lifecycle event identity, actor, request, hotel, provenance, timestamp and from-room semantics;
- adversarial lifecycle tamper regression that fails reconciliation while aggregate row counts remain unchanged;
- corrected source `0001–0030` nullable/legacy actor/identity audit;
- migrated `saas_admin` network ALLOW plus explicit tenant operational `403` DENY;
- local-only CONTROL_DB + two hotel D1 backup/restore rehearsal;
- local Worker+D1 complete-product smoke and inherited CF-I03–CF-I08 regression coverage;
- development-only local identity selector and local auth guard without source password migration;
- bounded local three-D1 persistence workaround without changing product topology;
- no remote, paid, production, real-data or cutover action.

## HUMAN PRODUCT ACCEPTANCE GATE — ACTIVE

This is a real Human Gate. Technical work must not auto-resume around it.

Repeatable acceptance preparation from repository root:

```bash
npm install
bash scripts/migration/test-rehearsal.sh
scripts/cf-i09-local-backup-restore-rehearsal.sh
node scripts/cf-i09-local-smoke.mjs
scripts/cf-i09-local-start.sh --reset
```

The final command leaves the clean reconciled candidate running at:

- Frontend: `http://127.0.0.1:4174`
- API: `http://127.0.0.1:8787`

Human Product Acceptance should exercise the visible complete product and return one of:

- `ACCEPT` — local HMS product accepted; authorize planning of the Cloudflare test environment as the next separate stage.
- `REWORK` — record concrete product/UX/functional defects and return them to autonomous technical repair before any remote stage.

When acceptance is finished:

```bash
scripts/cf-i09-local-stop.sh
```

## DELIVERY SEQUENCE

`CF-I09 PASS → HUMAN LOCAL PRODUCT ACCEPTANCE → Cloudflare test environment authorization → Cloudflare validation → production-readiness/release gates`.

Remote Cloudflare provisioning/deployment, remote D1 mutation, paid resources, real-data migration, production Access/DNS changes and cutover remain unauthorized.

## NEXT AUTHORIZED ACTION

`HUMAN_LOCAL_PRODUCT_ACCEPTANCE_CF_I09_ACCEPTED_CANDIDATE`

No Codex autonomous resume is authorized while this Human Gate is active.
