# F0.6-IC-01 Repair Evidence

Finding: `F0.6-IC-01 HIGH`, raised by Galileo on exact A1+B1. See `.orchestration/evidence/HMS-F0-06-SYNTHETIC-ACTIVE-STAY-PRICING-BOOTSTRAP-001-INDEPENDENT-CRITIC.md`.

## Root cause

F0.6 treated bookings, invoice, charges, payments, rooms and inventory as the baseline source snapshot, but omitted existing `booking_pricing_segments`. F0.5 defines those segments as operational quote inputs. The omission allowed a source set to change without the F0.6 segment-specific stale guard noticing, and allowed bootstrap candidates to be layered over an already-canonical pricing history.

## Bounded correction

- `active-stay-pricing-bootstrap.ts` now snapshots every canonical segment identity, booking/room, interval, rate, room-pricing version, segment version, operation token, actor/hotel/request provenance and creation timestamp into the stable source manifest/digest.
- Any booking with an existing canonical segment is held as `ORPHAN_OR_CONFLICT` with `CANONICAL_PRICING_SEGMENTS_PRESENT` and receives no bootstrap candidate segments.
- `d1-active-stay-pricing-bootstrap.ts` verifies manifest identity for those segment rows.
- Forward-only `0027_active_stay_bootstrap_segment_snapshot_guard.sql` validates exact current-versus-snapshotted segment cardinality and all fields in both directions before `SHADOWED → ACTIVATING`, within the same D1 batch transaction.
- Executing-D1 cases prove (1) a pre-segmented stay is held without layering new segments, and (2) a segment-set change after shadowing is rejected even when booking pricing version/token/update time are restored. The rejection leaves run/candidate state and canonical booking, inventory, invoice, payment and segment state unchanged.
- F0.3's deterministic cumulative schema/migration/source/report fingerprints were updated for additive 0027; all rehearsal behavior assertions remain intact.

## Fresh evidence

- F0.6 executing D1: 11/11 PASS.
- F0.3 synthetic cutover rehearsal executing D1: 2/2 PASS.
- `npm run check`: PASS, 32 files / 144 tests; includes F0.4 14/14 and D11 4/4.
- Clean local Wrangler migration chains through 0027: CONTROL_DB, HOTEL_DEMO_DB and HOTEL_SECOND_DB PASS on new temporary persistence; no remote database.
- `scripts/cf-wave12-reassignment-integrated.sh`: exit 0 using local Worker + D1 + Vite + browser; same remaining-stay hotel-local interval across availability, quote/preview and mutation; desktop success/persisted room refresh and mobile stale 409/authoritative refresh passed.
- `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, and staging SPA Wrangler dry-run: PASS. JS raw 296651/300000 bytes.
- CF-I03, CF-I04, CF-I05 and CF-I06 local regression scripts: PASS sequentially, each isolated from simultaneous fixed-port users.
- No real/customer data, remote D1, live bootstrap/cutover, staging mutation, deploy, PR, push, merge, main, production or Blocks A–H.

The repaired substantive artifact requires a fresh Independent Critic on its exact Artifact A2 and orchestration-only Boundary B2. This evidence is not self-approval.
