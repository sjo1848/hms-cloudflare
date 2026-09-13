# CF-STAGING-RELEASE-PREFLIGHT — Human Gate

Status: **HUMAN_GATE**  
Gate type: **CREDENTIAL_PERMISSION**  
Scope: Cloudflare staging only

## Accepted integrated candidate

- Integrated candidate: `3ccc28a0207bc142521ab92baa73960b1c86f3c0`.
- Foundation CI run `33147471962` — **PASS**.
- UX/mobile browser CI run `33147471959` — **PASS**.
- Browser artifact `9676346444`.
- Artifact digest `sha256:de63be030e353d2cefe738a2a3631c2b4161647bf4206f2576e798f380d3c1d6`.
- Access auto-provision implementation artifact `28b673f5abe9fdb809058d33169351d9427af3e9` — Foundation + Browser PASS and Independent Critic PASS before integration.

## Release preflight evidence

1. The first release attempt, run `33146922474`, stopped before any remote D1/Worker mutation because Access trust variables were absent.
2. Read-only Cloudflare discovery, run `33147160941`, proved:
   - Workers subdomain: `sjo1848`.
   - Exact staging hostname: `hms-cloudflare-web-staging.sjo1848.workers.dev`.
   - Access Apps listing succeeds with the current API token.
   - No existing Access application protects the staging hostname.
3. Access provisioning diagnostic, run `33147549494`, attempted to create the exact hostname-scoped Access application and failed with Cloudflare HTTP 403.
4. Therefore the current API token can read Access Apps but cannot create the Access application/policy required for a secure acceptance deployment.

## Safety state

- No staging API Worker has been deployed by the failed release attempt.
- No staging Web Worker has been deployed by the failed release attempt.
- No staging D1 database was created or mutated by the failed release attempt or Access diagnostic.
- Production, DNS/cutover, real hotel data and paid resources remain untouched.
- The deployment remains fail-closed; it will not hand off a publicly accessible acceptance candidate.

## Genuine Human action required

Grant the HMS Cloudflare API token account permission:

`Access: Apps and Policies → Write/Edit`

Preserve the existing Workers Scripts and D1 permissions. If Cloudflare replaces/rotates the token secret while changing permissions, update GitHub repository secret `CLOUDFLARE_API_TOKEN` for `sjo1848/hms-cloudflare`. Never place the token secret in chat or source control.

After the Human reports the permission is ready, the orchestrator must:

1. re-run the bounded Access provisioning check;
2. require successful create/reuse of the exact staging Access application;
3. advance the acceptance release candidate only after technical proof;
4. execute the staging D1/migration/Worker deployment;
5. prove anonymous root/API are fail-closed;
6. hand off `https://hms-cloudflare-web-staging.sjo1848.workers.dev` for **REMOTE HUMAN PRODUCT ACCEPTANCE**.

The failed preflight does not count as the product staging deployment because it stopped before any D1/Worker mutation.
