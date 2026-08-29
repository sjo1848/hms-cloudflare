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

/** Resolve a trusted control-plane binding name to its physical D1 database. */
export function resolveOperationalDatabaseBinding(
  bindings: OperationalBindings,
  operationalBinding: string,
): OperationalDatabase {
  const database = bindings[operationalBinding as keyof OperationalBindings];
  if (!database) throw new OperationalRoutingError();
  return database;
}

/**
 * The binding name comes from the authorized control-plane membership, never
 * directly from the request. Each configured hotel gets its own operational
 * D1 binding; unknown bindings fail closed.
 */
export function resolveOperationalDatabase(
  bindings: OperationalBindings,
  membership: Membership,
): OperationalDatabase {
  return resolveOperationalDatabaseBinding(bindings, membership.operationalBinding);
}
