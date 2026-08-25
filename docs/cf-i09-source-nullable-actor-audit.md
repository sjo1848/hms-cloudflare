# CF-I09 source nullable-actor audit

Source baseline `4df56a6217caab611f2f5fcbd98bde8386bb5629`, migrations `0001`–`0030` reviewed exhaustively. Migrations without actor-bearing tables are recorded as `NONE`; actor-bearing nullable legacy fields are adapted with deterministic provenance.

| Migration range | Actor-bearing nullable surface | Target adaptation |
|---|---|---|
| 0001–0023, 0025–0027, 0029–0030 | NONE beyond already-required operational actors | Existing source reference or explicit rejection; no migration operator attribution |
| 0024 | `payment_entries.received_by_user_id` | `legacy-source-user:unknown:payment:<id>` plus `actor_reconstruction` |
| 0028 | `maintenance_cases.reported_by_user_id` | Case remains NULL; reconstructed housekeeping event uses `legacy-source-user:unknown:maintenance:<id>` plus provenance |
| 0028 | booking check-in/check-out actor columns | Deterministic unknown sentinel plus provenance when source actor is NULL |
| 0001–0030 | audit actor | Deterministic unknown sentinel plus source-table provenance when NULL |

The executable preflight asserts every adapted sentinel/provenance branch and rejects attribution to the migration operator. The fixture and reconciliation runner exercise the nullable payment, maintenance and lifecycle branches.
