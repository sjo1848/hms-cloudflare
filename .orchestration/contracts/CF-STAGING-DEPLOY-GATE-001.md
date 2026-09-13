# CF-STAGING-DEPLOY-GATE-001 — Deliberate staging deployment

## Objective

Make `deploy/staging` a release-candidate branch without causing a Cloudflare deployment on every merge. A staging deployment must occur only when deliberately dispatched after the integrated candidate passes technical and independent review.

## Inputs

- Current release branch: `deploy/staging`.
- Existing workflow: `.github/workflows/deploy-staging.yml`.
- Active product contract: `.orchestration/contracts/CF-UX-MOBILE-002.md`.
- Human authorization: one deliberate remote staging deployment for Product Acceptance.

## Allowed

- Change only the staging deployment trigger and method/evidence needed to enforce it.
- Keep `workflow_dispatch` as the deployment entry point.
- Preserve the existing D1 migration/seed/deploy steps unchanged.

## Forbidden

- Production/cutover changes.
- Paid resources.
- Real data.
- Changes to application behavior, API, D1 schema, RBAC or authentication.
- Automatic deployment from ordinary pushes or merges.

## Evidence

- Git diff shows removal of the `push` trigger and preservation of `workflow_dispatch`.
- Foundation CI passes.
- Independent Critic reviews the immutable branch artifact before integration.

## Done when

- Merging into `deploy/staging` cannot by itself start `Deploy HMS staging`.
- A deliberate `workflow_dispatch` can still run the existing deployment pipeline.
- Critic verdict is PASS.

## Decision latitude

Low. This is a bounded harness correction. Routine REWORK is autonomous. Any request to broaden deployment scope, activate production, spend money or alter security requires a Human Gate.
