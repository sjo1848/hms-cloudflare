# PRE-CRITIC V4 — CF-OPS-FLOW-DEFINITION-001

Verdict: `PASS FOR IMMUTABLE FINAL REVIEW`
Reviewed predecessor: `23e358adb2047f54f9b09e99da97f9e1bcba6542`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`
Accepted source reference: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

This is an admission gate, not implementation authorization.

## Prior-review closure

A/A2/A3 each failed for real reasons and remain historical evidence. V4 closes their findings rather than suppressing them:
- source timing/pricing/settlement parity repaired;
- maintenance RBAC made binding;
- API ownership and legacy compatibility fixed;
- admin-only checkout override fixed;
- room-scoped `maintenance.read` route added;
- material evidence payloads made server-contract requirements;
- intentional target departures registered as a closed set;
- overrun reassignment guard explicitly authorized as target correction;
- guest+reservation endpoint ambiguity removed.

## Canonical authority set

Final review must treat these as one contract:
- `00-master-definition.md`;
- `05-maintenance-data-rbac.md`;
- `16-target-transition-matrix.md`;
- `18-end-to-end-scope-matrix.md`;
- `19-api-command-contract-map.md`;
- `20-intentional-target-departures.md`;
- `.orchestration/OPERATIONAL-INVARIANTS.md`;
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`.

## End-to-end scope — PASS

The package defines technical prerequisites and every operator path in scope: existing/new guest reservation, formal check-in, cancellation, no-show, late arrival, reassignment, non-blocking/blocking/vacant maintenance, Housekeeping turnover, checkout, extension, extra-charge/invoice reconciliation, server-owned front-desk board, contextual freshness/navigation, next-case continuation, audit/events, API/OpenAPI/RBAC/departure conformance and synthetic shift acceptance.

Each material flow defines success and negative/concurrency consequences. Cross-module effects and responsive acceptance are required.

## API/evidence contracts — PASS

Canonical routes are fixed. Material evidence is server-bound:
- cancellation/no-show `terminal_reason` min 6;
- active reassignment `reason` min 6;
- escalation `escalation_note` min 6;
- resolution `resolution_note` min 6.

Maintenance read has room-scoped canonical GET requiring `maintenance.read`. No-case returns null. Generic PATCH/direct status cannot bypass lifecycle/maintenance commands. OpenAPI/client update is required before browser acceptance.

## Authorization — PASS

Admin/ops/housekeeping have maintenance read-report-resolve; receptionist read-report only; saas_admin none. Report can open/escalate; resolve closes. Cleaning remains separately governed. Checkout pending-balance override remains admin-only. Guest+booking atomic create requires guest+booking write capabilities.

## Source parity and departures — PASS

Source behavior is default. `20-intentional-target-departures.md` is closed-set authorization for D1-D8. Notably:
- no-show remains eligible from arrival date;
- no new check-in/cancellation cutoff exists;
- source current-room repricing/settlement semantics remain;
- overrun reassignment guard is explicitly D2 rather than mislabelled parity;
- explicit no-show/extend commands, atomic guest+booking, occupied maintenance and invoice consistency are registered target hardenings.

Unlisted source divergence is a blocker.

## Domain/Billing/concurrency — PASS

Physical room state, availability and readiness remain distinct. Occupancy exit cannot skip turnover. Remaining-night reassignment preserves history. Extension and reassignment reconcile inventory/Billing atomically. Payment history remains immutable. Stale/lost races create no partial mutation or success event.

## Scope isolation — PASS

Branch comparison to staging changes only `docs/operational-flows/**` and `.orchestration/**`; no runtime, migration, CI budget, deployment, production or real-data mutation occurs in definition phase.

## Human Gates — PASS

No Human Gate remains open for the defined source-parity plus registered-hardening wave. Deferred commercial/product departures are explicitly outside scope.

## Admission result

No known unresolved scope, route, RBAC, evidence, parity, financial, concurrency or cross-module ambiguity blocks immutable final review. Publish this commit as Artifact A4, publish an orchestration-only one-commit Boundary B4 pointing exactly to A4, then run final adversarial Critic V4. Only that critic may close the definition phase.