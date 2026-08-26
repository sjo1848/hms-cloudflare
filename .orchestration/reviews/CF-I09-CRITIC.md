# CF-I09 — External Independent Critic

## Review 1 — Artifact A1

Artifact A: `a972bca40ed60505bc42f5ae560977886c2972ab`  
Boundary B: `54d8ad2e77b78f4101a14501b7e81ef014c9be2a`  
Verdict: **REWORK-1**  
Human Gate: **NONE**

### Accepted foundation

Preserve the strong local-only migration/rehearsal foundation established by A1: source→CONTROL_DB/per-hotel-D1 routing, explicit mapping/enums, cents/date/UTC/JSON handling, NO_SHOW semantics, replay/partial-run controls, exact reconciliation, local Access guard, readiness, backup/restore, integrated local Worker+D1 smoke, inherited CF-I03–CF-I08 regression intent, and zero remote/paid/real-data/cutover scope.

### REWORK-1 findings

1. **P1 — source `saas_admin` missing.** Migrate the real source role as network-only; do not promote an ordinary tenant admin.
2. **P1 — nullable legacy payment receiver rejected.** Preserve unknown historical receiver truthfully without attributing a real/migration user.
3. **P1 — nullable legacy maintenance reporter conflicts with target event actor.** Preserve unknown reporter truthfully and use explicit unknown provenance when a reconstructed event requires an actor.
4. **P2 — multi-context/model receipt incomplete.** Record truthful role/context → lane → actual model family → reasoning → escalation → outcome.
5. **P2 — abbreviated artifact boundary.** Fresh A2/B2 must use the exact full 40-character artifact SHA.
6. Perform one consolidated source migrations `0001`–`0030` nullable/legacy actor/identity sweep.

Diagnosis: `SOURCE_ROLE_PARITY_GAP + LEGACY_NULL_ACTOR_MIGRATION_GAP + HISTORICAL_PROVENANCE_GAP + MULTICONTEXT_MODEL_RECEIPT_MISSING + ABBREVIATED_ARTIFACT_BOUNDARY`.

---

## Review 2 — Artifact A2

Artifact A2: `e483e6b3d973491caa7eb25d119e41d5804f2ae0`  
Boundary B2: `f9c510c8c2bd6f5bdfc72a9f757e40a149e768e4`  
Verdict: **REWORK-2**  
Human Gate: **NONE**

### Publication boundary — PASS

