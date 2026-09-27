# HMS-F0-01-ROOM-DIMENSIONS-001 — Pre-Critic Record

Status: F0.1 internal gate evidence; not an Independent Critic verdict.  
Sources: frozen Blueprint 001, Reconciliation 007 Amendment A, Final Disposition 008; F0.1 Task Contract.

## Review findings and disposition

- **Enum/model fidelity — PASS.** Uses `VACANT|OCCUPIED`, `READY|DIRTY|CLEANING`, `NONE|NON_BLOCKING|BLOCKING`, `IN_SERVICE|OUT_OF_ORDER`; occupancy derives from current CHECKED_IN assignment; maintenance impact derives from open cases; readiness is derived, never independently stored.
- **Legacy ambiguity — PASS after repair.** The forward migration leaves new columns NULL and preserves legacy `rooms.status`; legacy `MAINTENANCE` is unresolved unless an open BLOCKING case supports the old protective state. A NON_BLOCKING case cannot legitimize that legacy state. No case/history is synthesized. This is consistent with 008's rule to reconcile history where reliable and otherwise keep ambiguous records unresolved.
- **No false readiness — PASS.** Missing/invalid dimensions, more than one checked-in booking, scalar OCCUPIED without an active assignment, scalar non-OCCUPIED with an active assignment, unknown maintenance impact, and OUT_OF_ORDER all fail closed from READY.
- **Maintenance does not overwrite another dimension — PASS.** A synthetic executing-D1 case with OCCUPIED + READY + BLOCKING + IN_SERVICE remains represented as such; readiness is NOT_READY because occupied/blocking, not by rewriting either dimension.
- **Sellability claim — PASS WITH LIMITATION.** `date_range_sellability` is explicitly UNRESOLVED in this increment. `/rooms/available` still uses legacy selection rules and labels that result `LEGACY_FILTER_NOT_CANONICAL`; no claim is made that F0.1 has implemented the final range predicate. The shared interval predicate belongs to its authorized later F0 contract.
- **Security boundary — PASS.** New read projection uses the already-authoritative operational D1; no request parameter selects a database. Executing-D1 API coverage proves hotel selection, unknown-hotel denial, and role capability denial.
- **Compatibility — PASS.** Existing room response keys and scalar status remain; dimension fields are additive. `npm run check` passes all 26 files / 97 tests after the addition.
- **Scope — PASS.** No UI, mutation, lifecycle, Housekeeping command, billing, pricing, cutover, real data, or Blocks A–H change.

## Executed validation

- `npx vitest run apps/api/src/modules/room-state --maxWorkers=2` — 3 files / 6 tests PASS.
- `npm run check` — 26 files / 97 tests PASS.
- `npm run types:check` — PASS.
- `npm run wrangler:dry-run` — API and Web PASS; no deployment.
- `git diff --check` — PASS.

Read-only Contract Reviewer finding (Luna Medium): HIGH, legacy `MAINTENANCE` plus only `NON_BLOCKING` could otherwise produce READY. Repaired by requiring current BLOCKING evidence whenever legacy status is `MAINTENANCE`; deterministic executing-D1 regression added. All validation above was rerun after the repair. Finding resolved; reviewer did not issue an Independent Critic verdict.

The source limitation remains material for F0.3: legacy `MAINTENANCE` may have masked prior Housekeeping state and event rows are not complete proof. Synthetic mapping/reconciliation must preserve unresolved classification; no live records were inspected or adjudicated.

Internal Contract Reviewer and separate Independent Critic verdicts are tracked separately; neither is replaced by this Pre-Critic record.
