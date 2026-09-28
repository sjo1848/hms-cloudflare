import type { BookingListQuery, BookingMutationProvenance, BookingRow, BookingUpdateResult, CreateBookingRecord, UpdateBookingRecord } from "./domain";

export type BookingPricingReference = { priceCents: number; pricingVersion: number };

export interface BookingRepository {
  list(query: BookingListQuery): Promise<BookingRow[]>;
  find(id: string): Promise<BookingRow | null>;
  validateReferences(guestId: string, roomId: string, bookingId: string | null, start: string, end: string): Promise<number | null>;
  validatePricingReferences(guestId: string, roomId: string, bookingId: string | null, start: string, end: string): Promise<BookingPricingReference | null>;
  extraChargeTotal(bookingId: string): Promise<number>;
  create(record: CreateBookingRecord): Promise<BookingUpdateResult>;
  cancel(bookingId: string, now: string, provenance?: BookingMutationProvenance): Promise<BookingUpdateResult>;
  update(record: UpdateBookingRecord): Promise<BookingUpdateResult>;
}
