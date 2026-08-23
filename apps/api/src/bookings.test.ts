import { describe, expect, it } from "vitest";
import { assertBookingUpdateApplied } from "./routes/bookings";

describe("CF-I03 booking update atomicity guard", () => {
  it("rejects a guarded update that affects zero rows", () => {
    expect(() => assertBookingUpdateApplied({ meta: { changes: 0 } })).toThrowError(/unavailable during update/);
  });

  it("accepts exactly one updated booking", () => {
    expect(() => assertBookingUpdateApplied({ meta: { changes: 1 } })).not.toThrow();
  });
});
