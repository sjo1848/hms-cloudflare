# Block E reopened bundle gate — CSS raw ceiling

Status: `BUNDLE_BUDGET_GATE_REQUIRED_AWAITING_CONTROLLER_REVIEW`

The Controller-resolved JS raw ceiling remains 350,000 B. The other ceilings remain JS gzip 100,000 B, CSS raw 55,000 B and CSS gzip 15,000 B. This record supplements, and does not rewrite, the original Block E bundle gate or the Controller's prior JS raw ceiling resolution.

## Measurement

Production build completed. TypeScript checks passed before the budget check. The budget checker was rerun and stopped at the first exceeded ceiling:

- JS raw: baseline 329,618 B → 333,186 B; delta +3,568 B (+1.082%); ceiling 350,000 B; pass.
- JS gzip: baseline 93,456 B → 93,941 B; delta +485 B (+0.519%); ceiling 100,000 B; pass.
- CSS raw: baseline 54,297 B → 55,652 B; delta +1,355 B (+2.496%); ceiling 55,000 B; **exceeded by 652 B**.
- CSS gzip: baseline 10,138 B → 10,328 B; delta +190 B (+1.874%); ceiling 15,000 B; pass.
- Aggregate raw: baseline 383,915 B → 388,838 B; delta +4,923 B (+1.282%).
- Aggregate gzip: baseline 103,594 B → 104,269 B; delta +675 B (+0.652%).
- Initial/entry payload: not separately measured at this gate.
- Runtime loading evidence: not rerun at this gate.

The CSS raw output is 0.652 KB over the currently authorized development growth guardrail. This is a gate, not a performance-target failure. No ceiling has been changed in response.

## Scope and validation disposition

The worktree preserves the in-progress Block E implementation and targeted test changes. No behavior or translations were removed to recover the previous raw limit. No full test suite, architecture/i18n gates, integrated Worker/D1 browser validation, runtime trace, Artifact A, Boundary B, Independent Critic or branch publication is claimed after this measurement. Block E does not continue until the Controller resolves the new CSS raw gate.
