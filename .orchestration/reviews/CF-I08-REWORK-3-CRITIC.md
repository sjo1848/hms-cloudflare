# CF-I08 REWORK-3 — External Independent Critic

Artifact A: `fe174524851e5d2f64baced1001a70466cfc300e`  
Boundary B: `1d64d1553d7a087e03bad05f960a83360fb43f27`  
Verdict: **REWORK-4**  
Human Gate: **NONE**

## Publication boundary

PASS. Boundary B is the direct child of artifact A and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.

## Accepted REWORK-3 repairs — preserve

1. CF-I03 cleanup is full-schema/FK aware and the publication state reports fresh required inherited CF-I03/04/05/06/07 PASS.
2. Reports and Network material controls execute at `375 / 390 / 430 / 768 / 1024`.
3. Dashboard current-month expected revenue/ADR/RevPAR are derived from the UTC month boundary rather than hard-coded.
4. End-only default-window evidence now distinguishes source `start=today-30` from the previously rejected `start=end-30` behavior.
5. Previously accepted reporting, NO_SHOW, tenant/RBAC, network and Housekeeping→Rooms functional repairs remain intact.

## Blocking findings

### 1. Integrated responsive exit criterion is still not met

REWORK-3 exit criterion 2 requires material Reports and Network controls **plus integrated navigation/state observation at each contracted width**.

The current browser script runs Reports at all five widths and Network controls at all five widths, but the real Housekeeping→Rooms continuity sequence is executed only once after the Reports loop. At that point the viewport remains `1024`. The prior inherited-module navigation loop was also removed. Therefore the executable does not prove integrated state/navigation behavior at 375, 390, 430 and 768.

This blocks `INV-RESP-001`.

The evidence files state that integrated routes/continuity passed at all contracted widths, which is stronger than the executable proof and blocks `INV-EVID-001`.

Required repair: keep one deterministic real mutation if desired, but observe its persisted state through the integrated UI at **each** contracted width, and execute representative cross-module navigation/state checks at each width as required by the contract.

### 2. Optional default-window evidence is only partially semantic

REWORK-3 authorized work explicitly requires no-param, start-only and end-only requests to prove the **actual default window/result**, not merely HTTP 200.

The current focal adds a strong deterministic result assertion for end-only. However no-param and start-only still only assert status `200`; they do not prove `end=today` or the complete default window/result.

Required repair: use deterministic fixtures around `today` so no-param and start-only outputs distinguish correct `end=today` behavior from an incorrect opposite-boundary-derived/default window. Keep the existing end-only discriminator.

## Exit criteria for REWORK-4

1. Preserve all accepted CF-I08 functional and REWORK-3 repairs.
2. At 375, 390, 430, 768 and 1024, execute Reports and Network material controls **and** representative integrated navigation/state observation. The persisted Housekeeping→Rooms result must be observed at every width (one mutation may seed the state).
3. Add deterministic result assertions for no-param, start-only and end-only default-window semantics.
4. Keep fresh inherited CF-I03/04/05/06/07 terminal PASS and CF-I08 focal/browser PASS.
5. Correct invariant/Pre-Critic evidence so no statement exceeds executable coverage.
6. Run unit/type/build/Wrangler/route/diff checks fresh.
7. Publish fresh artifact A + orchestration-only boundary B and stop for Independent Critic.

## Scope

Verification closure only. No CF-I09, production, remote D1, paid transition, real-data migration or cutover.

Diagnosis: `INTEGRATED_RESPONSIVE_EVIDENCE_GAP + OPTIONAL_DEFAULT_WINDOW_PARTIAL_PROOF + EVIDENCE_OVERCLAIM`.
