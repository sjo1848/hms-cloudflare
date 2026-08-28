# CF-STAGING-ACCESS-AUTOPROVISION — Independent Critic

Verdict: **PASS**

Immutable implementation/test artifact: `28b673f5abe9fdb809058d33169351d9427af3e9`

## Trigger

The first deliberate release preflight failed before any D1/Worker mutation because repository variables for Access team domain and audience were absent. Read-only discovery then proved the existing token can read Access applications and the account Workers subdomain is `sjo1848`, yielding the exact staging hostname `hms-cloudflare-web-staging.sjo1848.workers.dev`.

## Reviewed closure

- Release now creates/reuses a hostname-scoped Access self-hosted application for the exact staging workers.dev hostname.
- Its allow policy is limited to Cloudflare account members for the same account; no Everyone/OTP-any-email rule is used.
- The generated Access app audience is captured at release time and injected into the private API configuration.
- Staging may derive the JWT issuer only when it is HTTPS and ends exactly in `.cloudflareaccess.com`; the independently pinned random application AUD is still required during signature verification.
- Production does not inherit issuer derivation and still requires its explicit team domain.
- The API remains workers_dev=false/private and receives traffic through the web Service Binding.
- Anonymous root/API probes remain mandatory after deployment.
- No production, real-data, DNS/cutover or paid-resource change is introduced.

## Evidence

- Foundation CI run `33147357717` — PASS.
- UX/mobile browser run `33147357679` — PASS.
- Browser artifact `9676306783`, digest `sha256:089b683fc4379f042342cb65f7e7810fc22e5a86733b46f96f1c6676a38f93ac`.
- Unit tests cover successful staging issuer derivation with a generated RS256/JWK assertion and rejection of a non-Cloudflare issuer.

## Runtime condition

Actual Access application creation/reuse and login availability remain runtime facts. The release workflow must fail closed if the token cannot create the app, if the app has no policy/AUD, or if anonymous staging becomes 2xx. Such failure is technical/configuration REWORK, not Product Acceptance.

Integration and another deliberate release attempt are authorized. The prior attempt performed no remote D1/Worker mutation, so the next successful run remains the single actual staging deployment for acceptance.
