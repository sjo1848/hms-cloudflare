# CF-STAGING-AUTH-REWORK-1

## Evidence-backed diagnosis
Cloudflare Access already protects all Web Worker traffic. The API is private via Service Binding. The staging fixture maps `source-user:<uuid>` identities to hotel memberships. The deployed 401 is caused by `ctx.access`, which is not available in the Worker fetch context.

## Objective
Remove only the unsupported context guard so the existing Access-gated Web Worker can forward the fixed synthetic acceptance identity to the private API.

## Forbidden
No Access/Zero Trust redesign; no Team Domain/AUD configuration; no main/UX-mobile/production changes.

## Done when
Focused regression + CI pass; independent Critic; deliberate staging deploy; browser evidence for `/auth/me` and one fixture journey.
