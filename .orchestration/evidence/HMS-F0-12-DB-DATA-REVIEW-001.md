# F0.12 Read-only DB/Data Review

Reviewer: Raman, separate GPT-6 Luna Medium, read-only. No files changed; no tests/migrations run by reviewer; no external or real data accessed. This review is not an Independent Critic or aggregate gate approval.

## Initial findings and disposition

Raman checked `.orchestration/evidence/HMS-F0-12-CUTOVER-BOOTSTRAP-CROSSWALK.md` against the frozen F0.12 contract/plans and `legacy-cutover.test.ts`, `legacy-cutover.executing-d1.test.ts`, and `active-stay-pricing-bootstrap.executing-d1.test.ts`.

| Finding | Repair / evidence limitation preserved |
|---|---|
| Room-state edge cases were described too broadly | Crosswalk now says the enumerated synthetic mapper cases only, not the entire possible source/legacy corpus. |
| Fresh two-run rehearsal receipt was absent at first review | Two separate clean F0.3 D1 test invocations are now saved at `f0-12-runs/f03-clean-rehearsal-1.log` and `f03-clean-rehearsal-2.log`; each shows 2/2 PASS. The same four pinned schema/migration/source/report digest assertions are executed by both runs. The log itself does not print the digest tuple; the equality is established by the common assertions in the executing-D1 test, not a textual log-to-log digest comparison. |
| F0.3 tenant statement implied checkpoint/routing isolation | Narrowed to independent minimal D1 mapper/result separation; expressly does not claim F0.3 checkpoint isolation or production routing/auth. F0.6 separately supports synthetic bootstrap checkpoint/segment separation. |
| Provenance mixed input evidence with emitted audit events | Split mapper validation of source-event provenance, F0.3 unchanged canonical event tables/no fabricated cutover audit, and F0.6 actor/hotel/request metadata on generated pricing segments. No generic audit-event guarantee is claimed. |
| F0.6 full-paid/overpaid cases implied activation preservation | Narrowed: they are manifest classification cases; exact post-activation preservation is asserted for partial-paid `stay-a` only. VOIDED and account mismatch are held classifications, not separate activation attempts. |
| Date/rate-change coverage overstated breadth | Narrowed to named synthetic interval/effective-date and source-backed segment/digest cases; no full calendar or room×rate matrix claim. |
| Interruption/restart implied process kill during canonical activation | Narrowed to shadow-stage rollback/restart and atomic activation write-failure rollback; no process-kill/restart during canonical activation is claimed. |

## Follow-up

After corrections and creation of the two rehearsal receipts, Raman re-read the crosswalk and receipts. The six noted areas are accurately scoped and linked. The only qualification retained is that digest equality is established through identical fixed digest assertions in each fresh passing run; those digest values are not printed into the log. Raman's follow-up did not issue an aggregate or Development Gate PASS. Full exchanged assessment is preserved in the agent's read-only result; no reviewer claim beyond this bounded scope is made.

## Scope

All classifications refer to isolated synthetic fixtures and the exact cited tests. No result establishes real-hotel state, customer-data readiness, production routing security, live cutover, or live pricing bootstrap.
