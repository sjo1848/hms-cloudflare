export const navigation = [
  ["bookings", "/bookings", "Recepción", "Llegadas, salidas y cobros"],
  ["rooms", "/rooms", "Habitaciones", "Inventario y disponibilidad"],
  ["guests", "/guests", "Huéspedes", "Fichas y contactos"],
  ["housekeeping", "/housekeeping", "Housekeeping", "Limpieza y handoff"],
  ["reports", "/reports", "Reportes", "Ocupación e ingresos"],
  ["users", "/users", "Usuarios", "Accesos y roles"],
  ["network", "/network", "Red", "Operación multi-hotel"],
] as const;

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
