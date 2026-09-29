# Block A — Independent Contract Review (read-only)

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001.md`
Reviewer: Jason, separate read-only subagent, GPT-6 Luna Medium. No repository files were modified by the reviewer.
Review boundary: approved authorization 014 and exact base `1bfa20bb5f9bf1db421afbb88bf77b87a97f5d18`; current shell/router/navigation/API authority.
Result: **No ROADMAP_BLOCKER; bounded clarifications required and incorporated before freeze.** This is contract review, not implementation review, Pre-Critic PASS, or Independent Critic.

## Findings and disposition

1. Direct URL could render a page despite hidden navigation. Contract now requires a client-side inaccessible state based only on server effective capabilities, while explicitly preserving backend authority and a denied protected-API assertion.
2. F0.11 invalidation trigger was unspecified. Contract now pins startup/identity-hotel change and 403 (excluding `/auth/me`) to a deduplicated server-authoritative refresh; the failed business request is never replayed; failures fail closed.
3. Unknown paths defaulted to Reception. Contract now requires a truthful not-found/recovery surface and canonical current route inventory; aliases must be source/test-backed.
4. Router had no hash state/scroll-restoration contract. Contract now covers pathname/search/hash and useful per-history-entry scroll restoration without duplicating module-owned URL state.
5. Current `/auth/me` has `hotel_name`, `hotel_id`, `email`, `subject`, effective capability arrays; the profile selector is local-dev-only. Contract now uses those server-owned fields and forbids adding a production hotel switcher.
6. Existing breakpoints do not define WIDE/COMPACT/NARROW. Contract now treats exact approved test viewports as evidence dimensions and does not equate them to existing CSS breakpoints.
7. “Each module route” was unbounded. Contract enumerates the seven existing navigation routes and frozen context grouping; it adds no route/destination.
8. Anchor/focus behavior was implicit. Contract now requires current-page semantics, keyboard operation, Escape/focus restore and explicit Back/Forward evidence.

## Invariant review

Applicable: INV-TENANT-001, INV-RBAC-001, INV-UX-001, INV-RESP-001, INV-EVID-001, INV-STATE-001, INV-CF-I07-003 (same synthetic subject and same operation for allowed-before/denied-after downgrade proof), INV-CF-I07-004 (if a runner starts local processes), INV-SCOPE-001. All remaining registry invariants are classified N/A with rationale in the Task Contract. The reviewer found the planned N/A candidates reasonable within the stated scope.

No product policy choice remains unresolved in this contract. Exact visual implementation and CSS breakpoints remain implementation detail within the frozen WIDE/COMPACT/NARROW compositions.
