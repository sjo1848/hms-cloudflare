# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 REWORK-3 ARTIFACT READY FOR INDEPENDENT CRITIC`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

Conversation history is supporting context only. Canonical repository state, contracts, decisions, reviews and evidence control execution.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Migration design: `docs/migration-design-package.md`
- Source parity inventory: `docs/source-contract-inventory.md`
- Active Task Contract: `.orchestration/contracts/CF-I05.md`
- Current Independent Critic: `.orchestration/reviews/CF-I05-REWORK-2-CRITIC.md`
- Learned invariants: `.orchestration/INVARIANTS.md`
- Mandatory admission gate: `.orchestration/PRECRITIC-GATE.md`
- Machine-readable execution state: `.orchestration/STATUS.json`

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED
Cloudflare Access + React/Vite + Workers/Hono/TypeScript + D1; same-origin `/api/v1`; source HMS read-only; parity before expansion.

### CF-DATA-001 — APPROVED OPTION B
CONTROL_DB for identity/hotel/membership/routing; one operational D1 per hotel; critical workflows atomic inside one hotel D1; target `$0/month / Cloudflare Free`; paid/material recurring-cost transition requires Human Gate.

### CF-UX-PARITY-001 — APPROVED
Accepted source HMS is UX canon for workflow structure, interaction semantics and material responsive/mobile behavior. Technical adaptation is allowed; material intentional departure requires Human Gate.

### PM-AUTONOMY-001 — APPROVED
Human = Product/Risk Authority. ChatGPT = External Controller / Method Custodian / Independent Critic / Human-Gate Classifier. Codex = Runtime Orchestrator / execution owner. Routine REWORK is autonomous; Human is not a routine message bus.

### PM-INVARIANTS-001 — BINDING
Reusable defect classes become durable invariants. Codex must classify applicable invariants, persist evidence and pass `.orchestration/PRECRITIC-GATE.md` before publishing. This never replaces External Independent Critic.

## VALIDATED RESULTS

- CF-I01 Platform foundation — `PASS`; accepted `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 Rooms / guests / holds — `PASS`; accepted `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 Bookings / availability / room-night protection — `PASS / CLEAN INTEGRATION PASS`; accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated reviewed `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 Reception lifecycle — `PASS`; accepted `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.

## CF-I05 — HOUSEKEEPING + MAINTENANCE

Task Contract: `.orchestration/contracts/CF-I05.md`.

Artifact history:
- `02421a19985fa71408e52be2a253b9082292dd78` → `REWORK`.
- `14915f79c77ca688cafd5e50da4398b0cf57d113` → `REWORK`.
- `462bd0519c7224dc996f23825dbbc8c5afc10aec` → Independent Critic `REWORK-3`.
- `97cd553` → fresh immutable REWORK-3 artifact ready for Independent Critic.

### Accepted in artifact `462bd05`

- exact maintenance-case ABA correlation is repaired;
- deterministic stale K1 vs newer open K2 preserves room MAINTENANCE, K1 RESOLVED, K2 OPEN and zero stale resolve event;
- simple cleaning/resolve concurrency remains exactly-once;
- legacy reporter/resolver ownership remains preserved;
- mobile task workspace is now a distinct bottom focused surface;
- per-room draft isolation and retention are browser-tested;
- integrated browser harness remains real local API + D1 + Vite;
- no CF-I06, production, remote D1, real-data or paid-resource scope drift.

### REWORK-3 result — artifact ready for Independent Critic

- `Siguiente tarea` now opens `visible[0]`, the first visible queue task, and the browser asserts the opened room matches the queue head at every contracted width.
- Mobile focus enters the task heading and close restores focus to the originating next-task control; the browser asserts actual focus transition/return at 375px and open/close at all mobile widths.
- Browser evidence explicitly executes `Clear form` for room B and verifies room A's draft remains retained; evidence no longer claims unexecuted success-reset proof.
- Full regression, browser, build, types, Wrangler dry-run, invariant evidence and Pre-Critic Gate PASS are persisted for artifact `97cd553`.

Independent Critic: `REQUIRED`.
Human Gate: `NONE`.
Blocker: `NONE`.

## DELIVERY SPEED POLICY

Accelerated waves remain active. Speed comes from complete contracts, one coherent implementation wave, learned-invariant self-QA and one external boundary—not from skipping domain, security, UX or evidence guarantees.

No intermediate Cloudflare preview is planned. Authorized sequence remains:

`CF-I05 → CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

None.

## BLOCKERS

None. CF-I05 REWORK-3 artifact is published; external Independent Critic is the next boundary.

## NEXT AUTHORIZED ACTION

Stop at External Independent Critic review of immutable CF-I05 REWORK-3 artifact `97cd553`. Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
