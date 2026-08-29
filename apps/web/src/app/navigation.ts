import type { MessageKey } from "../i18n";

export const navigation = [
  ["bookings", "/bookings", "nav.reception", "nav.receptionDescription"],
  ["rooms", "/rooms", "nav.rooms", "nav.roomsDescription"],
  ["guests", "/guests", "nav.guests", "nav.guestsDescription"],
  ["housekeeping", "/housekeeping", "nav.housekeeping", "nav.housekeepingDescription"],
  ["reports", "/reports", "nav.reports", "nav.reportsDescription"],
  ["users", "/users", "nav.users", "nav.usersDescription"],
  ["network", "/network", "nav.network", "nav.networkDescription"],
] as const satisfies ReadonlyArray<readonly [string, string, MessageKey, MessageKey]>;

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
