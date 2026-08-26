# CF-STAGING-AUTH-001 — Task Contract

## Objective
Close the staging authentication path without altering product UX/mobile or production behavior.

## Canonical inputs
- GitHub Issue #6
- Drive: HMS-CLOUDFLARE — Staging Authentication Handoff — 2026-08-26
- Project Method v0.1
- Base: `deploy/staging` / `infra/cloudflare-staging-access` at `f211f2fe917564e78bd7be8958d721caf0624474`
- Staging URL: `https://hms-cloudflare-web-staging.sjo1848.workers.dev`

## Diagnosis
Cloudflare Access permits entry to the Web Worker, but the protected UI receives API 401 responses. The Web Worker bridge checks `ctx.access`, which is not a supported identity signal in the Worker fetch context. The check prevents forwarding to the private API worker.

## Allowed
- Change staging-only Web Worker/API auth bridge and focused tests.
- Persist evidence and create a reviewable branch/PR.
- Deliberately deploy only after independent Critic PASS.

## Forbidden
- Modify `main`.
- Start `ux/mobile-rework`.
- Production/cutover, real data, paid resources, public API exposure.
- Weaken production authentication.

## Required evidence
1. Focused regression: staging Web Worker forwards only under its Access-gated perimeter and strips caller-supplied identity headers.
2. API bridge accepts only staging-gateway-marked injected identity, rejects unmarked or production requests.
3. Staging browser journey: `/api/v1/auth/me` and one authenticated fixture journey work.
4. No public API endpoint is introduced.
5. Independent Critic verdict: PASS, REWORK, or concrete HUMAN_GATE.

## Done when
All required evidence is persisted; independent Critic verdict exists; Project State/Issue is updated; next action is calculated.

## Human Gate triggers
Only a material security trade-off, paid resource, production exposure, or irreversible policy change.
