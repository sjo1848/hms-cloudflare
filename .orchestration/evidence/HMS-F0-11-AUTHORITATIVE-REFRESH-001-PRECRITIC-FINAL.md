# F0.11 Final Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-11-AUTHORITATIVE-REFRESH-001.md`
Invariant mapping: `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-INVARIANTS.md`
Integrated local proof: `.orchestration/evidence/HMS-F0-11-AUTHORITATIVE-REFRESH-001-INTEGRATED.md`

## 1. Contract completeness and source parity

- PASS: frozen F0.11 contract identifies concrete Rooms, Billing and Reception stale-read defects and preserves existing Housekeeping request-generation behavior.
- PASS: final product diff remains confined to UI read ordering, selection identity, visible read failure/recovery and existing minifier settings. The sole extra fixture change, `scripts/p0-1-seed-local.mjs`, populates existing room housekeeping/service dimensions explicitly for synthetic Worker/D1 setup; it does not change product behavior or schema. No API/schema/migration, backend command, Cash/Shift, Reports, Users, F0.12 or Blocks A–H work.
- PASS: no source domain rule, queue priority, lifecycle transition or enum behavior changed. No product-policy decision is guessed.

## 2. Conditional mutation / concurrency

- PASS: F0.11 adds no backend conditional writes. Read response generations are tied to current component selection; a delayed Rooms read cannot overwrite the latest result, Billing account results are committed atomically only for the active request, and a Reception detail result is guarded by both queue and selection generations.
- PASS: deterministic deferred-response browser cases in `scripts/cf-f0-11-refresh-races.playwright.js` assert late results, each Billing subread failure, Reception detail 200/404/500 behavior, a selected-booking switch during a delayed detail read, and Housekeeping failed post-mutation refresh/recovery. Output `output/playwright/f0-11-refresh-races.log` is MOCK ONLY.
- PASS: local integrated Reception mutation and authoritative board reread are separate HTTP responses (200/200); D1 verifies persisted state and one truthful CHECK_IN event. No optimistic domain state is asserted as persisted success.

## 3. Security / tenant / authorization

- PASS: no authorization source, capability, binding selection or API route changed. Integrated proof uses only local synthetic hotel identity/tenant. API dry-run lists configured local bindings only; no remote binding mode used.
- PASS: CF-I03, CF-I04 and CF-I05 security/lifecycle regressions pass, including prior tenant/RBAC assertions. No claim that F0.11 newly re-certified every authorization matrix.

## 4. UX, response widths and built bundle

- PASS: integrated check-in uses mobile 375×812 and desktop 1280×900 on separate fresh synthetic Worker/D1 fixtures; both preserve Reception lane/search, confirm authoritative CheckedIn status, and advance to the expected `z-priority` case.
- PASS: built/minified Rooms workflow executes local Worker/D1 mutation plus authoritative GET at 375×812 and 1280×900, retaining search. This also exercises Terser output with `pure_getters: true`; no other unsafe compression option or property mangling was added.
- PASS: mock deferred races at 1280×900 assert workspace-level error/recovery and identity behavior. Claims are explicitly limited to mock, local Worker/D1, or D1 regression evidence as appropriate.

## 5. Failure and recovery evidence

- PASS: Billing failed invoice, payment, or charge subread clears stale/partial account snapshot, visibly reports error, and succeeds after explicit refresh.
- PASS: Reception clears selection only after detail 404; detail 500 retains context and surfaces error; 200 updates identity; late A response cannot overwrite newer B selection.
- PASS: Housekeeping failed authoritative post-action reread retains the selected task and exposes error; explicit board refresh reconciles state.
- PASS: no arbitrary sleeps, inflated timeouts, or blind retry was added. Two harness defects found during testing (unfulfilled `route.fetch()` proxy and reuse of a fixture already mutated by check-in) were corrected by routing with `route.continue()` and using a fresh isolated fixture. No product finding remains from those attempts.

## 6. Exact validation

- `npm run check`: PASS, 33 test files / 168 tests.
- `npm run types:check`: PASS (API and web Wrangler types current).
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS (architecture I/II, i18n coverage, Cloudflare budgets).
- Budget: JS raw 299,982 / 300,000 bytes (18 bytes headroom), gzip 86,293; CSS raw 43,399, gzip 8,383. The narrow raw margin is an explicit risk, not a waived ceiling.
- `npm run test:d1-query-plan`: PASS (arrival, checkout and inventory indexes).
- Explicit `npx wrangler deploy --dry-run -c apps/api/wrangler.jsonc`: PASS.
- Explicit `npx wrangler deploy --dry-run -c apps/web/wrangler.jsonc`: PASS.
- Explicit `npx wrangler deploy --dry-run -c apps/web/wrangler.staging.jsonc`: PASS; dry-run only, no staging mutation/deploy.
- `bash scripts/cf-i03-regression.sh`, `cf-i04-regression.sh`, `cf-i05-regression.sh`, `cf-i06-regression.sh`: PASS; lifecycle, Housekeeping/Maintenance, billing/atomic cents/closure.
- `scripts/cf-f0-11-refresh-races.sh`: PASS, mock only; process cleanup verified.
- `scripts/cf-f0-11-reception-local.sh <fresh isolated fixture> 375` and `... 1280`: PASS Worker/D1/Vite/browser at mobile and desktop; each run uses a fresh fixture and verifies process cleanup.
- `scripts/cf-f0-11-built-local.sh`: PASS built/minified bundle against local Worker/D1 at mobile+desktop; process cleanup verified.
- `node --check` for new F0.11 browser scripts; `bash -n` for F0.11 runner scripts: PASS.
- `git diff --check` on F0.11-scoped source/evidence paths: PASS. Unrelated refreshed historical output files are excluded from the F0.11 Artifact A scope.

The attempted `npm run wrangler:dry-run` package script itself is defective/incomplete: it dry-runs API then prints web `--help` and exits without checking staging SPA. This was not counted as evidence; all three explicit Wrangler dry-runs above passed. No package-script repair is in F0.11 scope.

## 7. Scope and publication boundary

- PASS: no real data read/mutation, production access, remote D1, deployment, merge, PR or Block A–H work occurred.
- PASS: invariant file classifies every registry entry and has no applicable `UNPROVEN` item.
- PASS: artifact publication must be two commits: substantive Artifact A followed by orchestration-only Boundary B naming exact A and requiring fresh Independent Critic. This Pre-Critic is not a substantive self-approval.

## Final Pre-Critic result

`MANDATORY PRE-CRITIC GATE: PASS — ELIGIBLE TO FREEZE F0.11 ARTIFACT A`

External Independent Critic remains required; this is not an Independent Critic verdict and does not close Foundation 0. F0.12 remains required after the F0.11 critic disposition.
