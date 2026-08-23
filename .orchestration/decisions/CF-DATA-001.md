# CF-DATA-001 — Tenant Isolation Topology

Status: `APPROVED`
Decision date: `2026-08-23`
Human authority: Product/Risk Authority
Selected option: `B — control-plane D1 + one operational D1 per hotel`

## Decision

Use a small control-plane D1 for Cloudflare Access identity mappings, hotels, memberships/roles and routing metadata. Keep each hotel's operational data in its own D1 database, including rooms, guests, bookings, availability/holds, billing, housekeeping, audit and other hotel-scoped operational records.

## Rationale

The source HMS currently relies on PostgreSQL tenant safeguards including tenant-scoped relational integrity and RLS. D1 has no direct PostgreSQL RLS equivalent. Option B preserves a strong database-level tenant boundary: a query executed against one hotel's operational D1 cannot read another hotel's operational D1.

This adds provisioning/binding and network-aggregation complexity, but that complexity is acceptable at the current scale and is preferred over silently weakening tenant isolation.

## Constraints

- Cloudflare Access remains the authentication boundary under `CF-ARCH-001`.
- HMS remains authoritative for application membership, roles and capabilities.
- Operational transactions must remain inside the relevant hotel D1 whenever atomicity is required. Do not design critical atomic workflows that span CONTROL_DB and a hotel operational DB.
- Network-level aggregation must use an explicit authorized path and must not weaken tenant isolation.
- The source HMS remains read-only reference.
- Parity first; no new customer-facing product scope is authorized by this decision.
- No production cutover or real-data migration is authorized by this decision.

## Cost boundary

Option B is selected under a `$0/month / Cloudflare Free` operating target. No paid Cloudflare plan, paid D1 transition, or other material recurring-cost increase may be activated automatically. Any such change requires a separate Human Gate with cost, alternatives and impact presented explicitly.

Free-tier capacity is therefore an explicit growth boundary, not permission to weaken isolation or enable paid services silently.

## Alternatives rejected for this decision

- `A — shared operational D1`: simpler, but shifts more tenant isolation responsibility to application query correctness and reduces database-level defense-in-depth relative to the source HMS.
- `C — PostgreSQL behind Workers/Hyperdrive`: preserves PostgreSQL semantics most directly but conflicts with the approved D1-first target and reintroduces an external database dependency/cost surface.

## Effect on workflow

`CF-DATA-001` is no longer a blocker.

Next required sequence:
1. reconcile `.orchestration/STATE.md` and the Design Package with this decision;
2. independently review the integrated Design Package;
3. perform bounded REWORK if required and use a fresh independent Critic;
4. on independent PASS, close DESIGN;
5. create/activate the `CF-I01` Task Contract and continue automatically.

`CF-I01` BUILD remains forbidden until DESIGN exit criteria pass.
