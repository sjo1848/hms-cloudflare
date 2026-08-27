# CF-UX-MOBILE-002 — Invariant Evidence

Artifact scope: PR #11, branch `ux/hms-rooms-guests`.

- INV-UX-001 — PASS: Rooms and Guests retain the existing list, selection, create, edit, and hold workflows; only responsive presentation and client-side state handling changed.
- INV-RESP-001 — PASS: Responsive controls remain covered by the branch browser workflow; this rework specifically preserves material room selection, hold form, guest form, and retry controls.
- INV-EVID-001 — PASS: Claims are limited to the implementation diff and CI/browser results; no remote deploy or production claim is made.
- INV-SCOPE-001 — PASS: Diff is limited to Rooms, Guests, their styles, contract, and evidence; no API, D1, RBAC, domain, financial, or deployment changes.
- INV-TENANT-001 — N/A: no API or tenant-routing changes.
- INV-RBAC-001 — N/A: no backend capability changes.
- INV-DOMAIN-001 — N/A: no domain transition implementation changes.
- INV-ATOMIC-001 — N/A: no business mutation implementation changes.
- INV-AUDIT-001 — N/A: no audit/event implementation changes.
- INV-MONEY-001 — N/A: no financial behavior changes.
- INV-STATE-001 — UNPROVEN for this intermediate rework commit: the final immutable artifact/publication-boundary pair is created only after CI and pre-Critic validation. This branch is not authorized for merge or deploy by this file.
