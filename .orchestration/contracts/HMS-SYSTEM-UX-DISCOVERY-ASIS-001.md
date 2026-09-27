# Task Contract — HMS-SYSTEM-UX-DISCOVERY-ASIS-001

Phase: HMS_SYSTEM_UX_DISCOVERY_ASIS
Authority: current Human request, full-system AS-IS audit only.
Branch: analysis/hms-system-ux-discovery-v1
Audited product baseline: b9197e278e227a8e3da5ecb867d6d430f69c1d2f (PR #50 Draft).
Base branch synchronized with origin before branching; clean initial worktree.

## Outcome and boundaries

Produce docs/ux/HMS-SYSTEM-UX-DISCOVERY-AS-IS-V1.md (24 requested sections), HMS-SYSTEM-WORKFLOW-CATALOG-V1.md (stable workflow IDs and six statuses), and HMS-HOTEL-OPERATIONS-JOURNEYS-AS-IS-V1.md (seven required journeys, dependencies and discontinuities). Inspect all routes, frontend actions and API/domain registrations; distinguish hotel operations, hotel administration and SaaS/network. Reception and financial account/payment/cash distinctions receive deep inspection.

New Drive document in folder 13hYWjlt3gFpcIsa0fMXdEAC-zAJ0MeLr, title “HMS Cloudflare — HMS System UX Discovery / AS-IS Audit v1”, internal ID HMS-SYSTEM-UX-DISCOVERY-ASIS-001. Preserve previous artifacts.

No TO-BE decisions, wireframes, recommendations disguised as decisions, code refactors, product/backend/frontend/test changes, new workflows, merges, staging, deployment, production, or main mutation. The newest unpromoted UI is evidence of AS-IS. PRs outside the baseline are recorded separately.

## Acceptance and evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| System breadth | Main audit + catalog | Every frontend route and every backend domain accounted for, including hidden/backend-only capabilities | Route/component inventory, API/domain references, separate reviewers |
| Reception + financial depth | Main audit | Queue, reservation, arrival, stay, departure, account, payment and shift distinguished | Source citations and relevant existing/current evidence |
| Responsive + continuity | Main audit | Desktop/tablet/mobile actual behavior and source breakpoints; context transitions documented; unknowns explicit | Targeted read-only local browser inspection where available, screenshots, source/evidence labels |
| Journeys | Journey map | All A–G crossings and absent links represented | Stable workflow IDs, Mermaid/tables, catalog mapping |
| Gaps | Capability/friction matrices | Six workflow statuses, requested severity/category, FACT/INFERENCE/UNKNOWN | Bounded negative searches and API/UI contrast |
| Traceability | Git + Drive | Exact product baseline, reviewers, linked artifacts, Drive readback | Source references, commit A + B, verified document metadata/content |
| Scope | Git diff | Only documentary files and orchestration | Diff against audited baseline |

Validation is documentary: source/route coverage, catalog counts/IDs, evidence link existence, reviewer reconciliation, targeted responsive observations, no-TO-BE review, JSON/diff checks. Do not rerun entire product suites without an audit need. Existing tests are evidence artifacts, not newly executed PASS.

## Invariants (pre-inspection classification)

| Invariant | Classification | Rationale / acceptance |
|---|---|---|
| INV-ATOMIC-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-AUDIT-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-DOMAIN-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-TENANT-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-RBAC-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-PARITY-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-ENUM-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-UX-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-ORDER-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-RESP-001 | APPLIES | Label source-derived responsive behavior versus actual targeted browser observations and inherited evidence; no full-operation claim from screenshots. |
| INV-EVID-001 | APPLIES | Every capability/status/absence claim has a source, observed result, or explicit UNKNOWN; no future contract represented as implemented. |
| INV-LEGACY-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-MONEY-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-STATE-001 | APPLIES | Publish documentary artifact A then metadata-only boundary B on this analysis branch; no main publication (explicit current prohibition). |
| INV-CF-I07-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I07-002 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I07-003 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I07-004 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I08-001 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I08-002 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I08-003 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I08-004 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-CF-I08-005 | N/A | Documentation-only audit introduces no business behavior, schema, authority, migration, report predicate or regression runner; existing implementation is described without re-certifying this invariant. |
| INV-SCOPE-001 | APPLIES | Diff allowlist docs/ux and task orchestration/evidence only; no product, test, dependency or config edits. |

## Review and stop

Use separate Luna Medium product/workflow, responsive/interaction, and backend-capability reviewers if capability exists; one documentary writer integrates and retains disagreements. These are discovery reviewers/Pre-Critic, not an Independent Critic acceptance.

Complete the documentary Pre-Critic/invariant evidence, publish isolated A+B and Drive backup. Final status DISCOVERY_COMPLETE_AWAITING_CONTROLLER_REVIEW; promotion BLOCKED; resume_authorized=false; external_review.required=true. Stop at HMS SYSTEM UX DISCOVERY / AS-IS — CONTROLLER CHECKPOINT. No blueprint or implementation authorization.