B2 is the direct child of A2, changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`, and records the exact full A2 SHA. The publication-boundary defect from REWORK-1 is closed.

### REWORK-1 findings closed in A2

- Source `saas_admin` is represented explicitly and maps to `network_memberships` without hotel operational membership.
- Legacy NULL payment receiver uses deterministic unknown-legacy provenance rather than a real/migration actor.
- Legacy NULL maintenance reporter preserves unknown truth and reconstructed housekeeping event provenance.
- Internal review receipt now records truthful model/reasoning assignments without fabricating the orchestrator model family.
- Browser acceptance includes an explicit `Network · SaaS Admin` profile and persists the profile across navigation.
- Full 40-character A2 SHA is present in B2 canonical metadata.

These repairs must be preserved.

### Blocking findings

#### 1. P1 — booking snapshot actor parity is still wrong

The pinned source migration `0022_booking_operational_fields.sql` defines `checked_in_by_user_id` and `checked_out_by_user_id` as nullable. The accepted D1 booking schema likewise permits `checked_in_by` / `checked_out_by` to remain NULL.

A2 nevertheless maps a NULL source booking actor to deterministic `legacy-source-user:unknown:checkin:<booking-id>` / `...checkout:<booking-id>` values in the **booking snapshot itself**, including rows where no check-in/check-out occurred.

That is not source parity. A deterministic unknown sentinel is justified only for a reconstructed `lifecycle_events.actor_subject` when an actual historical lifecycle event exists and the target event actor is NOT NULL. It must not invent a principal in a nullable booking snapshot column.

Required repair:

- preserve source NULL as target NULL in `bookings.checked_in_by` / `bookings.checked_out_by`;
- use unknown-legacy sentinel/provenance only for reconstructed lifecycle events whose timestamp proves the historical event occurred and whose target actor column is NOT NULL;
- add exact reconciliation for booking `checked_in_by` / `checked_out_by` so this class of parity defect cannot pass silently;
- add deterministic fixture/preflight coverage for: no lifecycle event + NULL actor, lifecycle event + NULL actor, and lifecycle event + real actor.

#### 2. P2 — the declared exhaustive source nullable-actor sweep is factually incomplete/inaccurate

`docs/cf-i09-source-nullable-actor-audit.md` states that migrations `0001–0023` have no relevant nullable actor surface and associates booking lifecycle actors with `0028`. That is incorrect at the pinned source baseline:

- `0020_room_holds.sql` defines nullable `room_holds.created_by_user_id`;
- `0022_booking_operational_fields.sql` introduces nullable check-in/check-out actor columns;
- `0026_booking_arrival_exceptions.sql` introduces nullable terminal/late-arrival actor columns;
- `0028_maintenance_legacy_backfill.sql` changes maintenance reporter nullability/backfill; it does not introduce the booking lifecycle actor columns.

The consolidated audit must be corrected from the actual source migrations, not merely from fixture behavior. Every actor/identity surface from `0001`–`0030` must be explicitly classified as nullable/non-null, mapped/omitted/reconstructed, and tested where it feeds a stricter target principal/event column.

#### 3. P2 — `saas_admin` positive authorization is proven, explicit tenant-operation DENY is not

A2 proves that the migrated `saas_admin` can read network `/hotels` / network KPIs and proves that the source role receives no hotel membership. That is strong structural evidence.

However REWORK-1 explicitly required allowed **and denied** behavior. The integrated smoke contains a cross-hotel `403` for a tenant admin, but no explicit request showing the migrated `saas_admin` is denied a hotel-operational route such as `/rooms` when a hotel id is supplied.

Required repair:

- add one explicit behavioral assertion: migrated `saas_admin` + hotel context → representative tenant operational route → `403`;
- retain the positive network read assertion and exact membership reconciliation.

### REWORK-2 exit criteria

1. Preserve every A2 repair already accepted above.
2. Booking nullable snapshot actors preserve NULL exactly; lifecycle-event unknown sentinels are emitted only for real historical lifecycle events requiring a non-null target actor.
3. Reconciliation compares booking lifecycle actor snapshot columns exactly.
4. Correct the source `0001`–`0030` nullable/legacy actor audit against the actual migration files, including 0020, 0022, 0026, 0028 and any other applicable actor/identity surface.
5. Add explicit behavioral DENY proving `saas_admin` lacks tenant operational capability while retaining network ALLOW proof.
6. Rerun focal migration/reconciliation, replay/partial failure, backup/restore, full local Worker+D1/Playwright smoke, inherited CF-I03–CF-I08, type/unit/build/Wrangler/route/diff/scope checks.
7. Fresh Internal QA/Critic + Integration Review; zero open P0/P1/P2.
8. Correct invariant and Pre-Critic claims so no PASS exceeds executable proof.
9. Publish fresh substantive A3, followed by orchestration-only B3 containing the exact full 40-character A3 SHA, then stop in `WAITING_EXTERNAL_REVIEW`.
10. No Human Gate, remote/paid Cloudflare action, real-data migration, production or cutover.

Diagnosis: `BOOKING_NULL_ACTOR_SNAPSHOT_PARITY_GAP + SOURCE_NULLABILITY_AUDIT_INACCURATE + SAAS_ADMIN_TENANT_DENY_EVIDENCE_MISSING`.

---

## Review 3 — Artifact A3

Artifact A3: `58ac2c5758795ae1b8257a8c313b31842e157993`  
Boundary B3: `b0a8ea321a29ccf31d91375e42ef8f709ad47664`  
Verdict: **REWORK-3**  
Human Gate: **NONE**

### Publication boundary — PASS

B3 is exactly one commit after A3, changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`, records the exact full 40-character A3 SHA, sets `WAITING_EXTERNAL_REVIEW`, `resume_authorized=false`, and requires External Independent Critic review. The A/B publication boundary is valid.

