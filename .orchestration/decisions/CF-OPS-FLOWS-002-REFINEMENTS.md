# DECISION — CF-OPS-FLOWS-002-REFINEMENTS

Status: `SUPERSEDED — HISTORY ONLY`.

This intermediate refinement captured useful findings about hotel-local operational date and remaining-night reassignment, but later adversarial review invalidated material parts of it:

- maintenance vacancy depends on an open `BLOCKING` case, not any open case;
- the canonical maintenance impact enum is `NON_BLOCKING | BLOCKING`, not `RELOCATION_REQUIRED`;
- extension rate basis cannot be inferred from current room price because the accepted model does not preserve a trustworthy contracted nightly-rate snapshot independent from extra charges.

Current authority is:

- `.orchestration/decisions/CF-OPS-FLOWS-001.md` — consolidated binding decision and Human Gates;
- `.orchestration/decisions/CF-OPS-FLOWS-003-MAINTENANCE-MODEL.md` — canonical maintenance details;
- `docs/operational-flows/00-master-definition.md` — current master summary;
- detailed canonical flow documents referenced by `docs/operational-flows/README.md`.

Retained valid historical discoveries from this file are incorporated into those canonical artifacts: server-owned hotel-local date, no-show after arrival date, remaining-night reassignment and no automatic reassignment pricing.

Do not use this file as an implementation contract.