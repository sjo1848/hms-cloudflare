import { describe, expect, it } from "vitest";
import { createHotelTimeContext, hotelLocalDate, isIanaTimeZone, parseExplicitOffsetInstant } from "./hotel-time";

describe("hotel operational time", () => {
  it("derives Mendoza local date independently from UTC date", () => {
    const instant = new Date("2026-09-20T01:30:00.000Z");
    expect(hotelLocalDate("America/Argentina/Mendoza", instant)).toBe("2026-09-19");
    expect(hotelLocalDate("UTC", instant)).toBe("2026-09-20");
  });

  it("publishes one trusted request clock snapshot", () => {
    const instant = new Date("2026-09-19T15:00:00.000Z");
    expect(createHotelTimeContext("America/Argentina/Mendoza", instant)).toEqual({
      timeZone: "America/Argentina/Mendoza",
      localDate: "2026-09-19",
      nowIso: "2026-09-19T15:00:00.000Z",
    });
  });

  it("validates IANA timezones", () => {
    expect(isIanaTimeZone("America/Argentina/Mendoza")).toBe(true);
    expect(isIanaTimeZone("Mars/Olympus")).toBe(false);
  });

  it("accepts only absolute instants with an explicit offset", () => {
    expect(parseExplicitOffsetInstant("2026-09-19T12:30:00-03:00")).toBe("2026-09-19T15:30:00.000Z");
    expect(parseExplicitOffsetInstant("2026-09-19T15:30:00Z")).toBe("2026-09-19T15:30:00.000Z");
    expect(parseExplicitOffsetInstant("2026-09-19T12:30:00")).toBeNull();
  });
});
