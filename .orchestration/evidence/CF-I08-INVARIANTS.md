# CF-I08 REWORK-2 invariant evidence

Artifact scope: source-semantic analytics/reporting, `NO_SHOW`-safe local schema, network aggregation, Reports/Network UX and integrated responsive evidence. No CF-I09, production, paid or real-data scope.

| Invariant | Result | Evidence |
|---|---|---|
| INV-MONEY-001 | PASS | Revenue/ADR/RevPAR remain integer cents; focal source-derived fixture asserts `12345` and zero-safe denominators. |
| INV-TENANT-001 | PASS | Membership-selected operational D1; direct Hotel-A identity with Hotel-B selection returns `403`; network binding is server allow-list only. |
| INV-RBAC-001 | PASS | Fresh CF-I07 regression PASS; admin/ops report reads pass; housekeeping Reports denial is browser-visible; network capability is distinct. |
| INV-PARITY-001 | PASS | Source-to-target matrix maps exact dashboard, date, state, occupancy, formula and network semantics; focal fixture includes `NO_SHOW`. |
| INV-ORDER-001 | PASS | Network fixture independently asserts Hotel B then Hotel A from known revenues; rows are sorted by authoritative revenue, not target-self expected order. |
| INV-ENUM-001 | PASS | `NO_SHOW` is an explicit target schema value and report predicates use semantic `CANCELLED`/`NO_SHOW` exclusion plus `CONFIRMED`/`CHECKED_IN` occupancy inclusion. |
| INV-RESP-001 | PASS | Fresh CF-I08 browser runner passes Reports/Network material controls and integrated navigation at 375/390/430/768/1024. |
| INV-EVID-001 | PASS | Focal terminal marker `CF-I08 analytics/reports/multi-hotel D1/API regression PASS`; browser terminal marker `CF-I08 responsive/integrated browser regression PASS`; source matrix and screenshot committed. |
| INV-STATE-001 | PASS | This file and gate are included in substantive artifact A; publication will create orchestration-only boundary B with exact A SHA. |
| INV-SCOPE-001 | PASS | No CF-I09/import rehearsal, remote D1, paid resource, production deployment, real-data migration or cutover. |

## REWORK-2 closure

- `NO_SHOW` is excluded from Housekeeping departures and the focal API assertion proves no departure or turnover flag for the NoShow room.
- Dashboard alerts are arrays with source-compatible booking/guest/room/status fields; deterministic current-date fixtures assert exact revenue, occupancy, ADR, RevPAR and alert identities.
- No-param, start-only, end-only, same-day and inverted report ranges are executable; defaults derive independently from UTC today.
- Browser continuity performs a real local Housekeeping maintenance mutation and verifies `Maintenance` for room 101 on the Rooms surface.

## Fresh executable checks

- `scripts/cf-i08-regression.sh`: PASS, `RC:0` — source dashboard, inclusive 31-day occupancy series, same-day revenue range, `NO_SHOW` exclusion, RBAC, direct tenant isolation, network totals/ranking and unavailable binding.
- `scripts/cf-i08-browser-regression.sh`: PASS — Reports/Network controls, integrated routes, responsive overflow and housekeeping denial at all contracted widths; screenshot `output/playwright/cf-i08-integrated.png`.
- Fresh inherited: `cf-i03`/`cf-i04` lifecycle D1/API PASS, `cf-i05` Housekeeping/Maintenance PASS, `cf-i06` Billing PASS, `cf-i07` RBAC/users/audit/network PASS, `cf-i07-browser` PASS.
- `npm run check`: PASS (17 tests); `npm run web:build`: PASS; `npm run wrangler:dry-run`: PASS; canonical route grep and `git diff --check`: PASS.
