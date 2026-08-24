# CF-I07 security/admin parity

## Source → target capability matrix

| Source role/capability | Target Access + CONTROL_DB mapping | Enforcement |
|---|---|---|
| `admin` hotel administration | Access subject + active `hotel_memberships` role `admin`; rooms, guests, bookings, lifecycle, housekeeping, billing, users and audit capabilities | centralized `hasCapability` in Worker routes |
| `ops` operations | active hotel membership role `ops`; operational and billing capabilities, no user/network administration | backend capability check |
| `receptionist` front desk | active hotel membership role `receptionist`; reception and billing read/write capabilities | backend capability check |
| `housekeeping` | active hotel membership role `housekeeping`; housekeeping read/write only | backend capability check |
| `saas_admin` network administration | active `network_memberships` row; only `saas.hotels.read/write` | explicit network middleware + capability check; audit remains denied |
| unknown role | no capability set | deny by default |

Exact source-sensitive permissions are executable in `apps/api/src/auth/capabilities.ts`: `receptionist` has `billing.balance.read` and `billing.invoice.read` but not `billing.invoices.read`; `ops` retains `audit.events.read`; `saas_admin` is limited to network hotel read/write; and `bookings.checkout.override` is admin-only. Lifecycle and all migrated route modules consume this single authority.

## Cloudflare Access adaptation

The source password/account fields are intentionally not recreated. Cloudflare Access supplies the authenticated subject and email; `access_identity_mappings` retains the durable identity record and `hotel_memberships` retains tenant-scoped roles. User create/register updates an Access-backed membership only; it does not create a local password or bypass Access. Deactivation sets the tenant membership inactive while retaining identity history.

Operational routing is selected from the server-side `control_hotels.operational_binding` value and the Worker binding allow-list. A partial unique index makes active hotel→binding ownership one-to-one; client input cannot select an undeclared or already-consumed D1 binding. Network administrators have no implicit hotel membership and can only use the explicit `/hotels` control-plane surface.

The source network KPI shell is preserved with truthful `analytics_deferred: true` metadata; reporting aggregation remains CF-I08 scope.
