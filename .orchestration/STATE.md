# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 REWORK-1 IMPLEMENTATION VALIDATED / INDEPENDENT REVIEW PENDING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Portable integrated Design Package: `docs/migration-design-package.md`
- Runtime data decision: `.orchestration/decisions/CF-DATA-001.md`
- Autonomous execution decision: `.orchestration/decisions/PM-AUTONOMY-001.md`
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

### PM-AUTONOMY-001 — APPROVED

- Human = Product/Risk Authority; the Human decides legitimate Human Gates and Product Acceptance, not routine technical work.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator and execution owner for planning, implementation, tests, adversarial QA, routine repair, evidence, artifact publication and bounded integration mechanics.
- Bugs, red tests, ordinary migration defects, incomplete evidence and Independent Critic REWORK are not Human Gates.
- Routine REWORK is consumed directly from persisted GitHub review evidence and repaired autonomously by Codex.
- Full Independent Critic remains mandatory for substantive artifacts; identity-preserving post-PASS integration may use deterministic verification rather than duplicating the same substantive review.
- The Human is never a routine message bus.
- `RUNTIME_CAPABILITY_FALLBACK` remains mandatory when true Specialist contexts are unavailable; no false multiagency claims.

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

- Status: `PASS / INTEGRATED` as a technical experiment, but unattended Codex is not the normal operating mode.
- PR #2 merged at `08af1ffda02447e53924345d900fa5f91c266765`.
- First real dispatch proved `GitHub → systemd → dispatcher → Codex` works without Human relay.
- User-visible execution is the preferred operating mode; automation must not hide substantive Codex work.

### Runtime Git handoff repair — CF-RUNTIME-GIT-HANDOFF-002

- Status: `PASS / INTEGRATED / LOCAL PROBE PASS`.
- PR #5 exact reviewed head: `f3f1565f15b69fb2b9a0046fc4ca0d72b31fdd28`.
- ChatGPT Independent Critic verdict: PASS after one controller-found rework concerning non-idempotent commit/push recovery.
- PR #5 merged to main at `a2f8a7eb760834b7868368ebe9c793a0fc2f188b`.
- No host auto-commit to `main`; no auto-merge path.

## CF-I03 — BOOKINGS / AVAILABILITY / ROOM-NIGHT PROTECTION

Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.

