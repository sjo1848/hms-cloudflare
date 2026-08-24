# CF-I07 REWORK-3 — Independent Critic

Verdict: `PASS`  
Human Gate: `NONE`  
Artifact A: `fdf9c6f82c3c5066152e49ecba70268d669a640f`  
Publication boundary B: `c52656fcc311f53be9b584346f2afc9e54796ff9`

## Scope reviewed

Independent review of the exact immutable REWORK-3 artifact against `.orchestration/contracts/CF-I07.md`, prior REWORK findings, durable invariants and Pre-Critic obligations.

## PASS findings

1. The browser fixture now establishes a real active `housekeeping` identity/membership for hotel A before exercising `/users`; denial therefore proves backend capability enforcement rather than a missing-membership/routing guard.
2. Users browser evidence executes at 375/390/430/768/1024 and explicitly proves create success, visible duplicate/error state, role mutation with persisted value after reload, deactivation confirmation and deterministic focus return.
3. Network browser evidence exercises property selection and plan mutation at every contracted width with overflow checks.
4. `saas_admin` audit bypass remains removed and source-sensitive RBAC repairs from REWORK-2 are preserved.
5. Same-role/same-plan requests remain semantic no-ops/rejections; the focal regression now asserts exactly one durable `HOTEL_PLAN_CHANGE` after success plus same-plan retry.
6. Allowed-before/denied-after downgrade and tenant-A→tenant-B membership isolation remain proven with zero unauthorized target audit effects.
7. CF-I07 focal/browser runners recursively track owned Worker/Vite process trees, poll termination, escalate if needed and refuse terminal PASS if owned processes remain. Playwright session is explicitly closed before final cleanup.
8. Fresh inherited CF-I03/04/05/06 regressions, focal CF-I07, browser, unit/type/build and Wrangler dry-run are recorded PASS with evidence wording matching executable assertions.
9. Artifact publication follows `INV-STATE-001`: B is the direct child of A and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.
10. No CF-I08 implementation, production deployment, remote D1 mutation, paid transition, real-data migration or cutover entered the artifact.

## Conclusion

CF-I07 Users / RBAC / Audit / Hotel-Network Admin satisfies its Task Contract and applicable invariants. Security, tenant isolation, Access identity adaptation, audit provenance, plan-tier parity and responsive admin workflow are accepted for the Cloudflare migration baseline.

CF-I08 may be authorized immediately. CF-I07 must not be reopened except for a newly demonstrated regression or a later integration defect with evidence.
