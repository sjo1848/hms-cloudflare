# Block E bounded repair — specialist review disposition

The following separate read-only specialist reviews were completed before follow-up implementation. They did not edit files and do not constitute the final Independent Critic.

## Domain and concurrency

- Finding: maintenance history was globally limited before grouping by room, so a busy hotel's recent events could hide another room's records.
- Disposition: implement deterministic per-room bounded history; retain exact event/case/room identity, actor, request and timestamps.
- Finding: the selected-case UI did not make exact case correlation or actor/request traceability visible.
- Disposition: show exact case-correlated history and stored case facts; provide a truthful empty state.
- Finding: blocking overlap risk must be distinguished from advisory, non-overlap and terminal booking cases.
- Disposition: keep the board read-only and assert positive and negative fixtures plus unchanged bookings.

## UX and responsive

- Finding: State, Attention and Impact were compressed; risk discovery depended on selecting a room; case details omitted stored facts; report impact was hard-coded to BLOCKING.
- Disposition: distinguish the three concepts, surface risk in the queue, show available case facts, and expose only the existing BLOCKING/NON_BLOCKING choice.
- Finding: event names were raw and audit facts were hidden.
- Disposition: localize event labels in both supported locales and display available actor/request/case traceability.
- Finding: the 768–900 px layout stacked panes while workspace state still behaved as desktop; the focused task did not contain keyboard focus or consistently close/restore focus.
- Disposition: implement Queue→Case below the frozen compact threshold, modal keyboard containment, Escape/visible close, and focus restoration; prove the contract's exact viewport matrix.

## QA and evidence

- Finding: the two-D1 test did not prove same-identity membership and tenant-specific data isolation, and browser fixtures lacked the corresponding second-tenant Housekeeping data.
- Disposition: seed independently bound local D1s with valid same-subject active memberships and distinguishable same-ID fixtures; prove reads and writes remain hotel-scoped.
- Finding: risk/history assertions omitted non-overlap, unchanged booking rows, ordering, exact case identity, per-room bounds and empty state.
- Disposition: cover these with executing-D1 API/browser assertions.
- Finding: integrated browser evidence lacked complete deep-link/reload/history, viewport, authorization-denial and failure/recovery checks.
- Disposition: add only the bounded Housekeeping evidence in the frozen repair contract, including capability denial and zero write effects.
- Finding: browser runner process cleanup and fixed historical dates needed stronger evidence.
- Disposition: use dates derived from synthetic hotel-local board date where time-relative behavior is asserted; record exact owned process cleanup.

All dispositions stay inside Block E's existing UI/API/domain/capability contracts. No schema, route, capability policy, domain semantics, Block F workflow or new budget policy is authorized. The final Independent Critic must be separate and read-only over the exact Artifact A + Boundary B pair.
