export type LifecycleBooking = { id: string; room_id: string; check_in: string; check_out: string; status: string };
export type LifecycleActor = { subject: string; requestId: string; hotelId: string };
export type CheckoutPolicy = "settled" | "pending-approved";

export function claimDates(start: string, end: string): string[] {
  const result: string[] = [];
  for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor < new Date(`${end}T00:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) result.push(cursor.toISOString().slice(0, 10));
  return result;
}

export function positiveGuestCount(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 100 ? value as number : null;
}

export function requiredConfirmations(body: Record<string, unknown>, fields: string[]): string | null {
  return fields.find(field => body[field] !== true) ?? null;
}

export function checkoutPolicy(value: string): CheckoutPolicy | null {
  return value === "settled" || value === "pending-approved" ? value : null;
}

export function normalizedCheckoutReference(value: unknown): string | null | undefined {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length >= 3 && normalized.length <= 120 ? normalized : undefined;
}

export function requiresCheckoutOverride(policy: CheckoutPolicy): boolean {
  return policy === "pending-approved";
}

export function pendingReferenceValid(policy: CheckoutPolicy, reference: string | null): boolean {
  return policy !== "pending-approved" || Boolean(reference && reference.length >= 6);
}
