# E-11 Stale Board Response Repair — Pre-Critic Admission

The bounded repair contract and invariant map are frozen before code/test changes. Exact review source is A2 `3d28da570b1b0916c49dd03c93c333494dcadadb` + B2 `3114979d9ecd6bc7848ccf1814ac21608f98d789`, with fresh Independent Critic `REWORK` and no `ROADMAP_BLOCKER`.

## Admission

- [x] Finding maps to frozen E-11 and existing request identity guard; no new product/domain semantics.
- [x] Proof will use integrated local Worker + D1 and actual UI-triggered requests, not mocked application state.
- [x] Only the existing Refresh control may remain available during a read load so the real operator action can initiate a newer request; it remains disabled during mutations. No production test seam, schema, endpoint, capability, budget or CSS change is authorized.
- [x] All 24 registry invariants have been classified; repair applicability and executable evidence are mapped in the companion file.
- [x] Full validation and bundle checks will run; any active ceiling breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`.
- [x] Replacement A → evidence-only B → fresh exact-pair Independent Critic → final STATE/STATUS reconciliation.

**PASS — bounded technical/evidence rework admitted.** This is not an Independent Critic PASS.

## Final implementation Pre-Critic

**PASS — no applicable invariant is unproven.** After the narrow Refresh-control change and browser test, the real integrated race returned the newer current-date board first (`2026-10-01`) and the older `2099-01-01` response only after that. The actual UI retained date `2026-10-01`, search `904`, active Shift filter, selected Room 904/case, and no loading state after both requests completed. Full `npm run check` passed (35 files / 175 tests); `npm run types:check`; production build and canonical budgets (JS 334638/94467 B, CSS 55652/10384 B); architecture fitness I/II and i18n; D1 query plan; executing local Worker/D1 CF-I05 API; integrated Playwright CF-I05; Wrangler API/Web dry-runs; and `git diff --check` passed. The old and new controller budget-gate records remain unmodified. Exact outputs and scope are recorded in the parent Block E Results record. Replacement Artifact A may be frozen; its fresh exact-pair Critic remains required.
