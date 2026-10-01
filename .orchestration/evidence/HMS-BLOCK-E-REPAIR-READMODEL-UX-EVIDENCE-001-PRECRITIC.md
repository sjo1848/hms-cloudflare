# Block E Bounded Repair — Pre-Critic Admission

Repair contract `.orchestration/contracts/HMS-BLOCK-E-REPAIR-READMODEL-UX-EVIDENCE-001.md` is frozen before follow-up product changes. The parent Task Contract, source parity and all 24 invariants were reread.

## Admission checks

- [x] Findings are implementation/evidence gaps inside the already approved Housekeeping + Maintenance scope; no new product policy or state is introduced.
- [x] History uses persisted events with per-room bound and exact case correlation; no new retention claim or write.
- [x] Booking risk uses existing `CONFIRMED` rows, open `BLOCKING` cases and date overlap; advisory/non-overlap/terminal rows are explicit negatives; no booking mutation.
- [x] Both current impact enum values use existing API contract; no role/capability changes.
- [x] Tenant proof will use valid synthetic membership in both independently bound local D1s, with same-ID/different tenant data.
- [x] Browser matrix and keyboard/context/error checks map to E-11..E-13 and `INV-RESP-001`.
- [x] New controller budget resolution is recorded separately. Active ceilings are JS raw 350000, JS gzip 100000, CSS raw 55000, CSS gzip 15000; rerun passed before this repair.
- [x] No migration, real data, deployment or F–H work.

**PASS for the bounded repair changes listed in the contract only.** This is implementation admission, not final validation or Independent Critic approval. Final Pre-Critic remains mandatory before Artifact A.
