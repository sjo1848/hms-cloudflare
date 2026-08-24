# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 REWORK-2 ARTIFACT READY FOR INDEPENDENT CRITIC`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized. CF-I04 REWORK-2 is complete locally and is awaiting external review.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Portable Design Package: `docs/migration-design-package.md`
- Source parity artifact: `docs/source-contract-inventory.md`
- Data topology decision: `.orchestration/decisions/CF-DATA-001.md`
- Autonomous execution decision: `.orchestration/decisions/PM-AUTONOMY-001.md`
- UX parity decision: `.orchestration/decisions/CF-UX-PARITY-001.md`
- Active Task Contract: `.orchestration/contracts/CF-I04.md`
- Current Critic record: `.orchestration/reviews/CF-I04-REWORK-1-CRITIC.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED

- Authentication boundary: Cloudflare Access.
- Frontend: React + Vite.
- API: Cloudflare Workers + Hono + TypeScript.
- Persistence: Cloudflare D1.
- Topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
- Preserve same-origin `/api/v1` compatibility where product contract has not intentionally changed.
- Source HMS remains read-only.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B

- one control-plane D1 for Access identity mappings, hotels, memberships/roles and routing metadata;
- one operational D1 per hotel for hotel-scoped operational data;
- critical atomic workflows remain inside one operational hotel D1;
- target remains `$0/month / Cloudflare Free`;
- any paid/material recurring-cost transition requires a separate Human Gate.

### CF-UX-PARITY-001 — APPROVED

- Cloudflare is a technical migration of the accepted HMS product, not a product redesign.
- The accepted source HMS is the UX canon for workflow structure, interaction semantics and responsive reception behavior.
- Technical frontend adaptation is allowed; a materially different product UX is not.
- A material intentional UX departure requires Human Gate classification before implementation.
- Pixel-perfect copying is not required; relevant accepted behavior and information architecture are.

### PM-AUTONOMY-001 — APPROVED

- Human = Product/Risk Authority; decides legitimate Human Gates and Product Acceptance only.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator / execution owner for planning, implementation, tests, adversarial QA, repair, evidence and artifact publication.
- Bugs, red tests, migration defects, incomplete evidence and Independent Critic REWORK are not Human Gates.
- REWORK is consumed directly from persisted GitHub evidence and repaired autonomously by Codex.
- The Human is not a routine message bus.
- `RUNTIME_CAPABILITY_FALLBACK` is required when true Specialist contexts are unavailable; no false multiagency claims.

## VALIDATED RESULTS

### Method / design foundation

- `CF-BOOTSTRAP-REVIEW-001`: PASS after bounded rework.
- `CF-SOURCE-CONTRACT-001`: PASS; router/OpenAPI/inventory operations `51 / 51 / 51`.
- `CF-DESIGN-REVIEW-001`: PASS.

### CF-I01 — Platform foundation

Status: `PASS`.
Fresh Critic PASS artifact: `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02 — Rooms / guests / holds

Status: `PASS`.
Accepted artifact: `bb3a136526c900522394f223206600f543e99e23`.
Evidence included D1 persistence, tenant routing/isolation, API/UI behavior, tests/build/types/Wrangler checks.

