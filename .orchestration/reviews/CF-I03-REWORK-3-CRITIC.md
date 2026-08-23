# CF-I03 REWORK-3 — Independent Critic

Reviewed artifact: `86f4028df45d9d4b977b378d6f89d3c0b9bf35ed`
Branch: `runtime/cf-i03-rework-6`
Reviewer: ChatGPT External Independent Critic
Verdict: `REWORK`
Human Gate: `NONE`

## What is now correct

- `room_inventory_nights` is explicitly materialized with primary-key uniqueness on `(room_id, stay_date)`.
- Booking PATCH now orders the D1 batch as booking UPDATE -> conditional old-claim DELETE -> new-claim INSERT, so a claim uniqueness failure can roll the batch back.
- Local D1/API evidence covers ordinary overlap rejection, hold exclusion, cancellation release, failed-input preservation and half-open adjacency.
- `RUNTIME_CAPABILITY_FALLBACK` is recorded explicitly; no false multiagent claim is accepted.

## Blocking findings

### P1 — PATCH can return 200 after a concurrent availability invalidation without applying the requested mutation

`validateBookingReferences()` runs before the D1 batch. If the target room becomes invalid between that read and the batch (for example a hold is inserted on the target room/date range), the guarded UPDATE can affect zero rows without throwing. The subsequent conditional DELETE and claim INSERT statements can also become no-ops, the batch can complete successfully, and the route then reads and returns the unchanged booking with HTTP 200.

Required repair:
- inspect/assert the guarded booking UPDATE result inside the batch result; a zero-row update must produce typed `409 CONFLICT`;
- preserve the pre-existing booking and claims on that path;
- add a regression proving the zero-row/concurrent-invalidation path cannot return a false success.

### P1 — Required concurrency/regression tests are not persisted or repeatable

The approved Design Package explicitly states: `Concurrency/regression tests are required. Availability UI/API checks are not sufficient evidence by themselves.` The CF-I03 Task Contract likewise requires database constraint/atomicity regression tests and API/domain tests.

The current repository test suite has no booking/inventory D1/API regression test file. The documented manual local run in `docs/cf-i03-rework-3-evidence.md` is useful supplemental evidence but is not an executable regression suite and cannot prevent recurrence.

Required repair:
- persist an executable local D1/API regression harness or automated tests covering at minimum: overlapping create rollback, hold->booking and booking->hold exclusion, room/date PATCH claim replacement, failed PATCH preservation, cancellation release, half-open adjacency, and the zero-row concurrent-invalidation case above;
- make the relevant regression suite part of a reproducible validation command.

### P1 — Required `/bookings` UI/browser evidence is still missing

CF-I03 requires UI/browser evidence for booking creation, availability, detail/edit and observable loading/empty/validation/error states. The frontend currently has implementation only; no component/browser test artifact is persisted. `web:build` proves compilation, not the required surface behavior.

Required repair:
- add a bounded browser/component validation for `/bookings` that exercises the required CF-I03 surface without expanding into CF-I04;
- evidence must include creation using date-scoped availability, detail/edit, empty/loading/validation/error behavior, and backend rejection surfaced to the user.

### P2 — Claim-to-booking relational integrity is weaker than the approved D1 semantic map

`room_inventory_nights.booking_id` is `NOT NULL` but has no FK to `bookings(id)`, while the approved design says SQLite/D1 foreign keys are retained inside each database. The claim is semantically owned by a booking.

Required repair:
- add `FOREIGN KEY (booking_id) REFERENCES bookings(id)` (with delete behavior chosen deliberately), or document an explicit bounded design justification for omitting it and prove orphan claims cannot occur.

## Rework-budget diagnosis

The experimental automatic rework budget has already been exceeded. This does NOT create a Human Gate.

Diagnosis: `EXECUTION_DEFECT + EVIDENCE_DEFECT`.
- The Task Contract is sufficiently explicit; this is not `CONTRACT_DEFECT`.
- No strategic ambiguity, cost change, scope change or new material product decision exists.
- Runtime cannot expose true Specialists in this interactive adapter, so `RUNTIME_CAPABILITY_FALLBACK` remains legitimate, but it does not waive specialist-quality separation of responsibilities or evidence.

Authorized next approach: fresh bounded CF-I03 repair cycle under the same Task Contract, test-first. First persist the required regression/browser tests, then make only the implementation changes necessary to satisfy them, run full validation, publish a new immutable artifact, and stop at Independent Critic.

Do not advance to CF-I04. Do not self-PASS CF-I03.