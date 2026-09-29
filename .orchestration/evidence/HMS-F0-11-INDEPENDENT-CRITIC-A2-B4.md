# F0.11 Independent Critic — Artifact A2 + Boundary B4

Reviewer: Euler, fresh separate read-only Independent Critic (`gpt-6-luna`, medium); no edits and no tests run.

Exact pair reviewed:

- Artifact A2: `f7c8d28db1ce1dd6839f1f182260537f0e2d4898`
- Boundary B4: `173aed525d42198012d89d386ff60eafe3138e78`

Verdict: `REWORK` — two orchestration/evidence-handoff findings; no product defect, `ROADMAP_BLOCKER`, architecture contradiction, data-risk finding, or scope issue.

## Findings

### HIGH — F0-11-IC-A2-B4-01: stale canonical review pointer

`STATUS.json.external_review.review_path` names `.orchestration/evidence/HMS-F0-11-INDEPENDENT-CRITIC-A2-B3.md`, which is not a reviewed report in A2. The report on record is the historical A1+B2 review. B4 correctly identifies A2 and itself as pending, but its machine-readable pointer is stale. Repair: set the new boundary's intended review path to the exact A2+B5 report, while `last_audited_head` records B4 as the most recently reviewed boundary and `last_verdict` preserves this B4 `REWORK`.

### MEDIUM — F0-11-IC-A2-B4-02: historical boundary wording in immutable A2

A2's final Pre-Critic and invariant evidence name the originally intended B3. B4 later superseded B3 only to reconcile a stale F0.10 historical field. A2 must not be rewritten. Repair: explicitly record in B5 that this wording is historical and superseded by B4; direct the next fresh reviewer to exact A2+B5.

## Conditions substantively checked

Euler confirmed the four earlier A1+B2 evidence conditions now have substantive evidence: exact JS/CSS raw and gzip budgets; Rooms selection retain/clear; Housekeeping date/filter/search/selection/scroll, fixed Next identities and failed-reread recovery; integrated console/page-error classification. The actual `scrollY 600→0` continuity defect was reproduced and repaired with loaded board retention and stale-action disabling.

Integrated local Worker/D1 browser evidence covers Reception at 375×812 and 1280×900 and the built Rooms bundle at both widths. Mock and integrated evidence are labeled separately. The fresh test/build/budget/query-plan/Wrangler/regression evidence is present, including CF-I03–I06. The 10-byte JS raw budget margin is disclosed. A2's scope is bounded; unrelated working-tree changes remain excluded. No real-data, promotion, deployment or production operation is claimed.

The exact critic dispatch's full review notes are preserved in this disposition. Findings are metadata/handoff repair, not product rework; F0.11 remains pending until a fresh exact-pair review resolves the handoff.
