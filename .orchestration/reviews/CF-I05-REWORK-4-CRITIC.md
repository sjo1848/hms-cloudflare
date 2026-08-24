# CF-I05 REWORK-4 — External Independent Critic

Reviewed artifact: `6837a61a7b27e5ae0b909d1a436ddff10e0e1b14`  
Reviewer: ChatGPT External Independent Critic  
Verdict: `REWORK`  
Human Gate: `NONE`  
Diagnosis: `ENUM_REPRESENTATION_PARITY_DEFECT + CANONICAL_STATE_CONVERGENCE_DEFECT`

## Summary

REWORK-4 successfully closes the prior operational-order findings. The target now ports the source housekeeping queue ranking, proves a HIGH maintenance task (`Room 904`) outranks numerically earlier ordinary DIRTY `Room 901`, synthesizes an orphan departure (`Room 906`) from `departures_today`, blocks invalid mutations on that synthetic task, and uses a known expected source-priority identity rather than deriving the expectation from the target itself.

CF-I05 still cannot PASS for two bounded reasons. First, the queue's blocked-departure rule compares the source representation `CheckedIn` while the target D1/API emits `CHECKED_IN`; therefore an eligible board room with a checked-in departure can be mis-ranked. Second, the immutable artifact does not contain converged canonical state: its `.orchestration/STATUS.json` still describes REWORK-4 as pending, points at `97cd553...`, has `external_review.required=false`, and `resume_authorized=true`. That directly contradicts `INV-STATE-001` and the claimed Independent Critic boundary.

No Human Gate is required. CF-I06 remains unauthorized until a fresh CF-I05 artifact passes Independent Critic.

## Findings accepted in REWORK-4

- `buildHousekeepingQueue` matches the source maintenance-priority / turnover / blocked / state ranking structure and numeric room tie-break.
- Browser evidence independently asserts `Room 904` must precede `Room 901` and `Siguiente tarea` opens `Room 904` at every contracted width.
- Orphan departure `Room 906` is absent from eligible board rooms, present in `departures_today`, synthesized into the operational queue, visibly blocked, and exposes no cleaning or maintenance mutation.
- Mobile focused-task open/focus/close behavior remains preserved.
- Draft isolation / selected-room clear evidence remains present.
- Previously accepted stale/concurrent cleaning, exact maintenance-case ABA correlation, legacy actor ownership, RBAC, tenant routing and audit behavior remain intact.
- No CF-I06, production, remote-D1, real-data or paid-resource scope drift was found.

## Blocking finding 1 — Booking-status representation breaks blocked ranking parity

The accepted source queue marks a board item blocked when its departure has `booking_status === "CheckedIn"`.

The target D1 lifecycle schema stores statuses as uppercase snake-case (`CHECKED_IN`), and the target housekeeping API returns that raw booking status in `departures_today` / room departure context. However `buildHousekeepingQueue` currently checks:

`departure?.booking_status === "CheckedIn"`

Therefore the blocked condition is false for target `CHECKED_IN` data.

This is not just cosmetic representation. In the source ordering, a blocked eligible task has rank 4. A target `Available` room with a same-day checked-in departure can incorrectly fall to ordinary Available rank 8. The current orphan fixture does not catch this because orphan tasks force `isBlocked=true` independently of booking-status representation.

Required repair:
- define one canonical semantic booking-status normalization at the boundary used by queue logic, or compare against the target canonical representation consistently;
- preserve source semantics for at least Confirmed / Cancelled / CheckedIn / CheckedOut representations used by the migrated target;
- add deterministic queue/browser or unit evidence with an **eligible** board room whose departure is target `CHECKED_IN`, proving it receives the source blocked rank and ordering independently of orphan behavior;
- ensure source-facing UI labels may differ in presentation, but business predicates cannot depend on mismatched serialized enum spelling.

Reusable root cause: enum/value representation changed during migration but product rules were copied using source display/serialization literals. Promote this into the invariant registry before the next publication.

### Non-blocking carry-forward — source NoShow filtering

The source Housekeeping board excludes both Cancelled and NoShow departures. The current target booking schema does not represent NoShow at all, so this exact source state cannot currently enter CF-I05. Do not silently forget it: carry it into the booking-status/data-migration parity work (at latest CF-I09) so imported NoShow rows cannot become housekeeping work. This does not independently block CF-I05 beyond the enum-normalization defect above.

## Blocking finding 2 — Immutable artifact violates INV-STATE-001

The remote artifact is `6837a61a7b27e5ae0b909d1a436ddff10e0e1b14`, but its committed `.orchestration/STATUS.json` still contains the previous REWORK-4 authorization state:

- `last_completed_head = 97cd5536efa632bb30536fdfd106b69ee14687fd`;
- `next_action = CF_I05_AUTONOMOUS_REWORK_4_...`;
- `external_review.required = false`;
- `resume_authorized = true`.

Its invariant evidence also uses `Artifact candidate: PENDING_IMMUTABLE_HEAD` rather than the exact reviewed artifact.

The user's local statement that the canonical state had been reconstructed is not enough; repository canonical state controls execution. The exact remote artifact must contain (or be followed by a clearly defined canonical publication commit that the review boundary explicitly identifies) converged artifact identity, evidence and review-boundary flags.

Required repair:
- publish the next fresh immutable artifact with exact full SHA persisted in canonical STATE/STATUS/evidence according to the repository's publication protocol;
- `external_review.required=true` and `resume_authorized=false` at the external boundary;
- no `PENDING_IMMUTABLE_HEAD` or previous-artifact head may remain in evidence claimed as PASS;
- verify remote `main`, STATUS, STATE, evidence and artifact identity all converge before stopping.

## Required next action

Under `PM-AUTONOMY-001`, execute one bounded autonomous REWORK-5:

1. repair booking-status semantic normalization for housekeeping queue predicates;
2. add a deterministic eligible-room `CHECKED_IN` blocked-ranking regression whose expected rank/order is source-derived;
3. promote the reusable enum-representation rule into `.orchestration/INVARIANTS.md` and the Pre-Critic parity/evidence sweep;
4. preserve all accepted REWORK-4 ranking/orphan/mobile/domain/security evidence;
5. record the source NoShow exclusion as carry-forward parity debt for migration/status work, without expanding CF-I05 into a new lifecycle feature;
6. run complete CF-I03/CF-I04/CF-I05 API+D1/browser regressions, tests, build, types, Wrangler dry-run and diff checks;
7. pass all applicable invariants including `INV-ORDER-001`, the new enum-representation invariant and `INV-STATE-001`;
8. publish one fresh immutable CF-I05 artifact with canonical state/evidence converged on the exact artifact and `external_review.required=true`, `resume_authorized=false`;
9. stop for External Independent Critic.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.
