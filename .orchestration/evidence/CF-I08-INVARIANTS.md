# CF-I08 Invariant Evidence

Artifact scope: analytics KPIs, revenue/occupancy reports, authoritative multi-hotel aggregation, Reports/Network UX and integrated responsive navigation. No CF-I09, migration, production or paid scope.

| Invariant | Result | Evidence |
|---|---|---|
| INV-MONEY-001 | PASS | Focal fixtures assert exact integer-cent revenue `12345`, ADR `6173` and RevPAR `206`; no floating-point API fields are used. |
| INV-TENANT-001 | PASS | Hotel reports route through the selected active membership D1; network fan-out uses server-side configured bindings only; tenant admin network request is denied. |
| INV-RBAC-001 | PASS | Admin/ops report reads pass, housekeeping report read returns capability denial, and network KPIs require `saas.hotels.read`. |
| INV-PARITY-001 | PASS | `docs/cf-i08-analytics-reporting-parity.md` maps source routes, date/state inclusion, formulas, ordering and zero behavior. |
| INV-ORDER-001 | PASS | Revenue rows order by date; network rows are independently asserted as Hotel B then Hotel A by descending revenue. |
| INV-RESP-001 | PASS | Playwright runs Reports, Network and integrated module navigation at 375/390/430/768/1024 with overflow assertions. |
| INV-EVID-001 | PASS | Executable focal/browser runners, source matrix, evidence files and committed screenshot match the claims. |
| INV-STATE-001 | PASS | Publication uses substantive artifact A followed by orchestration-only boundary B. |
| INV-SCOPE-001 | PASS | No CF-I09 migration/readiness, production, remote D1, paid resource, real-data or cutover action. |

## Executed checks

- `scripts/cf-i08-regression.sh`: PASS; deterministic two-hotel D1/API, zero range, invalid range, cancellation exclusion, RBAC, tenant isolation, ranking and unavailable binding.
- `scripts/cf-i08-browser-regression.sh`: PASS; Reports/Network/integrated module navigation at all contracted widths and housekeeping denial.
- `npm run typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run check`: PASS (17 unit tests).
- `npm run wrangler:dry-run`: PASS for API and web Workers.
- Fresh inherited CF-I03/04: PASS; CF-I05: PASS; CF-I06: PASS; CF-I07 focal and browser: PASS; no owned Worker/Vite process remains after the successful runners.
