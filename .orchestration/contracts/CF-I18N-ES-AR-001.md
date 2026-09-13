# CF-I18N-ES-AR-001 — Full application internationalization

## Objective
Internationalize the HMS web application without changing product/domain behavior. `es-AR` is the default product locale because the initial target market is Argentina. English remains a selectable alternative.

## Immutable baseline
- Product-accepted artifact: `e6fc4dd0eb42d0eca172932f13daf768160ccbc9`
- Recovery branch: `backup/architecture-hardening-ii-2026-08-29`
- Controller working branch: `controller/i18n-es-ar-completion`
- Integration PR: `#25`

The earlier `feature/i18n-es-ar` branch and PR #24 are superseded as active orchestration surfaces. Their implementation was preserved at controller takeover; the accepted baseline did not change.

## Required behavior
1. First visit defaults to `es-AR` regardless of browser language unless a previously persisted supported locale exists.
2. User can switch between `Español (Argentina)` and `English` from the persistent App Shell.
3. Locale selection persists in localStorage and survives route changes/reloads.
4. `<html lang>` follows the active locale.
5. All normal end-user web surfaces are localized: shell/navigation, Reception, Billing, Rooms, Guests, Housekeeping/Maintenance, Reports, Users, Network, shared async states, prompts/confirms and frontend-owned feedback.
6. Canonical API/domain values MUST NOT be translated before persistence or transport. Translation is presentation-only for booking/room statuses, roles, payment methods, priorities, invoice states and plan labels.
7. `es-AR` presentation uses Argentine locale conventions for currency/time/date where values are rendered as presentation text. ISO values used by form controls and API payloads remain unchanged.
8. Backend/API contracts, D1 schema/topology, Access/RBAC, lifecycle/concurrency semantics and Product Flow MUST remain unchanged.

## Architecture
Use the application-owned typed i18n boundary under ADR `.orchestration/decisions/CF-I18N-001.md`. The choice is deliberate rather than an accidental departure from the initial `i18next`/`react-i18next` preference.

The i18n boundary must provide:
- active locale + persisted setter;
- typed message lookup and interpolation;
- typed plural selection backed by `Intl.PluralRules`;
- physically separated feature namespaces with exact locale parity;
- locale-aware currency/date/time formatting;
- presentation-only labels for canonical status/role/payment/priority values;
- localized HTTP error fallback without mutating API status semantics.

## Compatibility / regression strategy
Historical browser/product-flow regressions that assert legacy English text MUST explicitly select/persist `en` before page bootstrap. A new i18n regression MUST independently prove:
- clean storage -> Spanish default;
- shell and representative surfaces render Spanish;
- switch to English updates UI and `<html lang>`;
- reload preserves English;
- switch back to Spanish persists;
- navigation remains SPA and no horizontal overflow at 375/390/430 px.

The real integral Product Flow MUST execute the primary create/edit/cancel/check-in/reassign/checkout/housekeeping path in `es-AR`, with an explicit bilingual smoke proving English switching and persistence.

## Gates
1. i18n foundation + catalog parity.
2. Full surface migration.
3. i18n coverage guard.
4. Foundation/typecheck/unit/build/Architecture Fitness PASS.
5. UX/mobile + Product Flow + historical regressions PASS.
6. exact-artifact Pre-Critic PASS.
7. fresh Independent Critic PASS.
8. controlled integration + post-merge exact-SHA verification.
9. deliberate staging promotion/deploy.
10. Human Product Acceptance for bilingual behavior.

## Non-goals
- No backend response translation layer.
- No production/cutover.
- No database migration.
- No business rule changes.
- No automatic browser-language negotiation overriding the Argentina-first default.
