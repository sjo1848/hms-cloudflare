# CF-I08 Analytics and Reporting Parity

Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`  
Target increment: CF-I08, parity BUILD only.

| Source contract | Target surface | Mapping / acceptance | Evidence |
|---|---|---|---|
| Dashboard KPI summary | `GET /api/v1/analytics/kpis` | Explicit `[start,end)` dates; cancelled bookings excluded; revenue is integer `total_cents`; occupied nights come from room-night claims; zero denominators return zero. | `scripts/cf-i08-regression.sh` |
| Revenue report | `GET /api/v1/reports/revenue` | Validated ISO date range; booking arrival date in `[start,end)`; cancelled rows excluded; daily deterministic ordering; integer cents and empty rows allowed. | `scripts/cf-i08-regression.sh`, Reports UI |
| Occupancy report | `GET /api/v1/reports/occupancy` | Available nights = non-out-of-order rooms × range days; occupied nights = non-cancelled room-night claims; occupancy is percentage; ADR = rounded revenue / occupied nights; RevPAR = rounded revenue / available nights. | `scripts/cf-i08-regression.sh` |
| Network KPI aggregation | `GET /api/v1/hotels/network-kpis` | Network capability only; server reads configured active hotels and their bound D1s; totals equal per-hotel rows; rows sort by descending revenue then slug; unavailable binding returns 503. | `scripts/cf-i08-regression.sh`, Network UI |
| Reports/network UX | `/reports`, `/network` | Date controls, KPI cards, ranking, property drill-down, loading/error/success rendering and no horizontal overflow at 375/390/430/768/1024. | `scripts/cf-i08-browser-regression.sh`, committed screenshot |

The target deliberately keeps money in integer cents. Percentages are numeric percentages rounded to two decimals; zero denominators are `0`, never `NaN` or an invented estimate. Network aggregation never accepts a client-supplied binding and never silently drops an unavailable configured hotel.
