# Block B bounded rework disposition

## Initial independent Critic finding

Exact initial pair: A `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B `903436fcb69e3e412db7a41aeaacde3a8cfa1504`; fresh read-only reviewer returned `REWORK`, one MEDIUM WIDE 1280×600 Queue filter label/count collision and missing geometry/operation assertion. The original review is `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-INDEPENDENT-CRITIC-A-B.md`.

Frozen repair contract `HMS-BLOCK-B-REPAIR-WIDE-QUEUE-FILTERS-001.md` was executed. The desktop filter layout now has two columns; the integrated runner checks all six controls' bounding boxes, label/count separation and height at 1280×600 and operates Arrivals→All. The updated screenshot is `output/playwright/block-b-1280x600-queue.png`; executable output is `output/playwright/cf-block-b-reception-workspace.log`.

## Reassignment status verification clarification

The required Wave12 runner initially timed out waiting for the visible “Room reassigned” status. A bounded verification contract `HMS-BLOCK-B-REPAIR-REASSIGN-SUCCESS-NOTICE-001.md` was frozen while investigating. Reinspection of the exact initial Artifact A source shows the notice was already set after `closeCase()` and authoritative Queue refresh. No reassignment source edit was made. The initial timeout was not reproduced; a fresh Worker+D1 integrated rerun passed HTTP 200, observed the existing post-refresh success status, checked destination room 102 in refreshed Queue, and then passed the mobile stale HTTP 409 path while retaining the current case context. Log: `output/playwright/block-b-rework-wave12.log`. The initial timeout is recorded as a transient runner observation; it is not represented as a code defect or source fix.

## Final validation after WIDE repair

- `npm run check`: 35 files / 174 tests pass.
- `npm run types:check`: pass.
- `npm run web:build`: pass; JS raw/gzip 306,733/88,540 B; CSS 52,127/9,664 B.
- `npm run architecture:fitness`: architecture Fitness I/II, i18n coverage, active Cloudflare budgets all pass.
- `npm run test:d1-query-plan`: pass.
- `npm run wrangler:dry-run`: Worker API and static Web assets pass; no deploy.
- CF-I03 + CF-I04 local D1/API pass; CF-I05 API and browser pass; CF-I06 API and browser pass; CF-I07 API and browser pass. The direct CF-I05 rerun is represented in `output/playwright/cf-i05-regression.log`; its browser result and later regressions are preserved as rework logs.
- F0.11 check-in mobile Worker+D1/browser pass at 375px, with authoritative board refresh and selected-next-case continuity (`block-b-rework-f011-browser.log`).
- Wave12 reassignment integrated Worker+D1/browser pass as detailed above.
- Final Block B local Worker+D1+Vite/browser pass using fresh fixture `.hms-local/p0-1-block-b-final-repair-02`; queue visible screenshot at 2,702 ms while all three auxiliary responses remained pending; WIDE/COMPACT/NARROW, filter operation, navigation, partial failures/retries, capability refresh and Billing separation pass. Owned process trees stopped.
- Exact final production Vite Chrome DevTools trace summary and Resource Timing are in `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`. It reports FCP/LCP, each request start/end, the queue rAF marker (not paint), and explicitly does not claim a raw trace file or standalone parse/evaluation CPU measurement.
- `git diff --check` pass.

The only source changes for this rework are the Queue filter grid layout and the exact 1280×600 browser geometry/operation assertion. There are no API, schema, capability, lifecycle, or business-data changes.
