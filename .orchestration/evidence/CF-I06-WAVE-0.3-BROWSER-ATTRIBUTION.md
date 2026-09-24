# CF-I06 Wave 0.3 browser attribution

Date: 2026-09-24

## Scope

The exact browser runner was used with the lockfile environment and the same local fixture reset. No product code was changed between the observations below.

Current reference: `c40fe0522c69a50f39e77f44ac4d2b2253018c36`.

Baseline reference: `010d2ce08a0922bc24c0d42eb1d5c21c217ffd43`.

## Executions

| Reference | Run | Command/scenario | Exit | Assertion/failure |
|---|---:|---|---:|---|
| current | 1 | `CI_BROWSER_STANDARD=1 bash scripts/cf-i05-browser-regression.sh` | 1 | Reports: timeout waiting for exact `Daily occupancy`; logs showed concurrent report requests, local `workerd` broken pipe and Vite `socket hang up` |
| current | 2 | same | 1 | Users: timeout in the admin flow; not the same surface as run 1 |
| baseline | 1 | same | 1 | Housekeeping: timeout waiting for `Reason`; baseline does not reach Reports because it lacks the Wave 0.3 housekeeping refresh-race repair |
| baseline | 2 | same | not completed | The baseline full runner remained blocked by the same earlier Housekeeping surface; no equivalent Reports assertion was reached |

## Attribution

Classification: `BROWSER HARNESS / INFRA FLAKINESS` / shared browser-gate finding, not a demonstrated Wave 0.3 Reports regression.

Evidence supporting the classification:

- Current executions failed on different browser surfaces (`Reports`, then `Users`), which is not deterministic Reports-only behavior.
- The Wave 0.3 diff from baseline contains no Reports page, analytics route, API routing, package, or dependency changes. Changed surfaces are billing, housekeeping, the browser fixture runner, and orchestration metadata.
- The known baseline Housekeeping failure is independent of Reports and prevents a full-suite A/B comparison from reaching Reports.
- The Reports failure remains a promotion-gate finding and is not absorbed into Wave 0.3 or CF-I08.

This evidence is sufficient to allow development continuation, but not to declare the global browser/promotion gate green.
