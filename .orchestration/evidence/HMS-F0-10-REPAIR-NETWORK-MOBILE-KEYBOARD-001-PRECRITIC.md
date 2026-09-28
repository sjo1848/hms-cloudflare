# F0.10 Network mobile keyboard evidence repair — Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-MOBILE-KEYBOARD-001.md`

1. **Finding precision — PASS.** Tesla's exact A2+B2 review found mobile Network keyboard behavior unproven, not a runtime defect. Existing authorized/unauthorized Network keyboard checks ran at 1280×900; mobile checks afterward were on Rooms.
2. **Bounded scope — PASS.** Add viewport-specific assertions in the existing integrated test runner only. No UI/API/schema/role change is authorized unless new browser evidence proves a genuine behavior defect.
3. **Accepted test method — PASS.** Use the real local Worker and membership/capability response. For the no-network-write property detail, intercept only the hotel-list GET with the declared synthetic row because canonical roles do not separate network read from write. The API denial, identity and capabilities stay real; direct POST must return 403 and D1 remain unchanged.
4. **Acceptance — PASS.** Independently execute authorized register/plan keyboard traversal and unauthorized DOM absence/tab-exclusion at both 1280×900 and 375×844; assert the plan is readable and direct denial has no side effect. Record role×viewport fields in JSON.
5. **Invariants — PASS for admission.** All 24 IDs are mapped in the contract. Responsive, RBAC, tenant, UX, evidence, process cleanup and state invariants require fresh evidence; remaining dispositions have specific N/A reasons.
6. **Publication — REQUIRED.** Persist test evidence and invariant update, freeze new A3 and orchestration-only B3; a fresh critic must review exact pair. A2/B2 REWORK remains historical. The `INV-STATE-001` row may be finalized in a later orchestration-only commit after that verdict.

`PRE-CRITIC: PASS FOR BOUNDED EVIDENCE REPAIR`

## Execution disposition

- First integrated attempt exposed a test race: the assertion queried the authorized mobile registration control before the real `/auth/me` response had been consumed by the application. The test now synchronizes on the actual 200 response and then waits for the rendered control; no sleeps/timeouts or product changes were added.
- Fresh integrated run: `bash scripts/cf-f0-10-capabilities-integrated.sh` PASS. Network authorized registration/plan keyboard reachability and unauthorized DOM absence/tab exclusion each pass at 1280×900 and 375×844. Direct denied network POST returns 403 at both widths; D1 has no denied mutation; owned processes are verified stopped.
- Machine evidence: `output/playwright/f0-10-capabilities-integrated-result.json`, `.log`, `f0-10-network-admin-mobile-keyboard.png`, and `f0-10-network-no-write-mobile-keyboard.png`.
- Product source and schema remain unchanged. This is evidence repair only; replacement Artifact A3 and orchestration-only B3 require a fresh Independent Critic.
