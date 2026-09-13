export type ReceptionBooking = {
  id: string;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  status: string;
};

export type ReceptionQueueFilter = "attention" | "arrivals" | "departures" | "in-house" | "all";

export type ReceptionQueueLane = "Atención" | "Llegada" | "Salida" | "En casa" | "Reserva" | "Finalizada";

export type ReceptionQueueItem<T extends ReceptionBooking = ReceptionBooking> = {
  booking: T;
  lane: ReceptionQueueLane;
  title: string;
  detail: string;
  actionLabel: string;
  rank: number;
  attention: boolean;
  relevantDate: string;
};

export const receptionQueueFilters: Array<{ value: ReceptionQueueFilter; label: string }> = [
  { value: "attention", label: "Atención" },
  { value: "arrivals", label: "Llegadas" },
  { value: "departures", label: "Salidas" },
  { value: "in-house", label: "En casa" },
  { value: "all", label: "Todos" },
];

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizedReceptionSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function statusKey(status: string): string {
  return status.replace(/[\s_-]/g, "").toLocaleLowerCase("en");
}

export function classifyReceptionBooking<T extends ReceptionBooking>(booking: T, today = localDateKey()): ReceptionQueueItem<T> {
  const status = statusKey(booking.status);
  const isConfirmed = status === "confirmed";
  const isCheckedIn = status === "checkedin";
  const isCheckedOut = status === "checkedout";
  const isCancelled = status === "cancelled" || status === "canceled";

  if (isCheckedIn && booking.check_out <= today) {
    return {
      booking,
      lane: "Salida",
      title: "Salida pendiente",
      detail: booking.check_out < today ? "Checkout vencido: requiere resolución inmediata." : "Checkout previsto para hoy.",
      actionLabel: "Preparar checkout",
      rank: booking.check_out < today ? 0 : 10,
      attention: true,
      relevantDate: booking.check_out,
    };
  }

  if (isConfirmed && booking.check_in <= today) {
    return {
      booking,
      lane: "Llegada",
      title: booking.check_in < today ? "Llegada demorada" : "Llegada lista",
      detail: booking.check_in < today ? "La fecha de llegada ya pasó y el ingreso sigue pendiente." : "Reserva confirmada para ingresar hoy.",
      actionLabel: "Hacer check-in",
      rank: booking.check_in < today ? 5 : 20,
      attention: true,
      relevantDate: booking.check_in,
    };
  }

  if (isConfirmed) {
    return {
      booking,
      lane: "Reserva",
      title: "Próxima llegada",
      detail: `Ingreso previsto para ${booking.check_in}.`,
      actionLabel: "Revisar reserva",
      rank: 30,
      attention: false,
      relevantDate: booking.check_in,
    };
  }

  if (isCheckedIn) {
    return {
      booking,
      lane: "En casa",
      title: "Estadía activa",
      detail: `Salida prevista para ${booking.check_out}.`,
      actionLabel: "Gestionar estadía",
      rank: 40,
      attention: false,
      relevantDate: booking.check_out,
    };
  }

  if (isCheckedOut || isCancelled) {
    return {
      booking,
      lane: "Finalizada",
      title: isCancelled ? "Reserva cancelada" : "Estadía finalizada",
      detail: isCancelled ? "No requiere acción operativa." : "Checkout completado.",
      actionLabel: "Ver detalle",
      rank: 90,
      attention: false,
      relevantDate: booking.check_out,
    };
  }

  return {
    booking,
    lane: "Atención",
    title: "Estado para revisar",
    detail: `Estado ${booking.status}: requiere clasificación operativa.`,
    actionLabel: "Revisar",
    rank: 15,
    attention: true,
    relevantDate: booking.check_in,
  };
}

export function buildReceptionQueue<T extends ReceptionBooking>(bookings: T[], today = localDateKey()): ReceptionQueueItem<T>[] {
  return bookings
    .map(booking => classifyReceptionBooking(booking, today))
    .sort((left, right) =>
      left.rank - right.rank ||
      left.relevantDate.localeCompare(right.relevantDate) ||
      left.booking.room_number.localeCompare(right.booking.room_number, "es", { numeric: true }) ||
      left.booking.guest_name.localeCompare(right.booking.guest_name, "es"),
    );
}

export function filterReceptionQueue<T extends ReceptionBooking>(
  queue: ReceptionQueueItem<T>[],
  filter: ReceptionQueueFilter,
  search: string,
): ReceptionQueueItem<T>[] {
  const query = normalizedReceptionSearch(search);
  return queue.filter(item => {
    const matchesFilter =
      filter === "all" ||
      (filter === "attention" && item.attention) ||
      (filter === "arrivals" && (item.lane === "Llegada" || item.lane === "Reserva")) ||
      (filter === "departures" && item.lane === "Salida") ||
      (filter === "in-house" && item.lane === "En casa");
    if (!matchesFilter) return false;
    if (!query) return true;
    return normalizedReceptionSearch([
      item.booking.guest_name,
      item.booking.room_number,
      item.booking.id,
      item.booking.status,
      item.lane,
      item.title,
      item.detail,
    ].join(" ")).includes(query);
  });
}

export function receptionQueueCounts<T extends ReceptionBooking>(queue: ReceptionQueueItem<T>[]): Record<ReceptionQueueFilter, number> {
  return {
    attention: queue.filter(item => item.attention).length,
    arrivals: queue.filter(item => item.lane === "Llegada" || item.lane === "Reserva").length,
    departures: queue.filter(item => item.lane === "Salida").length,
    "in-house": queue.filter(item => item.lane === "En casa").length,
    all: queue.length,
  };
}
