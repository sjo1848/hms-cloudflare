# CF-UX-MOBILE-002 — PR13 artifact evidence

Artifact under review after Critic REWORK-1: `e88a3a855581498154aaa0d782750e5cc8b97b46`
Branch: `ux/hms-reports-admin`
Scope: responsive Reports, Users administration and Hotel network plus Network rejected-plan state recovery and complete browser action coverage.

## Executable evidence

- Foundation CI `33137698493`: PASS.
- UX mobile browser CI `33137698486`: PASS.
- Browser artifact `9672681117`: `sha256:8d486b474da4cf165435a6a93cfb80379c507511d861b86f5e0b42192bc7f422`.
- Widths: 375, 390, 430, 1366.

## Material workflows now proven

Reports: loading -> successful data; invalid date range -> visible error + Retry; valid no-booking range -> authoritative zero occupancy; restore normal range -> success.

Users: loading; search empty; create membership through real API; duplicate create -> visible error; Retry reload; role update; deactivation. Each contracted width executes the material actions.

Network: loading; filter empty; successful real plan PATCH; bounded 409 negative-path injection; rejected optimistic selection restores authoritative plan; Retry reload; analytics refresh. Each contracted width executes the material actions.

## Transport policy

Successful Reports/Users/Network data is never response-mocked. Request delays use `route.fallback()` and end at the actual local API. The sole injected response is the Network plan 409 used to prove negative-path UI recovery.

## Product change

`Network.updatePlan` snapshots the authoritative hotel from the loaded collection and restores it on PATCH failure. No API contract or server mutation semantics are modified.

## Scope proof

No API implementation, D1 schema/migration, RBAC/authentication implementation, production/cutover configuration or paid resource is changed by PR13. Staging deployment is manual-only and remains pending.
