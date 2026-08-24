export const ROLE_CAPABILITIES: Record<string, ReadonlySet<string>> = {
  admin: new Set([
    "rooms.read", "rooms.write", "rooms.search", "guests.read", "guests.write",
    "bookings.read", "bookings.write", "lifecycle.write", "housekeeping.read", "housekeeping.write",
    "billing.read", "billing.write", "billing.balance.read", "billing.close_cash.write", "billing.invoices.read", "billing.invoice.read", "bookings.extra_charges.read", "bookings.extra_charges.write", "bookings.update", "bookings.checkout.override", "analytics.kpis.read", "reports.revenue.read", "reports.occupancy.read", "users.read", "users.write", "users.delete", "audit.events.read",
  ]),
  ops: new Set(["rooms.read", "rooms.search", "guests.read", "guests.write", "bookings.read", "bookings.write", "lifecycle.write", "housekeeping.read", "housekeeping.write", "billing.read", "billing.write", "billing.balance.read", "billing.close_cash.write", "billing.invoices.read", "billing.invoice.read", "bookings.extra_charges.read", "bookings.extra_charges.write", "bookings.update", "analytics.kpis.read", "reports.revenue.read", "reports.occupancy.read", "audit.events.read"]),
  receptionist: new Set(["rooms.read", "rooms.search", "guests.read", "guests.write", "bookings.read", "bookings.write", "lifecycle.write", "billing.read", "billing.write", "billing.balance.read", "billing.invoice.read", "bookings.extra_charges.read", "bookings.extra_charges.write", "bookings.update"]),
  housekeeping: new Set(["housekeeping.read", "housekeeping.write"]),
  saas_admin: new Set(["saas.hotels.read", "saas.hotels.write"]),
};

export function hasCapability(role: string, capability: string): boolean {
  return ROLE_CAPABILITIES[role]?.has(capability) ?? false;
}
