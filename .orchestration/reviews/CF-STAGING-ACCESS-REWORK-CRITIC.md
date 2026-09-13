# CF-STAGING-ACCESS-REWORK — Independent Critic

Verdict: **PASS**

Immutable implementation/test artifact: `0d3b714796b7d821172f8e30038b50acb776e528`
Branch: `rework/staging-access-verification`

## Trigger

Integration review found that the staging acceptance bridge trusted the private web-service gateway marker before cryptographically verifying the forwarded Cloudflare Access assertion. That made the bridge depend entirely on an external Access application being configured correctly.

## Reviewed closure

- `apps/api/src/auth/access.ts` now verifies `Cf-Access-Jwt-Assertion` against the configured Access team issuer/JWKS and audience before honoring the staging synthetic-identity bridge.
- Missing/malformed assertions fail closed.
- The bridge remains staging-only and explicitly opt-in; production continues through normal verified Access identity.
- Unit coverage includes a generated RS256 key/JWK and a signed Access-like JWT proving the positive bridge path, plus a negative no-assertion staging case.
- `.github/workflows/deploy-staging.yml` requires non-placeholder Access trust inputs before remote D1/deploy work.
- The deploy handoff captures the staging Web Worker URL and refuses acceptance handoff if either the root or API is anonymously 2xx.
- Deployment remains limited to manual dispatch or an explicit advance of `acceptance/staging`; ordinary `deploy/staging` merges do not deploy.
- No production, paid-resource, real-data, DNS/cutover, API schema, D1 schema, tenant or RBAC semantic change is introduced.

## Executable evidence

- Foundation CI run `33146654083` — PASS.
- UX/browser CI run `33146654077` — PASS.
- Browser artifact `9676041391` — digest `sha256:43d027b0da94d06689e965dd918cbdd3ee3bb8121ad0736305214fcf15a3b6dc`.

## Critic checks

- P0/P1 authorization bypass: **closed** by JWT verification before identity substitution.
- Fail-closed behavior when Access inputs are absent: **PASS**.
- Local development bypass leakage into staging/production: **not introduced**.
- Release-trigger scope: **PASS**; only `acceptance/staging` or explicit workflow dispatch can deploy.
- Evidence/implementation boundary: **PASS**; this review commit follows the immutable artifact above.

## Remaining runtime condition

The actual Cloudflare Access application and repository variables are external runtime facts. They are not assumed PASS here. The deployment workflow is deliberately required to prove them at runtime and must fail before Human Product Acceptance if they are missing or the hostname is anonymously accessible.

No Human Gate is required for this technical closure. Integration is authorized. Product Acceptance remains a later Human Gate after the single staging deployment succeeds.
