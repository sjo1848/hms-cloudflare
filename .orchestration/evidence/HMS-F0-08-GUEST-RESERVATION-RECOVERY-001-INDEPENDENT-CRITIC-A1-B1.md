# F0.8 Independent Critic — A1 + B1

Reviewer: Jason, fresh separate read-only subagent; GPT-6 Luna, Medium. The reviewer did not implement, did not participate in the prior QA/Pre-Critic, made no edits, and did not run tests.

Exact reviewed pair:

- Artifact A1: `298545b23e59f8aabfef5a766f76249ee71e856b`
- Orchestration Boundary B1: `5d6e9b37a58554a5b3d4e74bdf13ed7db7a09219`

## Verdict

`REWORK`

## Findings

- **HIGH — incomplete operation becomes undiscoverable.** `D1ReservationCreationRepository.listIncomplete()` excluded a `GUEST_CREATED` operation whenever a different confirmed booking existed for the same guest. Reception's explicit “Use saved guest” recovery path creates that different operation/token, leaving the original stage incomplete but absent from subsequent recovery lists. This contradicts the durable incomplete-operation contract; another operation must not silently complete, hide or mutate it.
- **MEDIUM — mobile width does not match contract.** The integrated browser script ran at 390×844, while the frozen F0.8 contract requires 375px. The browser assertion is real Worker/D1 but does not prove the specified width.

No architecture contradiction or ROADMAP_BLOCKER was found.

## Rework disposition

Routine technical rework is authorized under `.orchestration/contracts/HMS-F0-08-REPAIR-RECOVERY-LIST-375-001.md`. Keep the original stage discoverable until its own operation reaches `BOOKING_CREATED`; test separate-token reuse explicitly; change the integrated mobile viewport to 375px and rerun the exact interaction and persistence assertions. This finding does not authorize a new retention/cleanup policy or other product scope.
