import { describe, expect, it } from "vitest";
import { navigation, navigationAllowed, navigationGroups, pageFromPath, visibleNavigation } from "./navigation";
import type { EffectiveCapabilities } from "./capabilities";

const receptionist: EffectiveCapabilities = {
  hotel: ["bookings.read", "rooms.read", "guests.read", "bookings.write"],
  network: [],
};

describe("application navigation contract", () => {
  it("maps only known canonical routes and rejects unknown nested paths", () => {
    expect(pageFromPath("/bookings")).toBe("bookings");
    expect(pageFromPath("/bookings/booking-123")).toBeNull();
    expect(pageFromPath("/rooms/room-123")).toBeNull();
    expect(pageFromPath("/housekeeping/future-task")).toBeNull();
    expect(pageFromPath("/")).toBe("bookings");
    expect(pageFromPath("/not-a-module")).toBeNull();
    expect(pageFromPath("/bookings-pretend")).toBeNull();
  });

  it("filters destinations using server capability scope and every required capability", () => {
    expect(visibleNavigation(receptionist).map(item => item[0])).toEqual(["bookings", "rooms", "guests"]);
    expect(visibleNavigation({ hotel: [], network: ["saas.hotels.read"] }).map(item => item[0])).toEqual(["network"]);
    const reports = navigation.find(item => item[0] === "reports");
    expect(reports).toBeDefined();
    expect(navigationAllowed(reports!, { hotel: ["reports.revenue.read"], network: [] })).toBe(false);
    expect(navigationAllowed(reports!, { hotel: ["reports.revenue.read", "reports.occupancy.read"], network: [] })).toBe(true);
  });

  it("preserves the approved shell taxonomy without promoting Billing/Cash into navigation", () => {
    expect(navigationGroups).toEqual(["operations", "directory", "insights", "administration", "platform"]);
    expect(navigation.some(item => item[0].toLowerCase().includes("billing") || item[0].toLowerCase().includes("cash"))).toBe(false);
  });
});