### REWORK-2 findings closed in A3

- `bookings.checked_in_by` / `checked_out_by` now preserve source NULL exactly.
- Unknown legacy check-in/check-out actor sentinels are emitted only for reconstructed lifecycle events whose source timestamps prove those events occurred.
- Deterministic preflight covers no-event + NULL actor, event + NULL actor, event + real actor, and no-event + real actor without inventing an event sentinel.
- The source nullable/legacy actor audit is corrected against the pinned `0001`–`0030` source migration lineage, including 0001, 0020, 0022, 0024, 0026, 0027 and 0028.
- Migrated `saas_admin` retains network ALLOW, has zero hotel membership, and is explicitly denied `/rooms` with hotel context (`403`).
- The three-binding local rehearsal workaround is bounded to local tooling and does not change product D1 routing/topology.

These repairs are accepted and MUST be preserved.

### Blocking finding

#### P2 — lifecycle reconciliation is still not exact enough to prove the repaired parity

A3 correctly generates nullable booking actor snapshots and deterministic reconstructed lifecycle events. However the executable reconciliation does not fully verify those semantics:

- the exact `bookings` reconciliation includes `checked_in_by` / `checked_out_by` but omits `checked_in_at` / `checked_out_at`;
- reconstructed `lifecycle_events` are not exact-reconciled by row identity/fields; the aggregate reconciliation checks only `COUNT(*)` for lifecycle events;
- the focal migration Vitest covers imported booking status/`NO_SHOW`, not lifecycle snapshot/event parity.

Therefore a target could contain a wrong check-in/check-out timestamp, lifecycle actor, event timestamp, request/hotel identity or event provenance while preserving the same event count and still satisfy the current focal reconciliation. That is incompatible with CF-I09's exact machine-checkable reconciliation requirement and with the REWORK-2 evidence intent.

The internal review receipt also states that actor columns reconcile exactly and that zero P0/P1/P2 findings remain; that claim is stronger than the executable proof and must be corrected under `INV-EVID-001`.

### Required REWORK-3 repair

1. Preserve every A3 repair accepted above.
2. Add `checked_in_at` and `checked_out_at` to exact booking reconciliation alongside the actor snapshots.
3. Exact-reconcile every reconstructed lifecycle event that should exist from the fixture, including at minimum deterministic event ID, booking ID, event type, actor subject, request ID, hotel ID, created timestamp, room/from-room semantics, and material provenance fields.
4. Add at least one adversarial executable regression proving reconciliation fails when a migrated lifecycle snapshot timestamp or reconstructed lifecycle event actor/timestamp is tampered while row counts remain unchanged.
5. Rerun focal migration/reconciliation, replay/partial-failure and backup/restore against the repaired reconciliation; rerun the contracted fresh inherited CF-I03–CF-I08, local Worker+D1/Playwright smoke, unit/type/build/Wrangler/route/diff/scope checks as required by CF-I09 after the change.
6. Fresh Internal QA/Critic + Integration Review must explicitly falsify the lifecycle exactness claim and close with zero P0/P1/P2 only after the new executable negative proof passes.
7. Correct invariant/evidence receipts so no PASS exceeds executable proof.
8. Publish fresh substantive A4 followed by orchestration-only B4 containing the exact full A4 SHA, then stop in `WAITING_EXTERNAL_REVIEW`.
9. No Human Gate, remote/paid action, production, real-data migration or cutover.

Diagnosis: `LIFECYCLE_EXACT_RECONCILIATION_GAP + EVIDENCE_OVERCLAIM`.
