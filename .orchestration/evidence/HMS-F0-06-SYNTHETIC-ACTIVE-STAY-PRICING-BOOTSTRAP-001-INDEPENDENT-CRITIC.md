# F0.6 Independent Critic — Artifact A1 + Boundary B1

Reviewer: Galileo, separate read-only Independent Critic, GPT-6 Luna Medium. The reviewer did not implement F0.6 or participate in its Pre-Critic.

Exact reviewed pair:

- Artifact A1: `ac0b42cb6bdc787726b3160957464af1298eb52a`
- Orchestration-only Boundary B1: `3f1d8dc9c1767f7d5009633c27dff16ecec43beb`

Verdict: `REWORK`

## F0.6-IC-01 — HIGH

The baseline snapshot and activation guard did not include the existing canonical `booking_pricing_segments` set. Those rows are operational quote inputs established by F0.5. An already-segmented stay could therefore receive overlapping bootstrap segments, alter quotes, or break booking-account total reconciliation without the F0.6 stale-input checks detecting it.

## Disposition

Bounded technical repair; no product-policy choice or Human Gate. A repair Task Contract was created at `.orchestration/contracts/HMS-F0-06-REPAIR-CANONICAL-PRICING-SNAPSHOT-001.md`.

The repair snapshots every canonical segment field into the source manifest and digest, holds an already-segmented stay as `ORPHAN_OR_CONFLICT` with no bootstrap candidates, and adds forward-only migration `0027_active_stay_bootstrap_segment_snapshot_guard.sql`. The guard compares exact row cardinality and all segment fields in both directions before the shadow run enters activation within the batch transaction. The executing-D1 adversarial test changes canonical segments after shadowing, restores booking pricing version/token/update timestamp, and verifies the isolated segment-set guard rejects without activation or canonical drift.

This record preserves A1's `REWORK`; it does not claim a verdict for replacement A2. A fresh independent reviewer must assess exact A2+B2 after publication. The prior verdict remains immutable and is not transferable.
