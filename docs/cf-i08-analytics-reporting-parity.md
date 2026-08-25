# CF-I08 reporting parity matrix

Source baseline: HMS `4df56a6217caab611f2f5fcbd98bde8386bb5629`, `ReportingService`, `postgres_booking.rs`, reporting handlers and `HotelNetworkPage`.

| Requirement | Source rule | Target surface | Executable evidence |
|---|---|---|---|
| Dashboard KPIs | Current month revenue excludes `CANCELLED`/`NO_SHOW`; today's confirmed check-ins; active `CONFIRMED`/`CHECKED_IN`; today's distinct-room occupancy over all rooms; arrivals/departures; ADR = revenue/active bookings; RevPAR = occupancy × ADR / 100, integer truncation | `GET /api/v1/analytics/kpis` | `scripts/cf-i08-regression.sh` + source-derived SQL in `apps/api/src/routes/analytics.ts` |
| Revenue report | Optional defaults `today-30`/`today`; inclusive `check_in >= start AND <= end`; excludes `CANCELLED` and `NO_SHOW`; ascending daily rows `{date,revenue_cents}` | `GET /api/v1/reports/revenue` | same-day, inclusive-end, cancellation and NoShow fixtures |
| Occupancy report | Inclusive daily series; distinct rooms with `CONFIRMED`/`CHECKED_IN`; `check_in <= day < check_out`; denominator all rooms | `GET /api/v1/reports/occupancy` | daily 30-row fixture and state negative cases |
| Network summary | Per-hotel dashboard occupancy/active/ADR/RevPAR, range revenue; arithmetic mean occupancy; totals and rows ordered by revenue | `GET /api/v1/hotels/network-kpis` | two bound D1 fixtures, independent ranking/total assertions |
| Isolation | Tenant membership selects exactly one operational D1; another hotel identity cannot select it | all hotel reports | Hotel A identity + Hotel B header returns `403` |

The target migration adds `NO_SHOW` to the local booking lifecycle schema only to preserve source reporting predicates; it does not perform import, real-data migration or production cutover.
