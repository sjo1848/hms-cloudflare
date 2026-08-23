# Independent Critic Review — CF-DESIGN-REVIEW-001

## Review identity

- Contract: `CF-DESIGN-REVIEW-001`
- Reviewed target repository: `sjo1848/hms-cloudflare`
- Reviewed target HEAD: `84cc541ae9b5ac8ceccf18ad38885b1b4b3b4617`
- Reviewed design artifact: `docs/migration-design-package.md`
- Reviewed source parity artifact: `docs/source-contract-inventory.md`
- Reviewed decision: `.orchestration/decisions/CF-DATA-001.md`
- Source baseline inspected: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Working tree: clean before this evidence update; `main` matched `origin/main`.
- Role: Independent Critic. This review is based on persisted artifacts and source evidence, not the design author’s private reasoning.

## Inputs actually inspected

- `AGENTS.md` and `.orchestration/STATE.md`.
- `.orchestration/contracts/CF-DESIGN-REVIEW-001.md`.
- `.orchestration/decisions/CF-DATA-001.md` — approved Option B and `$0/month / Cloudflare Free` cost guard.
- `docs/migration-design-package.md` in full.
- `docs/source-contract-inventory.md` and its independent Critic review.
- Source router/OpenAPI, frontend route tree/API usage, RBAC/auth evidence, domain models/services, migrations and representative lifecycle/transaction/tenant tests at the pinned source SHA.
- Drive governance documents were unavailable to this runtime; no Drive verification is claimed. The repository-portable artifacts were used as authorized by the contract.

## Pre-flight result

| Check | Result | Evidence |
|---|---|---|
| Working directory | PASS | `/home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare`. |
| Git root | PASS | Same path from `git rev-parse --show-toplevel`. |
| Remote identity | PASS | `git@github.com:sjo1848/hms-cloudflare.git`. |
| Branch/HEAD/worktree | PASS | `main`, HEAD `84cc541...`, clean and synchronized with `origin/main`. |
| Tenant decision | PASS | `CF-DATA-001` explicitly `APPROVED`, selected Option B. |
| Paid transition | PASS | Decision and design package prohibit automatic paid activation and require a separate Human Gate. |
| Source baseline | PASS | Read-only source checkout resolves exactly to `4df56a6217caab611f2f5fcbd98bde8386bb5629`. |

## Requirement-by-requirement review

| # | Review question | Result | Evidence |
|---:|---|---|---|
| 1 | Product parity covers source journeys and surfaces | PASS | Design sections 2–3 inherit the 51-operation inventory, J-01–J-11 journeys, UI/API/DB evidence rule and mobile reception scope. |
| 2 | Option B is applied consistently | PASS | Sections 4–5 keep CONTROL_DB narrow and ordinary hotel operations in one operational D1 per hotel. |
| 3 | Untrusted hotel input cannot select unauthorized DB | PASS | Section 11 requires Access identity → HMS membership/capability → authorized hotel context → binding; explicitly rejects client-supplied hotel ID as authorization. |
| 4 | Network path remains explicitly authorized | PASS | Section 12 requires distinct network capability, CONTROL_DB visibility, bounded aggregation and traceability without weakening ordinary isolation. |
| 5 | Relational integrity is preserved | PASS | Section 8 requires local operational FKs and verified routing; Section 11 constrains the control/operational boundary. |
| 6 | Room-night overlap replaces GiST semantics plausibly | PASS | Section 10 defines one row per active occupied room-night, uniqueness and atomic updates for create/date-change/reassignment/cancellation; tests are explicitly required. |
| 7 | Lifecycle remains domain transitions | PASS | Sections 8, 13 and 16 retain check-in, checkout, reassignment and housekeeping semantics as non-CRUD invariants. |
| 8 | Financial integer cents and atomicity | PASS | Sections 8–10 require integer cents and business atomicity inside the relevant hotel D1; cross-D1 atomicity is explicitly forbidden. |
| 9 | Access/HMS auth adaptation | PASS | Section 7 makes Access primary, keeps HMS membership/roles/capabilities authoritative and preserves `/api/v1/auth/me`; native auth is the explicit exception. |
| 10 | API and UI surfaces | PASS | Sections 2–3 and 13 preserve `/api/v1`, typed errors, request correlation and the required UI surfaces, including mobile. |
| 11 | Free-tier cost boundary | PASS | Section 6 and decision record prohibit paid Workers/D1/services without a separate Human Gate; growth boundary is explicit. |
| 12 | Operational feasibility and validation | PASS | Sections 3, 14, 16–18 require local/CI test harnesses, contract/security/browser evidence, health/readiness, rollback/recovery and pre-production validation. |
| 13 | Decision Latitude | PASS | Section 15 separates implementation-owned mechanics from fixed strategy/security/product/cost constraints. |
| 14 | Design exit criteria | PASS | Section 18 lists all required exits and blocks CF-I01 until independent Design PASS. |

## Findings ordered by materiality

No blocking or corrective findings.

The design intentionally leaves implementation details such as D1 binding mechanics, query-builder choice, file layout and network aggregation mechanics to BUILD, while retaining explicit security, parity and cost constraints. That is consistent with the contract’s Decision Latitude and is not a design omission.

## Strongest contrary evidence

The strongest contrary risk is that the per-hotel D1 binding and network aggregation are operationally complex and Free-tier capacity may become a growth boundary. The package treats both risks explicitly: hotel selection is authorization-derived, network access is capability-bound, critical transactions stay within one hotel DB, and any paid transition requires a new Human Gate. This is residual execution risk, not a current design defect.

## Residual risks and limitations

- Drive governance documents were unavailable; portable repository artifacts were used and no external parity is claimed.
- `room_inventory_nights` is a semantic design obligation; its concrete schema, indexing and concurrency tests belong to `CF-I03` BUILD and must be independently reviewed there.
- Access header validation, D1 binding provisioning and bounded network aggregation require implementation evidence before technical closure.
- Human Product Acceptance, production eligibility and deployment remain distinct future states; this review does not approve them.
- No product BUILD, paid service activation, real-data migration or production cutover was performed or approved.

## Verdict

`PASS`

## Exact next authorized action

Mark DESIGN complete, create/activate the `CF-I01` Task Contract, and continue automatically into its pre-flight/contextual Specialist work. Do not activate paid Cloudflare services, migrate real data or declare Product Acceptance.

