# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I06.md`.
- Last Independent Critic: `.orchestration/reviews/CF-I05-REWORK-5-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## ACTIVE DECISIONS

- `CF-ARCH-001`: Cloudflare Access + React/Vite + Workers/Hono/TypeScript + D1; same-origin `/api/v1`; source read-only; parity before expansion.
- `CF-DATA-001`: CONTROL_DB + one operational D1 per hotel; critical workflows stay inside one hotel D1; `$0/month / Cloudflare Free`; paid transition is Human Gate.
- `CF-UX-PARITY-001`: accepted source HMS controls material workflow/interaction/responsive parity.
- `PM-AUTONOMY-001`: Human = Product/Risk Authority; ChatGPT = External Controller/Independent Critic; Codex = Runtime Orchestrator; routine REWORK autonomous.
- `PM-INVARIANTS-001`: learned invariants + mandatory Pre-Critic Gate are binding; no Codex self-PASS.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — substantive artifact A `17372d3200b8e88eec116e97672c12589005103d`, publication boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.

### CF-I05 accepted guarantees

- source-equivalent operational queue ranking and next-task semantics;
- orphan departures retained as safe blocked operational tasks;
- semantic enum normalization (`CHECKED_IN` ↔ source `CheckedIn`) protects ranking behavior;
- deterministic stale/concurrent cleaning and maintenance behavior, exact-case ABA protection and exactly-once event semantics;
- legacy maintenance ownership/provenance;
- tenant routing and backend RBAC;
- focused mobile workflow and responsive browser evidence at 375/390/430/768/1024;
- per-room draft isolation;
- corrected non-circular artifact A + boundary B publication protocol.

### Carry-forward debt

Source `NoShow` departure exclusion is not yet representable in the target booking enum. This must be resolved explicitly before final migration readiness, at latest CF-I09; imported NoShow data must not become Housekeeping tasks.

## ACTIVE INCREMENT — CF-I06 BILLING

Contract: `.orchestration/contracts/CF-I06.md`.

CF-I06 is a separate financial-risk boundary. It covers:

- extra charges and booking-total consistency;
- invoices;
- partial/full booking payments and settlement;
- payment history/metadata;
- current cash/balance summary;
- cash closures and shift handoff;
- exact integer cents;
- stale/concurrent payment and close-cash safety;
- tenant/RBAC/audit guarantees;
- source financial workflow/browser parity.

Critical invariants include `INV-MONEY-001`, `INV-ATOMIC-001`, `INV-AUDIT-001`, `INV-DOMAIN-001`, `INV-TENANT-001`, `INV-RBAC-001`, `INV-PARITY-001`, `INV-ENUM-001`, `INV-UX-001`, `INV-RESP-001`, `INV-EVID-001`, `INV-STATE-001`, `INV-SCOPE-001`.

## DELIVERY SEQUENCE

`CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

Local `git pull --ff-only` is required if the Codex workspace has not yet consumed the latest remote orchestration state. This is a Human Action, not a Human Gate.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

Codex reads the canonical state, `.orchestration/contracts/CF-I06.md`, source billing/cash-closure contracts and all learned invariants; then executes CF-I06 autonomously as one coherent financial wave:

1. source parity pre-flight;
2. D1 financial schema/domain/API;
3. exact-cent + atomicity/concurrency tests;
4. tenant/RBAC/audit tests;
5. billing/cash workflow UI;
6. responsive/integrated browser evidence;
7. full inherited regression;
8. invariant evidence + Pre-Critic Gate;
9. publish substantive artifact A;
10. publish orchestration-only boundary B pointing exactly to A with `external_review.required=true`, `resume_authorized=false`;
11. stop for Independent Critic.

Do not begin CF-I07 before CF-I06 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.