# F0.12 Aggregate Evidence Gate — Final Pre-Critic

Task Contract: `.orchestration/contracts/HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001.md`.
Scope: exact evidence aggregation and synthetic-only validation. This is the mandatory internal publication gate, not an Independent Critic verdict and not Foundation 0 completion.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Increment closure | Aggregate manifest | F0.1–F0.11 identities and dispositions are explicit and ordered; F0.1 remains internal-evidence-only | `HMS-F0-12-AGGREGATE-EVIDENCE-INPUTS.json`; generated manifest |
| Cutover/bootstrap criteria | 24-row crosswalk | Every criterion has PROVEN/NOT_APPLICABLE/UNPROVEN status and exact source paths; scope limitations remain explicit | Crosswalk, hash-pinned evidence inputs, manifest |
| Synthetic record safety | Per-record manifest | Only synthetic test identities; unresolved/held rows excluded; no live read, mutation or activation authorization | Seven-record manifest; validator tests |
| Validation receipts | 16-item receipt set | Each required command has fixture, exit code and hashed evidence output; all applicable receipts pass | Input index and final run receipts |
| Repeatability / fail closed | CLI and Node tests | Two independent generations byte-identical; missing/tampered references rejected | Final Node test receipt; two output hashes `6dfab6de24a2f20bba784967549a34f413374a57201f6f239a581228f59511d0` |
| Gate separation | Manifest and orchestration | Candidate is `PASS_PENDING_INDEPENDENT_CRITIC`; `foundation0Complete=false`; no live activation or promotion authorization | Generated manifest; post-A/B state boundary |

## Final adversarial checks

- PASS: repository `npm run check` completed after the final validator change: 33 test files / 168 tests, exit 0.
- PASS: TypeScript, web build, architecture fitness, i18n, Cloudflare budgets and D1 critical query plans rerun after the final validator change, exit 0. JS budget 299,990 raw / 86,226 gzip bytes; CSS 43,399 raw / 8,383 gzip bytes.
- PASS: F0.3 clean synthetic D1 rehearsal executed twice; F0.6 synthetic bootstrap executing-D1 tests passed 11/11. Both remained isolated Miniflare D1 fixtures.
- PASS: strict serial CF-I03–CF-I06 regressions completed exit 0; each emitted its PASS marker.
- PASS: API, web and staging-SPA Wrangler dry-runs previously completed successfully; no deploy or staging mutation.
- PASS: manifest generation validated 24 criteria, 16 validation receipts, 7 synthetic rows, 64 pinned evidence paths; output `PASS_PENDING_INDEPENDENT_CRITIC`, zero blockers, and `foundation0Complete=false`.
- PASS: two fresh final manifest generations compared byte-for-byte; both SHA-256 values equal `6dfab6de24a2f20bba784967549a34f413374a57201f6f239a581228f59511d0`.
- PASS: seven fail-closed Node tests cover missing/tampered evidence, unproven criteria, invalid/non-synthetic claims, unreviewed increments, held-room activation, and deterministic output.
- PASS: DB/Data reviewer Raman's narrow findings are reflected in the crosswalk; no broadened production, tenant-routing, corpus-completeness, or full activation-preservation claim was introduced.
- PASS: no real/customer data was accessed or mutated; no product source or migration changed; no Blocks A–H, PR, push, merge, main, staging mutation or deployment was performed.
- PASS: only F0.12-owned paths are candidates for this artifact; pre-existing unrelated dirty outputs/scripts are excluded and preserved.

## Invariant gate

All 24 registry invariants are classified in `HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001-INVARIANTS.md`. Applicable invariants are evidenced PASS; CF-I08 invariants are N/A with rationale. INV-STATE-001 is specifically limited to the publication protocol: immutable Artifact A, subsequent orchestration-only Boundary B, then exact-pair Independent Critic. The file does not claim a self-approved substantive PASS.

## Findings and limitations retained

- Uncovered legacy source-corpus cases remain outside the finite synthetic mapper corpus; no universal migration correctness claim is made.
- F0.3 rehearsal digests are asserted against identical pinned values in both clean invocations; command logs do not themselves print every digest tuple.
- F0.3 tenant proof is limited to its independent mapper/D1 fixtures; F0.6 separately covers synthetic checkpoint/segment isolation.
- F0.6 full-paid and overpaid rows are classification-only; exact post-activation preservation is demonstrated only for the synthetic partial-paid stay.
- F0.6 restart evidence covers shadow restart and activation rollback, not process-kill/restart during canonical activation.
- These are bounded-evidence limitations, not hidden PASS claims. They were accepted as scoped by the read-only DB/Data review and do not create a roadmap or architecture blocker for this evidence-gate task.
- Shared/global promotion findings remain unchanged and are outside F0.12.

## Disposition

`PRE-CRITIC: PASS — READY TO FREEZE ARTIFACT A`

This permits only publication of the immutable F0.12 evidence artifact and its orchestration-only boundary, followed by a fresh Independent Critic. It does **not** close the F0.12 Development Gate or declare Foundation 0 complete. No F0.12 verdict may be represented as PASS until the Independent Critic reviews the exact frozen A+B pair.
