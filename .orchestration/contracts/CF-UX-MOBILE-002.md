# CF-UX-MOBILE-002 — Complete responsive UX batch

## Objective

Complete the contracted responsive/mobile UX surfaces while preserving HMS Elite intent, API contracts, authorization and business behavior.

## In scope

- Rooms and Guests: list, search, selection, forms, holds, loading/error/empty/retry states.
- Housekeeping: responsive board, focused mobile task, stable date, safe mutations and stale-response isolation.
- Reports, Users and Network: responsive presentation, states, actions and accessibility.
- Payment submission safety: idempotent retries and protection against duplicate payments.
- Desktop/mobile validation at the existing contracted widths.

## Out of scope

New product workflows, authentication redesign, production changes, paid resources, intermediate Cloudflare deploys, and any API/D1/RBAC/domain change outside the reviewed payment idempotency work.

## Acceptance

- Foundation and browser CI pass on the integrated head.
- Browser evidence covers the named surfaces, responsive controls, asynchronous races and payment retry behavior.
- Existing tenant, RBAC, domain and Cloudflare behavior remains preserved.
- Independent Critic reviews the immutable integrated artifact before deployment.
- After one deliberate staging deploy, Human performs remote Product Acceptance.

## Forbidden

No intermediate Cloudflare deploy, production change, paid resource, or self-approval.
