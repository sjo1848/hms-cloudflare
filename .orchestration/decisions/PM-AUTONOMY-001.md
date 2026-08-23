# PM-AUTONOMY-001 — Autonomous Execution Operating Policy

Status: `APPROVED`
Effective from: `CF-I04 REWORK onward`
Scope: HMS Cloudflare runtime execution under the existing Project Method

## Decision

Preserve the existing authority architecture while maximizing Codex autonomy and minimizing Human coordination.

- **Human = Product/Risk Authority.** The Human decides only legitimate Human Gates, Product Acceptance and other explicitly human-owned irreversible/product/risk decisions. The Human is not a routine message bus, technical approver or rework dispatcher.
- **ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human-Gate Classifier.** ChatGPT independently evaluates substantive artifacts against Task Contracts and canonical evidence, classifies PASS / REWORK / HUMAN_GATE, persists review outcomes, and surfaces only legitimate Human Gates to the Human.
- **Codex = Runtime Orchestrator / execution owner.** Once scope is authorized, Codex owns planning, implementation, specialist dispatch when available, test execution, adversarial QA, routine repair, evidence, artifact publication, integration mechanics and preparation of the next bounded increment.

This decision does not authorize Codex to self-PASS substantive work and does not weaken Independent Critic or Product Acceptance boundaries.

## Autonomous execution rule

After an authorized Task Contract exists, Codex continues without asking the Human for routine permission through:

`plan → implement → test → adversarial QA → repair → re-test → browser/integration evidence → immutable artifact`.

Codex stops only at a legitimate stop condition. Test failures, implementation bugs, failed migrations, incomplete UI, routine security findings and ordinary bounded REWORK are not stop conditions by themselves; Codex repairs them autonomously while the contract remains valid.

## Independent Critic loop

For a substantive artifact:

1. Codex publishes the exact immutable artifact and sets `external_review.required=true`.
2. ChatGPT reviews that artifact independently.
3. `REWORK` is persisted in GitHub and is automatically authorized routine work when no Human Gate/blocker exists.
4. Codex reads the persisted review directly, repairs autonomously, validates, publishes a new artifact and stops at the next Independent Critic boundary.
5. The Human is not asked to relay findings, approve routine rework or choose ordinary implementation details.

A retry-budget exhaustion triggers diagnosis, not automatic Human escalation. If the contract remains clear and the defect is technical/evidence-related, Codex continues with a revised bounded approach.

## Human Gate classification

ChatGPT classifies whether a finding is a legitimate Human Gate. The Human decides only after that classification.

A Human Gate requires a material choice such as:
- product intent or scope change;
- approved architecture/topology change;
- new material security/risk acceptance;
- paid-resource or material recurring-cost change;
- irreversible migration/cutover action;
- unresolved product trade-off with no approved contract answer;
- Product Acceptance or another explicitly human-owned acceptance boundary.

The following are NOT Human Gates:
- bugs;
- red tests;
- ordinary migration defects;
- incomplete browser evidence;
- implementation disagreement resolvable from the contract/design;
- bounded technical blockers with recoverable alternatives;
- Independent Critic REWORK.

## Integration verification after PASS

Do not duplicate a full substantive review when integration is mechanically identity-preserving.

After an implementation artifact has Independent Critic PASS, integration may close through a bounded deterministic verification when all are true:
- substantive product/schema/test blobs are identical to the accepted artifact or the integration diff is governance-only;
- the required regression suite passes on the integrated head;
- no new scope, dependency, architecture, security/cost decision or migration behavior is introduced;
- canonical state/evidence is reconciled.

If any substantive blob changes, regression fails, or scope/security/cost semantics change, a fresh Independent Critic is required.

## Specialist execution

Codex should delegate Domain/Engineering, UX and QA/Security responsibilities to separate contextual Specialists when the runtime genuinely exposes them.

When the runtime cannot instantiate separate contexts:
- record `RUNTIME_CAPABILITY_FALLBACK`;
- do not simulate or falsely claim multiagency;
- preserve responsibility separation in contract, implementation passes and evidence;
- Independent Critic remains external to Codex.

Runtime capability limitation is not itself a Human Gate.

## Required stop conditions

Codex may stop routine autonomous execution only for:
- substantive immutable-artifact / Independent Critic boundary;
- legitimate Human Gate;
- Product Acceptance boundary;
- material blocker that remains unrecoverable after bounded recovery/diagnosis;
- unavoidable Human-only action/input;
- runtime/session termination, with exact resumable state persisted and `resume_authorized=true` when routine work remains.

## Operational targets

Target behavior for each increment:
- Human technical decisions: `0` unless a true Human Gate exists;
- Human message-relay actions: `0`;
- routine REWORK resolved by Codex: `100%`;
- false Human Gates: `0`;
- substantive artifact attempts before PASS: minimize through stronger Codex pre-Critic adversarial QA, without reducing acceptance coverage;
- no false multiagent claims.

The optimization target is not fewer tests or weaker review. It is more correct product work completed by Codex before requiring Human authority.
