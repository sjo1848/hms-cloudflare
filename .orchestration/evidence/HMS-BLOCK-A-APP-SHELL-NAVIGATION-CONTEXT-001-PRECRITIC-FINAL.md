# Block A — Final Pre-Critic Gate

Task: `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001`
Gate: mandatory internal Pre-Critic; not an Independent Critic verdict.
Scope: approved Block A only.

## Gate result

**PASS for immutable Artifact A admission.** The separate read-only adversarial QA outcome is recorded in `HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001-QA-REVIEW-001.md`; all four findings were repaired and affected integrated evidence rerun. This does not self-approve a substantive Development Gate. External Independent Critic remains required after exact Artifact A + orchestration Boundary B.

## Contract, authority and scope

- Frozen Task Contract predates product implementation; Block A BA1–BA7 is approved. All repository paths are exact/current or marked `PROPOSED NEW SURFACE` in the contract/addenda.
- The seven routes are the existing navigation inventory; no destination, API, schema, permission taxonomy or domain workflow was added.
- Server `/auth/me` remains identity, hotel and capability authority. Client route guards are UX only. No backend files, migrations, domain data, or real/customer records changed.
- Blocks B–H and all promotion operations remain excluded.

## Adversarial checks and executable evidence

- Capability leakage/downgrade: allowed-before/denied-after same-subject Rooms read; route access removed after authoritative refresh; one 403 and no replay; protected API remains authority. Real local Worker; disposable D1 only.
- Identity/hotel stale state: server-provided user/hotel verified on synthetic identity/hotel switch; inherited F0.10 out-of-order `/auth/me` case PASS; unmembered hotel denied.
- Routing/context: all seven direct routes; unknown path is not Reception; Reception query/hash survives reload; Back/Forward restores path/query/hash and scroll (789 px restored).
- Responsive/interactions: exact WIDE 1440×900, COMPACT 1024×700, NARROW 390×844; actual keyboard traversal, named links, current-page semantics, More, Escape, focus restoration and touch-size assertions pass. Reduced-height 390×560 More drawer remains scrollable and keyboard-operable. Built/minified bundle separately checked at desktop/mobile with real local API proxy.
- Failed parallel full-suite run: 8 timeout failures among executing-D1 tests under two workers; serial rerun completed 34/34 files and 171/171 tests. The initial result is disclosed, not relabeled; serial execution demonstrates runner contention rather than a reproducible assertion failure.
- Visual snapshots are committed as diagnostic receipts and do not replace the executable browser assertions.

## Regression/build/security checks

- `npm run types:check`: PASS.
- `npm run typecheck && npx vitest run --maxWorkers=1`: PASS, 171/171.
- `npm run web:build`: PASS.
- `npm run architecture:fitness`: PASS, including i18n and raw/gzip budget checks. Exact final receipt: JS raw 299,976/300,000 (24 bytes remaining); JS gzip 86,915/100,000; CSS raw 48,615/50,000; CSS gzip 9,193/15,000. The very small raw headroom is an explicit critic risk, not hidden. The earlier 300,712-byte overrun and its repair remain preserved in `output/playwright/block-a-budget-overrun-after-hash.log`.
- `npm run test:d1-query-plan`: PASS.
- `npm run wrangler:dry-run`: API and web PASS; no deploy.
- Integrated F0.10 + Block A Worker/D1/dev + production-minified preview browser runner: PASS; D1 assertions and owned process cleanup PASS.
- `git diff --check`: PASS; exact diff/scope and screenshots reviewed. The frozen parent Task Contract is unchanged; new test scripts/files are identified as `PROPOSED NEW SURFACE` in evidence addenda.

## Invariants

All 24 durable invariant IDs are classified in the frozen Task Contract. Applicable evidence is recorded in `.orchestration/evidence/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001-INVARIANTS.md`; no applicable invariant remains FAIL/UNPROVEN.

## Final internal disposition

No `ROADMAP_BLOCKER`, frozen architecture contradiction, new product-policy decision or scope crossing found. Mandatory Pre-Critic and invariant evidence pass. Publish immutable A, then orchestration-only B; a fresh Independent Critic must review that exact pair. Do not start Blocks B–H or promote.
