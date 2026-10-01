# Block E Critic Repair — Invariant Map

All registry entries keep their parent Block E applicability (`HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-INVARIANTS.md`). This bounded repair has the following acceptance mapping before code:

| Invariant | Repair applicability / acceptance | Required evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES — legacy concurrent loser cannot leave a case or room mutation after 409. | Executing-D1 race, exact status, case identity/count, room state/version, event count. |
| INV-AUDIT-001 | APPLIES — one winning recovery creates exactly one attributed event; loser none. | D1 event row tied to winning case, actor/hotel/request, one event at room version. |
| INV-DOMAIN-001 | APPLIES — only existing legacy resolve and escalate commands are exposed. | UI request to existing endpoint; no generic route/schema; denied/invalid transitions. |
| INV-TENANT-001 | APPLIES — added latest resolved case remains selected-hotel scoped. | Existing two-D1 CF-I05 isolation assertions; board facts do not cross tenants. |
| INV-RBAC-001 | APPLIES — escalation remains server-capability guarded; UI affordance follows existing capability contract. | Existing API denial plus UI access/capability behavior; no frontend permission authority. |
| INV-PARITY-001 | APPLIES — latest resolved facts and escalation preserve existing accepted case semantics. | D1/API and browser checks against exact existing case/event values. |
| INV-ENUM-001 | APPLIES — only canonical case OPEN/RESOLVED and NON_BLOCKING/BLOCKING values drive affordance. | Positive and negative browser/API assertions. |
| INV-UX-001 | APPLIES — case history stays available after resolution; escalation is a focused contextual task action. | Visible resolved timeline and focused escalation result/error. |
| INV-ORDER-001 | APPLIES — WIDE contract viewport does not alter queue ordering. | 1280×900 browser exact priority/queue assertion. |
| INV-RESP-001 | APPLIES — new task control remains reachable and usable on all contracted viewports. | Real UI control at 1280×900, 900×700, 390×844, 320×700, 1280×600, 844×390; keyboard/focus. |
| INV-EVID-001 | APPLIES — separate API/D1/UI proof; no screenshot substitution. | Contract results record and actual assertions. |
| INV-LEGACY-001 | APPLIES — legacy recovery remains exact, attributed and idempotent under race. | Existing legacy success + concurrent loser no-drift regression. |
| INV-STATE-001 | APPLIES — replacement A → B → fresh critic → final canonical reconciliation. | Exact SHAs and ancestry, exact-pair critic record, final state dispatch fields. |
| INV-CF-I07-004 | APPLIES — integrated runners terminate only owned local processes. | API and browser runner cleanup checks. |
| INV-CF-I08-004 | APPLIES — not changed by repair; retain target booking enum regression. | Parent CF-I05 evidence rerun. |
| INV-SCOPE-001 | APPLIES — only bounded Housekeeping API/UI/i18n/test/evidence files. | Diff allowlist and forbidden-surface audit. |
| INV-MONEY-001 | N/A — no financial facts or mutation. | Parent Block E classification. |
| INV-CF-I07-001 | N/A — no protected audit/admin/network route. | Parent Block E classification. |
| INV-CF-I07-002 | N/A — no role/plan mutation. | Parent Block E classification. |
| INV-CF-I07-003 | N/A — no role downgrade. | Parent Block E classification. |
| INV-CF-I08-001 | N/A — no analytics arithmetic. | Parent Block E classification. |
| INV-CF-I08-002 | N/A — no network aggregation. | Parent Block E classification. |
| INV-CF-I08-003 | N/A — no reporting date predicate. | Parent Block E classification. |
| INV-CF-I08-005 | N/A — no reporting date default. | Parent Block E classification. |

No code change is admitted until this map and the companion repair Pre-Critic are committed.

## Final evidence status (before replacement Artifact A)

All APPLIES rows pass; N/A rows retain their parent disposition. `npm run test:cf-i05` exercises the concurrent legacy exact winner and one-event/no-drift assertion as well as the existing same-case concurrency and stale/ABA proofs. `npm run test:cf-i05-browser` proves latest-resolved-case history, focused escalation note validation/success/authoritative refresh, and WIDE 1280×900 plus every responsive viewport. Full automated validation is recorded in `.orchestration/evidence/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001-RESULTS.md`. No applicable row remains unproven; replacement Artifact A may be frozen.
