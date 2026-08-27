# CF-UX-MOBILE-001 — HMS Elite parity foundation

## Evidence
- HMS Elite (the accepted source product) uses a dark operational sidebar, responsive shell, focused reception entry point, accessible mobile navigation, and dedicated reception mobile actions.
- HMS Cloudflare preserves operational surfaces but currently uses a minimal global CSS shell. At mobile widths it primarily stacks desktop columns and wraps the full navigation.
- Staging authentication is closed on deploy/staging at 03487765965a1778e5ce1e99ba36682fa554ec44. No deploy is needed while this branch is under construction.

## Objective
Rebuild the shared application shell and Reception surface so their visual language and mobile interaction intent match HMS Elite without changing HMS Cloudflare domain behavior or business API semantics.

## In scope
1. Shared shell: HMS Elite-inspired sidebar/header hierarchy, navigation grouping, active states and responsive mobile navigation.
2. Reception: clear primary action, mobile reception action bar, queue/workspace hierarchy, touch-safe controls, and selected-case flow.
3. Selected shadcn primitives only where they remove custom interaction risk: Button, Input, Select, Sheet/Drawer, Dialog/AlertDialog, Tabs, Badge, Toast/Sonner, Skeleton.
4. Shared design tokens and responsive behavior for 375 px, 390 px, 430 px, and desktop 1366 px.
5. Additive authenticated hotel display metadata (hotel_name) in /api/v1/auth/me, read from authoritative control-plane metadata; this is presentation context only and does not alter authorization, routing, mutations or the existing fields.

## Preserved invariants
- All existing routes, API behavior and fields, staging authentication, tenant identity headers, business actions, statuses and synthetic fixture behavior; the sole additive exception is the non-authoritative display-only hotel_name field above.
- Existing Reception, Rooms, Guests, Housekeeping, Users, Reports and Network feature availability.
- HMS Elite is the visual and interaction canon; shadcn is an implementation primitive, not a visual reset.
- Registry classification and evidence: .orchestration/evidence/CF-UX-MOBILE-001-INVARIANTS.md.

## Forbidden
- No product/domain/business API changes, no production/cutover, no real-data migration, no Access redesign, no paid Cloudflare resources.
- No unrelated redesign of secondary modules in this batch.
- No deployment per commit. Exactly one deliberate staging deployment may occur only after CI, responsive validation and an independent Critic PASS.

## Done when
- Shell + Reception meet the stated parity intent at the four target widths.
- Keyboard navigation, focus handling, dialogs/drawers, and touch targets are verified.
- Existing build/typecheck/tests and focused regression checks pass.
- Independent Critic returns PASS or a bounded REWORK is completed and freshly reviewed.
- One deliberate staging deployment is performed and recorded only after the prior gates pass.

## Decision latitude
The implementer may choose the minimal shadcn subset and CSS composition needed for the evidence. New primitives require a direct usability/accessibility or maintenance reason.

## Human gates
The Human authorized remote Product Acceptance because local computer access is unavailable. This does not waive CI, invariant evidence, Pre-Critic or Independent Critic. Exactly one deliberate staging deployment is allowed for the remote acceptance; the Human then returns ACCEPT or REWORK.
