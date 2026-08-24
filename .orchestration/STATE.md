# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 REWORK-2 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

Conversation history is supporting context only. Canonical repository state, contracts, decisions, reviews and evidence control execution.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Migration design: `docs/migration-design-package.md`
- Source parity inventory: `docs/source-contract-inventory.md`
- Active Task Contract: `.orchestration/contracts/CF-I05.md`
- Current Independent Critic: `.orchestration/reviews/CF-I05-REWORK-1-CRITIC.md`
- Learned invariants: `.orchestration/INVARIANTS.md`
- Mandatory admission gate: `.orchestration/PRECRITIC-GATE.md`
- Machine-readable execution state: `.orchestration/STATUS.json`

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED
- Cloudflare Access authentication boundary.
- React + Vite frontend.
- Workers + Hono + TypeScript API.
- D1 persistence.
- Same-origin `/api/v1` compatibility where the accepted product contract is unchanged.
- Source HMS remains read-only.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B
- CONTROL_DB for identity/hotel/membership/routing metadata.
- One operational D1 per hotel.
- Critical atomic workflows remain inside one hotel D1.
- Target `$0/month / Cloudflare Free`.
- Paid/material recurring-cost transition requires Human Gate.

### CF-UX-PARITY-001 — APPROVED
- Cloudflare migration is not a product redesign.
- Accepted source HMS is UX canon for workflow structure, interaction semantics and material responsive/mobile behavior.
- Technical adaptation is allowed; material intentional departure requires Human Gate.

### PM-AUTONOMY-001 — APPROVED
- Human = Product/Risk Authority.
- ChatGPT = External Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator / execution owner.
- Routine REWORK is autonomous.
- Human is not a routine message bus.
- `RUNTIME_CAPABILITY_FALLBACK` remains accurate when separate specialist contexts are unavailable.

### PM-INVARIANTS-001 — BINDING
- Reusable defect classes become durable invariants.
- Every task/rework classifies applicable invariants and maps them to evidence.
- Codex must pass `.orchestration/PRECRITIC-GATE.md` before publishing a substantive artifact.
- `FAIL` or `UNPROVEN` blocks publication and triggers autonomous repair.
- The admission gate never replaces External Independent Critic.

## VALIDATED RESULTS

### CF-I01 — Platform foundation
Status: `PASS`.  
Accepted artifact: `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02 — Rooms / guests / holds
Status: `PASS`.  
Accepted artifact: `bb3a136526c900522394f223206600f543e99e23`.

### CF-I03 — Bookings / availability / room-night protection
Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.  
Accepted artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a`.  
Integrated reviewed head: `58c84a2564d9a4b85785203ff04fee24fee47213`.

