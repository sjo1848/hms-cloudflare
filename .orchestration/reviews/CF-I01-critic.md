# Independent Critic Review — CF-I01

## Review identity

- Contract: `.orchestration/contracts/CF-I01.md`
- Reviewed artifact commit: `faeff038d041f6bbbeab8af3dac7f55e26937316`
- Review-state commit before this evidence update: `058add57e99ac504def9240b1d9a5f8acbb3fe95`
- Target repository: `sjo1848/hms-cloudflare`
- Branch/HEAD reviewed: `main` / `faeff038d041f6bbbeab8af3dac7f55e26937316`
- Source/design refs: `docs/migration-design-package.md`, `docs/source-contract-inventory.md`, `CF-DATA-001 Option B`
- Role: Independent Critic; implementation was inspected from persisted files and command evidence, not author reasoning.

## Inputs and checks performed

- `AGENTS.md`, `.orchestration/STATE.md`, `.orchestration/contracts/CF-I01.md`.
- Full foundation source/config/schema/test files under `apps/**`.
- `docs/cf-i01-foundation.md` and `.github/workflows/ci.yml`.
- Generated Wrangler types and package lock.
- Official Cloudflare guidance for Access JWT validation, Workers bindings, Wrangler JSONC, generated types and observability.
- Re-ran/read recorded evidence: `npm test` (7/7), `npm run typecheck`, `npm run types:check`, API/web `deploy --dry-run`, and local D1 migration application.
- No remote deployment, paid resource activation or real-data access observed.

## Requirement-by-requirement review

| Requirement | Result | Evidence |
|---|---|---|
| Separate API/static Workers | PASS | `apps/api/wrangler.jsonc`, `apps/web/wrangler.jsonc`, dry-run bundles and bindings. |
| Generated typed bindings | PASS | Per-worker `worker-configuration.d.ts`; `types:check` passes. |
| Access JWT boundary | PASS | `jose` JWKS validation with issuer/audience; malformed/missing assertions fail closed; tests cover it. |
| Membership/capability seam | PASS | Control-plane membership query and authorized hotel selection; backend boundary precedes application routes. |
| Option B data boundary | PASS | Separate control/hotel migrations and bindings; ordinary rooms/inventory are not in CONTROL_DB. |
| Authorized operational DB routing | FAIL | Membership selection returns the binding name but no resolver obtains the authorized operational D1; F-002. |
| Same-origin security | FAIL | CORS reflects arbitrary request origins while allowing credentials; F-001. |
| Local auth safety | FAIL | `LOCAL_DEV_AUTH=true` is an explicit config opt-in but not constrained to development environment in code; F-003. |
| Health/readiness and errors | PASS | `/health`, `/ready`, request IDs, security headers and redacted internal errors. |
| Free-tier/no deployment boundary | PASS | Placeholder local IDs, docs, CI dry-run and no remote mutation. |
| Reproducibility | PASS | npm lockfile, scripts, CI, generated type checks and local migrations. |
| No product feature expansion | PASS | Foundation-only placeholder routes and schemas; no HMS journey implementation. |

## Findings ordered by materiality

### F-001 — arbitrary credentialed CORS reflection (HIGH; REWORK)

`apps/api/src/index.ts` installs `cors({ origin: (origin) => origin ?? "", credentials: true })`. This reflects any supplied origin and enables credentialed cross-origin reads. The approved design is same-origin and the source contract treats backend authorization as authoritative. An arbitrary credentialed origin is an avoidable security regression and must be removed or restricted to an explicit configured origin.

### F-002 — authorized hotel binding is not resolved (HIGH; REWORK)

The membership query and `selectAuthorizedMembership` prove that a subject has a hotel membership, but the request path only stores/returns `membership.operationalBinding`; it does not resolve that binding to the corresponding D1 object before application handling. The contract explicitly requires an authorized hotel routing boundary. The foundation needs a fail-closed allowlisted resolver seam for the representative hotel binding, with a regression proving an unknown/client-influenced binding cannot be used.

### F-003 — local auth escape hatch lacks environment guard (MEDIUM; REWORK)

