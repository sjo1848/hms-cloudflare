# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare
Updated: 2026-08-23
Global Project Mode: `DELIVERY`
Phase: `DESIGN`
Phase Status: `WAITING_HUMAN_GATE` with independent work still available

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Durable governance docs: `HMS-CLOUDFLARE — Project State & Orchestration`; `HMS-CLOUDFLARE — Migration Design Package v0.1`; `HMS-CLOUDFLARE — Codex Runtime Bootstrap`; `REFERENCE — PROJECT-METHOD-TRANSFER-PACK-v0.1`
- This file: portable runtime snapshot, not permission to override newer explicit Human Gate decisions.

## ACTIVE DECISIONS

- `CF-ARCH-001` — APPROVED.
  - Authentication boundary: Cloudflare Access.
  - Frontend: React + Vite.
  - API: Cloudflare Workers + Hono + TypeScript.
  - Persistence target: Cloudflare D1.
  - Deployment topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
  - Compatibility objective: preserve same-origin `/api/v1` behavior where practical.
  - Source HMS remains untouched.
  - Parity before feature expansion.

## SUPERSEDED / NON-CANONICAL

- Native username/password + Argon2-on-Workers is not the selected authentication path.
- Local foundation commit `53e2a69a350d22754532c8f53a709280f1fdd1f8` is PROVISIONAL ONLY. It is candidate evidence, not accepted implementation and not a BUILD PASS.

## PENDING HUMAN GATE

### CF-DATA-001 — D1 tenant-isolation topology

Status: `WAITING_HUMAN_GATE`

Decision choices documented in the Design Package:
- A: shared operational D1 with strict `hotel_id` scoping + composite tenant FKs + security regressions.
- B: control-plane D1 + one operational D1 per hotel. Current system recommendation.
- C: retain PostgreSQL behind Workers/Hyperdrive, which conflicts with the D1-first target.

Do not infer the human choice. The gate blocks final D1 tenancy/schema architecture and `CF-I01` BUILD.

## BOOTSTRAP STATUS

- Branch: `chore/method-bootstrap`
- PR: `#1 — chore: bootstrap Project Method for Codex`
- External-controller bootstrap commit: `ca5f145f7e89d539075baee8f97d00ff309b8fa4`
- Bootstrap review `CF-BOOTSTRAP-REVIEW-001`: `REWORK` at head `91217a116635c6878bca4fcb91cc6929b2f1483a`.
- Review evidence: `.orchestration/reviews/CF-BOOTSTRAP-REVIEW-001.md`.
- Repair is authorized within bootstrap scope: add an explicit Human/Codex/ChatGPT authority-role split, then route the repaired head through a fresh independent Critic.
- Codex must first execute `CF-BOOTSTRAP-REVIEW-001` as an independent Critic. If PASS, integrate the bootstrap; if REWORK, repair and send through a fresh independent Critic before integration.

## CRITICAL INVARIANTS

- Tenant isolation.
- Tenant-scoped relational integrity.
- Room-night overlap prevention.
- Domain lifecycle semantics for check-in, checkout, room reassignment and housekeeping.
- Integer-cent financial semantics and atomic financial operations.
- Backend-authoritative RBAC/capability enforcement.
- `/api/v1` compatibility except native login/refresh substitution.
- Audit/request traceability.
- No production cutover or real-data migration during parity BUILD.

## ACTIVE / READY TASKS

### CF-BOOTSTRAP-REVIEW-001
Status: `REWORK`
Contract: `.orchestration/contracts/CF-BOOTSTRAP-REVIEW-001.md`
Purpose: independent review of Project Method/Codex bootstrap PR #1 because the external controller that authored it cannot approve its own work.
Handoff on PASS: integrate PR #1, update state, continue automatically to `CF-SOURCE-CONTRACT-001`.

### CF-SOURCE-CONTRACT-001
Status: `READY_AFTER_BOOTSTRAP_PASS`
Contract: `.orchestration/contracts/CF-SOURCE-CONTRACT-001.md`
Purpose: build a durable source API/product contract inventory and representative acceptance-journey map from the pinned HMS baseline. This work is independent of `CF-DATA-001`.

### CF-FOUNDATION-RECONCILE-001
Status: `PLANNED / BLOCKED_BY_DESIGN_EXIT`
Purpose: inspect the provisional local foundation against the accepted Design Package after `CF-DATA-001` and independent design review. Retain/rework/discard by evidence.

### CF-I01
Status: `PLANNED / BLOCKED_BY_CF-DATA-001_AND_DESIGN_EXIT`
Purpose: platform foundation BUILD under an approved Task Contract.

## ORCHESTRATION RULES

- Every substantive task requires a Task Contract.
- Every substantive output requires independent Critic review.
- Routine REWORK is autonomous.
- Separate independent branches require separate Critics and Integration Review.
- Persist artifact identity/ref and evidence before Critic review.
- Before any repo mutation verify repository/worktree boundary.
- Do not merge or declare global PASS from local/subtask PASS alone.
- Do not use the human as a routine coordinator.

## METHOD METRICS

- `human_coordination_messages`: target 0 during routine execution.
- `corrective_interventions`: 1 historical — premature foundation construction before full method bootstrap.
- `unnecessary_prompts`: target 0.
- `false_pass`: 0 accepted.
- `source_of_truth_divergence`: provisional foundation remains non-canonical until reconciled.

## NEXT AUTHORIZED ACTION

Execute `CF-BOOTSTRAP-REVIEW-001` as an independent review of PR #1:
1. pre-flight and artifact identity check;
2. compare bootstrap against Project Method/Transfer Pack/current Drive state;
3. verify no product BUILD or hidden `CF-DATA-001` decision;
4. emit `PASS | REWORK | HUMAN_GATE | CONTRACT_DEFECT`;
5. persist review evidence;
6. on PASS integrate bootstrap and immediately execute `CF-SOURCE-CONTRACT-001`.

Continue automatically until the only remaining next action requires `CF-DATA-001` or another legitimate Human Gate/material blocker.

## STOP CONDITION

If bootstrap review passes and `CF-SOURCE-CONTRACT-001` later receives independent PASS with no other independent DESIGN task remaining, transition to `WAITING_HUMAN_GATE: CF-DATA-001` and provide one concise gate handoff. Do not begin `CF-I01` BUILD before the gate is resolved and DESIGN exit criteria pass.
