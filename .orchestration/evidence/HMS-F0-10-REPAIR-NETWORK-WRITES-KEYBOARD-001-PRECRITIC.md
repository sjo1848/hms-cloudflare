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
