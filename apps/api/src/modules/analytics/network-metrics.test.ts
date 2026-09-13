import { describe, expect, it } from "vitest";
import { loadNetworkHotelMetrics } from "./network-metrics";

describe("network KPI compact query", () => {
  it("keeps range revenue separate from month-based ADR and RevPAR", async () => {
    let bound: unknown[] = [];
    const database = {
      prepare(sql: string) {
        expect(sql).toContain("AS revenue_cents");
        expect(sql).toContain("AS revenue_month_cents");
        return {
          bind(...values: unknown[]) {
            bound = values;
            return {
              async first() {
                return {
                  total_rooms: 4,
                  occupied_rooms: 2,
                  active_bookings_count: 2,
                  revenue_cents: 900,
                  revenue_month_cents: 1000,
                };
              },
            };
          },
        };
      },
    } as any;

    const metrics = await loadNetworkHotelMetrics(
      database,
      { start: "2026-08-10", end: "2026-08-20" },
      "2026-08-29",
      "2026-08-01",
    );

    expect(bound).toEqual(["2026-08-10", "2026-08-20", "2026-08-29", "2026-08-01"]);
    expect(metrics).toEqual({
      occupancy_rate: 50,
      active_bookings_count: 2,
      revenue_cents: 900,
      adr_cents: 500,
      rev_par_cents: 250,
    });
  });
});
