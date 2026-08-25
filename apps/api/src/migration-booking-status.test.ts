import { describe, expect, it } from "vitest";
import { bookingStatusView, isBookingListStatus } from "./routes/bookings";

describe("CF-I09 imported booking status surface", () => {
  it("serializes imported NO_SHOW using the source-shaped API value", () => {
    expect(bookingStatusView("NO_SHOW")).toBe("NoShow");
  });

  it("allows every persisted lifecycle state in list filters without widening generic PATCH", () => {
    for (const status of ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"])
      expect(isBookingListStatus(status)).toBe(true);
    expect(isBookingListStatus("UNKNOWN")).toBe(false);
  });
});
