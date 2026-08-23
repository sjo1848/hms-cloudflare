import { describe, expect, it } from "vitest";
import { selectAuthorizedMembership, type Membership } from "./auth/membership";
import { OperationalRoutingError, resolveOperationalDatabase } from "./routing";

const membership: Membership = {
  hotelId: "hotel-a",
  role: "admin",
  email: "user@example.test",
  operationalBinding: "HOTEL_DEMO_DB",
};

const database = {
  prepare: () => {
    throw new Error("not called by resolver test");
  },
};

describe("authorized operational routing", () => {
  it("resolves only an explicitly registered binding", () => {
    expect(resolveOperationalDatabase({ HOTEL_DEMO_DB: database }, membership)).toBe(database);
  });

  it("fails closed for an unknown control-plane binding", () => {
    expect(() =>
      resolveOperationalDatabase(
        { HOTEL_DEMO_DB: database },
        { ...membership, operationalBinding: "CLIENT_SUPPLIED_DB" },
      ),
    ).toThrow(OperationalRoutingError);
  });

  it("keeps selection bounded to authorized memberships", () => {
    expect(selectAuthorizedMembership([membership], "hotel-b")).toBeUndefined();
  });
});
