import type { CheckoutPolicy, LifecycleActor, LifecycleBooking } from "./domain";
import type { StayPricingQuote } from "../billing/d1-stay-pricing";

export type LifecycleMutationResult = {
  ok: boolean;
  reassignment?: {
    oldRoomId: string;
    newRoomId: string;
    hotelLocalDate: string;
    effectiveDate: string;
    remainingInterval: { startDate: string; endDateExclusive: string };
    oldRoomStatus: string;
    totalCents: number;
    previousTotalCents: number;
    priceDeltaCents: number;
  };
};

export interface LifecycleRepository {
  findBooking(id: string): Promise<LifecycleBooking | null>;
  checkIn(current: LifecycleBooking, guestCount: number, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  quoteReassignment(current: LifecycleBooking, destinationRoomId: string, hotelLocalDate: string): Promise<StayPricingQuote | null>;
  reassign(current: LifecycleBooking, destinationRoomId: string, reason: string, hotelLocalDate: string, quoteToken: string, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult>;
}
