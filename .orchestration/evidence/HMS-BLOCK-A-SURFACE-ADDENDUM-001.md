# Block A — Proposed Test Surface Addendum

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001.md` (frozen before implementation).

## Proposed new surface

`PROPOSED NEW SURFACE`: `scripts/cf-block-a-shell.playwright.js` — Playwright CLI `run-code` browser flow, invoked by the existing local Worker/D1 capability fixture runner `scripts/cf-f0-10-capabilities-integrated.sh`.

## Why this is required

The existing browser runners inspected before implementation do not assert the exact Block A shell matrix: WIDE/COMPACT/NARROW composition, direct route/hash/reload, Back/Forward scroll/context, More/secondary mobile navigation, capability-guarded direct routes and UI-triggered 403 → authoritative `/auth/me` refresh. This proposed file adds executable coverage only; it does not change application/API authority, data model, or test dependency policy. Its fixture mutations are disposable local D1 identities/rooms only. The existing runner owns and verifies cleanup of Worker, Vite and browser processes.

Implementation may create this test file; no new production client/API file is proposed by this addendum.
