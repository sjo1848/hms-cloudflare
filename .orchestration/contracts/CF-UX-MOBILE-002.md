# CF-UX-MOBILE-002 — HMS full operational surfaces

## Objective
Extend the HMS Elite visual language and mobile interaction model from Reception to all existing application surfaces, preserving business behavior and tenant/RBAC boundaries.

## Workstreams
- Rooms and availability
- Guests
- Housekeeping and maintenance
- Reports
- Users and memberships
- Network and multi-hotel administration

## Required behavior
- Every existing route loads through the authenticated staging contract.
- Each surface has a coherent desktop layout and a focused mobile workflow.
- Forms, dialogs, selections, loading, empty, validation and error states are usable at 375/390/430 px.
- Existing API contracts, permissions, statuses, calculations and mutations remain unchanged.
- No new product capability is invented.

## Branch boundaries
- ux/hms-rooms-guests: Rooms, availability and Guests.
- ux/hms-housekeeping: Housekeeping and maintenance.
- ux/hms-reports-admin: Reports, Users and Network.
- ux/hms-full-surfaces: integration branch only; no direct feature work.

## Gates
Each workstream requires CI, browser regression and independent critic review. Integration requires all workstream PASS results. One deliberate staging deployment occurs only after integration PASS, then the Human performs remote Product Acceptance with ACCEPT or REWORK.

## Deployment guard
No intermediate Cloudflare deploys. No D1 migration or schema change is in scope.
