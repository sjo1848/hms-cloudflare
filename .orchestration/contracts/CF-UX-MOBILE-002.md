# CF-UX-MOBILE-002 — Rooms + Guests

Status: ACTIVE / bounded rework of PR #11

## Objective

Complete the Rooms and Guests responsive UI workstream while preserving the existing HMS Elite visual language and all existing API, D1, RBAC, tenant, and domain semantics.

## In scope

- Rooms list, search, selection, creation, edit, and operational holds.
- Guests list, search, selection, and creation.
- Desktop/mobile responsive layouts at the existing contracted widths.
- Explicit loading, empty, error, retry, success, and disabled states.
- Repair of PR #11 findings:
  - capture the form before asynchronous work;
  - use the existing light-theme palette;
  - correlate hold requests and responses with the selected room.

## Out of scope

- API, D1 schema, migrations, authentication, RBAC, domain rules, routes, and deployment.
- Reception, Housekeeping, Reports, Users, and Network behavior except for regression protection.
- New product workflows or changes to the HMS Elite source semantics.

## Acceptance and evidence

- Typecheck, build, existing tests, and browser CI pass.
- Successful hold creation resets the captured form without converting success into an error.
- Selecting room B while room A is loading never displays A's holds under B; stale success/error/finally handlers cannot overwrite B's state.
- Rooms and Guests remain readable on the existing light theme at desktop and mobile widths.
- No deploy occurs from this workstream.

## Applicable invariants

- INV-UX-001: APPLIES — preserve Rooms/Guests workflow and interaction semantics.
- INV-RESP-001: APPLIES — material list, selection, forms, holds, and retry controls require responsive evidence.
- INV-EVID-001: APPLIES — claims are limited to named CI/browser evidence.
- INV-SCOPE-001: APPLIES — this branch remains limited to Rooms + Guests.
- INV-TENANT-001: N/A — no API or tenant-routing changes.
- INV-RBAC-001: N/A — no backend capability changes.
- INV-DOMAIN-001: N/A — no domain transition implementation changes.
- INV-ATOMIC-001: N/A — no business mutation implementation changes.
- INV-AUDIT-001: N/A — no audit/event implementation changes.
- INV-MONEY-001: N/A — no financial behavior changes.
- INV-STATE-001: APPLIES — artifact and publication boundary remain separate commits.

## Gate

After implementation and CI, publish the immutable artifact and invariant evidence for Independent Critic review. Do not merge or deploy this PR automatically.
