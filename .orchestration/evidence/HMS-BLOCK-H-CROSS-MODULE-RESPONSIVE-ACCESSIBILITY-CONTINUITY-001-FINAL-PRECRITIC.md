# Block H — Final Pre-Critic Gate

Task: `HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001`
Base: `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`
Gate: self-adversarial implementation/evidence check; this is not an Independent Critic or Controller verdict.

## Gate result

**PASS — eligible to freeze Artifact A and then exact orchestration-only Boundary B for an independent review request.** This does not declare Block H technical PASS or Controller acceptance. External review remains required.

## Completeness and invariant evidence

- [x] Frozen Task Contract, scenario/API/capability inventory, requirement→evidence matrix, and pre-code admission Pre-Critic exist at the authorized base.
- [x] All 24 registry invariants have final evidence/status at `.orchestration/evidence/HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001-INVARIANTS.md`; each applicable implementation invariant is PASS. `INV-STATE-001` is marked PASS* for the frozen non-circular method and has an explicit mandatory exact-A/B ancestry/diff verification immediately after A is written; do not request review unless the check passes.
- [x] `INV-EVID-001`: results classify each claim as Worker/D1, API/D1, synthetic browser, static check or diagnostic capture. Mock evidence is never called integrated proof.
- [x] All active source/domain/API/schema/migration invariants are preserved; no backend/domain/schema files changed.

## Adversarial checks and results

- [x] Queue ordering is asserted against known `z-priority` → `a-next` identities, not derived from rendered order.
- [x] Canonical Check-in 409 and readiness/maintenance guards do not show success until authoritative refresh and retry; D1 state/events are asserted.
- [x] Account response-loss replay preserves the exact operation token and integer-cent ledger; altered payload, capability denial, cross-tenant object access and injected audit failure assert conflict/zero side effects.
- [x] Housekeeping stale/out-of-order board response, one synthetic refresh 503, retry, tenant boundary and independent room dimensions are asserted.
- [x] Guest context failure is not shown as an empty history; its 503 is explicitly synthetic, and real tenant/API/D1 evidence is separately attributed.
- [x] Admin denied routes and protected mutations are backed by established identity/membership fixtures, allowed-before/denied-after downgrade evidence and audit assertions.
- [x] Reports/Network arithmetic, dates, allow-listed stores and configured-store failure are covered by CF-I08 D1/API tests.
- [x] Material UI controls, focus entry/return, Escape/cancel and horizontal overflow are executed at exact `1280×900`, `768×812`, `375×812`, `375×600`, and `844×390` viewports in the H-02..H-08 browser matrix.
- [x] Dropdown menu Tab/Shift+Tab no longer falls back to its trigger when no document control exists ahead; keyboard menu exit and activation are browser-tested.
- [x] Scope audit: no F-cash/Cash workflow, staging, production, real data, main, PR/merge, or Block I+ work.

## Full validation completed

- [x] `npm run check` — 35 files / 176 tests PASS.
- [x] `npm run types:check` — API and Web Wrangler types PASS.
- [x] `npm run web:build` PASS.
- [x] `npm run architecture:fitness` — architecture I/II, i18n and budgets PASS.
- [x] `npm run test:d1-query-plan` PASS.
- [x] API and Web Wrangler deploy dry-runs PASS; no deploy occurred.
- [x] Required/relevant CF-I03, CF-I04, CF-I05, CF-I07, CF-I08, F0.8, Wave12, F0.9 and P0.1 Worker/D1/browser regressions passed with evidence classified in Results. Accepted CF-I06 Account D1 evidence is inherited from the base; no Cash-containing CF-I06 browser runner was executed.
- [x] P0.1 full Worker/D1/Vite/Chromium run passed under Wrangler 4.146.0 and persisted-state assertions passed.
- [x] Bundle baseline/result/delta bytes and percentages are recorded in Results; active ceilings are unchanged and pass.
- [x] Final `git diff --check`, changed-path/scope review, and owned process cleanup checks pass.

## Explicit runtime differential — required Independent Critic disposition

- **Classification:** `LOCAL_RUNTIME_VERSION_DIFFERENTIAL — PRODUCT_ATTRIBUTION_UNPROVEN`.
- Repository-pinned Wrangler **4.125.0**: both full P0.1 integrated Worker/D1/Vite/Chromium runs failed from local Miniflare `ProxyController2.emitErrorEvent` crashes. One crashed after the Check-in 409; the other crashed during initial reads before Queue-ready. Neither run is PASS, and no claim says 4.125.0 passed this P0.1 integrated scenario.
- Temporary Wrangler **4.146.0**: full P0.1 integrated scenario PASS, using the same source, Wrangler config, schema, and fixture bytes as the 4.125.0 attempts. `package.json` and `package-lock.json` were not changed; no Wrangler upgrade was made.
- Wrangler 4.125.0 did pass the separately listed executing-D1/Worker regressions and build/type/architecture/budget/query-plan/dry-run gates that were actually rerun. That does not convert its failed P0.1 integrated run into PASS.
- The two 4.125.0 failures and 4.146.0 success are preserved as distinct evidence. Product attribution remains unproven; do not assert a confirmed upstream/tooling root cause.
- The Independent Critic must explicitly decide whether this differential invalidates any H claim, whether it is adequately bounded as a tooling/runtime limitation, whether a Wrangler upgrade is required before Controller PASS, and whether integrated versus synthetic evidence is accurately delimited. Do not update Wrangler or lockfiles absent a separate decision.

## Publication instructions

1. Freeze Artifact A with substantive code, tests and evidence; do not include its own SHA.
2. Create immediate Boundary B with only `.orchestration`/evidence metadata, recording exact A SHA, `external_review.required=true`, `resume_authorized=false`, and the next action as fresh Independent Critic.
3. Verify B is a direct child of A, exact A files are unchanged, B contains no product/test/CSS/JS/backend/schema/budget change, and both SHAs resolve remotely.
4. Update the INV-STATE-001 PASS* record in Boundary B with the actual A+B identifiers, then publish the dedicated branch and request a fresh separate read-only Independent Critic through Issue #54, including all four runtime/evidence questions above.
5. Do not report Block H complete until Independent Critic and Controller review are resolved and final orchestration metadata is reconciled.
