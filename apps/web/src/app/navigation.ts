import type { MessageKey } from "../i18n";

export type NavigationAccess = { scope: "hotel" | "network"; allOf: readonly string[] };

export const navigation = [
  ["bookings", "/bookings", "nav.reception", "nav.receptionDescription", { scope: "hotel", allOf: ["bookings.read"] }],
  ["rooms", "/rooms", "nav.rooms", "nav.roomsDescription", { scope: "hotel", allOf: ["rooms.read"] }],
  ["guests", "/guests", "nav.guests", "nav.guestsDescription", { scope: "hotel", allOf: ["guests.read"] }],
  ["housekeeping", "/housekeeping", "nav.housekeeping", "nav.housekeepingDescription", { scope: "hotel", allOf: ["housekeeping.read"] }],
  ["reports", "/reports", "nav.reports", "nav.reportsDescription", { scope: "hotel", allOf: ["reports.revenue.read", "reports.occupancy.read"] }],
  ["users", "/users", "nav.users", "nav.usersDescription", { scope: "hotel", allOf: ["users.read"] }],
  ["network", "/network", "nav.network", "nav.networkDescription", { scope: "network", allOf: ["saas.hotels.read"] }],
] as const satisfies ReadonlyArray<readonly [string, string, MessageKey, MessageKey, NavigationAccess]>;

export type PageKey = typeof navigation[number][0];
export function pageFromPath(pathname: string): PageKey {
  if (pathname.startsWith("/guests")) return "guests";
  if (pathname.startsWith("/rooms")) return "rooms";
  if (pathname.startsWith("/housekeeping")) return "housekeeping";
  if (pathname.startsWith("/users")) return "users";
  if (pathname.startsWith("/network")) return "network";
  if (pathname.startsWith("/reports")) return "reports";
  return "bookings";
}
