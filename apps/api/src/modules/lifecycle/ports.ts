import type { CheckoutPolicy, LifecycleActor, LifecycleBooking } from "./domain";

export type LifecycleMutationResult = {
  ok: boolean;
  reassignment?: {
    oldRoomId: string;
    newRoomId: string;
    effectiveDate: string;
    oldRoomStatus: string;
    destinationPriceCents: number;
    totalCents: number;
  };
};

export interface LifecycleRepository {
  findBooking(id: string): Promise<LifecycleBooking | null>;
  checkIn(current: LifecycleBooking, guestCount: number, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  reassign(current: LifecycleBooking, destinationRoomId: string, reason: string, hotelLocalDate: string, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult>;
}
