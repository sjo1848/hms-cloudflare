# F0.7 Pricing-Version ABA Repair — Mandatory Pre-Critic Gate

Task Contract: `.orchestration/contracts/HMS-F0-07-REPAIR-BOOKING-PRICING-ABA-001.md`
This is an internal admission gate, not an Independent Critic verdict.

| Gate | Status | Evidence |
|---|---|---|
| Contract/scope | PASS | Frozen bounded repair contract precedes code. Only existing pricing-version binding and executing-D1 ABA proof. |
| Root cause | PASS | Prior checkout snapshot bound visible amount/invoice/ledger fields but not monotonic booking pricing generation; same-value repricing ABA could not be disproved by existing evidence. |
| Exact conditional winner | PASS | Checkout SQL includes `pricing_version` equality from pre-read account snapshot. Interleaved total 10,000 → 12,500 → 10,000 plus pricing version +2 returns false with exact zero drift. |
| D11/money | PASS | No invoice/payment changes in ABA fixture; integer cents remain exact. Existing A1 D11 matrix is unchanged. |
| Audit truth | PASS | No CHECK_OUT event for stale ABA loser; exact count zero. |
| User-visible behavior | PASS (inherited) | No UI/API response contract change; A1 real local Worker/D1 desktop/mobile 409/success and refresh remain applicable. Broad browser-runner limitation is retained explicitly. |
| Migration/cutover | N/A | No schema migration and no data cutover. |
| Tenant/RBAC | PASS (inherited) | No authorization/routing change; A1 CF-I03 validates active receptionist denial and tenant routing; final CF-I03 rerun required. |
| All registry invariants | PASS/N/A | Classified in `...-INVARIANTS.md`; no applicable invariant left unproven. |
| Full validation | PASS | Focused executing-D1 test PASS; `npm run check` 32 files / 144 tests PASS; TypeScript PASS; web build PASS (JS 296732 raw / 86123 gzip; CSS 40196 / 7909); architecture/i18n/Cloudflare budgets PASS; critical D1 query plans PASS; Wrangler API/Web/staging-SPA dry-runs PASS (dry-run only); CF-I03, CF-I04, CF-I05 and CF-I06 sequentially PASS; `git diff --check` and shell/STATUS syntax checks PASS. |
| Integrated checkout browser | PASS | Fresh real local Worker + migrated D1 + Vite desktop flow on repaired repository: settled 409 inline; authorized pending-approved 200; authoritative in-house queue refresh; exact D1 booking/room/inventory/invoice/ledger/event assertions. Prior A1 mobile browser evidence remains applicable because UI was unchanged. Broad product-flow runner limitation remains disclosed, not PASS. |
| Artifact boundary | PENDING | Freeze replacement A2, then orchestration-only B2 with external review required and resume false. |
| Independent Critic | PENDING | Fresh reviewer on exact A2+B2. Prior A1+B1 PASS_WITH_CONDITIONS does not transfer. |

No real data, remote D1, cutover, PR, push, merge, staging, deploy, production or Blocks A–H.
