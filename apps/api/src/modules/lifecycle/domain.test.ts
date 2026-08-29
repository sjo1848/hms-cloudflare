import { describe, expect, it } from "vitest";
import { checkoutPolicy, normalizedCheckoutReference, pendingReferenceValid, positiveGuestCount, requiredConfirmations } from "./domain";

describe("lifecycle domain rules", () => {
  it("validates check-in confirmations and guest count", () => {
    expect(requiredConfirmations({ document_verified: true, contact_confirmed: true, stay_confirmed: true }, ["document_verified", "contact_confirmed", "stay_confirmed"])).toBeNull();
    expect(requiredConfirmations({ document_verified: true }, ["document_verified", "contact_confirmed"])).toBe("contact_confirmed");
    expect(positiveGuestCount(1)).toBe(1);
    expect(positiveGuestCount(100)).toBe(100);
    expect(positiveGuestCount(0)).toBeNull();
  });

  it("preserves settled empty-reference semantics and pending override reference rules", () => {
    expect(checkoutPolicy("settled")).toBe("settled");
    expect(checkoutPolicy("pending-approved")).toBe("pending-approved");
    expect(checkoutPolicy("other")).toBeNull();
    expect(normalizedCheckoutReference("")).toBeNull();
    expect(normalizedCheckoutReference("   ")).toBeNull();
    expect(normalizedCheckoutReference(" ABC123 ")).toBe("ABC123");
    expect(pendingReferenceValid("settled", null)).toBe(true);
    expect(pendingReferenceValid("pending-approved", null)).toBe(false);
    expect(pendingReferenceValid("pending-approved", "ABC123")).toBe(true);
  });
});
