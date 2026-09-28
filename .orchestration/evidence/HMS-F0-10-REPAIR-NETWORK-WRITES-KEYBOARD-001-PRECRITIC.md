# F0.10 network-write visibility and keyboard repair — Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-WRITES-KEYBOARD-001.md`

1. **Finding/cause — PASS.** Independent Critic F0.10-IC-01 noted Network write affordances were only CSS-hidden, remained in DOM, and lacked negative-scope browser evidence. F0.10-IC-02 found no actual keyboard traversal assertions. These are bounded UI/evidence defects, not backend authority defects.
2. **Contract — PASS.** F0.10 already requires visibility to match exact server capability and keyboard evidence. This repair adds no permission, workflow, route, API or product semantics.
3. **Implementation boundary — PASS.** Use `CapabilitiesContext` populated by `/auth/me`; only `saas.hotels.write` controls register/plan editor rendering. Preserve plan as readable text without write permission. No role-name condition or duplicate authority.
4. **Security/tenant — PASS preflight.** Test an active hotel member with no network write (direct `/network` URL) and a separate network-only writer. Backend API guards remain unchanged. Prove no hidden control in DOM/focus and denied network writes remain 403 where direct guard is tested.
5. **Keyboard — REQUIRED.** In real browser, Tab through visible Network controls as permitted and unpermitted identities. Assert authorized register/plan affordance receives focus; no unauthorized register/plan element exists or receives focus. Exercise at 1280×900 and 375×844.
6. **Responsive/browser — REQUIRED.** Actual local Worker, disposable CONTROL_DB and two separate hotel D1s, Vite/browser. No mock API for integration claims. Include identity context and screenshots/result JSON as supplementary durable evidence.
7. **Invariants — PASS for admission.** All 24 registry entries are explicitly mapped in the frozen repair contract. Applicable RBAC, tenant, UX, responsive, evidence, state, CF-I07-001/004 and scope require fresh post-change proof; others have specific N/A reasons.
8. **Regression/publication — REQUIRED.** After the code edit, rerun tests, types, build/budget/architecture, query plans, dry-runs, F0.10 integrated browser and relevant CF-I03–I07 serial gates. Update invariant record, freeze A2, create orchestration-only B2 and request a new Independent Critic. A1/B1 retain their REWORK verdict; do not mutate them or report their review as cleared.

`PRE-CRITIC: PASS FOR BOUNDED REWORK / IMPLEMENTATION MAY BEGIN`

## Final Pre-Critic after implementation

1. **IC-01 — PASS.** `NetworkPage` reads only `CapabilitiesContext.network` and conditionally renders both registration `<details>` and plan editor `<select>` when `saas.hotels.write` is present. Without it, neither write affordance is mounted; current plan stays visible as text. Backend route/grants unchanged.
2. **IC-02 — PASS.** Real browser keyboard traversal reaches register summary, registration input and plan editor for network `saas_admin`. A current Hotel Sur `ops` member directly navigating to `/network` has no registration/plan editor nodes and 40 Tab steps never focus the forbidden selectors. Desktop and mobile viewports exercised. One synthetic hotels-list GET is explicitly scoped to selected-property UI proof because current canonical network capability sets do not include a read-without-write role; `/auth/me` and denied POST remain real Worker/D1.
3. **IC-03 — publication follow-up.** All ordinary applied invariants are PASS and the invariant record keeps `INV-STATE-001` explicitly conditional on exact A2+B2 plus independent review. After the exact critic verdict is persisted, an orchestration-only follow-up will finalize that one row. No invariant is represented as already self-approved.
4. **All 24 invariants — PASS/N/A.** Updated evidence is `.orchestration/evidence/HMS-F0-10-SERVER-OWNED-CAPABILITIES-001-INVARIANTS.md`; each APPLIES result has exact evidence or the non-circular review condition; each N/A has rationale.
5. **Fresh validation — PASS.** `npm run check`: 33 files / 168 tests; `npm run types:check`; `npm run web:build`; architecture fitness/i18n/budgets; D1 query plans; Wrangler API/Web dry-runs; serial CF-I03+I04, CF-I05, CF-I06, CF-I07; final local Worker/two D1/Vite browser runner. JS raw 299,947/300,000 bytes. Runner process cleanup is verified before PASS.
6. **Scope/budget — PASS.** Only NetworkPage conditionally renders these controls; AppShell removes a now-unused `data-network-capabilities` attribute and its CSS-only rule/file; no other attribute used by other surfaces, capability grant, API guard, migration, or product operation changed. This keeps bundle at 53 bytes below the binding raw ceiling.

`FINAL PRE-CRITIC: PASS — eligible for replacement Artifact A2 + orchestration-only Boundary B2 and fresh Independent Critic`
