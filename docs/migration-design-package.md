# HMS Cloudflare — Migration Design Package

Status: `DESIGN — READY_FOR_INDEPENDENT_REVIEW`  
Project: `HMS Cloudflare`  
Global Project Mode: `DELIVERY`  
Source baseline: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`  
Target repository: `sjo1848/hms-cloudflare`  
Source parity artifact: `docs/source-contract-inventory.md`  
Tenant decision: `CF-DATA-001 — APPROVED OPTION B`

This repository copy is the portable review artifact for Codex. The durable governance copy remains in the HMS Cloudflare Drive folder. If a later canonical governance decision supersedes this artifact, update both sources and record precedence explicitly.

## 1. DESIGN OBJECTIVE

Migrate the accepted HMS product to Cloudflare infrastructure while preserving observable product behavior, domain semantics and material safety guarantees. This is a parity migration first; it is not a product-feature expansion.

The source HMS remains read-only reference.

## 2. INHERITED PRODUCT JOURNEYS

The migration must preserve the accepted product journeys documented in `docs/source-contract-inventory.md`, including:

- Reception: reservation/walk-in → guest and room context → check-in verification → stay operations → charges/payments → checkout → housekeeping handoff.
- Rooms: inventory, availability, operational status, holds and maintenance.
- Guests: guest records and booking context.
- Housekeeping: dirty/cleaning/maintenance/release transitions.
- Billing: extra charges, invoices, payment entries, settlement and cash closure.
- Administration: users, capabilities/RBAC, hotel administration and audit.
- Reporting: dashboard KPIs, occupancy and revenue reports.
- Multi-hotel: hotel-scoped operation plus authorized network-level administration/KPIs.
- Mobile: reception journeys must remain usable at the accepted mobile widths and interaction model.

The source inventory independently verified `51 / 51 / 51` routed/OpenAPI/inventoried `/api/v1` operations.

## 3. EXPECTED SURFACES

- UI: React + TypeScript browser application, including mobile reception.
- API: versioned same-origin `/api/v1` REST surface.
- Authentication boundary: Cloudflare Access.
- Application authorization: HMS roles/capabilities and hotel membership.
- Persistence: Cloudflare D1 with explicit relational/domain invariants.
- Operations: health/readiness, logs/observability, migrations, rollback/recovery evidence.
- Validation: unit/integration/contract tests, browser journeys, security regressions and CI.

API-only evidence does not satisfy a required UI surface. Mock-only evidence does not satisfy real integration requirements.

## 4. TARGET TOPOLOGY

```text
Browser
  |
