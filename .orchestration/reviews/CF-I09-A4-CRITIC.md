# CF-I09 A4 — External Independent Critic

Artifact A4: `fcb4dd464e8d34f80c27c034e48ec9bc62c912f3`  
Boundary B4: `5d315de8ed6cccb585b16929e56e7371f819bd5e`  
Verdict: **PASS**  
Human Gate for technical review: **NONE**

## Publication boundary

PASS. B4 is exactly one commit after A4, changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`, and records the exact full 40-character A4 SHA. No substantive product/migration code changed after A4 before review.

## REWORK-3 closure

1. `bookings.checked_in_at` and `bookings.checked_out_at` are now part of exact booking reconciliation alongside nullable actor snapshots.
2. Every reconstructed lifecycle event expected from the fixture is exact-reconciled by deterministic event ID, booking ID, event type, actor subject, request ID, hotel ID, `details_json` provenance, created timestamp, and from-room semantics.
3. The adversarial reconciliation regression mutates a migrated booking lifecycle timestamp without changing row counts and requires reconciliation failure, restores it, then mutates a lifecycle event actor without changing row counts and again requires reconciliation failure.
4. The adversarial regression is executed inside the focal migration/reconciliation runner before replay and partial-failure checks.
5. A3 repairs remain preserved: source NULL booking actor snapshots remain NULL, unknown sentinels are event-only when a historical timestamp proves the event, source actor/identity migration audit is corrected, migrated `saas_admin` retains network ALLOW and explicit hotel-operation `403` DENY, and the three-D1 persistence workaround remains local-only.
6. The internal Independent QA/Critic receipt reports fresh inherited regressions/build/static closure, full migration/backup evidence, focal reconciliation/replay/partial-failure closure, types/build/Wrangler checks, and explicit falsification of lifecycle timestamp/actor tampering with zero open P0/P1/P2.
7. Invariant evidence was updated to match the executable lifecycle proof. No contradictory `FAIL`/`UNPROVEN` claim was found in the A4 publication set.

GitHub has no status checks or PR workflow runs attached to A4. CF-I09 does not contractually require GitHub Actions as the acceptance oracle; the durable internal review receipt plus executable repository evidence and this independent review form the technical gate. This absence is therefore not a blocker.

## Result

CF-I09 Data Migration Rehearsal + Local Operational Readiness is technically accepted.

The complete local HMS candidate is ready for **Human Product Acceptance** using the checked-in repeatable local acceptance sequence. This PASS does **not** authorize remote Cloudflare provisioning/deployment, remote D1 mutation, paid resources, real-data migration, DNS/Access production changes, production release or cutover.

Next gate: **Human Product Acceptance — local complete HMS**.