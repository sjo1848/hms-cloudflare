# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 INDEPENDENT CRITIC PASS / CLEAN INTEGRATION REQUIRED BEFORE CF-I04`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Portable integrated Design Package: `docs/migration-design-package.md`
- Runtime decision record: `.orchestration/decisions/CF-DATA-001.md`
- Source parity artifact: `docs/source-contract-inventory.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED

- Authentication boundary: Cloudflare Access.
- Frontend: React + Vite.
- API: Cloudflare Workers + Hono + TypeScript.
- Persistence target: Cloudflare D1.
- Deployment topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
- Compatibility objective: preserve same-origin `/api/v1` behavior where practical.
- Source HMS remains untouched.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B

- one control-plane D1 for Access identity mappings, hotels, memberships/roles and routing metadata;
- one operational D1 per hotel for hotel-scoped operational data;
- target remains `$0/month / Cloudflare Free`;
- no paid Cloudflare plan, paid D1 transition or material recurring-cost increase may be activated without a separate Human Gate;
- critical atomic workflows stay inside the relevant hotel operational D1.

### Independent review policy

- Codex quota is reserved for implementation/rework.
- ChatGPT is the external Independent Critic through GitHub.
- Routine `@codex review` is not used unless the Human explicitly changes this policy.

## VALIDATED RESULTS

### Bootstrap / source contract / design

- `CF-BOOTSTRAP-REVIEW-001`: PASS after bounded rework.
- `CF-SOURCE-CONTRACT-001`: PASS; router/OpenAPI/artifact operations `51 / 51 / 51`.
- `CF-DESIGN-REVIEW-001`: PASS.

### CF-I01

- Status: `PASS`.
- Rework: 1 bounded cycle.
- Fresh Critic PASS at repaired artifact `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02

- Status: `PASS`.
- Final implementation artifact: `bb3a136526c900522394f223206600f543e99e23`.
- State/evidence commit on main: `24a1e68a8df8fd7251586415619045f287e2c95a`.
- Evidence: 13 tests PASS, typecheck PASS, web build PASS, generated-type check PASS, API/web Wrangler dry-run PASS, diff check PASS.

### Runtime automation — CF-RUNTIME-AUTOMATION-001

- Status: `PASS / INTEGRATED` as an experiment, but unattended execution is not the active operating mode.
- PR #2 merged at `08af1ffda02447e53924345d900fa5f91c266765`.
- First dispatch proved `GitHub → systemd → dispatcher → Codex` technically works.
- Human selected visible interactive Codex execution as the active workflow because observability is a method requirement.

### Runtime Git handoff repair — CF-RUNTIME-GIT-HANDOFF-002

- Status: `PASS / INTEGRATED / LOCAL PROBE PASS`.
- PR #5 exact reviewed head: `f3f1565f15b69fb2b9a0046fc4ca0d72b31fdd28`.
- PR #5 merged to main at `a2f8a7eb760834b7868368ebe9c793a0fc2f188b`.
- No host auto-commit to `main`; no auto-merge path.

## CF-I03

Status: `PASS / INDEPENDENT CRITIC COMPLETE / CLEAN INTEGRATION REQUIRED`.

Accepted implementation artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a` on `runtime/cf-i03-rework-6`.
Independent Critic record: `.orchestration/reviews/CF-I03-REWORK-4-CRITIC.md`.
Critic verdict: `PASS`.
Human Gate: `NONE`.

The accepted increment covers booking create/list/detail/update/cancellation, date-scoped availability, room-night uniqueness, hold/booking exclusion, integer-cent totals, half-open intervals, typed errors and the `/bookings` browser surface. Migration `0004_booking_claim_fk.sql` preserves relational ownership with `booking_id -> bookings(id) ON DELETE CASCADE`.

Executable evidence:
- `npm run test`: 16/16 PASS as persisted by the worker;
- `npm run test:cf-i03`: local D1/API regression covering FK/orphan rejection, overlap rollback, adjacency, room/date PATCH claim replacement, failed-update preservation, hold exclusion and cancellation release;
- persisted Playwright scripts cover loading, empty, validation, date-scoped availability, create, detail/edit and surfaced backend error;
- web build, generated types, Wrangler dry-runs and diff check PASS as persisted evidence.

Rework history:
- REWORK-1 corrected blank notes, hold/booking semantics, UI availability/detail/edit, lifecycle revival, safe totals, room status and bounded queries.
- REWORK-2 corrected hold-vs-booking mutation direction and claim replacement defects.
- REWORK-3 materialized claim schema and strengthened D1/API evidence.
- REWORK-4 closed the zero-row PATCH false-success path, added booking-claim FK and persisted executable D1/API/browser regression.

Runtime capability record: `RUNTIME_CAPABILITY_FALLBACK` — the visible Codex adapter did not expose separate specialist/subagent execution capability, and no false multiagency result is claimed. This remains a runtime/method refinement item and does not invalidate CF-I03 technical PASS.

Non-blocking observation: `0004_booking_claim_fk.sql` uses `PRAGMA foreign_keys = OFF/ON`; future D1 schema changes should prefer Cloudflare's recommended `PRAGMA defer_foreign_keys` when temporary deferral is actually needed.

Original PR #4 remains stale at `cf-i03-bookings@834e4a2aa3ec37aac036dc0273b15e6abf5c7d81` and must not be merged as the accepted artifact.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. Current integration is routine technical work, but the accepted rework branch has diverged from `main`; integration must reconcile current main state rather than merge stale PR #4.

## NEXT AUTHORIZED ACTION

1. Create a clean integration from current `main` containing the accepted CF-I03 product/schema/test/evidence changes from artifact `65ed1e5710a20af97d183f04364b5aa7b605a74a`, while reconciling orchestration state rather than overwriting newer main/runtime decisions.
2. Validate the integrated candidate against the CF-I03 regression suite and normal build/type/dry-run checks.
3. Integrate the clean candidate to `main` after exact-head verification.
4. Close or supersede stale PR #4.
5. Derive and authorize CF-I04 Reception Lifecycle under a fresh Task Contract.
6. Continue in visible interactive Codex mode; do not re-enable unattended execution as the normal workflow.

## STOP CONDITION

Stop only for:
- a legitimate Human Gate;
- material unrecoverable blocker;
- unavoidable Human Action/Input;
- Product Acceptance boundary;
- external Independent Critic boundary;
- runtime/session end with exact resumable state persisted.

## ORCHESTRATION RULES

- Human = Product/Risk Authority.
- Codex = Runtime Orchestrator / implementation and bounded rework.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human Gate interface.
- Every substantive task requires a Task Contract.
- Every substantive output requires an independent ChatGPT Critic.
- Routine REWORK is autonomous.
- Retry exhaustion triggers diagnosis, not automatic escalation.
- Do not use the Human as a routine message bus.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.
- Optimize for minimum unnecessary Human coordination plus maximum runtime visibility; resumability must not require hidden background execution.
