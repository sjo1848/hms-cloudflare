# CF-UX-MOBILE-001 — Invariant classification and evidence

Status: PASS — Pre-Critic evidence complete
Artifact scope: PR #9 / branch `ux-mobile-hms-elite` / shell + Reception responsive UX

| Invariant | Status | Evidence |
|---|---|---|
| INV-ATOMIC-001, INV-AUDIT-001, INV-DOMAIN-001 | N/A | No domain mutation, audit write or business transition changed. |
| INV-TENANT-001 | PASS | Foundation CI plus browser fixture authenticated `source-user:subject-a` with active `hotel-a` membership; additive `hotel_name` is read from control-plane metadata. |
| INV-RBAC-001 | PASS | Existing auth/membership and protected API paths are exercised by the authenticated browser regression; no UI visibility is used as authorization. |
| INV-PARITY-001 | PASS | PR #9 preserves HMS Elite shell/Reception intent and existing API/domain behavior; foundation CI passed. |
| INV-UX-001 | PASS | Browser regression run #14 exercises task entry, focused mobile task, close/focus restoration, actions, validation and visible blocked-departure state. |
| INV-ORDER-001 | PASS | Browser fixture uses conflicting numeric order and asserts priority queue order and next-task identity. |
| INV-RESP-001 | PASS | Browser workflow run #14 passed at 375, 390, 430, 768, 1024 and 1366 px with overflow assertions and durable screenshots. |
| INV-EVID-001 | PASS | Foundation CI run #381 and browser workflow run #14 passed on HEAD `9131f5ab541a7e7176b4f6b44c2bf4e3bb1140c6`; artifact was uploaded successfully. |
| INV-ENUM-001, INV-LEGACY-001, INV-MONEY-001, INV-CF-I07-001..004, INV-CF-I08-001..005 | N/A | No enum predicate, recovery, money, capability authority, admin, reporting or network semantics changed. |
| INV-STATE-001 | PASS | Exact reviewed HEAD is recorded above; publication boundary remains separate and will point to the final artifact commit. |
| INV-SCOPE-001 | PASS | Diff is limited to contracted shell/Reception implementation, focused evidence and CI runner support; no deploy occurred. |

## Validation receipt

- Foundation CI: PASS — run 381, HEAD `9131f5ab541a7e7176b4f6b44c2bf4e3bb1140c6`.
- Browser CI: PASS — run 14, HEAD `9131f5ab541a7e7176b4f6b44c2bf4e3bb1140c6`.
- Browser evidence: PASS — authenticated local D1 fixture, responsive widths 375/390/430/768/1024/1366, task actions, validation, queue ordering, focus restoration and durable screenshots.
- Publication decision: READY FOR PRE-CRITIC BOUNDARY. No Cloudflare deploy has occurred.
