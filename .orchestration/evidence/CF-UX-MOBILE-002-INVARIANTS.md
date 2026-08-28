# CF-UX-MOBILE-002 — Integrated invariant evidence

Status: PENDING INTEGRATED CI
Scope: Rooms, Guests, Housekeeping, Reports, Users, Network and payment retry safety.

| Invariant | Applies | Status | Required evidence |
|---|---|---|---|
| INV-UX-001 | APPLIES | PASS | Contracted workflows and HMS Elite interaction intent preserved. |
| INV-RESP-001 | APPLIES | PASS | Browser evidence at 375, 390, 430, 768, 1024 and 1366 px. |
| INV-STATE-001 | APPLIES | PASS | Async responses, selected dates, forms and payment retries remain coherent. |
| INV-PARITY-001 | APPLIES | PASS | Existing API payloads and domain semantics preserved; payment idempotency is separately reviewed. |
| INV-SCOPE-001 | APPLIES | PASS | Diff limited to contracted UX, evidence and reviewed payment retry safety. |
| INV-EVID-001 | APPLIES | PENDING | Final status depends on integrated Foundation and Browser CI. |
| INV-TENANT-001 / INV-RBAC-001 / INV-DOMAIN-001 | APPLIES | PASS | No unauthorized tenant, permission or domain behavior change. |
| INV-MONEY-001 | APPLIES | PASS | Payment retries are idempotent and bound to booking and full payload. |

The immutable integrated head and final CI run must be recorded here before Independent Critic review. No deploy is authorized from this evidence alone.
