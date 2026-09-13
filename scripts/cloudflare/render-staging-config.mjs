#!/usr/bin/env node
import { writeFile } from "node:fs/promises";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing required environment variable ${name}`);
  return value;
};

const config = {
  $schema: "../../node_modules/wrangler/config-schema.json",
  name: "hms-cloudflare-api-staging",
  main: "src/entrypoint.ts",
  compatibility_date: "2026-08-23",
  compatibility_flags: ["nodejs_compat"],
  workers_dev: false,
  observability: {
    enabled: true,
    logs: { enabled: true, head_sampling_rate: 0.1 },
  },
  vars: {
    ENVIRONMENT: "staging",
    ACCESS_AUDIENCE: required("CF_ACCESS_AUDIENCE"),
    LOCAL_DEV_AUTH: "false",
    STAGING_ACCEPTANCE_AUTH: "true",
  },
  d1_databases: [
    {
      binding: "CONTROL_DB",
      database_name: "hms-control-staging",
      database_id: required("CONTROL_DB_ID"),
      migrations_dir: "schema/control-migrations",
    },
    {
      binding: "HOTEL_DEMO_DB",
      database_name: "hms-hotel-demo-staging",
      database_id: required("HOTEL_DEMO_DB_ID"),
      migrations_dir: "schema/hotel-migrations",
    },
    {
      binding: "HOTEL_SECOND_DB",
      database_name: "hms-hotel-second-staging",
      database_id: required("HOTEL_SECOND_DB_ID"),
      migrations_dir: "schema/hotel-migrations",
    },
  ],
};

await writeFile(
  new URL("../../apps/api/wrangler.staging.generated.jsonc", import.meta.url),
  `${JSON.stringify(config, null, 2)}\n`,
  { mode: 0o600 },
);

process.stderr.write(
  "STAGING_ACCEPTANCE_BRIDGE: API is private and pins the exact Access application audience; staging issuer is derived only from a Cloudflare Access assertion.\n",
);
