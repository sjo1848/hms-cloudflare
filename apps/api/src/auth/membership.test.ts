import { describe, expect, it } from "vitest";
import { selectAuthorizedMembership, type Membership } from "./membership";

const memberships: Membership[] = [
  {
    hotelId: "hotel-a",
    role: "admin",
    email: "user@example.test",
    operationalBinding: "HOTEL_A_DB",
  },
];

describe("membership hotel selection", () => {
  it("never authorizes a hotel outside the membership set", () => {
    expect(selectAuthorizedMembership(memberships, "hotel-b")).toBeUndefined();
  });

  it("uses the first authorized membership only when no hotel is requested", () => {
    expect(selectAuthorizedMembership(memberships)?.hotelId).toBe("hotel-a");
  });
});
