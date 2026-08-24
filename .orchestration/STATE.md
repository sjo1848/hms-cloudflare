# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-24  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 PASS / CF-I06 REWORK-1 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving product behavior, domain semantics, security, financial integrity and operational safety. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.
- Target: `sjo1848/hms-cloudflare`.
- Active contract: `.orchestration/contracts/CF-I06.md`.
- Current Independent Critic: `.orchestration/reviews/CF-I06-CRITIC.md`.
- Invariants: `.orchestration/INVARIANTS.md`.
- Pre-Critic Gate: `.orchestration/PRECRITIC-GATE.md`.
- Machine state: `.orchestration/STATUS.json`.

## ACTIVE DECISIONS

- `CF-ARCH-001`: Cloudflare Access + React/Vite + Workers/Hono/TypeScript + D1; same-origin `/api/v1`; source read-only; parity before expansion.
- `CF-DATA-001`: CONTROL_DB + one operational D1 per hotel; critical workflows stay inside one hotel D1; `$0/month / Cloudflare Free`; paid transition is Human Gate.
- `CF-UX-PARITY-001`: accepted source HMS controls material workflow/interaction/responsive parity.
- `PM-AUTONOMY-001`: Human = Product/Risk Authority; ChatGPT = External Controller/Independent Critic; Codex = Runtime Orchestrator; routine REWORK autonomous.
- `PM-INVARIANTS-001`: learned invariants + mandatory Pre-Critic Gate are binding; no Codex self-PASS.
- Financial evidence rule effective now: a mutable snapshot used to authorize/price/close a financial operation must be correlated or revalidated in the authoritative write boundary. A post-batch JavaScript `meta.changes` check cannot retroactively roll back committed side effects.
- Test-runner rule effective now: a required regression blocked by runner/process-lock failure is `UNPROVEN`, not PASS, until executable evidence succeeds.

## VALIDATED RESULTS

- CF-I01 — PASS — `27515d85d9db0677c4946746fa86374252bff4f5`.
- CF-I02 — PASS — `bb3a136526c900522394f223206600f543e99e23`.
- CF-I03 — PASS / CLEAN INTEGRATION PASS — accepted `65ed1e5710a20af97d183f04364b5aa7b605a74a`; integrated `58c84a2564d9a4b85785203ff04fee24fee47213`.
- CF-I04 — PASS — `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.
- CF-I05 Housekeeping + Maintenance — PASS — artifact A `17372d3200b8e88eec116e97672c12589005103d`, boundary B `9a05013c4b38567ff4749a855b40c9fd1cba2314`.

### Carry-forward debt

Source `NoShow` departure exclusion is not yet representable in the target booking enum. Resolve before final migration readiness, at latest CF-I09; imported NoShow data must not become Housekeeping tasks.

## CF-I06 — BILLING

Artifact A `907d78629e2432f4ee54006c682f8185b04f7d4b` + boundary B `3f3abdadd5c1c6ad80d58308635c55a901c18752` received Independent Critic `REWORK-1`.

### Accepted foundation from artifact A

- INTEGER-cent schema and safe-integer API parsing;
- invoices, payment entries, extra charges, cash closures and financial events exist in hotel D1;
- existing-invoice concurrent payment fixture prevents overpay;
- backend financial capability map exists;
- booking-level billing UI is integrated with Reception rather than replacing it;
- A→B publication protocol is correct;
- no CF-I07, production, remote D1, real data or paid-resource drift.

### Blocking REWORK-1 findings

1. Rejected first payment/overpayment can leave a newly-created invoice committed because invoice insertion occurs in a successful batch and rejection happens only after the batch returns.
2. Cash close uses a mutable payment summary read before the write batch and does not revalidate total/cash/non-cash/count inside the closure write boundary; a payment can arrive between read and close.
3. Source counts every non-CASH payment, including TRANSFER, in the source-equivalent `card_amount_cents`; target currently counts only CARD.
4. Source first-shift opening is earliest unclosed payment, or current time when no payments exist; target exposes an artificial year-0000 opening.
5. Required cash balance + close-cash UX is absent; target browser only exercises booking charge/payment UI.
6. Required responsive matrix is incomplete: 390px missing; required financial error/close-cash browser journeys are not executed.
7. Required CF-I03/04/05 inherited regressions were blocked by local D1 lock and incorrectly treated as completed; runner failure is UNPROVEN.
8. Required settle-payment, tenant/RBAC, TRANSFER, positive/negative difference, extra-charge consistency and stale-snapshot adversarial evidence is incomplete.
9. Source payment history is newest-first; target is ascending. `INV-ORDER-001` was declared applicable in contract but omitted from invariant evidence.

Full findings and required repairs: `.orchestration/reviews/CF-I06-CRITIC.md`.

Diagnosis: `FINANCIAL_SNAPSHOT_ATOMICITY + PAYMENT_REJECTION_SIDE_EFFECT + CASH_CLASSIFICATION_PARITY + UX_CASH_CLOSE_GAP + REQUIRED_EVIDENCE_GAPS`.
Human Gate: `NONE`.
Blocker: `NONE`.

## DELIVERY SEQUENCE

`CF-I06 → CF-I07 → CF-I08 → CF-I09 → Cloudflare test environment → Human Product Acceptance → production-readiness/release gates`.

No intermediate Cloudflare preview is planned.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTIONS

Local `git pull --ff-only` only if the Codex workspace has not consumed the latest remote state. This is a Human Action, not a Human Gate.

## BLOCKERS

None. CF-I06 REWORK-1 is routine and authorized.

## CF-I06 REWORK-1 PUBLICATION BOUNDARY

Artifact A: `291ee7ae60ddd3c0abec8ff6b921666f3e86e76f` (`fix: harden CF-I06 financial rework`). It contains the substantive financial hardening, cash balance/close UX, expanded regression/browser harnesses and refreshed invariant/gate evidence.

The next commit is orchestration-only boundary B. It records exact A, sets `external_review.required=true` and `resume_authorized=false`, and stops for Independent Critic. No CF-I07 work is authorized before CF-I06 PASS.

## NEXT AUTHORIZED ACTION

Independent Critic reviews artifact A `291ee7ae60ddd3c0abec8ff6b921666f3e86e76f` together with orchestration-only boundary B. CF-I06 REWORK-1 execution is complete for this boundary:

1. fail-closed first payment/overpayment state;
2. complete cash snapshot revalidation in the authoritative write;
3. restore TRANSFER/non-cash, opening and newest-first parity;
4. implement balance/close UX and typed stale error;
5. execute expanded adversarial and browser evidence;
6. refresh invariant and Pre-Critic evidence;
7. publish artifact A `291ee7ae60ddd3c0abec8ff6b921666f3e86e76f` plus orchestration-only boundary B;
8. stop for Independent Critic.

Do not begin CF-I07 before CF-I06 Independent Critic PASS. No production deployment, remote D1 mutation, real-data migration, Cloudflare preview deployment or paid transition is authorized.
