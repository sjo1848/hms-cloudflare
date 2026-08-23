import type { Membership } from "./auth/membership";

export type OperationalDatabase = Pick<D1Database, "prepare" | "batch">;

export class OperationalRoutingError extends Error {
  public constructor(message = "Operational database binding unavailable") {
    super(message);
    this.name = "OperationalRoutingError";
  }
}

type OperationalBindings = {
  HOTEL_DEMO_DB: OperationalDatabase;
};

/**
 * The binding name comes from the authorized control-plane membership, never
 * directly from the request. Unknown bindings fail closed until a future
 * increment registers another explicitly configured hotel binding.
 */
export function resolveOperationalDatabase(
  bindings: OperationalBindings,
  membership: Membership,
): OperationalDatabase {
  if (membership.operationalBinding !== "HOTEL_DEMO_DB") {
    throw new OperationalRoutingError();
  }
  return bindings.HOTEL_DEMO_DB;
}
