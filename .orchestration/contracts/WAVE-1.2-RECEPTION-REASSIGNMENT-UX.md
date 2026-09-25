# TASK CONTRACT — WAVE-1.2-RECEPTION-REASSIGNMENT-UX

TASK ID: `WAVE-1.2-RECEPTION-REASSIGNMENT-UX`
PROJECT: `HMS Cloudflare`
PHASE: `BUILD`
BRANCH: `impl/wave-1.2-reception-reassignment-ux`
BASE ARTIFACT: `9ed9ebc1a42cd13096d526c4d621140f9d3d6a3b`
STATUS: `READY / AUTHORIZED`

## Objective and authority

Complete the Reception UI workflow for a checked-in guest room reassignment
using the existing queue/selected-case workspace. The backend command from
Wave 1.1 remains authoritative. The UI must make destination eligibility,
price impact, reason, submit state, success and conflict recovery operationally
clear without exposing D11/inventory internals.

Use existing Reception, i18n, API client, CSS and browser patterns. Do not
redesign navigation, Reports, Users, D11, or create another backend layer.

## Binding acceptance

- Reassignment is visible only for CHECKED_IN selected bookings.
- Destination options reflect the authoritative availability range and current
  physical room state; BLOCKING maintenance/invalid physical states cannot be
  selected. NON_BLOCKING maintenance is an advisory when the existing board
  contract exposes it.
- The surface keeps guest, current room, stay dates and checkout context.
- Estimated current/new total and difference use integer cents and existing
  extra charges; no payment entries are fabricated.
- Reason is required and trimmed length >= 6; invalid submit is blocked locally
  while backend validation remains authoritative.
- Submit prevents double submission and never applies optimistic reassignment.
- Success refreshes the Reception queue/selected context without losing queue
  filter/search state and reflects destination/old-room state.
- 409 responses produce operational guidance and preserve the surface for
  retry after refreshed data.
- Desktop and mobile browser paths cover selection, price summary, reason,
  submit, validation, conflict and success; focus/labels/keyboard behavior are
  usable.

## Invariant mapping

- `INV-ATOMIC-001` APPLIES — UI must not claim success before authoritative API response.
- `INV-AUDIT-001` APPLIES — success/error copy must correspond to API result only.
- `INV-DOMAIN-001` APPLIES — only the lifecycle reassignment command is used.
- `INV-TENANT-001` APPLIES — all room/booking data comes from tenant-scoped APIs.
- `INV-RBAC-001` APPLIES — backend remains authoritative; UI visibility is convenience.
- `INV-PARITY-001` APPLIES — preserve Reception workflow/context and V11 details.
- `INV-ENUM-001` APPLIES — use canonical API room/booking status labels through i18n.
- `INV-UX-001` APPLIES — this wave is the material Reception workflow.
- `INV-RESP-001` APPLIES — mobile reassignment controls are exercised, not shell-only.
- `INV-EVID-001` APPLIES — mock and integrated browser evidence are labeled precisely.
- `INV-LEGACY-001` N/A — no legacy synthesis.
- `INV-MONEY-001` APPLIES — integer-cent display and no payment mutation.
- `INV-STATE-001` APPLIES — artifact and orchestration boundary are non-circular.
- `INV-ORDER-001` N/A — no new queue ranking.
- `INV-CF-I07-001..004` N/A — no admin/network route changes.
- `INV-CF-I08-001..005` N/A — Reports is out of scope.
- `INV-SCOPE-001` APPLIES — only Reception reassignment UX/UI and necessary tests.

## Forbidden actions

No Reports/Users repair, global navigation redesign, D11/backend redesign,
optimistic room mutation, payment-entry change, deploy, staging/main merge or
production action. If the existing API cannot expose a required UI fact,
record a concrete backend-gap finding and make the minimum contract-aligned
change only if the workflow cannot otherwise be truthful.

## Boundary

Stop at the Wave 1.2 Controller checkpoint after implementation, targeted
browser/mobile QA, Pre-Critic evidence and orchestration reconciliation. Do
not manufacture Independent Critic completion.
