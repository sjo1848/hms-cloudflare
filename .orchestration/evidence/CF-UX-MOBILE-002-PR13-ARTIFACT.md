# CF-UX-MOBILE-002 — PR13 artifact evidence

Artifact under review: `2170b711a87b4ce7ba8b30ac472481049c0e9de0`
Branch: `ux/hms-reports-admin`
Base candidate: `deploy/staging` (includes the separately accepted payment, Rooms/Guests, Housekeeping/Maintenance batch and manual-only staging deploy gate).
Scope: Reports, Users administration and Hotel network presentation/interaction plus bounded Network rejected-plan UI recovery.

## Executable evidence

- Foundation CI `33137425712`: PASS.
- UX mobile browser CI `33137425715`: PASS.
- Browser artifact `9672578298`: `sha256:a3582bb73100e7b731a280145494c3703f171dc9b88ca9eac9ad20b500320476`.
- Contracted widths: 375, 390, 430, 1366.

## Real-API coverage

The admin browser harness does not replace successful Reports/Users/Network API responses with mocks. It uses the local Worker/D1 path and exact seeded Access subjects.

- Reports: loading, invalid range -> error + Retry, valid zero-occupancy calendar representation, restored success.
- Users: loading, search empty state, user detail open/close.
- Network: loading, filter empty state, successful plan update, rejected plan rollback, analytics refresh.

Request delay uses Playwright `route.fallback()` so the actual API continues to serve the request. The only synthetic response is a bounded 409 on the Network plan negative path; it exists to prove that the UI does not retain an optimistic plan rejected by the server.

## Functional repair

`Network.updatePlan` snapshots the authoritative property from the loaded hotel collection. If PATCH fails, it restores that object before surfacing the error. A failed/concurrent plan update therefore cannot leave the selected property showing an unaccepted plan.

## Scope proof

PR13 changes no API implementation, D1 schema/migration, RBAC/authentication implementation, production/cutover configuration or paid-resource settings. Staging deployment remains separate and manual-only. Product Acceptance remains pending.
