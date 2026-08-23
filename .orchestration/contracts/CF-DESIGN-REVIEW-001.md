# TASK CONTRACT — CF-DESIGN-REVIEW-001

TASK ID: `CF-DESIGN-REVIEW-001`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `DESIGN`  
STATUS: `READY`

## OBJECTIVE

Independently review the integrated HMS Cloudflare Migration Design Package after the human-approved `CF-DATA-001 Option B` decision and determine whether DESIGN can close without silently weakening source-product behavior, tenant/security guarantees, financial/concurrency semantics, required product surfaces or the `$0/month / Cloudflare Free` operating boundary.

## CANONICAL INPUTS

- `AGENTS.md`
- `.orchestration/STATE.md`
- `.orchestration/decisions/CF-DATA-001.md`
- `docs/migration-design-package.md`
- `docs/source-contract-inventory.md`
- `.orchestration/reviews/CF-SOURCE-CONTRACT-001-critic.md`
- source repository: `sjo1848/hotel-management-system`
- pinned source baseline: `4df56a6217caab611f2f5fcbd98bde8386bb5629`
- durable Drive governance documents when the runtime can access them; if Drive is unavailable, explicitly state that limitation and use the repository-portable artifacts above.

## REQUIRED PRE-FLIGHT

Before review:

1. verify `pwd`;
2. verify `git rev-parse --show-toplevel`;
3. verify target remote identity is `sjo1848/hms-cloudflare`;
4. verify reviewed branch/HEAD and working-tree cleanliness;
5. verify the decision record says `CF-DATA-001 = Option B`;
6. verify no paid Cloudflare transition has been implicitly authorized;
7. verify source baseline identity before using source evidence.

A repository/baseline mismatch is `TECHNICAL_BLOCKED`, not a Human Gate.

## REVIEW QUESTIONS

The Critic must independently test at minimum:

1. **Product parity** — Does the design cover the accepted source journeys/surfaces and the independently verified source contract, rather than only backend infrastructure?
2. **Tenant topology** — Is Option B applied consistently: CONTROL_DB is narrow and ordinary hotel operational data remains in per-hotel D1 databases?
3. **Authorization** — Can a client-supplied hotel identifier or other untrusted input bypass membership/capability checks or select an unauthorized operational DB?
4. **Cross-tenant/network path** — Does network-level functionality remain explicitly authorized without weakening ordinary tenant isolation?
5. **Relational integrity** — Are cross-hotel references impossible/rejected under the split topology?
6. **Booking concurrency** — Does `room_inventory_nights` + atomic hotel-DB operations plausibly replace the PostgreSQL GiST overlap guarantee and is validation evidence required?
7. **Lifecycle semantics** — Are check-in, checkout, room reassignment and housekeeping still domain transitions rather than generic CRUD?
8. **Financial semantics** — Are integer cents and business-operation atomicity preserved without reliance on cross-D1 atomic transactions?
9. **Authentication adaptation** — Does Cloudflare Access replace primary authentication while HMS remains authoritative for roles/capabilities/membership and `/api/v1/auth/me` remains the application bootstrap contract?
10. **API/product surfaces** — Does the design preserve `/api/v1` and required UI surfaces except the explicitly replaced native auth mechanism?
11. **Cost boundary** — Could any stated increment or architecture path require paid Cloudflare usage without a separate Human Gate? If so, return REWORK or HUMAN_GATE depending on whether the defect is a design violation or a genuine new trade-off.
12. **Operational feasibility** — Is the design reviewable/testable in local/CI environments before production, with source-of-truth and evidence requirements explicit?
13. **Decision Latitude** — Are implementation-owned decisions distinguished from strategic/security/product/cost decisions so the future Critic does not over-freeze BUILD mechanics?
14. **Design exit** — Are all required DESIGN exit criteria actually satisfied?

## REQUIRED OUTPUT

Create:

`.orchestration/reviews/CF-DESIGN-REVIEW-001.md`

The review must contain:

- review identity and exact reviewed HEAD/artifact refs;
- inputs actually inspected;
- pre-flight result;
- requirement-by-requirement verdict;
- findings ordered by materiality;
- strongest contrary evidence;
- residual risks/limitations;
- final verdict: `PASS`, `REWORK`, `CONTRACT_DEFECT`, `TECHNICAL_BLOCKED`, or `HUMAN_GATE`;
- exact next authorized action.

## EVIDENCE REQUIRED

At minimum:

- immutable target HEAD/ref reviewed;
- exact design artifact path/ref;
- exact source baseline identity if source evidence is inspected;
- explicit comparison to `docs/source-contract-inventory.md`;
- explicit verification of CF-DATA-001 Option B and Free-tier cost guard;
- explicit check that no product BUILD, real-data migration or production cutover is being approved by this DESIGN review.

## DONE WHEN

The task is DONE only when a logically independent Critic has persisted a complete review artifact and one of these outcomes is reached:

### PASS

- DESIGN exit criteria are satisfied.
- Update `.orchestration/STATE.md` to mark DESIGN `COMPLETE`.
- Create/activate the `CF-I01` Task Contract.
- Continue automatically into the next authorized execution step without asking for routine human confirmation.

### REWORK

- Findings are specific and within existing DESIGN scope.
- Dispatch/perform bounded design repair.
- Persist repaired artifact identity.
- Run a fresh logically independent Critic.
- Default same-contract automatic rework budget: 2 cycles; exhaustion triggers diagnosis, not automatic Human Gate.

### CONTRACT_DEFECT

- Repair/split this Task Contract and start a fresh bounded review cycle.

### TECHNICAL_BLOCKED

- Diagnose/retry/fallback before involving the human.

### HUMAN_GATE

- Use only for a genuine new strategy/scope/security/cost/irreversibility trade-off that cannot be resolved inside the approved design boundaries.
- Stop only the affected branch where possible.

## DECISION LATITUDE

The Critic may require clarity/evidence but must not freeze implementation-owned details that are safely delegated to BUILD, including module/file layout, helper abstractions, index names, query-builder choice, test organization or equivalent internal mechanics.

The Critic must treat these as fixed strategic constraints unless a legitimate new Human Gate is opened:

- Cloudflare Access auth boundary;
- React/Vite + Workers/Hono/TypeScript + D1 target;
- parity-first scope;
- `/api/v1` compatibility objective;
- `CF-DATA-001 Option B` topology;
- `$0/month / Free` boundary and no paid transition without Human Gate;
- tenant isolation, money, booking overlap, lifecycle and required product surfaces;
- Human Product Acceptance remains separate from technical PASS.

## ALLOWED ACTIONS

- read canonical repository/source evidence;
- run non-destructive checks/scripts/tests useful to DESIGN review;
- create the review artifact;
- update orchestration state after verdict;
- on bounded REWORK, modify DESIGN/governance artifacts only within approved scope.

## FORBIDDEN ACTIONS

- product/runtime BUILD under CF-I01 or later increments before DESIGN PASS;
- production deployment;
- real hotel-data migration;
- enabling paid Cloudflare services/plans;
- changing CF-DATA-001 Option B by inference;
- modifying the source HMS repository;
- self-approving substantive design repairs without a fresh independent Critic.

## HANDOFF DESTINATION

On PASS: Orchestrator → DESIGN COMPLETE → `CF-I01` Task Contract → BUILD.  
On REWORK: Design repair → fresh Independent Critic.  
On legitimate HUMAN_GATE: Product/Risk Authority via the External Project Controller interface.
