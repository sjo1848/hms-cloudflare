# Blueprint → Block Traceability Matrix v1

Authority: Blueprint 001 + Reconciliation 007 + Final Disposition 008. Categories below are semantically grouped; contract-level requirements are further enumerated in the F0 and A–H contracts. No item is authorization to implement.

| Frozen requirement family | Primary owner | Dependencies / consumers | Acceptance evidence |
|---|---|---|---|
| Separate room Occupancy, Housekeeping, Maintenance Impact, Service State | F0.1 | F0.2, D, E, B, C | Dimensional transition matrix; legacy mapping and contradiction fixtures |
| Derived Readiness distinct from physical state | F0.1 | D, E, B, C | Readiness truth table, blocking/advisory and occupied cases |
| Date-range Sellability; holds and room-night ownership | F0.1 | F0.4, C, D, B | Interval overlap/hold API+D1 tests; preview/mutation parity |
| Safe legacy room-state mapping and no false READY | F0.3 | F0.1; all room consumers | Rehearsal, reconciliation counts, quarantine report, restart proof |
| Remaining-night reassignment interval and truthful history | F0.4 | B, C, D | Local-date/checkout boundary, exact claim set and history assertions |
| Segmented non-retroactive pricing | F0.5 | F0.6, C, F | Per-night segment arithmetic, repricing/extra preservation, D11 invariants |
| Active-stay bootstrap without changing historical totals/ledger | F0.6 | F0.5, C, F | Before/after exact-cent/ledger equality, provenance, rerun/restart |
| Current-account settlement guard | F0.7 | C, F | concurrent checkout vs payment/charge, exact all-or-none state |
| Guest + reservation recoverable staging | F0.8 | B, C | lost-response/failure at each stage, same-token replay and resume |
| Extra charge idempotency and D11 reconciliation | F0.9 | F, C | simultaneous replay, audit-failure rollback, exact charge/event/invoice |
| Server-owned capabilities; no client authority | F0.10 | A–G | role parity, direct API denial, downgrade same-subject before/after |
| Authoritative refresh and preserved task context | F0.11 | A–H | delayed fetch, 409, success refresh, Back/Forward/context browser proof |
| Aggregate Foundation readiness/evidence | F0.12 | A–H | evidence manifest, commit/test provenance, per-row/per-hotel unresolved gate |
| System shell, module separation, hotel/user context | A | B–G | route/deep-link/capability/responsive/accessibility suite |
| Reception case queue, booking/stay transactional workspace | B | A; C–F | known-priority fixture, case continuity and next-case flow |
| Reservation create/edit/availability/selectors | C | A–D,F0.8 | reservation validation, inventory conflict, guest recovery E2E |
| Guided check-in/readiness/blocker/advisory | C (entry B) | A,B,D,E,F0.1 | Worker/D1 check-in, blocker/advisory and refresh evidence |
| Reassignment/check-out/extension supported lifecycle | C | B,D,E,F0.4–.7 | command boundaries and D1 all-or-none evidence; unsupported extensions remain gaps |
| Room board, state dimensions, holds, occupant navigation | D | A,F0.1–.4,E | dimensional room scenarios, interval sellability and stale conflict |
| Housekeeping priority/task progression and maintenance impact/history | E | A,B,D,F0.1–.3 | deterministic ranking, lifecycle/event, tenant/RBAC browser + D1 |
| Booking Account/Folio, charges, payments, balances/credit (grain: Booking/Stay) | F-account | B,C,F0.5–.9 | ledger/invoice invariant, idempotent replay, exact-cent UI/API/D1 |
| Cash received summary/close/handoff/history (Receivables excluded) | F-cash | F0.9–.11; cash Human decision | ownership evidence; reconcile only received cash/non-cash payments; prove pending/credit receivables change none of Cash totals/count/difference; retry/concurrency |
| Guests directory/detail and booking relationships | G | A,B,C,F0.10 | guest search/context/tenant tests |
| Reports: date/range, revenue/occupancy/alerts semantics | G | A,F0.10/.11,F-account | independent D1 fixtures, empty range, integer-cent and date tests |
| Users/hotel administration and RBAC | G | A,F0.10 | canonical capability parity, denied write/no-op audit/downgrade |
| Network/SaaS surfaces separated from hotel operations | G | A,F0.10 | allow-list aggregation and unavailable-store truthfulness |
| Cross-module operational journeys and responsive/a11y | H | A–G | integrated Worker/D1 journeys at WIDE/COMPACT/NARROW; keyboard/focus/continuity |

## Ownership rule

Each row has one primary contract owner. Dependencies/consumers are listed separately and may consume behavior but cannot redefine it. In particular: F0.1 owns sellability semantics; F0.4 implements the remaining-night lifecycle interval using those semantics. F0 owns foundational semantics; B owns case-context orchestration; C owns lifecycle commands; D/E are read/task workspaces over shared room truth; F-account owns per-Booking/Stay account and Receivables presentation, F-cash owns received-payment reconciliation only; neither creates a second ledger. H proves integration and does not absorb missing domain contracts.

## Scope holes intentionally not papered over

Late arrival, no-show, cancellation, extension, guest merge, maintenance escalation and any settlement exception are included only to the extent frozen source/API inspection demonstrates a concrete capability and matching semantics. The catalog/open-decision file distinguishes partial, backend-only and uncertain cases rather than assigning an invented owner behavior.
