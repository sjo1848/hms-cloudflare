# CF-I09 — Post-PASS Local Acceptance Bootstrap Review

Prior technical artifact: `fcb4dd464e8d34f80c27c034e48ec9bc62c912f3`  
Prior boundary: `5d315de8ed6cccb585b16929e56e7371f819bd5e`  
Prior verdict: **PASS — WITHDRAWN BY NEW EXECUTION EVIDENCE**  
Current verdict: **REWORK-4**  
Human Gate: **NONE**

## Why the prior PASS is reopened

The first real Human Product Acceptance preparation run exposed a technical failure before the Human could exercise the product:

- `git pull --ff-only` reached canonical `5ba4fcd...`;
- `npm install` completed cleanly;
- `bash scripts/migration/test-rehearsal.sh` passed, including lifecycle tamper-negative reconciliation;
- `scripts/cf-i09-local-backup-restore-rehearsal.sh` hung during the local three-D1 reset and was cancelled with a bounded timeout;
- `node scripts/cf-i09-local-smoke.mjs` could not start because it depends on the same reset path;
- `scripts/cf-i09-local-start.sh --reset` reproduced the same reset hang and was cancelled with timeout;
- no owned processes remained afterward and the Git worktree stayed clean.

This is technical execution evidence, not a Product/Risk decision. Therefore the `HUMAN_GATE` is invalid until the local acceptance bootstrap itself is proven operational.

## Independent diagnosis

The focal rehearsal and the Human acceptance runtime do not use the same persistence mode.

`scripts/migration/test-rehearsal.sh` explicitly exports:

`CF_I09_ISOLATED_PERSISTENCE=1`

That makes `scripts/migration/wrangler-local.mjs` place each D1 binding in a separate persistence subdirectory, which avoids the previously diagnosed Wrangler 4.125 / Miniflare shared-persistence contention.

By contrast, `scripts/cf-i09-local-reset.sh` calls `scripts/migration/rehearse.mjs --persist-to apps/api/.wrangler/state` without enabling isolated persistence. `wrangler-local.mjs` therefore resolves all three D1 bindings back to the same shared persistence root. This is the exact topology already known to reproduce the third-D1 hang.

The prior technical evidence therefore proved the isolated focal migration path but did not prove the actual checked-in Human Product Acceptance reset/start path. The runbook claim of a reproducible complete local startup path was stronger than the executable evidence.

Diagnosis: `ACCEPTANCE_RUNTIME_PERSISTENCE_MODE_MISMATCH + SHARED_D1_RESET_HANG + LOCAL_READINESS_EVIDENCE_OVERCLAIM`.

## REWORK-4 requirements

1. Preserve all accepted migration/source-parity, lifecycle exactness, RBAC, tenant-isolation, money, replay/partial-failure and source-audit repairs from A4.
2. Fix the actual Human Product Acceptance persistence/runtime path, not only the isolated focal runner. Do not merely add an environment flag if that causes the Worker, backup/export/restore or reconciliation paths to read a different D1 layout.
3. Establish one coherent deterministic local acceptance topology in which reset/reseed, reconciliation, Worker startup, backup/export, restore, smoke and Human browsing all operate on the same intended CONTROL_DB + HOTEL_DEMO_DB + HOTEL_SECOND_DB state.
4. The known Wrangler 4.125 shared-persistence hang must be eliminated or deterministically bypassed without changing production topology and without remote Cloudflare resources.
5. Add bounded executable regression proving a clean `scripts/cf-i09-local-reset.sh` completes rather than hanging. A timeout must fail the test, not be treated as a workaround.
6. Execute the exact Human acceptance preparation path fresh:
   - `bash scripts/migration/test-rehearsal.sh`;
   - `scripts/cf-i09-local-backup-restore-rehearsal.sh`;
   - `node scripts/cf-i09-local-smoke.mjs`;
   - `scripts/cf-i09-local-start.sh --reset`;
   - verify API `/ready`, frontend reachability and all three expected D1 bindings/state;
   - `scripts/cf-i09-local-stop.sh` with zero owned descendants left.
7. Repeat the reset/start/stop path sufficiently to prove no stale lock/process state is required for success.
8. Re-run contracted inherited CF-I03–CF-I08 regressions plus unit/type/build/Wrangler/static/scope checks after the runtime change.
9. Fresh Internal QA/Critic and Integration Review must explicitly attempt to reproduce the original shared-persistence hang and verify the Human acceptance commands themselves, with zero open P0/P1/P2 before publication.
10. Correct runbook, invariant and Pre-Critic evidence so no readiness/PASS claim exceeds the exact executable path used by the Human.
11. Publish a fresh substantive Artifact A5 followed by an orchestration-only Boundary B5 containing the exact full A5 SHA, then stop in `WAITING_EXTERNAL_REVIEW`.
12. No Human Gate, remote D1, paid resource, real-data migration, production deployment, DNS/Access production change or cutover is authorized during REWORK-4.

## Gate result

CF-I09 technical PASS is reopened as REWORK-4. Human Product Acceptance is deferred until the complete local acceptance bootstrap succeeds on the actual checked-in runtime path.
