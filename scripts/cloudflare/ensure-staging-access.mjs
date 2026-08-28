#!/usr/bin/env node
import { appendFile } from "node:fs/promises";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
if (!token || !accountId) throw new Error("Cloudflare credentials are required");

const api = "https://api.cloudflare.com/client/v4";
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function cf(path, init = {}) {
  const response = await fetch(`${api}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const message = payload?.errors?.map((e) => e.message).filter(Boolean).join("; ") || `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload.result;
}

const { subdomain } = await cf(`/accounts/${accountId}/workers/subdomain`);
if (!subdomain) throw new Error("Cloudflare Workers subdomain is unavailable");

const host = `hms-cloudflare-web-staging.${subdomain}.workers.dev`;
const encoded = new URLSearchParams({ domain: host, exact: "true", per_page: "100" });
let apps = await cf(`/accounts/${accountId}/access/apps?${encoded}`);
let app = Array.isArray(apps) ? apps.find((candidate) => candidate.domain === host) : undefined;

if (!app) {
  const body = {
    name: "HMS staging acceptance",
    type: "self_hosted",
    domain: host,
    app_launcher_visible: false,
    session_duration: "8h",
    policies: [
      {
        name: "HMS staging - Cloudflare account members",
        decision: "allow",
        precedence: 1,
        include: [{ cloudflare_account_member: { account_id: accountId } }],
      },
    ],
  };

  try {
    app = await cf(`/accounts/${accountId}/access/apps`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log("ACCESS_APP_ACTION=created");
  } catch (error) {
    if (error?.status === 403) {
      throw new Error("Cloudflare token can read Access Apps but cannot create the staging application. Add Account > Access: Apps and Policies > Write/Edit to CLOUDFLARE_API_TOKEN, then retry.");
    }
    throw error;
  }
} else {
  console.log("ACCESS_APP_ACTION=reused");
}

if (!app?.id || !app?.aud) {
  throw new Error("Access application exists but has no id/audience tag");
}
if (app.type !== "self_hosted" || app.domain !== host) {
  throw new Error("Refusing to use an Access application whose type/domain does not exactly match staging");
}

const fullApp = await cf(`/accounts/${accountId}/access/apps/${app.id}`);
const policies = Array.isArray(fullApp?.policies) ? fullApp.policies : [];
if (policies.length === 0) {
  throw new Error("Refusing staging release: the Access application has no allow policy");
}

const envLines = [
  `CF_ACCESS_AUDIENCE=${app.aud}`,
  `STAGING_HOST=${host}`,
  `STAGING_WEB_URL=https://${host}`,
  `CF_ACCESS_APP_ID=${app.id}`,
].join("\n") + "\n";
if (process.env.GITHUB_ENV) await appendFile(process.env.GITHUB_ENV, envLines);

console.log(`STAGING_HOST=${host}`);
console.log(`ACCESS_APP_ID=${app.id}`);
console.log(`ACCESS_AUDIENCE=${app.aud}`);
console.log(`ACCESS_POLICY_COUNT=${policies.length}`);
