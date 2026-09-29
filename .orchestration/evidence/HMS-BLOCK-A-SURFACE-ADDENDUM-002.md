# Block A — Built-bundle browser evidence addendum

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001.md`.

## Proposed test surface

`PROPOSED NEW SURFACE`: `scripts/cf-block-a-shell-built.playwright.js`, executed by `scripts/cf-f0-10-capabilities-integrated.sh` against Vite's locally served production build.

## Why this is required

The shell browser matrix originally ran through Vite development mode. The existing Cloudflare raw-JS budget is close to its ceiling, so the final browser regression additionally exercises the Terser-minified build to detect output-only behavior differences. The preview server serves local `apps/web/dist`; Playwright forwards only `/api/v1/*` traffic to the real disposable local Worker/D1. No API responses are mocked, no remote data is accessed, and no deployment occurs.

Assertions cover the WIDE grouped shell, route/history/query/hash, server-capability route denial, and NARROW primary/More navigation, Escape and focus restoration. Existing dev-mode browser coverage remains responsible for profile switching, identity/hotel context and same-subject capability downgrade.
