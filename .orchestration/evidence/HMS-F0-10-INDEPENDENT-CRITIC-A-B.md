# F0.10 Independent Critic — exact Artifact A + Boundary B

## Review request

- Work branch: `impl/hms-foundation-0`
- Artifact A (frozen substantive implementation): `be92a5750c9be4b1b112bbd9980a8b34fc83d42a`
- Boundary B: this orchestration-only commit; its full SHA is supplied with the review request and will be persisted in the next orchestration transition.
- Scope: `F0.10 — Server-owned Capabilities`, including the bounded capability-to-control mapping repair.
- Reviewer must be genuinely separate from implementation and Pre-Critic; read-only; no code modification.
- Requested effort: Luna Medium. Escalate only if the review demonstrates a substantively difficult unresolved issue.

## Required adversarial review

Review the exact Artifact A and Boundary B, not the mutable worktree or implementer summary. Inspect the approved F0.10 Task Contract, bounded repair contract, all-24 invariant evidence and integrated executable evidence. Independently challenge:

1. server ownership and whether the UI accidentally became an authorization source;
2. exact route-to-control map, canonical scopes and absence of duplicate role grants;
3. hotel/network separation, no-membership behavior and tenant isolation;
4. same-subject downgrade freshness and delayed/out-of-order `/auth/me` response handling;
5. hidden controls, keyboard reachability and desktop/mobile evidence;
6. denied mutation zero-side-effect proof and whether tested prerequisites establish the intended guard;
7. Worker/D1 integration, evidence cleanup and claim support;
8. scope, migration/real-data boundaries, JS budget headroom and all applicable invariant evidence;
9. whether any repair finding remains or a ROADMAP_BLOCKER/architecture contradiction exists.

Permitted verdict: `PASS`, `PASS_WITH_CONDITIONS`, or `REWORK`, with concrete evidence and bounded findings. The implementer has not self-declared F0.10 Development Gate or aggregate Foundation PASS.

## Verdict

`PENDING`
