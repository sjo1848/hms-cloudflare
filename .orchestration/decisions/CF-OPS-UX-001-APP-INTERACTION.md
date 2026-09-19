# DECISION — CF-OPS-UX-001 — APP INTERACTION

Status: `BINDING DEFINITION / IMPLEMENTATION LOCKED`

The accepted HMS operational domain remains unchanged. This decision expands the UX definition before implementation.

Binding decisions:
1. HMS uses a persistent application shell; module work transitions inside it.
2. Desktop operational work favors master/detail; mobile favors focused full-screen task surfaces.
3. Multi-step context work uses drawer/full-screen sheet; destructive/material confirmation uses product dialog; low-risk metadata uses compact dialog/popover; success may use toast.
4. Native browser confirm/alert is not accepted product UX.
5. Core mobile operations use direct primary navigation; hamburger-only access is insufficient for Reception/Rooms/Guests/Housekeeping.
6. Filters/search/selection/history are application state and survive ordinary refresh/mutation/Back-Forward under `21`.
7. Reception-selected booking exclusively governs embedded Billing.
8. Known authoritative data remains visible during refresh; first load uses skeletons; conflicts keep task context and never auto-replay mutation.
9. Motion is short, functional, progressively enhanced, reduced-motion aware and must not require a heavy animation framework.
10. `21-app-interaction-contract.md` and E2E-21 are required browser acceptance authority.

Consequence: A7/B7 and HG-OPS-EXTCRITIC-001 are superseded as final-definition targets because the user intentionally expanded UX scope after publication. A fresh immutable artifact/review is required after UX reconciliation. Product implementation remains locked.
