import type { MessageKey } from "../i18n";
import type { EffectiveCapabilities } from "./capabilities";

export type NavigationGroup = "operations" | "directory" | "insights" | "administration" | "platform";
export type NavigationAccess = { scope: "hotel" | "network"; allOf: readonly string[] };
export type NavigationItem = readonly [string, string, MessageKey, NavigationAccess, NavigationGroup];

export const navigation = [
  ["bookings", "/bookings", "nav.reception", { scope: "hotel", allOf: ["bookings.read"] }, "operations"],
  ["rooms", "/rooms", "nav.rooms", { scope: "hotel", allOf: ["rooms.read"] }, "operations"],
  ["housekeeping", "/housekeeping", "nav.housekeeping", { scope: "hotel", allOf: ["housekeeping.read"] }, "operations"],
  ["guests", "/guests", "nav.guests", { scope: "hotel", allOf: ["guests.read"] }, "directory"],
  ["reports", "/reports", "nav.reports", { scope: "hotel", allOf: ["reports.revenue.read", "reports.occupancy.read"] }, "insights"],
  ["users", "/users", "nav.users", { scope: "hotel", allOf: ["users.read"] }, "administration"],
  ["network", "/network", "nav.network", { scope: "network", allOf: ["saas.hotels.read"] }, "platform"],
] as const satisfies ReadonlyArray<NavigationItem>;

export type PageKey = typeof navigation[number][0];
export const mobilePrimaryKeys: readonly PageKey[] = ["bookings", "rooms", "housekeeping"];
export const navigationGroups: readonly NavigationGroup[] = ["operations", "directory", "insights", "administration", "platform"];
export function isMobilePrimary(key: string): key is PageKey {
  return mobilePrimaryKeys.includes(key as PageKey);
}

export function pageFromPath(pathname: string): PageKey | null {
  if (pathname === "/") return "bookings";
  return navigation.find(([, href]) => pathname === href)?.[0] ?? null;
}

export function navigationAllowed(item: NavigationItem, capabilities: EffectiveCapabilities): boolean {
  const access = item[3];
  const granted = access.scope === "hotel" ? capabilities.hotel : capabilities.network;
  return access.allOf.every(capability => granted.includes(capability));
}

export function visibleNavigation(capabilities: EffectiveCapabilities): NavigationItem[] {
  return navigation.filter(item => navigationAllowed(item, capabilities));
}
