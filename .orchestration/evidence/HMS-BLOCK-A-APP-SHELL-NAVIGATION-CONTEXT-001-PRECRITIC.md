# Pre-Critic — HMS Block A App Shell + Navigation/Context

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001.md`
Gate type: **contract-admission Pre-Critic, before product implementation**.
Status: **PASS — bounded implementation may begin**. This is not an implementation Development Gate or Independent Critic verdict.

## Contract completeness

- Authorization: Drive artifact `HMS-BLOCK-A-AUTHORIZATION-014`, BA1–BA7 approved; exact accepted base `1bfa20bb5f9bf1db421afbb88bf77b87a97f5d18`; clean isolated branch `impl/hms-block-a-shell`.
- Controlling architecture read: Blueprint 001 (including frozen shell/context IA and responsive model); Reconciliation 007; Final Disposition 008; accepted repository Block A contract, roadmap master, traceability, evidence matrix and repository surface audit.
- Scope is only App Shell, primary/capability-aware navigation, hotel/user context, URL/history/deep-link behavior, WIDE/COMPACT/NARROW and F0 capability refresh/invalidation. No Blocks B–H, domain workflows, backend authorization, API/schema/migrations, real data, or promotion.
- Existing paths are distinguished from proposed additions; repository route inventory is explicit; all observed ambiguities from a separate Contract Reviewer are dispositioned in `.orchestration/evidence/HMS-BLOCK-A-CONTRACT-REVIEW-001.md`.
- Requirement → surface → acceptance → executable evidence is explicit for each material contract.

## Source/architecture parity preflight

- `/api/v1/auth/me` already returns server-owned subject/email, hotel identity/name and effective hotel/network capabilities. Client must consume these arrays; no role map is copied into frontend.
- Backend routes continue to enforce canonical capabilities. Frontend route state is UX-only.
- Frozen context taxonomy is kept: hotel operations, directory, insights, hotel administration, and platform/network administration. Reception remains central; no Billing/Cash shell destination, no global Guest account.
- WIDE, COMPACT and NARROW semantics follow Blueprint 001. The contract does not infer semantics from current arbitrary breakpoints; only evidence viewports are fixed.
- No data migration, domain enum, workflow order, or source-domain behavior changes.

## Adversarial risks addressed before code

- Direct denied routes: must not render unauthorized module data; still exercise server denial to prove UI is not the security boundary.
- `/auth/me` stale response after identity change: generation binding and old-context clearing.
- 403 refresh loop / unintended replay: deduplicated refresh only, exclude `/auth/me`, never retry the failed business operation.
- Unknown route masquerading as Reception: truthful not-found behavior.
- URL/history/context split: pathname/search/hash plus scroll tied to history entry; preserve Reception-owned query behavior.
- Capability downgrade: same synthetic identity and same protected operation allowed before/denied after; no two-profile substitution.
- NARROW/COMPACT accessibility: active state not color-only, no hover-only critical nav, keyboard/focus, Escape and focus restoration.
- Block B–H scope leakage: explicit diff audit and no module workflow changes.

## Invariant mapping

All 24 registry invariants are classified in the Task Contract. Applicable: INV-TENANT-001, INV-RBAC-001, INV-UX-001, INV-RESP-001, INV-EVID-001, INV-STATE-001, INV-CF-I07-003, INV-CF-I07-004 when process-starting runner is used, INV-SCOPE-001. The task-specific final invariant evidence file is required before Artifact A and every applicable item must be PASS with executable proof. Other invariants are explicitly N/A because Block A adds no corresponding mutation/domain/financial/report/cutover behavior.

## Admission decision

No `ROADMAP_BLOCKER`, architecture contradiction or product decision is present. All implementation requirements have an owning existing surface and acceptance evidence. Admission passes for Block A only. Implementation may start after this frozen contract/admission boundary; final claims remain blocked until fresh tests/browser/Worker evidence, final Pre-Critic, Artifact A + orchestration-only Boundary B, and an independent exact-pair Critic.