Task Contract: `.orchestration/contracts/CF-I03.md`.
Accepted implementation artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a` on `runtime/cf-i03-rework-6`.
Clean integration product commit: `f6f3d230348ca22834704a063eec728d27235e6a`.
Integrated main head independently reviewed: `58c84a2564d9a4b85785203ff04fee24fee47213`.
Original PR #4 was closed without merge because it was stale.

Independent Critic records:
- `.orchestration/reviews/CF-I03-REWORK-4-CRITIC.md` — implementation artifact PASS.
- `.orchestration/reviews/CF-I03-INTEGRATION-CRITIC.md` — clean integration PASS.

Accepted evidence includes:
- booking create/list/detail/update/cancellation;
- date-scoped availability with holds and active booking claims;
- unique `(room_id, stay_date)` room-night claims;
- `booking_id -> bookings(id) ON DELETE CASCADE` relational integrity;
- guarded PATCH false-success prevention;
- overlap rollback, claim replacement, failed-update preservation, hold exclusion, cancellation release and half-open adjacency;
- tenant routing fail-closed behavior;
- persisted browser validation for loading, empty, validation, availability, create, detail/edit and surfaced backend error;
- 16/16 tests, executable CF-I03 D1/API regression, web build, generated types, Wrangler dry-runs and diff check PASS during clean integration validation.

Human Gate: `NONE`.

Runtime capability record: `RUNTIME_CAPABILITY_FALLBACK` — the visible Codex adapter did not expose separate specialist/subagent execution capability, so no false multiagency result is claimed. The Independent Critic boundary remained external and intact.

Non-blocking migration note: `0004_booking_claim_fk.sql` uses `PRAGMA foreign_keys = OFF/ON`; prefer `PRAGMA defer_foreign_keys` or no toggle in future D1 migrations when appropriate.

## CF-I04 — REWORK-1 IMPLEMENTATION VALIDATED / INDEPENDENT REVIEW PENDING

Target increment: Reception Lifecycle.

Task Contract: `.orchestration/contracts/CF-I04.md`.
Reviewed implementation artifact: `32b5070dbd80b4b4d3667fe45573f8851cb60a7c`.
Repaired implementation artifact: `88c8361bae2148f682947bba1976a41404db9212` on `main`.
Published pre-review state: `855d0515716949284309da000e99c8037a113b27`.
Independent Critic record: `.orchestration/reviews/CF-I04-CRITIC.md`.
Verdict: `REWORK`.
Human Gate: `NONE`.
Diagnosis: `EXECUTION_DEFECT + EVIDENCE_DEFECT`.

REWORK-1 result: lifecycle side effects now share transition guards inside D1 batches; SQL transition uniqueness guards force conflicting check-in/checkout/reassignment attempts to serialize or roll back; named adversarial D1/API evidence covers lifecycle state/claim/room/event consistency and forbidden/unknown/cross-tenant attempts; browser evidence covers checklist validation/error/success, reassignment, checkout and widths 375/390/430/768/1024. No new Independent Critic verdict is claimed.

What was already useful in the reviewed artifact:
- explicit check-in/reassignment/checkout domain endpoints;
- checklist gating on the ordinary path;
- lifecycle actor/request/hotel event records;
- ordinary successful D1/API lifecycle path;
- persisted reassignment/checkout browser journey;
- explicit `RUNTIME_CAPABILITY_FALLBACK`.

Prior blocking repair input, addressed in `88c8361`:
1. **Lifecycle atomicity/concurrency:** critical guarded `UPDATE` row-count checks occur after successful `D1.batch()` completion. Zero-row statements are successful SQL operations, so later statements may commit before the route returns conflict. Concurrent reassignment can desynchronize booking, claims and room occupancy; stale check-in/checkout guards can commit partial room/audit/lifecycle state.
2. **Adversarial D1/API evidence:** current lifecycle regression covers ordinary preflight rejection but not stale/zero-row transactional invalidation. Add repeatable race/conflict regressions proving complete state preservation, including lifecycle event counts.
3. **Browser acceptance:** persisted browser test starts from `CheckedIn`, covers reassignment/checkout only and does not exercise required 375/390/430/768/1024 widths. Add Confirmed→CheckedIn checklist, validation/error/success and all accepted responsive widths.
4. **Lifecycle security evidence:** add forbidden-role and cross-tenant/unknown-binding lifecycle attempts proving fail-closed behavior with zero mutation/event side effects.

Under `PM-AUTONOMY-001`, these were routine technical findings and were repaired without Human approval. Do not advance to CF-I05 until CF-I04 obtains Independent Critic PASS.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. CF-I04 REWORK-1 is locally validated and awaits the next Independent Critic.

## NEXT AUTHORIZED ACTION

1. ChatGPT performs the Independent Critic review of exact repaired artifact `88c8361bae2148f682947bba1976a41404db9212`.
2. Resume only from that verdict; do not advance to CF-I05 before CF-I04 PASS.

No Human confirmation is authorized or required for this rework.

## STOP CONDITION

Stop only for:
- a substantive immutable-artifact / Independent Critic boundary;
- a legitimate Human Gate;
- Product Acceptance boundary;
- material unrecoverable blocker after bounded recovery/diagnosis;
- unavoidable Human-only Action/Input;
- runtime/session end with exact resumable state persisted.

Routine bugs, red tests and Independent Critic REWORK do not stop the authorized Codex work loop.

## ORCHESTRATION RULES

- Human = Product/Risk Authority; Human decides only legitimate Human Gates/Product Acceptance.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator / execution owner; routine implementation, QA and REWORK are autonomous.
- Every substantive task requires a Task Contract.
- Every substantive artifact requires an external ChatGPT Independent Critic before substantive PASS.
- ChatGPT REWORK is persisted directly for Codex consumption; the Human is not a relay or routine approver.
- Retry exhaustion triggers diagnosis, not automatic Human escalation.
- Identity-preserving post-PASS integration may use deterministic verification instead of duplicating the same full substantive review; substantive integration changes still require fresh Critic.
- Specialists are delegated only when the runtime genuinely supports separate contexts; otherwise record `RUNTIME_CAPABILITY_FALLBACK`.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.
- Optimize for minimum unnecessary Human coordination plus maximum execution visibility.
