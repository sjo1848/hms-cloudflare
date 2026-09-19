# REWORK V5 CLOSURE — CF-OPS-FLOW-DEFINITION-001

Status: `CLOSED FOR PRE-CRITIC V6`

Source critic: `CF-OPS-FLOW-DEFINITION-001-CRITIC-V5.md`.

## F1 hidden repricing — CLOSED
D9 now defines a closed pricing boundary. Reservation room/date changes, reassignment, extension and extra charge are priced. Guest/name/notes-only, check-in, cancellation, no-show, late arrival and checkout preserve stored booking total.

## D10 time hardening — CLOSED
Late-arrival ETA uses explicit-offset RFC3339/ISO-8601, parsed as an absolute instant and converted to hotel IANA timezone for stay-date validation. Timezone-less ETA is rejected.

## D11 reconciliation edge — CLOSED BEFORE REPUBLICATION
A pre-publication accounting sweep found that current target schema assumes prior paid amount cannot exceed invoice amount, while an authorized priced mutation can legitimately lower the later authoritative total.

D11 now owns one reconciliation contract for every priced command, including derived Billing values, status/timestamp outcomes, preservation of payment history, forward schema compatibility, and fail-closed behavior when existing invoice state is not eligible for priced mutation.

Historical `0010_billing.sql` remains immutable. The required schema correction is a forward migration.

D11 is propagated through the departure register, master, domain model, reassignment, extension, financial/Billing summaries, API map, E2E matrix, transition matrix, technical prerequisites, sequencing, Reception context, decision and operational invariant authority.

## Scope isolation
The analysis branch remains documentation/orchestration only relative to accepted staging. No runtime implementation, schema implementation, CI budget, deployment, staging, production or main change is authorized here.

## Result
Critic V5 blocker and all repair-pass findings D9-D11 are definition-closed. Next action: Pre-Critic V6. Implementation remains locked.