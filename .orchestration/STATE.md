# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-28  
Global Project Mode: `DELIVERY`  
Phase: `STAGING RELEASE PREFLIGHT`  
Runtime: `HUMAN_GATE`  
Gate type: `CREDENTIAL_PERMISSION`

The integrated product candidate is technically accepted by CI and independent review. No further UX/mobile implementation is authorized before secure remote Product Acceptance.

## INTEGRATED CANDIDATE

- Product/integration candidate: `3ccc28a0207bc142521ab92baa73960b1c86f3c0`.
- Current `deploy/staging` orchestration head: `44938deabe07494c31930530a6d6fda249058e7d`; later commits are evidence/state only.
- Foundation CI `33147471962` — PASS.
- UX/mobile browser CI `33147471959` — PASS.
- Browser artifact `9676346444`, digest `sha256:de63be030e353d2cefe738a2a3631c2b4161647bf4206f2576e798f380d3c1d6`.
- State-freeze head `44938dea...` also passed Foundation `33147701124` and Browser `33147701108`.
- Reports/Users/Network REWORK is closed.
- Access JWT verification REWORK is closed.
- Hostname-scoped Access auto-provision design passed independent Critic before integration.

## STAGING RELEASE BOUNDARY

- Target hostname: `hms-cloudflare-web-staging.sjo1848.workers.dev`.
- Ordinary merges to `deploy/staging` do not deploy Cloudflare.
- Deliberate release is gated through `acceptance/staging`.
- The first acceptance release attempt `33146922474` stopped at preflight before D1 or Worker mutation.
- No production, DNS/custom-domain cutover, real-data migration or paid-resource activation is authorized.
- Cost target remains Cloudflare Free / `$0/month`.

## CURRENT HUMAN GATE

The existing `CLOUDFLARE_API_TOKEN` can authenticate, use the existing Workers/D1 permissions and list Access Apps, but creation of the exact staging Access application returns HTTP 403.

Required human action when Cloudflare access is available:

1. Grant `Account > Access: Apps and Policies > Write/Edit` to the HMS Cloudflare API token.
2. If Cloudflare rotates the token value, replace only the GitHub Actions secret `CLOUDFLARE_API_TOKEN`.
3. Report `listo`; do not paste the token into chat.

Evidence:

- Access discovery run `33147160941`: workers.dev subdomain resolved to `sjo1848`; Access Apps GET is readable.
- Provision check run `33147549494`: Access App POST returns HTTP 403.

## RELEASE DESIGN ALREADY CLOSED

- Release creates or reuses one Access application scoped to `hms-cloudflare-web-staging.sjo1848.workers.dev`.
- The Access application AUD is obtained automatically and pinned into the private API configuration.
- Staging verifies the Cloudflare Access JWT before substituting the synthetic acceptance identity.
- API Worker remains private behind the Web Worker Service Binding.
- Anonymous root/API probes must fail closed before the workflow can hand off staging for Product Acceptance.
- D1 seed logic preserves already initialized synthetic state and refuses partial seed state.

## NEXT AUTHORIZED ACTION

While the credential gate is open, do not perform additional product/UX work and do not weaken Access.

When the permission is available: verify Access write capability → advance `acceptance/staging` once → create/reuse Access → apply D1 migrations/seed-preservation → deploy private API + Web Worker → verify anonymous fail-closed behavior → persist version/evidence → enter `REMOTE HUMAN PRODUCT ACCEPTANCE`.

The Human then exercises the complete candidate and returns `ACCEPT` or `REWORK`. Technical PASS is not `PRODUCT_ACCEPTED`.
