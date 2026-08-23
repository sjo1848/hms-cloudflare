# CF-I01 — Platform Foundation

This increment establishes the Cloudflare runtime boundary only. It does not implement HMS product journeys.

## Workers

- API Worker: `apps/api/wrangler.jsonc`, Hono entrypoint `apps/api/src/index.ts`.
- Static frontend Worker: `apps/web/wrangler.jsonc`, assets under `apps/web/public`.
- Both use `compatibility_date: 2026-08-23`, generated Wrangler bindings and Workers observability configuration.
- Deployment routing is intentionally not provisioned in this increment; the reviewed design requires `/api/*` to reach the API Worker and all other paths to reach the static Worker under one hostname.

## D1 boundary

The API Worker declares two local bindings:

- `CONTROL_DB`: `access_identity_mappings`, `control_hotels` and `hotel_memberships` only.
- `HOTEL_DEMO_DB`: representative operational `rooms` and `room_inventory_nights` foundation tables.

The IDs in the checked-in config are local placeholders. They are not production database IDs and must not be used for a remote deploy. No remote D1 resource was created or mutated.

## Access boundary

Production requests require a `Cf-Access-Jwt-Assertion` and the configured Access team domain/audience. The API validates the JWT signature through the Access JWKS endpoint and checks issuer/audience before using `sub` and `email` claims. A client-supplied hotel identifier is considered only after the authenticated subject’s memberships are loaded from `CONTROL_DB`.

`LOCAL_DEV_AUTH=true` is an explicit local-test escape hatch and is `false` in the checked-in config. It must never be enabled in a deployed environment.

## Verification

```bash
npm install
npm run types:api
npm run types:web
npm run types:check
npm run check
npm run wrangler:dry-run
CI=1 npx wrangler d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc
CI=1 npx wrangler d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc
```

The dry run validates both bundles and bindings without deployment. The migration commands use Wrangler’s local D1 state only. No paid Cloudflare service, production credential or real hotel data is part of this increment.
