# HMS-F0-11-CRITIC-CONDITIONS-EVIDENCE-REPAIR-001 — Task Contract

Status: `FROZEN BEFORE EVIDENCE REPAIR`
Phase: Foundation 0 / F0.11 bounded Independent Critic condition repair.
Authority: Independent Critic `PASS_WITH_CONDITIONS` on exact A `ef4d9ee39e04229fafcfdcc44fcfbf37977e0306` + B2 `d7b2067a9e891607f4860c07916559a0782eb041`; original F0.11 Task Contract remains binding.
Mode: local/synthetic evidence and browser-test repair only. No real data or promotion.

## Objective

Resolve only the four evidence conditions from the fresh F0.11 Independent Critic. Do not edit Artifact A; produce a replacement immutable Artifact A2 and a new orchestration-only boundary for fresh Independent Critic.

## Findings → surfaces → acceptance → evidence

| Finding | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| IC-F0.11-01 exact budget proof absent | build/budget runner output | Retain the exact production build/budget result in the artifact and verify raw/gzip numbers are from that run | captured `web:build` and architecture/budget output; identify exact byte count |
| IC-F0.11-02 Rooms selection cases absent | F0.11 deferred-response browser script | Refresh retains selected room when exact identity remains; authoritative room list removal clears selected detail; existing latest-wins test still passes | deterministic mock browser assertions |
| IC-F0.11-03 Housekeeping context/next absent | F0.11 deferred-response browser script | In-place refresh preserves non-default board date, filter, search, selected room, and window scroll; `Next task` follows known actionable ordering; failed post-action reread does not advance and explicit refresh remains coherent | deterministic mock browser assertions with known Room 712/713 identities and 1280×900 viewport |
| IC-F0.11-04 console claim/log mismatch | integrated Reception browser script/logs | Capture console messages and page errors on both widths; explain exact benign INFO if any; assert there are no unclassified console errors/page errors | captured browser log/console evidence in Artifact A2 |

## Invariant classification

| Invariant | Class | Rationale / evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No backend write implementation changes; existing integrated check-in only supplies UI context evidence. |
| INV-AUDIT-001 | N/A | No audit/event implementation change. |
| INV-DOMAIN-001 | N/A | No domain transition implementation change. |
| INV-TENANT-001 | N/A | No tenant boundary or API implementation change; local synthetic fixtures remain isolated. |
| INV-RBAC-001 | N/A | No authorization implementation change. |
| INV-PARITY-001 | N/A | No source behavior implementation change. |
| INV-ENUM-001 | N/A | No enum mapping change. |
| INV-UX-001 | APPLIES | Verify resource selection and operational context remain coherent through refresh/next. |
| INV-ORDER-001 | APPLIES | Assert explicit known Housekeeping `Next task` identity, not target-self-derived order. |
| INV-RESP-001 | APPLIES | Browser proof includes contracted mobile/desktop integrated runs; supplemental race browser covers desktop interaction. |
| INV-EVID-001 | APPLIES | Separate build, mock, and Worker/D1 evidence; no claim beyond executable proof. |
| INV-LEGACY-001 | N/A | No historical recovery record behavior. |
| INV-MONEY-001 | N/A | No financial writes or arithmetic; Billing remains out of this bounded evidence repair. |
| INV-STATE-001 | APPLIES | New immutable Artifact A2 plus orchestration-only boundary and fresh critic; no self-approval. |
| INV-CF-I07-001 | N/A | No admin/network/audit authorization. |
| INV-CF-I07-002 | N/A | No admin mutation. |
| INV-CF-I07-003 | N/A | No role change. |
| INV-CF-I07-004 | APPLIES | Browser runners own local process lifecycle and must verify cleanup before PASS. |
| INV-CF-I08-001 | N/A | No Reports changes. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date semantics. |
| INV-CF-I08-004 | N/A | No report state enum. |
| INV-CF-I08-005 | N/A | No report clock or continuity behavior. |
| INV-SCOPE-001 | APPLIES | Keep repair limited to F0.11 test/evidence gaps; no F0.12 or unrelated product changes. |

## Boundaries / non-goals

- Do not alter F0.11 production behavior unless a specific test demonstrates a product defect; if so, record the smallest repair under this contract and rerun full validation.
- Do not edit frozen A `ef4d9ee…` or mutate its review verdict/history.
- No API/schema/migration, backend/domain/financial changes, or UI redesign.
- No real data, remote D1, staging, PR, push, merge, deploy, production, or Blocks A–H.

## Pre-Critic, QA and publication

Before editing tests/evidence, verify all 24 invariant classifications and this bounded scope. Run deterministic mock browser race suite, integrated Reception Worker/D1 at mobile and desktop, built/minified Rooms Worker/D1, exact build/budget capture, `npm run check`, types, architecture/budgets, query plans, explicit Wrangler dry-runs and CF-I03..06. Confirm console errors/page errors, process cleanup and test-script syntax. If all conditions close, write updated invariant and final Pre-Critic evidence, create Artifact A2 and a metadata-only boundary, then obtain a fresh Independent Critic on exact A2+B. F0.12 remains next only after that review is resolved.

## Stop condition

Do not stop on ordinary test repair. Stop only at a material product/data/promotion gate or the exact A2+B Independent Critic boundary. Foundation 0 remains incomplete until F0.12 aggregate evidence gate closes.
