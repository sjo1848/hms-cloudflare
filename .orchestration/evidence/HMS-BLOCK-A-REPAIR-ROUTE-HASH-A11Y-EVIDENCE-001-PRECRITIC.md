# Pre-Critic — bounded Block A route/hash/accessibility evidence repair

Task: `HMS-BLOCK-A-REPAIR-ROUTE-HASH-A11Y-EVIDENCE-001`  
Type: pre-implementation admission; not implementation PASS and not Independent Critic.

## Contract completeness

- The four findings are concretely bounded to route resolution, fragment scroll semantics, responsive keyboard/accessibility evidence and current-build budget provenance.
- Each requirement maps to exact existing or parent-authorized proposed surfaces with executable acceptance. All 24 invariant IDs are classified in the repair contract.
- No new product route, module workflow, capability policy, backend behavior, schema, migration, or data action is needed.

## Adversarial preflight

- Prefix matching could expose a module for an unknown nested URL; exact canonical route matching closes it without removing an approved route.
- Fragment navigation and history scroll restoration can race. The repair preserves a saved history scroll position over fragment resolution, waits on DOM/render change rather than sleeps, and tests a deterministic local-only fragment target.
- Keyboard checks can be falsely satisfied by programmatic focus. The planned browser assertion follows Tab traversal and inspects accessible role/name/current state at both COMPACT and NARROW.
- Reduced-height evidence can merely repeat normal-height assertions. The planned 390×560 run checks the actual More task surface, scroll/controls, Escape/focus and horizontal overflow.
- A stale budget log is not evidence for the current artifact. The current architecture/budget command output will be committed and tied to the same source/build state used for integrated minified browser verification.

## Admission decision

**PASS to perform this bounded technical repair.** No ROADMAP_BLOCKER, product decision or scope expansion is present. Keep Artifact A unpublished until all repair acceptance and inherited Block A gates pass, invariant evidence is current, and final Pre-Critic is updated with concrete receipts.
