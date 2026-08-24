# CF-I07 Pre-Critic Gate

| Gate | Result | Evidence |
|---|---|---|
| Contract and scope exact | PASS | `.orchestration/contracts/CF-I07.md`; no CF-I08/CF-I09 work. |
| Invariants | PASS | `CF-I07-INVARIANTS.md`; CF-I07-001..004 are promoted and executable. |
| Backend authority | PASS | Central capability map and explicit network middleware; UI is supplementary. |
| Tenant/binding isolation | PASS | Membership-derived hotel; unique active binding index; server binding allow-list; focal cross-tenant, undeclared-binding and binding-reuse tests. |
| Atomic audit | PASS | D1 batches for create/role/deactivate/hotel mutations; same-value no-op, exact `HOTEL_PLAN_CHANGE` count, exact success/deny counts and cross-tenant zero-side-effect assertions. |
| Responsive/admin UX | PASS | Browser runner explicitly asserts create success/error, detail open/close, committed role value after refetch, confirmation/focus return and valid-housekeeping forbidden UX at every 375/390/430/768/1024 width; screenshot committed. |
| Static/build/route checks | PASS | Typecheck, unit suite, web build, Wrangler dry-run, no local role maps or direct `saas_admin` audit shortcut, one admin route registration. |
| Independent review boundary | READY | Artifact is immutable only after publication; Codex does not self-PASS. |

Required stop: publish one substantive artifact and one orchestration-only boundary, then await Independent Critic. Do not begin CF-I08.
