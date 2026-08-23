import type { AccessIdentity } from "./access";

export type Membership = {
  hotelId: string;
  role: string;
  email: string;
  operationalBinding: string;
};

type MembershipRow = {
  hotel_id: string;
  role: string;
  email: string;
  operational_binding: string;
};

type MembershipDatabase = {
  prepare(query: string): {
    bind(...values: string[]): {
      all<T>(): Promise<{ results: T[] }>;
    };
  };
};

export async function listMemberships(
  database: MembershipDatabase,
  identity: AccessIdentity,
): Promise<Membership[]> {
  const result = await database
    .prepare(
      `SELECT m.hotel_id, m.role, i.email, h.operational_binding
       FROM hotel_memberships AS m
       JOIN access_identity_mappings AS i
         ON i.access_subject = m.access_subject AND i.active = 1
       JOIN control_hotels AS h
         ON h.id = m.hotel_id AND h.active = 1
       WHERE m.access_subject = ?1 AND m.active = 1
       ORDER BY m.hotel_id`,
    )
    .bind(identity.subject)
    .all<MembershipRow>();

  return result.results.map((row) => ({
    hotelId: row.hotel_id,
    role: row.role,
    email: row.email,
    operationalBinding: row.operational_binding,
  }));
}

export function selectAuthorizedMembership(
  memberships: Membership[],
  requestedHotelId?: string,
): Membership | undefined {
  if (requestedHotelId) {
    return memberships.find((membership) => membership.hotelId === requestedHotelId);
  }
  return memberships[0];
}
