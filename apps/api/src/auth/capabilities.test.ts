import { describe, expect, it } from "vitest";
import { hasCapability } from "./capabilities";

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