`LOCAL_DEV_AUTH=true` is described as local-only and checked-in config sets it false, but the code branch does not require `ENVIRONMENT=development`. A deployment variable change could enable synthetic header authentication outside development. Constrain the branch to an explicit development environment and test that production configuration cannot use it.

## Strongest contrary evidence

The artifact documents the intended same-origin/CORS and routing boundaries, and tests cover missing/malformed Access assertions and unauthorized membership selection. Those are useful safeguards, but they do not neutralize the actual arbitrary-origin reflection or the missing binding resolution in the runtime path. Documentation cannot substitute for those controls.

## Residual limitations

- The representative resolver will not provision or dynamically discover production hotel bindings; provisioning and complete per-hotel binding strategy remain later implementation work under the approved Option B design.
- No production Access application, remote D1 or paid Cloudflare resource was used.

## Verdict

`REWORK`

## Exact next authorized action

Repair F-001 through F-003 within `CF-I01`: remove/restrict CORS to explicit same-origin configuration, add a fail-closed allowlisted operational binding resolver, require development environment for local auth, add regression tests and persist a new artifact head. Then run a fresh logically independent Critic review.

---

## Fresh independent review after REWORK

- Repaired artifact head reviewed: `27515d85d9db0677c4946746fa86374252bff4f5`.
- Review method: fresh inspection of the repaired source/config/tests and rerun of the foundation verification commands; no reliance on the first verdict.
- Working tree before this review evidence update: only the persisted review/state files were pending; repaired implementation head was immutable.

### Fresh checks

- No CORS middleware or arbitrary-origin reflection remains; the API is same-origin by default.
- Access JWT validation remains cryptographic through `jose` JWKS, issuer and audience checks.
- `LOCAL_DEV_AUTH` requires `ENVIRONMENT=development`; production-mode regression passes.
- Membership is resolved from `CONTROL_DB` before hotel selection.
- `resolveOperationalDatabase` allowlists `HOTEL_DEMO_DB` and rejects unknown/client-influenced binding names.
- API and web `deploy --dry-run` both pass with only the intended D1/assets bindings.
- `npm test`: 11/11 passed.
- `npm run typecheck`: passed.
- `npm run types:check`: passed.
- No deployment, paid resource activation or real-data access occurred.

### Fresh requirement verdict

| Requirement | Result | Evidence |
|---|---|---|
| Separate API/static Workers | PASS | Wrangler configs and dry-run outputs. |
| Generated typed bindings | PASS | Per-worker generated types and `types:check`. |
| Access JWT boundary | PASS | `access.ts`, malformed assertion test and production/local-mode tests. |
| Membership/capability seam | PASS | Control-plane membership query and fail-closed hotel selection. |
| Option B data boundary | PASS | Separate migrations/bindings; operational data remains in hotel DB. |
| Authorized operational DB routing | PASS | Allowlisted resolver and unknown-binding regression. |
| Same-origin security | PASS | No CORS reflection; same-origin routing remains the default. |
| Health/readiness/errors | PASS | `/health`, `/ready`, request IDs and redacted errors. |
| Free-tier/no deployment boundary | PASS | Local placeholder IDs, dry runs only, no remote mutation. |
| Reproducibility | PASS | Lockfile, CI, tests, types, dry runs and local migration evidence. |
| No product feature expansion | PASS | Foundation-only routes/schema and later-increment placeholder response. |

### Fresh contrary evidence and residual limitations

The foundation intentionally supports one representative statically configured hotel binding; complete per-hotel provisioning/binding management and product routes remain later increments. This is within CF-I01 scope and is explicitly fail-closed for unknown bindings. Access production configuration still requires an actual Cloudflare Access application/domain/audience before deployment; none was provisioned here.

### Fresh verdict

`PASS`

### Exact next authorized action

Integrate/publish the repaired foundation, mark `CF-I01` technically passed, activate the next bounded Task Contract for rooms, guests and room holds (`CF-I02`), and continue through its Specialist → Independent Critic flow without routine human confirmation.
