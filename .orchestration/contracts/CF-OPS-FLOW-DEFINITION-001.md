# TASK CONTRACT — CF-OPS-FLOW-DEFINITION-001

TASK ID: `CF-OPS-FLOW-DEFINITION-001`
PROJECT: HMS Cloudflare
PHASE: `OPERATIONAL FLOW DEFINITION`
STATUS: `IN_ANALYSIS`
BASELINE: `acceptance/staging` at `26239b76b919266de07d7bece5977296647f109c`

## Objective

Define and persist the end-to-end operational workflows that must govern the next HMS implementation wave after the first UX/UI pass. This stage is analysis and definition only. Product implementation remains locked until the definitions pass review.

## Scope

P0: in-stay room reassignment; occupied-room maintenance; no-show; checked-in stay extension.

P1: guest creation inside reservation; check-in readiness; Reception-Billing context; checkout-Housekeeping handoff; Housekeeping-Reception revalidation; contextual navigation; next-case continuation; operational read-model strategy.

P2: keyboard/focus optimization; stale-data policy; operational simulation; bundle/code-splitting headroom.

## Implementation lock

No runtime product changes, migrations, enum expansion, or new lifecycle UI controls are authorized by this contract. Only analysis, decisions, evidence, invariants and orchestration state may change.

## Exit criteria

Before implementation planning: every P0 flow has unambiguous preconditions, authoritative mutations, postconditions, concurrency behavior, audit behavior and UI consequences; cross-module context and revalidation rules are explicit; no coding agent is left to decide product semantics; all artifacts are persisted and internally consistent.
