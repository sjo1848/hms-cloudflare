# HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001 — Pre-Critic Gate

Status: `PASS FOR BOUNDED EVIDENCE REPAIR`
Frozen contract: `.orchestration/contracts/HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001.md`

- The failure was reproduced by the final browser run: the Case heading appeared before the scheduled focus restoration frame, and an immediate DOM assertion failed.
- The repair is limited to waiting on the exact existing contract predicate, `document.activeElement` having `.reception-case-title`; the five-second timeout remains a failing test if focus never arrives.
- No product, domain, authorization, API, schema, Cash, or budget code changed for this repair.
- All 24 registry invariants are classified in the paired invariant evidence. Applicable UX, evidence, process-cleanup, publication and scope invariants are supported by the complete passing integrated run and source inspection.
- `npm run test:cf-i06-browser` exits 0; it runs local Worker + migrated D1 + Vite, proves response-loss recovery, contextual return, keyboard focus, browser Back focus, responsive interactions and owned-process cleanup before PASS.
- This gate is not an Independent Critic verdict and does not self-approve Block F.
