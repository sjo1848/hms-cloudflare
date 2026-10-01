# HMS Block F — CF-I06 Worker Cleanup Repair

Status: `FROZEN BEFORE TEST-HARNESS CHANGE`
Parent: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Authority: Issue #52 `CONTROLLER_DECISION: START`; parent F-account contract; mandatory invariant `INV-CF-I07-004`.
Base: `39ee0a2b38e7205b8e041e792e16ee469c996241`.

## Evidence-driven gap

The parent Pre-Critic requires every runner that emits PASS to terminate its owned process tree and verify those processes are gone. Static review found `scripts/cf-i06-regression.sh` sent TERM to immediate children/root, but did not wait for or positively verify descendant Wrangler/Worker shutdown before printing PASS.

## Bounded acceptance

- Add recursive ownership collection for the test-owned Worker process tree.
- Terminate the collected tree, poll for exit, escalate to KILL only after the bounded TERM window, then poll again and verify absence before returning success.
- Reuse that one cleanup path both at the explicit pre-D1-query stop and at EXIT.
- Preserve test requests, fixtures, API assertions, Worker bindings, product code and D1 state assertions.
- Execute `npm run test:cf-i06`, then independently inspect the process table/owned port to verify cleanup.

This is a test-harness evidence repair required by the frozen parent contract and invariant; it adds no product, domain, backend/API, schema, capability, Cash or budget semantics.
