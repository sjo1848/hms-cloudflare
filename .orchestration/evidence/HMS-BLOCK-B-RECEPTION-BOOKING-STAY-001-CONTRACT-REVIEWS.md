# Block B Contract Specialist Reviews

All reviews below were separate, read-only specialist contexts before product implementation. None is an implementation review, Pre-Critic PASS, or Independent Critic verdict.

## UX / IA / continuity — `/root/ux_ia_continuity`

- Confirmed Block B’s roadmap obligations: stable queue/case identity, links, filter/search, keyed refresh, context and capability behavior.
- Identified ordinary `booking_id` deep links/popstate not restoring selected case; Reception's direct History writes erase router scroll state; BillingWorkspace is mounted under Reception.
- Contract disposition: direct load/reload and both-direction Back/Forward acceptance added; route query changes must preserve router metadata; Billing separation and compatibility are explicit; queue/case state uses one booking identity.

## Responsive / mobile — `/root/responsive_mobile`

- Confirmed current max-width behavior stacks queue above case; no reduced-height model; URL/back/focus gaps overlap with UX review.
- Contract disposition: WIDE persistent two-panel, COMPACT/NARROW queue→case state navigation, reduced-height control reachability, explicit viewport interaction evidence, no universal drawer/sheet, focus and scroll restoration added.

## QA / evidence — `/root/qa_evidence`

- Confirmed `Promise.all` in `reception-api.ts` and post-aggregate state update in hook; identified existing load/selection epochs and refresh polling that must remain race-safe. Suggested per-auxiliary deferred success/failure tests and a Worker/D1 browser runner with intentional delay.
- Flagged Billing route/capability location as a boundary to validate; current frontend navigation has no Billing route while API uses existing `billing.read` capability.
- Contract disposition: no permission/API changes; isolated compatibility route is permitted only under existing capability and only if shell policy remains intact, otherwise `ROADMAP_BLOCKER`; explicit independent reads/failures and process cleanup evidence added.

No reviewer changed files or ran tests.
