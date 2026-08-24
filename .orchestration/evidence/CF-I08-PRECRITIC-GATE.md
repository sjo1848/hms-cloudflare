# CF-I08 Pre-Critic Gate

| Gate | Result | Evidence |
|---|---|---|
| Contract and scope exact | PASS | `.orchestration/contracts/CF-I08.md`; no CF-I09 or production scope. |
| Source semantics matrix | PASS | `docs/cf-i08-analytics-reporting-parity.md`; formulas/date/state/order/zero behavior are explicit. |
| Backend authority and RBAC | PASS | Central capabilities; hotel reports use membership D1; network uses server-side configured fan-out; focal allow/deny matrix passes. |
| Financial/report integrity | PASS | Exact cents, cancelled exclusion, zero-safe formulas, invalid-range rejection and deterministic per-hotel totals are asserted. |
| Multi-hotel isolation | PASS | Two real local D1 bindings aggregate to exact totals/ranking; unknown binding returns truthful 503; client cannot choose binding. |
| Responsive/integrated UX | PASS | Browser runner asserts Reports/Network controls and navigation through bookings, rooms, guests, housekeeping and users at all contracted widths. |
| Static/build/route checks | PASS | Typecheck, 17-test check, web build, route uniqueness and Wrangler dry-run pass; fresh inherited CF-I03/04/05/06/07 focal/browser regressions pass. |
| Independent review boundary | READY | Publish artifact A plus orchestration-only B; Codex does not self-PASS. |

Required stop: publish one substantive artifact and one orchestration-only boundary, then await Independent Critic. Do not begin CF-I09.
