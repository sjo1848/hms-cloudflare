# HMS Cloudflare — Implementation Roadmap Open Decisions v1

Only unresolved Human/Controller inputs are listed. Architecture rules already frozen in Blueprint 001 / 007 / 008 are not reopened here. Routine API/UI choices belong to later Task Contracts.

| ID | Decision / question | Why unresolved | Scope blocked | Evidence needed / default safe handling |
|---|---|---|---|---|
| OD-1 | Is the actual hotel cashbox shared across operators or owned by operator/session, including float and handoff? | Current UI says “Caja actual / desde último cierre”; source-of-funds ownership was not established by repo evidence. | Block F Cash subsection only. F-account, charges and payments remain independent. | Validate actual operating practice with Controller/Human. Shared box preserves V1; operator-owned requires reopening only cash session/float/handoff contract. Do not infer from user/shift labels. |
| OD-2 | Which active stays have traceable historical nightly pricing and which are aggregate-only? | Repo evidence did not establish completeness of historical rate provenance. | Real-data activation/bootstrap and operations requiring per-night historical allocation for affected stays. | Read-only distribution/lineage inventory during separately authorized cutover prep; unresolved rows preserve current total and are held from affected repricing. |
| OD-3 | What real-data cutover window and operational write-freeze/coordination procedure is acceptable? | Requires hotel operations authority and risk assessment, not source code. | Any real-data room/pricing cutover, not synthetic development/rehearsal. | Human approval after dry-run evidence; no default window selected. |

## Not open decisions

- Separate room dimensions, non-retroactive segmented pricing and F0→A–H architecture are frozen, not options.
- No Independent Critic PASS is presumed.
- No choice about production, staging, main, or real-data execution is implied; all remain outside this roadmap authorization.

## Conditional implementation follow-ups (not current decisions)

- If implementation discovers a genuine frozen-contract/runtime contradiction, stop only the affected subproblem, capture exact source and runtime evidence, and classify it for Controller review; this is a contingency, not a present open decision or blocker.
- Inventory route alias usage as ordinary compatibility work in Block A; preserve direct links until evidence supports a contract-compliant deprecation. This is not a Human Gate by itself.
