# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 REWORK-5 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

Conversation history is supporting context only. Canonical repository state, contracts, decisions, reviews and evidence control execution.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I05.md`.
- Current Critic: `.orchestration/reviews/CF-I05-REWORK-4-CRITIC.md`.
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
- `97cd5536efa632bb30536fdfd106b69ee14687fd` → REWORK-4.
- `6837a61a7b27e5ae0b909d1a436ddff10e0e1b14` → Independent Critic `REWORK-5`.

### Accepted through artifact `6837a61`

- source-equivalent Housekeeping operational ranking is implemented, including maintenance priority, turnover, blocking/state ranks and numeric room tie-break;
- deterministic browser fixture proves HIGH maintenance `Room 904` outranks numeric `Room 901` and `Siguiente tarea` opens 904;
- orphan departure `Room 906` is synthesized from `departures_today`, remains visible/contextualized, and exposes no invalid housekeeping mutation;
- mobile focused-task open/focus/close behavior remains preserved;
- per-room draft isolation/clear remains proven;
- stale/concurrent cleaning and maintenance resolution, exact-case ABA correlation, legacy ownership, RBAC, tenant routing and audit behavior remain accepted;
- no CF-I06, production, remote-D1, real-data or paid-resource scope drift occurred.

### Current REWORK-5 blocking findings

1. **Enum representation parity:** source queue logic uses semantic `CheckedIn`; target D1/API emits `CHECKED_IN`, but target ranking predicate compares the source literal. Eligible checked-in departure tasks can therefore miss blocked rank 4. The orphan test does not expose this because orphan items force `isBlocked=true`.
2. **Canonical publication protocol:** artifact `6837a61` reached remote main without a separate publication-boundary commit. Its committed STATUS still pointed to `97cd553`, had `external_review.required=false`, and authorized REWORK-4. The previous requirement that a commit contain its own SHA was circular and is now corrected.

Diagnosis: `ENUM_REPRESENTATION_PARITY_DEFECT + CANONICAL_STATE_CONVERGENCE_DEFECT`.
Human Gate: `NONE`.
Blocker: `NONE`.

### Non-blocking carry-forward

The source Housekeeping board excludes both Cancelled and NoShow departures. The current target booking schema does not yet represent NoShow. Carry this into booking-status/data-migration parity work, at latest CF-I09, so imported NoShow rows cannot become Housekeeping tasks. This does not independently block CF-I05.

## LEARNED-INVARIANT UPDATE

### INV-ENUM-001 — effective now

Source and target enum spellings may differ, but business predicates must operate on canonical semantic values or an explicit normalization layer. A serialization change such as `CheckedIn` → `CHECKED_IN` cannot change ranking, transitions, filters or authorization.

### INV-STATE-001 — corrected non-circular publication protocol

A commit cannot contain its own SHA. Publication is therefore:

1. **Artifact commit A** — substantive product code/tests/evidence.
2. **Publication-boundary commit B** — orchestration-only commit that records exact A, sets `external_review.required=true`, `resume_authorized=false`, and stops for External Independent Critic.

The Critic reviews A plus B. B must not change substantive product code. This replaces the previous impossible self-SHA requirement.

## DELIVERY SEQUENCE

Accelerated waves remain active:

`CF-I05 → CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

None after local repository sync.

## BLOCKERS

None. REWORK-5 is routine and authorized.

## NEXT AUTHORIZED ACTION

Codex reads `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I05-REWORK-4-CRITIC.md`, `.orchestration/INVARIANTS.md`, `.orchestration/PRECRITIC-GATE.md`, the active Task Contract and source Housekeeping queue logic; then autonomously in one bounded wave:

1. normalizes source/target booking-status semantics for Housekeeping predicates;
2. adds deterministic eligible-room `CHECKED_IN` departure evidence proving source blocked rank/order, plus a negative non-checked-in case;
3. classifies/proves `INV-ENUM-001` and preserves `INV-ORDER-001` evidence;
4. records NoShow exclusion as carry-forward migration/status parity debt without expanding CF-I05 lifecycle scope;
5. runs full CF-I03/CF-I04/CF-I05 API+D1/browser regressions, tests, build, types, Wrangler and diff checks;
6. publishes artifact commit A;
7. reads exact full SHA A and publishes orchestration-only boundary commit B pointing to A, with `external_review.required=true` and `resume_authorized=false`;
8. stops for External Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
