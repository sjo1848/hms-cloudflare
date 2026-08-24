# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 REWORK-4 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

Conversation history is supporting context only. Canonical repository state, contracts, decisions, reviews and evidence control execution.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Migration design: `docs/migration-design-package.md`.
- Source inventory: `docs/source-contract-inventory.md`.
- Active contract: `.orchestration/contracts/CF-I05.md`.
- Current Critic: `.orchestration/reviews/CF-I05-REWORK-3-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## ACTIVE DECISIONS

- `CF-ARCH-001`: Cloudflare Access + React/Vite + Workers/Hono/TypeScript + D1; same-origin `/api/v1`; source read-only; parity before expansion.
- `CF-DATA-001`: CONTROL_DB + one operational D1 per hotel; critical workflows remain inside one hotel D1; `$0/month / Cloudflare Free`; paid transition is Human Gate.
- `CF-UX-PARITY-001`: accepted source HMS controls material workflow/interaction/responsive parity.
- `PM-AUTONOMY-001`: Human = Product/Risk Authority; ChatGPT = External Controller/Independent Critic; Codex = Runtime Orchestrator; routine REWORK autonomous.
- `PM-INVARIANTS-001`: learned invariants + mandatory Pre-Critic Gate are binding; no Codex self-PASS.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.

## CF-I05 — HOUSEKEEPING + MAINTENANCE

Artifact history:
- `02421a19985fa71408e52be2a253b9082292dd78` → REWORK.
- `14915f79c77ca688cafd5e50da4398b0cf57d113` → REWORK.
- `462bd0519c7224dc996f23825dbbc8c5afc10aec` → REWORK.
- `97cd5536efa632bb30536fdfd106b69ee14687fd` → Independent Critic `REWORK-4`.

### Accepted technical repairs through `97cd553`

- cleaning start/finish and maintenance resolve reject stale races with exactly-once audit behavior;
- exact maintenance-case ABA correlation is preserved;
- legacy recovery retains reporter/resolver ownership;
- backend capability enforcement and operational-D1 routing remain intact;
- active UX is queue → selected room → focused workspace;
- mobile focused-task dialog, focus entry/return and `Siguiente tarea -> target queue head` behavior are proven;
- per-room draft isolation and selected-room Clear form behavior are proven;
- integrated browser harness uses real local target API + D1 + Vite;
- no CF-I06, production, remote D1, real-data or paid-resource scope drift.

### Current REWORK-4 blocking findings

1. **Operational queue ranking parity:** source `buildHousekeepingQueue()` ranks maintenance priority, turnover, blocking and room status before numeric room tie-break. Target queue still follows API/room-number order. With existing fixture data, HIGH maintenance room 904 should outrank ordinary DIRTY room 901.
2. **Orphan departure parity:** source synthesizes a blocked queue task when a departure-today room is absent from eligible board rooms (for example still Occupied). Target receives `departures_today` but only renders `board.rooms`, so that task disappears.
3. **Evidence overclaim:** browser derives `expectedRoom` from the target's first rendered queue button, so it proves target self-consistency rather than source priority semantics.

Diagnosis: `OPERATIONAL_QUEUE_PRIORITY_PARITY_DEFECT + ORPHAN_DEPARTURE_PARITY_DEFECT + EVIDENCE_OVERCLAIM`.
Human Gate: `NONE`.
Blocker: `NONE`.

## LEARNED-INVARIANT UPDATE

`INV-ORDER-001` is binding effective now:
- operational ranking/order/deduplication/synthetic-item/next-item rules are product semantics;
- a target cannot substitute storage/API/identifier order when source ranking exists;
- evidence must use fixtures whose natural order conflicts with expected priority and assert known expected identities;
- source-required synthetic work items must remain visible/contextualized and safe.

The Pre-Critic Gate now checks ordering/selection parity independently of target-self-consistency.

## DELIVERY SEQUENCE

Accelerated waves remain active:

`CF-I05 → CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

None.

## BLOCKERS

None. REWORK-4 is routine and authorized.

## NEXT AUTHORIZED ACTION

Codex reads `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I05-REWORK-3-CRITIC.md`, the source `housekeepingQueue.ts`, the active Task Contract, `INV-ORDER-001` and the strengthened Pre-Critic Gate; then autonomously in one bounded wave:

1. ports/adapts the source Housekeeping operational ranking including numeric tie-break;
2. synthesizes source-equivalent orphan-departure queue items and keeps them non-invalid-action/blocked-safe;
3. adds deterministic priority fixture/evidence whose room-number order conflicts with source ranking;
4. adds deterministic orphan-departure visibility/safety evidence;
5. makes `Siguiente tarea` prove a known expected source-priority identity, not target-first-button consistency;
6. updates contract/invariant/parity/Pre-Critic evidence including `INV-ORDER-001`;
7. runs full CF-I03/CF-I04/CF-I05 regressions, browser, tests, build, types, Wrangler and diff checks;
8. publishes one fresh immutable CF-I05 artifact with `external_review.required=true`;
9. stops at Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
