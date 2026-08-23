import { describe, expect, it } from "vitest";
import { dateRange, email, integerCents } from "./validation";
import { nights } from "./routes/bookings";

describe("CF-I02 validation", () => {
  it("enforces integer cents and valid email", () => {
    expect(integerCents(1250, "price_cents")).toBe(1250);
    expect(() => integerCents(12.5, "price_cents")).toThrow();
    expect(email(" Guest@Example.COM ")).toBe("guest@example.com");
    expect(() => email("not-an-email")).toThrow();
  });
  it("uses half-open date ranges and rejects reversed or invalid dates", () => {
    expect(dateRange("2026-08-23", "2026-08-24")).toEqual({ start: "2026-08-23", end: "2026-08-24" });
    expect(() => dateRange("2026-08-24", "2026-08-24")).toThrow();
    expect(() => dateRange("2026-02-30", "2026-03-01")).toThrow();
  });
  it("expands a stay into exclusive-end room nights", () => {
    expect(nights("2026-08-23", "2026-08-26")).toEqual(["2026-08-23", "2026-08-24", "2026-08-25"]);
  });
});