### CF-I04 — Reception lifecycle
Status: `PASS`.  
Accepted artifact: `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.  
Human Gate: `NONE`.

Accepted scope includes real guest count, atomic lifecycle transitions, hold/claim-safe reassignment, checkout policy/reference semantics, actor/request/hotel traceability, source-aligned reception workspace/mobile journey and browser evidence at 375/390/430/768/1024.

## CF-I05 — HOUSEKEEPING + MAINTENANCE

Task Contract: `.orchestration/contracts/CF-I05.md`.

### Artifact history

- `02421a19985fa71408e52be2a253b9082292dd78` → Independent Critic `REWORK`.
- REWORK-1 artifact `14915f79c77ca688cafd5e50da4398b0cf57d113` → Independent Critic `REWORK`.
- Current review: `.orchestration/reviews/CF-I05-REWORK-1-CRITIC.md`.

### REWORK-1 improvements accepted

- simple concurrent cleaning start/finish now produces one success, one conflict and one event;
- simple concurrent resolution of the same current maintenance case no longer duplicates the resolve event;
- synthesized legacy maintenance recovery retains reporter and resolver ownership;
- active desktop UX is queue → selected room → focused workspace instead of a flat action-card board;
- maintenance drafts are keyed by room ID rather than globally shared;
- committed browser harness is backed by the real local target API + D1 + Vite;
- backend capability enforcement and authorized operational-D1 routing remain intact;
- no CF-I06, production, remote-D1, real-data or paid-resource scope drift occurred.

### Current blocking findings — REWORK-2

1. **Maintenance resolution ABA / case-correlation defect.** A stale request can pre-read old case K1, another request resolves K1, a newer case K2 is opened on the same room, and the stale K1 request can then change the room from the new K2 `MAINTENANCE` state to `DIRTY` because the room UPDATE is not correlated to the case resolution actually won by the current operation. The final event can reference already-resolved K1 while K2 remains OPEN. Exact case/room operation correlation is required.
2. **Mobile focused-task UX parity defect.** Source mobile Housekeeping uses `Siguiente tarea → Abrir` / room selection to open a focused bottom-sheet task workspace. Target mobile merely changes selection and stacks the workspace below the full queue. `Siguiente tarea` does not enter/focus the task and therefore remains a material interaction departure under `CF-UX-PARITY-001`.
3. **Browser/evidence overclaim.** The harness does not yet prove per-room draft isolation/reset in browser and does not prove source-equivalent mobile task-entry/focus/close behavior. `INV-UX-001`, `INV-RESP-001` and browser-gate claims must match executable assertions.

Diagnosis: `ABA_CONCURRENCY_DEFECT + MOBILE_UX_PARITY_DEFECT + EVIDENCE_OVERCLAIM`.  
Human Gate: `NONE`.  
Blocker: `NONE`.

## LEARNED-INVARIANT UPDATE

`INV-ATOMIC-001` is strengthened effective immediately:
- final-state checks are insufficient when related entity/case identity can change;
- multi-entity operations must prove exact logical-operation correlation;
- ABA/re-entry must be tested when a stale caller can observe K1/state A and later execute after K2/state A is recreated;
- deterministic evidence must assert both the stale object and the newer/current related object.

The mandatory Pre-Critic mutation sweep now explicitly requires identity/version/case correlation and ABA testing where applicable. UX/browser sweeps also require material mobile task-entry/focus semantics and browser proof of draft isolation when the contract requires it.

This strengthening applies automatically to CF-I06+.

## DELIVERY SPEED POLICY

Accelerated waves remain active. Speed comes from complete contracts, one coherent implementation wave, learned-invariant self-QA and one external boundary—not from skipping domain, security, UX or evidence guarantees.

No intermediate Cloudflare preview is planned. Current authorized sequence remains:

`CF-I05 → CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

High-risk boundaries remain separately reviewable: financial operations, security/cross-tenant administration, migration/cutover and paid/production transitions.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

None.

## BLOCKERS

None. CF-I05 REWORK-2 is bounded routine work.

## NEXT AUTHORIZED ACTION

Codex must read `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I05-REWORK-1-CRITIC.md`, `.orchestration/contracts/CF-I05.md`, `.orchestration/INVARIANTS.md`, `.orchestration/PRECRITIC-GATE.md` and the source parity inputs, then autonomously as one bounded accelerated rework wave:

1. correlate maintenance-case resolution, room transition and resolve audit to the exact case/current logical operation;
2. add deterministic K1 resolved → K2 reopened → stale-K1 attempt regression proving K2 remains OPEN, room remains MAINTENANCE and no stale event/success occurs;
3. preserve source-equivalent mobile focused-task behavior for `Siguiente tarea` and room selection, including direct task entry and close/focus return semantics;
4. add browser proof for mobile focus/open/close and per-room draft isolation/reset;
5. update invariant and Pre-Critic evidence so every PASS claim maps to an executable assertion;
6. run full CF-I03/CF-I04/CF-I05 regressions, browser, tests, build, types, Wrangler dry-runs and diff checks;
7. publish one fresh immutable CF-I05 artifact with `external_review.required=true` and stop for External Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.

No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized by this state.