Cloudflare Access
  |
  +-- /api/* -> API Worker (Hono + TypeScript)
  |              |
  |              +-- CONTROL_DB
  |              |     identities
  |              |     hotels
  |              |     memberships / roles
  |              |     routing metadata
  |              |
  |              +-- HOTEL_<tenant>_DB
  |                    rooms
  |                    guests
  |                    bookings
  |                    room holds / inventory nights
  |                    billing
  |                    housekeeping
  |                    audit
  |                    other hotel-scoped operational data
  |
  +-- /* -> Static frontend Worker (React + Vite assets)
```

The public hostname remains same-origin. More-specific `/api/*` routing reaches the API Worker; the remaining routes reach the static frontend Worker.

The API Worker derives authenticated identity from Cloudflare Access, maps it to HMS application membership/role, resolves the authorized hotel context and only then obtains/uses the appropriate operational D1 binding.

## 5. CF-DATA-001 — ACTIVE TENANT TOPOLOGY

Selected: `Option B — control-plane D1 + one operational D1 per hotel`.

Decision record: `.orchestration/decisions/CF-DATA-001.md`.

Security intent:

- physical database separation is the primary replacement for PostgreSQL RLS at the operational tenant-data layer;
- a query against one hotel's operational D1 cannot directly read another hotel's operational D1;
- network-level capabilities must be explicit and separately authorized;
- application authorization remains mandatory even with physical DB separation.

Control-plane responsibilities must remain narrow: identity mapping, hotel identity, memberships/roles and routing metadata. Do not move ordinary hotel operational records into CONTROL_DB merely for convenience.

Critical atomic operations must remain within one operational hotel D1. Do not design business correctness around cross-D1 atomic transactions.

## 6. FREE-TIER / COST BOUNDARY

The operating target is `$0/month / Cloudflare Free` during this stage.

No runtime, worker, automation or implementation decision may automatically:

- enable Workers Paid;
- move to a paid D1 tier/plan;
- provision another paid data service;
- introduce a material recurring-cost dependency.

Any such transition requires a separate Human Gate with current limits/costs, alternatives, rationale and impact.

Free-tier capacity is an explicit growth boundary. Hitting that boundary must produce a cost/architecture Human Gate, not silent payment and not a security downgrade.

## 7. AUTHENTICATION ADAPTATION

Cloudflare Access replaces the source username/password + Argon2/JWT mechanism as the primary authentication boundary.

HMS continues to own:

- application user/membership mapping;
- role and capability semantics;
- hotel membership;
- backend authorization.

`GET /api/v1/auth/me` remains the application bootstrap contract and returns the current HMS identity/membership/role context derived from Access identity.

Source native `/api/v1/auth/login`, `/refresh` and `/logout` are compatibility exceptions. The normal target runtime must not depend on the source credential/refresh-token mechanism.

The frontend `AuthProvider` and 401 flow must be adapted accordingly. Product authorization stays inside HMS.

## 8. CRITICAL INVARIANTS

### Tenant isolation

One hotel must never read or mutate another hotel's operational data unless the caller uses an explicit, authorized network-level capability.

### Relational integrity

Cross-hotel references between bookings, rooms, guests, users/memberships, invoices, charges, payments and operational records must be impossible by topology/schema or explicitly rejected.

Because operational records are per-hotel DB, ordinary operational foreign keys remain local to that database. The control-plane hotel identity used to route must be verified before operational access.

### Booking overlap

Two active/non-cancelled bookings must not occupy the same room-night.

### Lifecycle integrity

Check-in, checkout, room reassignment and housekeeping transitions remain domain operations, not generic CRUD.

### Financial integrity

Money remains integer cents. Charge/payment/settlement/cash-close mutations must be atomic at the business-operation boundary.

### Authorization

Frontend guards supplement backend enforcement; they never replace it.

### API compatibility

Preserve `/api/v1` paths, methods, typed error behavior and request-correlation semantics wherever the product contract has not intentionally changed. The native authentication mechanism is the explicit exception.

### Auditability

Risk-relevant mutations retain actor/hotel/request traceability.

### Release boundary

No real-data migration or production cutover occurs during parity BUILD.

## 9. POSTGRESQL → D1 SEMANTIC MAP

- UUID → `TEXT` IDs generated with `crypto.randomUUID()` or equivalent deterministic target convention.
- BIGINT money → SQLite/D1 `INTEGER` cents. Never floating-point money.
- DATE → ISO `YYYY-MM-DD` text with domain validation.
- TIMESTAMPTZ → normalized UTC timestamp representation.
- JSONB → validated JSON stored using a D1-compatible representation; JSON functions only where useful and tested.
- Foreign keys → D1/SQLite foreign keys retained inside each database.
- PostgreSQL historical migrations → do not replay literally. Create a fresh D1 baseline representing the current accepted domain plus a semantic migration map.
- PostgreSQL RLS → replaced at the operational layer by CF-DATA-001 physical per-hotel D1 separation plus backend authorization/routing enforcement.
- PostgreSQL GiST active-booking exclusion → explicit room-night inventory uniqueness.
- Tenant-scoped uniqueness → preserve within each hotel DB; control-plane uniqueness must be scoped deliberately where relevant.

## 10. ROOM-NIGHT OVERLAP DESIGN

Use a `room_inventory_nights` table for active occupancy claims.

Each active/non-cancelled booking claims one row per occupied night. A unique/primary constraint on room identity + `stay_date` makes overlapping active bookings fail at the database layer.

Booking creation, date changes, room reassignment and cancellation must update booking + room-night claims atomically inside the hotel operational D1.

Concurrency/regression tests are required. Availability UI/API checks are not sufficient evidence by themselves.

## 11. CONTROL-PLANE / HOTEL-DB BOUNDARY

CONTROL_DB may contain:

- Access identity mapping;
- hotel registry/identity;
- memberships;
- roles/capability assignment metadata where appropriate;
- operational DB routing metadata;
- narrow network-administration metadata.

Operational hotel D1 contains ordinary hotel business data.

A request path must follow this conceptual sequence:

1. authenticate via Access;
2. resolve HMS identity;
3. authorize requested capability;
4. resolve allowed hotel context;
5. select the bound hotel operational DB;
6. execute domain operation;
7. emit audit/request trace evidence.

Never trust a client-supplied hotel identifier as authorization by itself.

## 12. NETWORK-LEVEL CAPABILITIES

Network administration/KPIs are an explicit cross-hotel surface from the source product.

They must not be implemented by weakening ordinary hotel isolation.

Allowed design direction:

- authorize a distinct network-level capability;
- enumerate only hotels visible to that network actor from CONTROL_DB;
- perform bounded fan-out/aggregation or maintain explicitly designed derived network data;
- preserve traceability and error handling.

Exact aggregation mechanics are implementation-owned only if they remain within Free-tier/cost constraints and preserve accepted network behavior.

## 13. API COMPATIBILITY

`docs/source-contract-inventory.md` is the durable parity reference.

- Keep `/api/v1` as frontend base URL.
- Preserve source endpoint behavior wherever the underlying product contract is unchanged.
- Preserve typed errors and request correlation where practical.
- `/auth/login`, `/auth/refresh`, `/auth/logout` are intentional mechanism exceptions.
- `/auth/me` remains required application bootstrap.
- Contract tests must compare representative source behavior to target behavior before capability closure.

## 14. IMPLEMENTATION INCREMENTS

### CF-I01 — Platform foundation

- Workers topology;
- Cloudflare Access identity adapter;
- application membership/role bootstrap;
- CONTROL_DB + one representative hotel operational D1 baseline;
- tenant routing boundary;
- health/readiness;
- test harness and CI;
- cost/free-tier guardrails where enforceable/documentable.

### CF-I02 — Rooms, guests and room holds

### CF-I03 — Bookings, availability and room-night overlap protection

### CF-I04 — Reception lifecycle

Reservations/walk-ins, check-in, checkout and room reassignment.

### CF-I05 — Housekeeping and maintenance

### CF-I06 — Billing

Charges, invoices, payments, settlement and cash closure.

### CF-I07 — Users/RBAC/audit, hotels and network-level administration

### CF-I08 — Analytics/reports and integrated desktop/mobile journeys

### CF-I09 — Data migration rehearsal, operational-readiness evidence and Product Acceptance preparation

Every increment requires its own Task Contract, independent Critic and integration evidence where applicable.

## 15. DECISION LATITUDE

Implementation-owned decisions may include:

- file/module layout;
- helper abstractions;
- query-builder choice;
- test organization;
- index naming;
- non-contractual internal representations;
- bounded network aggregation mechanics that preserve security/cost/product constraints.

Implementation may not autonomously change:

- Cloudflare Access boundary;
- React/Vite + Hono/Workers + D1 target;
- `/api/v1` compatibility objective;
- parity-first scope;
- CF-DATA-001 Option B topology;
- Free-tier/no-paid-without-gate boundary;
- money semantics;
- booking-overlap guarantee;
- lifecycle semantics;
- required product surfaces;
- Human Product Acceptance boundary.

## 16. REQUIRED TRACEABILITY

For every material capability preserve:

`Requirement → Expected Surface → Acceptance → Evidence`

Representative examples:

- Reservation creation → Reception UI + `/api/v1/bookings` + hotel D1 → valid booking persists once and invalid overlap fails → browser + integration + DB-invariant evidence.
- Check-in → Reception UI + lifecycle API → accepted checklist transitions booking without unintended chaining → browser journey + contract test.
- Tenant isolation → Access/HMS auth + routing + D1 → unauthorized cross-hotel read/write/reference attempts fail → security regression + routing/schema evidence.
- Payment → Reception/billing UI + API + hotel D1 → amount, invoice balance and cash state remain coherent → integration + atomicity evidence.

## 17. DESIGN REVIEW FOCUS

The Independent Critic must explicitly challenge:

- whether physical per-hotel D1 isolation is consistently applied or accidentally bypassed by CONTROL_DB design;
- whether tenant resolution can be influenced by untrusted client input;
- whether network-level functionality silently reintroduces cross-tenant exposure;
- whether any required source journey/surface is orphaned;
- whether room-night uniqueness really substitutes the source overlap guarantee;
- whether financial operations rely on cross-D1 atomicity;
- whether auth adaptation preserves backend authorization and `/auth/me` semantics;
- whether any implementation increment implies paid Cloudflare usage without a Human Gate;
- whether the selected topology is feasible to validate locally/CI before production.

## 18. DESIGN EXIT CRITERIA

DESIGN may close only when:

- critical journeys and expected surfaces are explicit;
- source baseline and target architecture are explicit;
- authentication adaptation is explicit;
- tenant, overlap, lifecycle, financial and authorization invariants are explicit;
- D1 semantic translation is explicit;
- CF-DATA-001 Option B is integrated consistently;
- Free-tier/cost boundary is explicit;
- implementation increments and Decision Latitude are explicit;
- independent Design Critic returns `PASS`, or bounded REWORK is completed and a fresh Critic returns `PASS`.

Only then may `CF-I01` BUILD begin.
