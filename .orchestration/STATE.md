# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 PASS / CF-I07 PASS / CF-I08 ACTIVE+AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I08.md`.
- Last Independent Critic: `.orchestration/reviews/CF-I07-REWORK-3-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.
- CF-I06 Billing — PASS — artifact A `0004990ba60b0349776de139cd04dfc2f30eaa6d`, boundary B `de0dbdc0ed92b60a5fd32faa184484c701711d08`.
- CF-I07 Users / RBAC / Audit / Hotel-Network Admin — PASS — artifact A `fdf9c6f82c3c5066152e49ecba70268d669a640f`, boundary B `c52656fcc311f53be9b584346f2afc9e54796ff9`, Independent Critic `.orchestration/reviews/CF-I07-REWORK-3-CRITIC.md`.

## CF-I07 ACCEPTED GUARANTEES

- Cloudflare Access remains the authentication perimeter; no HMS password recreation.
- Active hotel → operational D1 ownership is unique; undeclared/already-consumed bindings fail closed.
- Source-sensitive RBAC is centralized and no protected route may bypass capability authority by direct role shortcut.
- `saas_admin` remains limited to source-canonical network hotel capabilities; hotel audit requires a qualifying hotel membership/capability.
- receptionist cannot list all invoices; ops retains tenant audit access.
- pending-approved checkout requires admin-only override capability.
- shared Access identity rows cannot be tenant-locally rewritten/reactivated.
- user role/deactivate and hotel-plan mutations have exact-winner/semantic-no-op truthful audit behavior.
- real allowed-before/denied-after role downgrade is proven.
- tenant-A cannot mutate tenant-B-only memberships and produces zero target audit side effects.
- tenant audit combines control + operational provenance without global/cross-tenant leakage.
- plan tiers are `BASIC | PRO | ENTERPRISE`.
- responsive Users/Network workflows and authenticated forbidden-capability UX pass at contracted widths.
- CF-I07 runners verify owned-process termination before PASS.

## ACTIVE INCREMENT — CF-I08 ANALYTICS / REPORTS / INTEGRATED RESPONSIVE PRODUCT

Contract: `.orchestration/contracts/CF-I08.md`.

CF-I08 is authorized and includes:

- source-equivalent dashboard/report KPI semantics;
- revenue and occupancy reporting with exact date/state inclusion rules;
- ADR and RevPAR parity with zero-safe behavior and integer-cent money semantics;
- completion of the deferred real multi-hotel network KPI aggregation over two configured per-hotel D1 stores;
- source-canonical report/network RBAC and tenant isolation;
- Reports and Network responsive UX at 375/390/430/768/1024;
- integrated responsive navigation/journey coverage across all modules accepted through CF-I07;
- fresh inherited CF-I03–CF-I07 regressions plus focal deterministic report/multi-hotel evidence;
- artifact A + orchestration-only boundary B, then Independent Critic.

CF-I08 must not enter CF-I09 migration/cutover/readiness scope or production deployment.

## CARRY-FORWARD DEBT

Source `NoShow` booking/departure exclusion is not yet representable in the target booking enum. Resolve explicitly before final migration readiness, at latest CF-I09; imported NoShow rows must not become Housekeeping tasks.

## DELIVERY SEQUENCE

`CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

Paid Cloudflare resources, irreversible provisioning/cutover, product-intent changes or final Product Acceptance remain Human Gates if/when reached.

## PENDING HUMAN ACTIONS

Local repository sync only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

`CF_I08_AUTONOMOUS_ANALYTICS_REPORTS_AND_INTEGRATED_RESPONSIVE_WAVE`

Codex reads canonical state, `.orchestration/contracts/CF-I08.md`, source reporting/network semantics, durable invariants and Pre-Critic Gate; then executes CF-I08 autonomously through implementation, deterministic D1/API analytics evidence, multi-hotel aggregation, responsive browser/integration, fresh inherited regressions, artifact A + boundary B, and stops for Independent Critic or a real Human Gate.

Do not begin CF-I09 before CF-I08 Independent Critic PASS. No production deployment, remote D1 creation/mutation, real-data migration, paid transition or cutover is authorized.
