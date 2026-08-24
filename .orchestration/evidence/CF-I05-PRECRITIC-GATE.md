# CF-I05 REWORK-3 — Pre-Critic Gate Execution

Gate: `.orchestration/PRECRITIC-GATE.md`  
Decision: `PASS — fresh CF-I05 REWORK-3 artifact eligible for External Independent Critic`

| Gate step | Result | Evidence |
|---|---|---|
| 1. Contract completeness | PASS | `.orchestration/contracts/CF-I05.md` lists scope, forbidden actions, parity rows and applicable invariant IDs |
| 2. Source parity pre-flight | PASS | `docs/cf-i05-housekeeping-maintenance-parity.md`; source baseline `4df56a6217caab611f2f5fcbd98bde8386bb5629` |
| 3. Mutation/concurrency sweep | PASS | `npm run test:cf-i05`; start/finish/resolve races plus K1 resolved → K2 open → stale-K1 `case_id` attempt; exact room/case/event assertions and `changes()=1` correlation |
| 4. Security sweep | PASS | backend capability map, membership-selected operational D1, receptionist `403`, unknown/missing object denial and zero-side-effect assertions |
| 5. UX parity sweep | PASS | active route opens the source-priority visible queue head on `Siguiente tarea`; mobile focus enters the task heading and closes back to the originating control; drafts are room-keyed |
| 6. Browser evidence sweep | PASS | `npm run test:cf-i05-browser`; real local API+D1+Vite harness proves queue-head selection and dialog open/close at 375/390/430, actual focus transition/return at 375, desktop workspace at 768/1024, and selected-room Clear form isolation |
| 7. Evidence claim audit | PASS | invariant evidence and parity matrix map queue-head, focus/return, drafts, API/D1 and screenshot claims to exact executable assertions; no mock or local evidence is overclaimed |
| 8. Full regression/scope audit | PASS | `npm run check`, `npm run types:check`, `npm run web:build`, sequential `npm run test:cf-i03`, `npm run test:cf-i04`, `npm run test:cf-i05`, `npm run test:cf-i05-browser`, `npm run wrangler:dry-run`, `git diff --check` |
| 9. Invariant evidence | PASS | every applicable registry invariant is `PASS`; `INV-MONEY-001` is justified `N/A` |
| 10. Publish boundary | PASS | immutable CF-I05 REWORK-3 artifact `97cd553` is published; canonical state will set `external_review.required=true`; stop and do not start CF-I06 |

## REWORK-3 repairs completed before this decision

- zero-row conditional writes no longer create false-success housekeeping events;
- maintenance resolve correlates the exact open-case update to the room transition and rejects stale K1 against a newer K2/OPEN case;
- deterministic ABA regression asserts K1/K2 identity, room state, HTTP 409 and zero stale event;
- deterministic stale races cover cleaning start/finish and maintenance resolve;
- legacy synthesized cases retain recovery reporter, resolver, timestamp and provenance marker;
- active UX preserves focused queue/workspace interaction with a mobile focused bottom-sheet dialog, explicit close and queue return;
- browser evidence proves mobile focus/close and per-room draft isolation, retention and success reset;
- maintenance drafts are keyed by room and reset on success/clear;
- browser evidence is committed, real local API/D1-backed and reproducible;
- `Siguiente tarea` now opens `visible[0]`, matching source queue-head priority;
- focus enters the mobile task heading and returns to the originating next-task control on close;
- browser proof asserts queue-head identity, actual focus/return at 375 and Clear form clearing only the selected room;
- prior mocked-only and flat-card evidence claims were removed or weakened.

No `FAIL` or `UNPROVEN` condition remains. This gate is admission to Independent Critic review, not a Codex substantive PASS.
