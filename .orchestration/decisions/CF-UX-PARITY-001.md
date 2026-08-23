# CF-UX-PARITY-001 — UI/UX Parity During Cloudflare Migration

Status: `APPROVED`
Effective from: `CF-I04 REWORK onward`
Scope: HMS Cloudflare parity migration
Source UX canon: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Decision

The Cloudflare migration is an infrastructure/runtime/data/authentication migration of the accepted HMS product. It is **not** an authorization to redesign the product UI/UX.

The accepted source HMS user experience is the canonical parity reference for user-visible product behavior, workflow structure, interaction model and responsive reception journeys unless an explicit later product decision supersedes it.

Cloudflare compatibility may require technical frontend adaptation, but technical adaptation must not be treated as permission to invent a new product experience.

## What the migration DOES require

Frontend work may change what is technically necessary to operate on the target architecture, including:

- authentication/session integration for Cloudflare Access;
- `/api/v1` client wiring and typed error handling;
- internal React/component/state organization;
- build/deployment configuration for Vite/static assets/Workers;
- compatibility changes caused by the new API/runtime/data model;
- test harness, browser evidence and observability hooks;
- bounded accessibility/responsiveness fixes needed to preserve the accepted journeys.

These changes are implementation details unless they materially change the accepted user-visible product contract.

## What the migration DOES NOT require

Do not redesign or replace accepted UX/UI merely because the backend, database, authentication boundary or deployment platform changed.

Without a separate approved product decision, Codex must not:

- replace established reception workflows with newly invented flows;
- materially change navigation/information architecture;
- remove or merge accepted product surfaces for implementation convenience;
- introduce a visually/functionally different workflow and call it migration parity;
- simplify required user interactions in a way that changes domain meaning;
- expand the product with new UX concepts unrelated to parity;
- use incremental UI evidence as justification for creating a second, divergent HMS experience.

## Canonical parity rule

For every user-visible migrated capability, the default question is:

> “Does the Cloudflare version preserve the accepted HMS product experience and behavior?”

not:

> “Can we design a new interface for the same backend capability?”

The source HMS is the reference for:

- reception/workflow sequence;
- accepted surface boundaries;
- labels and interaction semantics where they carry product meaning;
- mobile reception behavior and accepted widths;
- error/validation/success observability;
- check-in, checkout, room, guest, housekeeping, billing, administration and reporting journeys.

Pixel-perfect copying is not required unless a later acceptance criterion explicitly requires it. Internal refactoring and modest visual normalization are allowed when they preserve the accepted product contract and do not create a materially different UX.

## Incremental implementation rule

A Task Contract may require UI/browser evidence for the capability being migrated. This means:

- expose and test the relevant accepted surface;
- preserve its workflow and observable states;
- integrate it into the target frontend;

It does **not** mean:

- redesign that surface from scratch;
- create a temporary parallel UX that later becomes de facto product behavior;
- reinterpret missing implementation as product freedom.

Whenever practical, port/adapt the accepted source surface instead of reinventing it.

## Human Gate rule

A material intentional departure from the accepted source UX/UI is a product decision, not an implementation detail.

ChatGPT must classify a `HUMAN_GATE` before Codex proceeds when a proposed change would materially alter:

- workflow sequence or operational meaning;
- navigation/information architecture;
- required product surface;
- role-visible behavior;
- mobile interaction model;
- user-facing product scope.

Minor implementation-preserving visual adjustments, accessibility fixes, responsive corrections and technical adaptation do not require a Human Gate.

## Critic obligations

Independent Critic reviews must challenge both directions of drift:

1. **missing parity** — the target omits or weakens an accepted source journey/surface;
2. **unauthorized redesign** — the target introduces materially different UX/UI without an approved product decision.

UI evidence must therefore be evaluated against the source parity inventory and source HMS, not only against the newly written target component.

## Relationship to other decisions

This decision reinforces, and does not replace:

- `CF-ARCH-001` — target Cloudflare architecture;
- `CF-DATA-001` — control-plane D1 + per-hotel operational D1;
- `PM-AUTONOMY-001` — autonomous Codex execution;
- the migration design objective: parity before feature expansion.

If a future product redesign is desired, treat it as a separate post-parity product initiative or explicit Human Gate, not as hidden migration work.
