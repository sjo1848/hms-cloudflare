# HMS Cloudflare — Orchestration State

Phase: `OPERATIONAL FLOW DEFINITION`
Runtime: `REWORK_V5`
Last reviewed Artifact A5: `6604871ed5c010451db3441deedd58a8c194fa93`
Critic V5: `REWORK`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`
Implementation: `LOCKED`
Human gates: `NONE_OPEN`

Active repair: register D9 pricing boundary so status/metadata-only booking writes cannot accidentally reprice accommodation. Canonical scope remains master, transition matrix, E2E matrix, API map, departure register, maintenance RBAC and operational invariants.

Next action: reconcile D9 across all canonical/financial documents, run Pre-Critic V6, then publish immutable A6+B6 for a fresh critic.