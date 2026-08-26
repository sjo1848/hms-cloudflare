# CF-I09 source nullable-actor audit

Source baseline `4df56a6217caab611f2f5fcbd98bde8386bb5629`, `backend/migrations/0001`–`0030`. This inventory was checked against the pinned source files (not the target D1 migrations); the source checkout is read-only evidence and is not part of this repository. Migrations without an actor/identity column are explicitly recorded as `NONE`; identity surfaces that are non-null or only indexed/FK-reinforced are recorded separately so the sweep cannot silently skip them.

| Migration range | Actor-bearing / identity surface in the actual source file | Target adaptation |
|---|---|---|
| 0001 | `refresh_tokens.user_id` is NOT NULL; `audit_events.user_id` is nullable | Refresh-token identity is not recreated under Access. Nullable audit actor uses `legacy-source-user:unknown:<event-id>` plus provenance. |
| 0002–0008 | No new actor columns | No nullable actor surface introduced; existing source fields retain their disposition. |
| 0009 | `cash_closures.user_id` is NOT NULL | Required source operator maps to `actor_subject`; no NULL adaptation. |
| 0010–0019 | No new actor columns (0011/0013 only reinforce existing user FKs/indexes) | No nullable actor surface introduced; existing source fields retain their disposition. |
| 0020 | `room_holds.created_by_user_id` is nullable | Preserve NULL in the target hold row; do not invent an actor or event. |
| 0021 | No actor columns (hold-type constraint only) | No actor adaptation. |
| 0022 | `bookings.checked_in_by_user_id`, `checked_out_by_user_id` are nullable | Preserve NULL exactly in booking snapshots. If the corresponding timestamp proves a lifecycle event occurred, the NOT NULL event actor uses `legacy-source-user:unknown:<checkin\|checkout>:<booking-id>` plus provenance; no event is invented when the timestamp is absent. |
| 0023 | No actor columns (invoice/payment settlement constraints) | No actor adaptation. |
| 0024 | `payment_entries.received_by_user_id` is nullable | Preserve NULL in the payment source shape; target payment/event actor uses `legacy-source-user:unknown:payment:<id>` plus provenance. Cash closure is introduced in 0009 and maps its required source user. |
| 0025 | No new actor columns (cash handoff only) | No actor adaptation. |
| 0026 | `bookings.terminal_recorded_by_user_id`, `late_arrival_recorded_by_user_id` are nullable | Preserve NULL in booking snapshots and do not emit an event solely from an actor column. |
| 0027 | `maintenance_cases.reported_by_user_id` is initially NOT NULL; `resolved_by_user_id` is nullable | Preserve mapped reporter/resolver values; nullable resolver remains NULL. The later legacy relaxation is covered under 0028. |
| 0028 | Drops NOT NULL on `maintenance_cases.reported_by_user_id` and inserts NULL reporters | Case remains NULL; reconstructed `MAINTENANCE_OPEN` event uses `legacy-source-user:unknown:maintenance:<id>` plus provenance. |
| 0029 | No actor columns (hotel rename only) | No actor adaptation. |
| 0030 | No new actor columns (RLS policy coverage only) | Existing actor dispositions remain unchanged; tenant/RLS scope is validated separately. |

The executable preflight asserts every adapted sentinel/provenance branch and rejects attribution to the migration operator. The fixture and reconciliation runner exercise nullable payment, maintenance, audit and lifecycle branches; booking actor snapshots are reconciled separately and remain NULL unless a source actor is present.
