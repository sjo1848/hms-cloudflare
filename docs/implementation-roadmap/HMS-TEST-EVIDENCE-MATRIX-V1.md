# HMS Cloudflare — Test / Evidence Matrix v1

This matrix specifies future evidence; it does not claim these checks have been run for this roadmap. Existing historical receipts are not current PASS evidence. “Integrated” means local Worker/API + D1 persisted assertions, not mocks.

| Increment | Unit/domain | API/RBAC/tenant | D1 / migration | Concurrency/idempotency | Browser / UX | Responsive/a11y | Build/budget / gate evidence |
|---|---|---|---|---|---|---|---|
| F0.1 | room dimension transition truth table | readiness/sellability scoped reads | schema compatibility + combinations | stale state prevents false READY | room/HK/reception semantic rendering | dimension labels/actions usable at widths | migration/schema diff + invariant evidence |
| F0.2 | command/event contracts | typed conflicts, tenant scope | event shape compatibility | exact winner, stale, ABA, no event on reject | errors/actions observable | focus-safe error surfaces | route uniqueness + audit matrix |
| F0.3 | deterministic legacy mapper | tenant-local report access | repeated synthetic rehearsal, counts/checksums/orphans | source changes abort; restart/idempotent | unresolved status visible to authorized operator | review/quarantine usable at narrow width | reconciliation manifest; Human data gate remains separate |
| F0.4 | effective-date interval | lifecycle authorization | exact old/new inventory claims | competing claim/booking change | reassignment preview/conflict/recovery | room selection & task usable | migration forward diff + event audit |
| F0.5 | cents/segment arithmetic | quote/command authorization | segment persistence and invoice reconciliation | stale rate/quote no partial commit | consequence/price shown before confirm | amount/reason controls accessible | type/build/budget if API/UI changes |
| F0.6 | bootstrap mapping basis | scoped status/read access | before/after exact amount+ledger, rerun/restart | concurrent booking mutation stops row | blocked/unresolved status visible | status/recovery usable | checksums/provenance; no live-data claim |
| F0.7 | settlement predicate | checkout command RBAC | booking/room/invoice atomic final state | payment/charge vs checkout race | actionable current-account conflict | error announced/focus retained | D1 transactional evidence |
| F0.8 | stage/recovery model | tenant-scoped token lookup | partial stage persistence and replay | simultaneous same/different payload | resume after booking failure/lost response | recovery path usable | migration and route contract review |
| F0.9 | charge arithmetic | charge capability/tenant | D11 invoice + event rollback | duplicate simultaneous and response-loss retry | authoritative account refresh | pending/error recovery accessible | executing-D1 audit-failure rollback |
| F0.10 | exact capability map | every protected read/write and downgrade | no data mutation on denial | stale capability invalidation | nav/action visibility vs direct route | keyboard and hidden/disabled reason | API contract/type checks; no client authority claim |
| F0.11 | cache invalidation rules | typed 409/read auth | authoritative reread persisted state | delayed/out-of-order requests | preserve filters, selected case, next task | mobile focus and scroll after refresh | runner cleanup and request trace |
| F0.12 | evidence manifest consistency | gate access scope | per-hotel/per-row summary | immutable input repeatability | links to all required flows | matrix completeness | reproducible commands, hashes, exact exits; Controller gate |
| A | route/context unit | capability routes | none expected | identity/hotel switch invalidation | deep link, refresh, Back/Forward | WIDE/COMPACT/NARROW/focus | type/build/budget/route uniqueness |
| B | queue ranking / next-case | board + command authorization | authoritative case read | stale row/request ordering | full arrival→stay→departure case operations | material actions, reduced height, keyboard | feature regressions and artifact evidence |
| C | validation/transitions | command scopes/errors | inventory/bookings/account state | stale/ABA, idempotent lifecycle | reservation/check-in/reassign/checkout integrated | actual task controls at each width | executing D1 + browser evidence |
| D | derived predicates | room/hold access | state dimensions + room-night reads | booking/HK race before action | room context → owning workflow | board/list/dialog interactions | no availability predicate divergence |
| E | case transitions/ranking | read/report/resolve capabilities | room/case/event/booking risk | duplicate open/stale resolve | report→resolve and HK task paths | next task and controls at widths | exact event counts + migration rehearsal |
| F-account | Booking Account/Folio cents at Booking/Stay grain | payment/charge scopes | invoice = payment-entry sum; charge reconciliation | retry/lost response/concurrent mutate | booking account→charge/payment→refresh; Guest navigates to a selected stay account | form/summary/mobile keyboard | D1 audit rollback + budget |
| F-cash | received-payment cash/non-cash/count/difference arithmetic only | close capability/tenant | closure rows vs received-payment watermark | concurrent payment/close + token retry | received payment→count→difference→close→history; optional separate Receivables navigation | count entry and sticky action | assert seeded pending/credit invoices affect none of cash received, non-cash received, payment count, expected/count cash or difference; cash ownership Human evidence + independent finance review |
| G | metric/admin domain tests | guest/user/network route matrix | bounded network stores/report query truth | no-op and downgrade semantics | all supported management flows | responsive module-specific actions | report exact cents/date and architecture fitness |
| H | cross-module invariants | denial at integrated boundaries | local Worker/D1 persisted journeys | delayed reads/concurrent workflows | A–G journeys with real APIs | WIDE 1440, COMPACT 1024, NARROW 390 plus reduced-height/focus | full regression, JS budgets, process cleanup, final external critic |

## Evidence quality rules

1. Every test row records exact command, fixture identity, environment, exit status and output/evidence location.
2. Mocks are labeled `MOCK`; local integrated evidence names Worker and D1 fixture; no claim of real-data cutover from synthetic rehearsal.
3. Browser evidence asserts behavior and persisted state. Screenshots illustrate states but do not replace assertions.
4. Failed, interrupted or infra-terminated evidence is `UNPROVEN`, not PASS. Attribute shared flakes with same-commit reproduction evidence and leave promotion gates explicit.
5. For every mutation assert both expected state and zero side effects on denial/conflict, including events/audit and related entities.
6. Runner PASS requires owned Worker/Vite/browser process cleanup verified after execution.

## Existing source-backed test/evidence candidates

`apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`; `apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts`; `apps/api/src/modules/bookings/d1-booking-repository.executing-d1.test.ts`; `apps/api/src/routes/front-desk-board.executing-d1.test.ts`; `apps/api/src/room-availability.test.ts`; scripts `scripts/cf-i03-regression.sh`, `scripts/cf-i04-regression.sh`, `scripts/cf-i05-regression.sh`, `scripts/cf-i06-regression.sh`, `scripts/cf-i07-regression.sh`, `scripts/cf-i08-regression.sh`, `scripts/cf-i09-local-backup-restore-rehearsal.sh`; migration tools `scripts/migration/test-rehearsal.sh`, `scripts/migration/rehearse.mjs`, `scripts/migration/reconcile.mjs`. These exact current files are candidate suites, not proof of every row and not asserted as freshly executed here; proposed future test files must be labeled `PROPOSED NEW SURFACE`.
