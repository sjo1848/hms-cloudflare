import type { CheckoutPolicy, LifecycleActor, LifecycleBooking } from "./domain";

export type LifecycleMutationResult = { ok: boolean };

export interface LifecycleRepository {
  findBooking(id: string): Promise<LifecycleBooking | null>;
  checkIn(current: LifecycleBooking, guestCount: number, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  reassign(current: LifecycleBooking, destinationRoomId: string, actor: LifecycleActor): Promise<LifecycleMutationResult>;
  checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult>;
}
