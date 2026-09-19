import type { AccessIdentity } from "./auth/access";
import type { Membership } from "./auth/membership";
import type { OperationalDatabase } from "./routing";
import type { HotelTimeContext } from "./time/hotel-time";

export type ApiVariables = {
  identity: AccessIdentity;
  membership: Membership;
  operationalDatabase: OperationalDatabase;
  requestId: string;
  networkRole?: string;
  hotelTime?: HotelTimeContext;
};
