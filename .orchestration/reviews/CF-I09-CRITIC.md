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
