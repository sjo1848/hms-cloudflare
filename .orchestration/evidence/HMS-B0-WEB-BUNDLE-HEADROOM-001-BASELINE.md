# B0 Web Bundle Headroom — Baseline Evidence

Task: `HMS-B0-WEB-BUNDLE-HEADROOM-001`
Base: `3d40b82353ce747d9b79100e0d28e7f9348764fc`
Branch: `impl/hms-b0-bundle-headroom`
Environment: isolated B0 worktree; Node `v24.18.0`; locked npm dependencies installed with `npm ci`.

## Executed evidence

| Command / inspection | Result |
|---|---|
| `npm run web:build && npm run architecture:fitness` | PASS; 67 modules transformed; one emitted JS and one emitted CSS file; unchanged budgets passed. |
| `npx vite build --config .b0-bundle-inventory.config.mjs` (temporary diagnostic-only config, removed afterward) | PASS; route module inventory confirms all statically imported feature routes are included in one emitted JS chunk. |
| PostCSS duplicate-rule inventory over emitted CSS | 4 exact duplicate rule kinds; 290 duplicate extra bytes total. |
| PostCSS duplicate-rule inventory over CSS sources | 63 repeated rule kinds; 4,720 duplicate source bytes; source repetition substantially consolidated in production output. |
| Source inspection `AppShell.tsx` and imports | Static imports for Guests, Housekeeping, Network, Reception, Reports, Rooms and Users; no route-level `lazy()`/dynamic import found. |
| Static selector-name/source-string scan | 27 selector tokens not literal in TS/TSX; includes dynamic/state-derived names, so result is not proof of dead CSS and does not authorize deletion. |
| `git ls-remote origin refs/heads/impl/hms-block-a-shell` | Exact source base exists remotely at `3d40b82353ce747d9b79100e0d28e7f9348764fc`. |

## Exact baseline

| Asset | Raw | Gzip | Existing hard limit | Preferred target | Reduction needed |
|---|---:|---:|---:|---:|---:|
| JS | 299,976 B | 86,915 B | 300,000 / 100,000 B | 285,000 B raw | 14,976 B raw |
| CSS | 48,615 B | 9,193 B | 50,000 / 15,000 B | 45,000 B raw | 3,615 B raw |

The `scripts/check-cloudflare-budgets.mjs` measure is aggregate raw/gzip bytes for all emitted JS/CSS assets. Neither thresholds nor measurement semantics were changed. Splitting the current single JS chunk would not by itself reduce this aggregate total.

## Review and limitations

Read-only bundle diagnosis by Aquinas (separate subagent, GPT-6 Luna LOW) independently found no clear safely removable production JS dead-code candidate; source duplicate CSS is mostly already absent from emitted output. It did not run tests/build and did not edit files. Its conclusion is consistent with the measurements above.

The Vite diagnostic module `renderedLength` values are Rollup module-level instrumentation and exceed final minified output for vendor modules; they are used only to establish module reachability, not byte attribution. The standard production build/checker is the byte authority.

## Disposition

No product code, CSS, build configuration or budget checker was changed. Required savings are not supported by a bounded, behavior-preserving cleanup candidate. Broad route refactoring or aggressive CSS consolidation would require materially more behavioral/responsive verification and is outside this bounded precondition. Stop with `BUNDLE_BUDGET_POLICY_GATE_REQUIRED`; no Block B work has started.
