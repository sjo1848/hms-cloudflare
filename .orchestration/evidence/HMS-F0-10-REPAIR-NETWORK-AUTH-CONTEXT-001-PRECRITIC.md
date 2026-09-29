# F0.10 no-write Network auth-context evidence — Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-10-REPAIR-NETWORK-AUTH-CONTEXT-001.md`

1. **Finding and cause — PASS.** Harvey's exact A3+B3 review found that controls were tested absent without asserting the browser's own real `/auth/me` response. API denial alone cannot prove which identity context the UI received.
2. **Bounded scope — PASS.** Add response capture/assertions to the existing integrated runner. No product or schema change is in scope.
3. **Response authority — PASS for admission.** Do not intercept `/auth/me`; assert actual 200, exact subject, hotel, role, hotel capabilities, and missing network write capability separately at desktop and mobile. The only synthetic response remains the hotel-list GET used for the no-write detail fixture.
4. **UI proof — REQUIRED.** After verifying auth context, repeat DOM absence, readable plan, and 40-tab exclusion at both 1280×900 and 375×844. Preserve real denied POST 403 and D1 zero effect at both widths.
5. **Invariant map — PASS for admission.** All 24 invariant IDs are classified in the Task Contract. Tenant, RBAC, UX, responsive, evidence, state, process cleanup and scope are explicitly covered; other classifications have bounded N/A rationale.
6. **Publication — REQUIRED.** Persist role×viewport response and assertion evidence, verify only runner/evidence changes, freeze A4+B4, then obtain a fresh Critic distinct from Tesla and Harvey. A3+B3 `REWORK` remains historical. No Foundation 0 completion claim.

`PRE-CRITIC: PASS FOR BOUNDED EVIDENCE REPAIR ADMISSION`

## Execution disposition

- A prior runner pass mislabeled the unauthorized Network check as desktop while the viewport remained 375×844 after the authorized mobile check. The corrected runner explicitly restores and verifies 1280×900 before that case and then separately sets 375×844 for mobile.
- Screenshot inspection exposed the local acceptance selector being reset to Admin on every document navigation even though Worker headers were Ops. The runner now seeds the default identity only once per browser tab session and asserts the visible local selector remains Ops (`value=2`) in each no-write viewport.
- Fresh `bash scripts/cf-f0-10-capabilities-integrated.sh`: PASS. At each viewport, the App Shell first renders Hotel Sur; the browser then obtains an unmocked Worker `/api/v1/auth/me` response and asserts HTTP 200, exact subject, hotel, `ops`, `housekeeping.read`, and empty network capability array. It also asserts the visible selector is the Ops fixture before keyboard/DOM checks.
- Both denied POSTs return 403; D1 `deniedNetworkHotelCount` is 0. Only the hotel-list GET for the selected-property no-write view is synthetic. Process-tree cleanup is verified; the isolated `mktemp` directory is retained and is not represented as deleted.
- Result: `output/playwright/f0-10-capabilities-integrated-result.json`; logs and screenshots remain in the same directory. No product/schema changes.
