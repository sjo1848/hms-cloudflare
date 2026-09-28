import { describe, expect, it } from "vitest";
import { capabilitiesForRole, hasCapability, ROLE_CAPABILITIES } from "./capabilities";

describe("maintenance capabilities", () => {
  it("keeps report/read/resolve authority separate by role", () => {
    for (const role of ["admin", "ops", "housekeeping"]) {
      expect(hasCapability(role, "maintenance.read")).toBe(true);
      expect(hasCapability(role, "maintenance.report")).toBe(true);
      expect(hasCapability(role, "maintenance.resolve")).toBe(true);
    }
    expect(hasCapability("receptionist", "maintenance.read")).toBe(true);
    expect(hasCapability("receptionist", "maintenance.report")).toBe(true);
    expect(hasCapability("receptionist", "maintenance.resolve")).toBe(false);
    expect(hasCapability("saas_admin", "maintenance.read")).toBe(false);
    expect(hasCapability("unknown", "maintenance.resolve")).toBe(false);
  });
});

describe("server-owned effective capability exposure", () => {
  it("serializes every canonical role set exactly, sorted, without changing grants", () => {
    for (const [role, capabilities] of Object.entries(ROLE_CAPABILITIES)) {
      expect(capabilitiesForRole(role)).toEqual([...capabilities].sort());
    }
  });

  it("returns no capabilities for absent or unknown roles", () => {
    expect(capabilitiesForRole(null)).toEqual([]);
    expect(capabilitiesForRole(undefined)).toEqual([]);
    expect(capabilitiesForRole("unknown-role")).toEqual([]);
    expect(hasCapability("unknown-role", "bookings.read")).toBe(false);
  });
});
