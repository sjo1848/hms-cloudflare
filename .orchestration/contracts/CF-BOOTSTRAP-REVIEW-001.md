# TASK CONTRACT — CF-BOOTSTRAP-REVIEW-001

TASK ID: `CF-BOOTSTRAP-REVIEW-001`
PROJECT: HMS Cloudflare
GLOBAL PROJECT MODE: `DELIVERY`
PHASE: `DESIGN`
ROLE: `INDEPENDENT CRITIC`
STATUS: `READY`

## OBJECTIVE

Independently review PR #1 (`chore: bootstrap Project Method for Codex`) before it is integrated, because the external controller authored the bootstrap and cannot approve its own work.

## ARTIFACT UNDER REVIEW

- Repository: `sjo1848/hms-cloudflare`
- PR: `#1`
- Head branch: `chore/method-bootstrap`
- Bootstrap base: `main@c11141f1c724f2c83d2e06dc868e0bcc0cd9af4d`
- Initial bootstrap authoring commit: `ca5f145f7e89d539075baee8f97d00ff309b8fa4`
- Review the current PR head, not only the initial commit, and record the exact reviewed head SHA.

## CANONICAL INPUTS

- `AGENTS.md`
- `.orchestration/STATE.md`
- `.orchestration/contracts/CF-SOURCE-CONTRACT-001.md`
- this contract
- Drive governance documents when runtime access exists:
  - `HMS-CLOUDFLARE — Project State & Orchestration`
  - `HMS-CLOUDFLARE — Migration Design Package v0.1`
  - `REFERENCE — PROJECT-METHOD-TRANSFER-PACK-v0.1`
- pinned source baseline identity: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

If Drive is unavailable, use the repo snapshot and explicitly record that limitation. Do not fabricate Drive verification.

## REVIEW QUESTIONS

1. Does the bootstrap correctly assign:
   - Human = Product/Risk Authority;
   - Codex = Runtime Orchestrator / execution;
   - ChatGPT = External Project Controller / Method Custodian / audit/Human Gate interface?
2. Can Codex reconstruct current state without chat history?
3. Are Global Project Mode, phase, source baseline, target repo, active decision `CF-ARCH-001`, pending gate `CF-DATA-001`, scope and non-goals explicit?
4. Does the bootstrap prevent Codex from silently resolving `CF-DATA-001`?
5. Does it preserve Specialist → Independent Critic → REWORK → Integration Review → legitimate Human Gate semantics?
6. Does it prevent self-approval and human message-bus behavior?
7. Are acceptance-surface and state-separation rules present?
8. Is `CF-SOURCE-CONTRACT-001` correctly bounded to independent DESIGN work and prevented from product BUILD?
9. Is any product code, deployment, real-data access or D1 topology decision introduced by this PR?
10. Are artifact identities/refs and next action sufficiently explicit for runtime transfer?

## CRITIC CONSTRAINTS

- Do not approve based on intent alone; inspect the PR content.
- Do not edit the bootstrap while acting as the Critic.
- Do not use the author’s private reasoning.
- If REWORK is required, emit specific findings and hand them to a Repair context/role. A fresh logically independent Critic must review the repaired head.
- Do not turn minor wording/style preferences into REWORK unless they materially impair autonomy, safety, traceability or correctness.

## REQUIRED OUTPUT

Create:

`.orchestration/reviews/CF-BOOTSTRAP-REVIEW-001.md`

Include:
- reviewed PR/head SHA;
- inputs actually available;
- findings;
- requirement-by-requirement review;
- verdict: `PASS | REWORK | HUMAN_GATE | CONTRACT_DEFECT`;
- strongest contrary evidence;
- residual risks/limitations;
- next authorized action.

## PASS CRITERIA

PASS only if:
- role split and autonomy protocol are correct;
- pending Human Gate is preserved;
- no blocked BUILD is authorized;
- no product/runtime implementation is smuggled into bootstrap;
- source-of-truth and portable state are sufficient to start Codex;
- source-contract task is adequately bounded;
- bootstrap can be integrated without requiring a routine human confirmation.

## ON PASS

- Persist review artifact with immutable commit SHA.
- Integrate PR #1 through the normal repository path if runtime permissions allow.
- Update `.orchestration/STATE.md` to mark bootstrap PASS/integrated.
- Automatically begin `CF-SOURCE-CONTRACT-001`.
- Do not ask the human whether to continue.

## HUMAN GATE TRIGGERS

Only if the review uncovers a genuine unresolved strategy/scope/material security/cost/irreversibility trade-off. Bootstrap correctness defects are REWORK or CONTRACT_DEFECT, not Human Gates.

## STOP CONDITION

`PASS_CF_BOOTSTRAP_REVIEW_001`, bounded REWORK, or a legitimate Human Gate/material blocker.