### CF-I03 — Bookings / availability / room-night protection

Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.
Accepted artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a`.
Integrated reviewed head: `58c84a2564d9a4b85785203ff04fee24fee47213`.

Accepted evidence includes booking create/list/detail/update/cancel, date-scoped availability, unique room-night claims, claim FK integrity, overlap rollback, failed-update preservation, hold exclusion, cancellation release, half-open adjacency, tenant routing, UI/browser evidence and full regression/build/type/Wrangler validation.

Human Gate: `NONE`.

## CF-I04 — RECEPTION LIFECYCLE

Task Contract: `.orchestration/contracts/CF-I04.md`.

### Artifact history

- Initial reviewed artifact: `32b5070dbd80b4b4d3667fe45573f8851cb60a7c` → Independent Critic `REWORK`.
- REWORK-1 artifact: `88c8361bae2148f682947bba1976a41404db9212` → Independent Critic `REWORK`.
- Current Critic record: `.orchestration/reviews/CF-I04-REWORK-1-CRITIC.md`.
- REWORK-2 artifact: `22eb064c68e2793ef0d67dd984384f32f5a13873` → local implementation, adversarial QA, browser evidence and full validation complete; Independent Critic pending.

### REWORK-2 EXECUTION

Runtime status: `READY_TO_RESUME` with `resume_authorized=false` pending Independent Critic; `RUNTIME_CAPABILITY_FALLBACK` is active because this runtime exposes no separate Specialist contexts. Domain/Engineering and QA/Security responsibilities remain separated in the implementation and evidence passes; no multiagency claim is made.

The authorized repair consumes `.orchestration/reviews/CF-I04-REWORK-1-CRITIC.md` and is limited to lifecycle atomicity, deterministic evidence, valid repeated room history and source-reception UX parity.

Terminal boundary: artifact `22eb064c68e2793ef0d67dd984384f32f5a13873` is published on `main`. Independent Critic review is required; no technical PASS, Product Acceptance or CF-I05 advancement is self-declared.

### What REWORK-1 improved

- stale reassignment side effects are more tightly chained to booking state;
- named `test:cf-i04` harness exists;
- concurrent lifecycle requests are exercised;
- forbidden housekeeping role and unknown binding are exercised fail-closed;
- check-in browser journey was added;
- 375/390/430/768/1024 viewports are touched;
- `RUNTIME_CAPABILITY_FALLBACK` remains explicit and accurate.

### Current blocking findings — REWORK-2

1. **Checkout atomicity remains incomplete.** Booking transition, claim deletion and event insertion can commit even when the room `OCCUPIED -> DIRTY` guard affects zero rows; post-batch `meta.changes` inspection cannot roll back an already successful D1 batch.
2. **Reassignment destination availability is not atomically revalidated.** Target room status can change after preflight; booking/claims/old-room changes can proceed while target-room occupancy update affects zero rows. Current success check does not require the target-room update to have succeeded.
3. **Concurrency evidence is not deterministic.** Parallel curl requests accepting broad `{200,409}` outcomes do not force the stale interleavings the contract requires to prove safe.
4. **UX parity is materially off-canon.** Current target `apps/web/src/App.tsx` is a flat newly invented Rooms/Guests/Bookings interface. Under `CF-UX-PARITY-001`, CF-I04 must port/adapt the lifecycle-relevant accepted source Reception/BookingCaseWorkspace interaction model rather than create a second HMS UX. Do not pull billing/CF-I06 into scope.
5. **Browser evidence overstates responsive/error coverage.** The lifecycle journey executes at 375 only; the other contracted widths merely wait for the `Bookings` heading. A lifecycle backend error is not exercised and asserted as an observable error/recovery state.
6. **The lifetime reassignment uniqueness guard is semantically wrong.** Unique `(booking_id,event_type,from_room_id)` blocks a legitimate sequence such as `A -> B -> A -> C`, creating a restriction not present in the accepted lifecycle contract.

Diagnosis: `EXECUTION_DEFECT + EVIDENCE_DEFECT + UX_PARITY_DEFECT`.
Human Gate: `NONE`.
Blocker: `NONE`.

These findings are repairable inside the approved CF-I04 contract and binding parity decisions. If Codex proposes an intentional material UX redesign instead of parity repair, that proposal must be surfaced for Human Gate classification.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition, material product/UX redesign, approved architecture/topology change, irreversible real-data migration/cutover or Product Acceptance remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. CF-I04 has authorized routine technical/product-parity REWORK.

## NEXT AUTHORIZED ACTION

Independent Critic reads the exact artifact `22eb064c68e2793ef0d67dd984384f32f5a13873` against the contract and canonical evidence. Codex must not continue to CF-I05 before a fresh CF-I04 PASS.

Previously authorized repair sequence completed:

1. implements a D1 transaction guard that aborts inside the batch when booking/room/destination preconditions are stale;
2. removes the lifetime reassignment-history restriction and preserves legitimate repeated room-history semantics;
3. adds deterministic stale-state regressions for checkout and reassignment plus `A -> B -> A -> C`;
4. ports/adapts the CF-I04 Reception Lifecycle surface toward the accepted source HMS case-workspace UX without advancing billing/later scope;
5. exercises lifecycle UI behavior at 375/390/430/768/1024 and proves observable lifecycle typed-error + recovery/success behavior;
6. runs full self-adversarial QA, regressions, build, types, Wrangler dry-runs and scope/diff checks;
7. published the fresh immutable CF-I04 artifact with `external_review.required=true`;
8. stopped at the next Independent Critic boundary.

Do not advance to CF-I05 before CF-I04 obtains a fresh Independent Critic PASS.

## STOP CONDITIONS

Stop only for:
- substantive immutable-artifact / Independent Critic boundary;
- legitimate Human Gate;
- Product Acceptance boundary;
- material unrecoverable blocker after bounded recovery/diagnosis;
- unavoidable Human-only Action/Input;
- runtime/session termination with exact resumable state persisted.

Do not stop for ordinary bugs, red tests, bounded migration defects, incomplete evidence or Independent Critic REWORK.

## ORCHESTRATION RULES

- Every substantive task requires a Task Contract.
- Every substantive artifact requires external Independent Critic before PASS.
- REWORK is persisted for direct Codex consumption; Human does not relay it.
- Retry exhaustion triggers diagnosis, not automatic Human escalation.
- Integration Review is required when separate outputs must compose; identity-preserving post-PASS integration may use deterministic verification when no substantive blob/semantics change.
- Specialists are used only when runtime genuinely exposes separate contexts; otherwise use `RUNTIME_CAPABILITY_FALLBACK`.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence`.
- Optimize for minimum unnecessary Human coordination, maximum auditable autonomy and sufficient execution visibility.
