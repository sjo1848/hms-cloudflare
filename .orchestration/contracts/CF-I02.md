# TASK CONTRACT — CF-I02

TASK ID: `CF-I02`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `CONTEXTUAL SPECIALIST / BUILD`  
STATUS: `READY`

## OBJECTIVE

Implement the rooms, guests and room-holds parity increment on top of the passed CF-I01 foundation, preserving the source `/api/v1` contract, Option B hotel-D1 boundary and required UI surfaces without implementing bookings or other later product increments.

## CANONICAL INPUTS

- `AGENTS.md` and `.orchestration/STATE.md`.
- `.orchestration/contracts/CF-I01.md` and `.orchestration/reviews/CF-I01-critic.md`.
- Approved design: `docs/migration-design-package.md`.
- Source parity contract: `docs/source-contract-inventory.md`, especially P-04/P-05/P-06 and J-05.
- Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Source evidence: `backend/src/infrastructure/web/routes/mod.rs:140–177,201–205`; `backend/openapi.yaml` room/guest/hold paths; room/guest/hold domain services and tests; frontend rooms/guests feature surfaces.

## SCOPE

### API and hotel operational D1

Implement the following same-origin `/api/v1` operations against the authorized operational hotel D1 binding:

- `GET/POST /rooms`;
- `GET /rooms/available` with required `start`/`end` ISO dates;
- `GET/PATCH /rooms/{id}`;
- `GET/POST /rooms/{id}/holds`;
- `GET /rooms/holds/board`;
- `PATCH/DELETE /rooms/{id}/holds/{hold_id}`;
- `GET/POST /guests`.

The API must validate input, use prepared/bound SQL, preserve integer cents, enforce hotel-local ownership, and return typed errors consistent with the foundation convention. Room hold intervals use half-open overlap semantics (`existing.start < requested.end && existing.end > requested.start`) and must reject invalid ranges and conflicting holds. Availability must remain a domain-level query; do not assume bookings exist in this increment, but keep schema/query seams compatible with later booking overlap claims.

### UI

Add React + Vite browser surfaces for `/rooms` and `/guests` with:

- authenticated API client using same-origin `/api/v1`;
- loading, empty, validation and typed-error states;
- room inventory list and room creation/edit affordance;
- room hold list/create/update/delete surface;
- guest list/create surface;
- no booking, billing, housekeeping or network feature expansion;
- responsive behavior suitable for the accepted reception/rooms widths, with browser-testable semantic controls.

## AUTHORIZATION AND DATA INVARIANTS

- Use the CF-I01 Access → Control_DB membership → allowlisted operational binding context; never accept hotel identity as an independent authorization source.
- Ordinary room, hold and guest rows live in the hotel operational D1, not CONTROL_DB.
- Cross-hotel IDs must not resolve because the request is executed against the authorized hotel DB only.
- Room number uniqueness is local to the hotel DB; guest email uniqueness is local to the hotel DB.
- Room prices and all future monetary fields remain integer cents.
- Hold and availability date ranges are validated and overlap-safe.
- No real data, production deployment or paid Cloudflare resource is allowed.

## REQUIRED ACCEPTANCE

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Rooms list/create/update | `/rooms`, room API | Valid room data persists in hotel D1; duplicate room number and invalid price/input fail with typed errors. | API tests + UI/browser evidence + local migration/query evidence. |
| Guest list/create | `/guests`, guest API | Valid guest persists; name/email validation and tenant-local email uniqueness are enforced. | API tests + UI evidence. |
| Room holds | Room detail/hold board and hold API | Valid hold persists; invalid dates and half-open overlaps fail; update/delete remain room-scoped. | Domain/query tests + UI evidence. |
| Availability | Room availability picker/API | Required dates validate; held inventory is excluded; query remains compatible with future booking claims. | Query tests and route evidence. |
| Tenant boundary | All API surfaces | A membership for hotel A cannot read/write hotel B rows or use an unknown binding. | Routing/DB regression tests. |
| Error/async states | Rooms/guests UI | Loading, empty, validation, unauthorized/forbidden and server-error states are observable and non-silent. | Component/browser tests. |
| Responsive UI | Rooms/guests/reception-adjacent surfaces | Semantic controls remain usable at accepted widths; no unrequested product surface is introduced. | Browser or component evidence. |

## DECISION LATITUDE

The Specialist may choose schema column naming, repository/helper layout, React component organization, query-builder style, test organization and local fixture data, provided the API contract, source semantics, authorization and invariants remain intact.

The Specialist may not change CF-DATA-001 Option B, Access boundary, Workers/Hono/TypeScript/D1 target, same-origin `/api/v1`, parity scope, source behavior, cost boundary or later-increment boundaries.

## FORBIDDEN ACTIONS

- Booking, check-in/out, billing, housekeeping, user/RBAC, reporting or network feature implementation.
- Production deployment, remote D1 mutation, paid Cloudflare activation or real-data access.
- Trusting client hotel IDs or introducing a shared operational database.
- Skipping independent Critic review or self-approving substantive work.

## REQUIRED OUTPUTS

- API, D1 migration/query, React/Vite UI and tests within this scope.
- Exact artifact commit SHA persisted before Critic review.
- `.orchestration/reviews/CF-I02-critic.md` with independent verdict.
- Updated `.orchestration/STATE.md` with evidence, rework count and next action.

## CRITIC FOCUS

Search actively for missing routes, API-only parity claims, cross-tenant leakage, raw/unbound SQL, inclusive date-end mistakes, duplicate/invalid input gaps, missing UI states, unintended later features, Access/routing bypasses and hidden paid/deployment actions.

## DONE WHEN

All scoped API/UI acceptance criteria are evidenced, the artifact is committed, and an independent Critic returns `PASS` or bounded rework obtains a fresh `PASS`.

