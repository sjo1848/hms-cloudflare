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
  HOTEL_SECOND_DB: OperationalDatabase;
};

/**
 * The binding name comes from the authorized control-plane membership, never
 * directly from the request. Each configured hotel gets its own operational
 * D1 binding; unknown bindings fail closed.
 */
export function resolveOperationalDatabase(
  bindings: OperationalBindings,
  membership: Membership,
): OperationalDatabase {
  const database = bindings[membership.operationalBinding as keyof OperationalBindings];
  if (!database) throw new OperationalRoutingError();
  return database;
}
