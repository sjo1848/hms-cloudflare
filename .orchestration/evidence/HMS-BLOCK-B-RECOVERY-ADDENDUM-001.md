# Block B Recovery Addendum — Clean B0 Ancestry and Selective Transfer

Task Contract: `.orchestration/contracts/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001.md`
Frozen contract SHA-256: `d8522297d0ed420c83aee791c514676c8c68eed1e7faaf83c6b048bbea49d845`
Dedicated branch: `impl/hms-block-b-reception`
Exact B0 base/checkpoint: `5a42c5e1a62191843335f3fd217fead62b3ef0b2`
Recovery source only: `recovery/hms-b0-block-b-mixed-state` at `e9112f7e2289fda91dc1762a9d6c659c0de62a74`

## Lineage and contract preservation

The frozen Task Contract was authored before product implementation on the B0 review boundary `0a2b809097d73fd59865e75bb562eb3b6da4fea7`, branch label `impl/hms-b0-bundle-headroom`. That boundary is an ancestor of the clean B0 closure checkpoint above. The Task Contract blob is preserved byte-for-byte; its original metadata records its freeze-time base. This addendum records the actual execution branch/base after B0 closure and is authoritative for this recovered worktree. No acceptance semantics or scope were changed.

## Selective transfer

Recovered from the mixed snapshot: the frozen Block B Task Contract, its separate UX/IA, responsive/mobile and QA/evidence contract reviews, the frozen admission Pre-Critic, Reception/AppShell/i18n/styles implementation and unit tests, the Block B Worker/D1/browser/runtime harnesses, existing CF-I05/I06/I07 regression runner changes, and their synthetic-browser outputs. These are subject to fresh validation in this worktree.

Not transferred: mixed `.orchestration/STATE.md` / `STATUS.json`; the duplicate B0 runtime/policy/closure artifacts and duplicate budget edit; or any purported current-status values from the mixed snapshot. This checkpoint inherits canonical B0 closure/policy only from its verified B0 parents. No files under `apps/api`, schema/migrations, billing/rooms/housekeeping/maintenance implementations, or finance APIs were transferred.

The source snapshot remains intact as a recovery artifact and is not a promotion candidate. Nothing was pushed; no PR, merge, deployment, real data, or Blocks C–H work occurred.
