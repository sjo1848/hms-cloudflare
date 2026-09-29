# Pre-Critic — Housekeeping Refresh Continuity Repair

Task Contract: `.orchestration/contracts/HMS-F0-11-HOUSEKEEPING-REFRESH-CONTINUITY-002.md`

- PASS: source inspection maps the browser-reproduced scroll loss to HousekeepingPage hiding all workspace content whenever `loading` is true.
- PASS: a loaded board exists separately from the in-flight loading flag (`boardDate`); keeping the old task rendered until a read resolves does not claim it is refreshed because the existing loading status and failure alert remain visible.
- PASS: while the loaded task remains rendered, all mutating and task navigation controls must be disabled during `loading`/`actionBusy`; no second write can use stale state.
- PASS: no API, data, transition, tenant, financial, authorization, or maintenance behavior changes are needed.
- PASS: the deterministic mock browser reproduces the exact `scrollY: 600 → 0` failure, then will assert retention during refresh and known follow-on task identity. Integrated Worker/D1 regression remains part of the final suite.

`PRE-IMPLEMENTATION GATE: PASS` for the minimal HousekeepingPage render/disable repair in the frozen contract. This admission is not the final Pre-Critic or an Independent Critic verdict.
