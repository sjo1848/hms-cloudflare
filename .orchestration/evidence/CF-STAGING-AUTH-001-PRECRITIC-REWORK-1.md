# CF-STAGING-AUTH-001 — Pre-Critic Evidence (REWORK-1)

## Scope check
- Branch: `fix/staging-auth-bridge`
- Base: `deploy/staging`
- No `main` modification.
- No UX/mobile files or production configuration changed.

## Learned-invariant mapping
| Invariant | Result | Evidence |
| --- | --- | --- |
| Fail closed for auth | PASS | `access.test.ts` rejects absent/malformed JWT, local auth outside development, missing staging marker, altered staging subject/email, and production staging bridge. |
| No caller-controlled privilege injection | PASS | `web/src/index.test.ts` proves local/staging identity headers are stripped and replaced before the Service Binding call. |
| Staging-only bridge cannot become production auth | PASS | `access.ts` requires `ENVIRONMENT=staging`, `STAGING_ACCEPTANCE_AUTH=true`, the gateway marker, and the exact fixed synthetic subject/email. |
| Private API boundary | PENDING DEPLOY EVIDENCE | Staging config contains only a Web Worker Service Binding to `hms-cloudflare-api-staging`; public API exposure and Access deny/pass remain deployment checks. |

## Adversarial review performed
1. A browser session can load the Access-protected Web Worker but the current deployed journey reports 401; this is the observed defect.
2. The Web bridge removes all caller-supplied `x-local-*`, `x-staging-*`, gateway, and hotel headers.
3. The API rejects a correctly marked bridge request if either synthetic subject or email differs from the expected fixed fixture identity.
4. API fallback JWT validation remains unchanged for non-staging contexts.

## Automated evidence required before deploy
- GitHub Actions `foundation-ci`: typecheck, unit tests, web build, Wrangler dry-runs.
- This REWORK-1 commit must receive a fresh successful run.

## Post-deploy evidence still required
- Cloudflare Access deny/pass on the staging hostname.
- `/api/v1/auth/me` through the UI path returns the fixed fixture identity.
- One authenticated fixture journey completes.
- No direct public API route exists.

## Admission decision
Code-level known invariants are ready for independent Critic after CI. The deployment/browser claims are intentionally not made until a reviewed deliberate deploy occurs.
