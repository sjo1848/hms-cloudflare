import type { BookingListQuery, BookingMutationProvenance, BookingRow, BookingUpdateResult, CreateBookingRecord, UpdateBookingRecord } from "./domain";

export interface BookingRepository {
  list(query: BookingListQuery): Promise<BookingRow[]>;
  find(id: string): Promise<BookingRow | null>;
  validateReferences(guestId: string, roomId: string, bookingId: string | null, start: string, end: string): Promise<number | null>;
  create(record: CreateBookingRecord): Promise<void>;
  cancel(bookingId: string, now: string, provenance?: BookingMutationProvenance): Promise<BookingUpdateResult>;
  update(record: UpdateBookingRecord): Promise<BookingUpdateResult>;
}
