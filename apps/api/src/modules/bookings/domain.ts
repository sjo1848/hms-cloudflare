export type BookingRow = {
  id: string; guest_id: string; guest_name: string; guest_email: string;
  room_id: string; room_number: string; room_type: string; price_cents: number;
  check_in: string; check_out: string; status: string; total_cents: number;
  notes: string | null; created_at: string; updated_at: string;
};

export type BookingListQuery = {
  status?: string;
  start?: string;
  end?: string;
  limit: number;
};

export type BookingMutationProvenance = {
  tenantId: string;
  hotelId: string;
  actorId: string;
  sessionId: string;
  traceId: string;
};

export type CreateBookingRecord = {
  id: string;
  guestId: string;
  roomId: string;
  start: string;
  end: string;
  totalCents: number;
  notes: string | null;
  now: string;
  claimNights: string[];
  provenance?: BookingMutationProvenance;
};

export type UpdateBookingRecord = CreateBookingRecord & { bookingId: string };

export type BookingUpdateResult = { meta: { changes: number } };

export function nights(start: string, end: string): string[] {
  const result: string[] = [];
  for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor < new Date(`${end}T00:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) result.push(cursor.toISOString().slice(0, 10));
  return result;
}

export function totalCents(priceCents: number, stayNights: number): number | null {
  const total = priceCents * stayNights;
  return Number.isSafeInteger(total) ? total : null;
}

export function bookingStatusView(value: string): string {
  return ({ CONFIRMED: "Confirmed", CANCELLED: "Cancelled", CHECKED_IN: "CheckedIn", CHECKED_OUT: "CheckedOut", NO_SHOW: "NoShow" } as Record<string, string>)[value] ?? value;
}

export function isBookingListStatus(value: string): boolean {
  return ["CONFIRMED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT", "NO_SHOW"].includes(value.toUpperCase());
}

export function bookingView(row: BookingRow, hotelId: string) {
  return {
    id: row.id, hotel_id: hotelId, guest_id: row.guest_id, guest_name: row.guest_name, guest_email: row.guest_email,
    room_id: row.room_id, room_number: row.room_number, room_type: row.room_type, check_in: row.check_in, check_out: row.check_out,
    status: bookingStatusView(row.status), total_cents: row.total_cents, notes: row.notes,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}
