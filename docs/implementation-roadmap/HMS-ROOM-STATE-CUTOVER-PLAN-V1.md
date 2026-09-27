# HMS Cloudflare — Room State Cutover Plan v1

Status: **planning only; not approved for execution**. This plan preserves frozen room semantics in Blueprint 001 / Reconciliation 007 / Final Disposition 008. Current target evidence is `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`; current `rooms.status` is still a single text field and prior HK state can be obscured by status transitions.

## 1. Cutover invariant

For every room, represent separately: Occupancy; Housekeeping; open Maintenance Impact; Service State; derived Readiness; date-range Sellability. Neither `AVAILABLE` text nor absence of an open case alone proves readiness/sellability. Unknown, contradictory, orphaned or non-deterministically recoverable state is `UNRESOLVED`, never silently `READY`.

## 2. Authority and candidate evidence

Read exact accepted mappings from 007/008 and source-state history before designing the executable transform. Candidate existing repository evidence: `apps/api/schema/hotel-migrations/0001_foundation.sql`, `apps/api/schema/hotel-migrations/0009_housekeeping_maintenance.sql`, `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`; `apps/api/src/routes/housekeeping.ts`; `apps/api/src/routes/inventory.ts`; `apps/api/src/routes/lifecycle.ts`; `apps/api/src/modules/inventory/availability.ts`; `apps/api/src/room-availability.ts`; migration tooling `scripts/migration/source-target-map.mjs`, `scripts/migration/migration-core.mjs`, `scripts/migration/rehearse.mjs`, `scripts/migration/reconcile.mjs`, `scripts/migration/test-rehearsal.sh`. The database objects `room_inventory_nights`, `booking_events` and maintenance events are schema/data concepts, not source filenames. The observed 0020 backfill classifies open case impact using present room status; it does not reconstruct overwritten Housekeeping state. Do not treat it as a complete room cutover.

## 3. Non-destructive staged method

1. **Inventory / source manifest:** enumerate tenant, room IDs, status values, booking occupancy, current and future room-night claims, open maintenance cases, HK tasks/events, holds and relevant event/history rows. Capture exact schema/migration digest and counts; protect data under existing access rules.
2. **Shadow mapping:** compute proposed dimensions without writing canonical values. Each output carries source row/event IDs, mapping rule ID and confidence; exact deterministic source evidence is required for recovered state.
3. **Classification:** `MAPPED`, `REVIEW_REQUIRED`, `CONFLICT`, `ORPHAN`, `DUPLICATE_OPEN_CASE`, `UNSUPPORTED_VALUE`. No ambiguous class may be defaulted into a sellable or ready state.
4. **Reconcile:** compare totals by class, room, occupancy, HK state, maintenance impact, active/future claims, holds and events. Explain every row in a signed/local review manifest; resolve only by a contract-backed, actor-attributed correction command.
5. **Synthetic rehearsal:** execute the proposed forward migration and transform on generated edge cases and sanitized/synthetic distributions only; include repeat-run, interruption/restart, orphan FK claim and conflicting timeline cases. This is not real-data evidence.
6. **Pre-cutover gate:** independent data reviewer verifies transform and reconciliation; Controller confirms exact plan and evidence. Human explicitly authorizes any real-data action and operational window. No authorization is included now.
7. **Activation:** versioned per-hotel migration/checkpoint; quiesce or concurrency-protect source writes; re-read source version/digest immediately before switch; activate only hotels/rows whose required mappings reconcile. Others remain on safe compatibility read or are operationally held out, as the approved runbook defines.
8. **Post-activation:** verify counts/checksums, derived readiness and sellability predicates, reservation conflicts, open case uniqueness and sampled histories; retain immutable before/after manifest and actor/time/command provenance.

## 4. Idempotency, concurrency and isolation

- Transform key is `(hotel_id, room_id, source_digest, mapping_version)`; repeated same key yields same result, changed source digest invalidates prior readiness.
- Protect against room/booking/HK/maintenance mutations between shadow read and activation with source version/watermark or a bounded write freeze. If any source changes unexpectedly, reject activation and recompute; never merge a stale mapping.
- Hotel D1 is routed only via authoritative hotel binding; rehearsal asserts no cross-hotel row leakage. No cross-D1 atomicity is claimed.
- Before/after totals must account for all source records. No unexplained deletes, duplicate claims or synthesized anonymous cases.

## 5. Recovery and rollback

- Before activation: abort without canonical writes; retain report and source snapshot, correct mapping rule, rerun from a new version.
- During partial per-hotel execution: mark that hotel `INCOMPLETE`, block affected operations/readiness and resume idempotently from checkpoint after reconciliation. Never advertise global green.
- After activation: do not assume destructive schema rollback is safe. Prefer forward repair with provenance; restore the retained source snapshot only under an explicitly approved incident procedure. Keep compatibility mapping until reconciliation is accepted.
- Any room whose previous HK/maintenance state cannot be proven stays unresolved/unsellable until an authorized, auditable operational adjudication. Do not fabricate maintenance or cleaning history.

## 6. Acceptance evidence / gates

Required: source-to-target mapping table; edge-case corpus; duplicate/orphan/unknown reports; dry-run count/checksum reconciliation; migration rehearsal twice; injected failure/restart; deterministic no-false-ready predicates; date-range inventory and hold validation; one-open-maintenance uniqueness; tenant isolation; event/provenance assertions; post-activation verification commands.

**Development Gate:** synthetic rehearsal + transformation code/test evidence satisfy above with no unexplained data loss and zero ambiguous records marked READY. **Independent Critic:** DB/data reviewer not author of transform. **Human Gate:** mandatory before any real-data execution, ambiguous state adjudication policy or irreversible activation. **Current status:** no execution approved; real-data distribution and freeze window unknown.
