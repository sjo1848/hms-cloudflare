# PM-MODEL-ROUTING-001 — Cost-aware Codex model routing

Status: `APPROVED / BINDING`
Date: `2026-09-08`
Scope: HMS Cloudflare Codex runtime, controller execution and spawned subagents.

## Decision

Codex MUST optimize for the cheapest model/reasoning level that is sufficient for the task. Maximum-cost / maximum-reasoning execution is not the default.

The objective is quality-per-credit, not maximum model capability per turn.

OpenAI's current model guidance describes:
- GPT-5.6 Terra as the model that balances intelligence and cost;
- GPT-5.6 Luna as optimized for cost-sensitive/high-volume workloads;
- GPT-5.6 Sol as the flagship for complex professional work;
- GPT-6 Astra as the highest-capability tier for the hardest end-to-end work.

Therefore HMS adopts a tiered routing policy rather than using the most expensive model everywhere.

Official references at decision time:
- https://developers.openai.com/api/docs/models
- https://help.openai.com/es-419/articles/20001106-tarifario-de-codex

## Persistent defaults

Project-scoped defaults are defined in `.codex/config.toml`:

- root/controller default: `gpt-5.6-terra`, reasoning `medium`;
- spawned-subagent default: `gpt-5.6-luna`, reasoning `medium`.

These are defaults, not permission to sacrifice correctness. Escalate only when the task characteristics or evidence justify it.

## Routing tiers

### Tier 1 — Luna
Use GPT-5.6 Luna for routine, bounded, high-volume or easily verifiable work, including where applicable:

- repository reconnaissance and file discovery;
- evidence collection and inventory;
- straightforward documentation checks;
- mechanical comparisons;
- simple test/log triage;
- repetitive QA checks;
- narrowly scoped transformations;
- supporting subagent work whose result will be independently verified.

Reasoning should normally be `low` or `medium`.

### Tier 2 — Terra — normal HMS default
Use GPT-5.6 Terra for work requiring meaningful engineering judgment, including:

- Runtime Orchestrator / Controller work;
- Task Contract construction;
- implementation involving business/domain invariants;
- debugging with multiple plausible causes;
- integration reasoning;
- architecture review;
- concurrency/data-integrity analysis;
- Pre-Critic work;
- synthesis of multiple subagent findings;
- decisions where an incorrect result could cause substantial rework.

Default reasoning is `medium`.

Use `high` only when complexity is demonstrated rather than assumed.

### Tier 3 — Sol — evidence-based escalation only
GPT-5.6 Sol is NOT a routine default.

It may be used only when at least one of these conditions exists:

1. Terra produced an unresolved or low-confidence result after a bounded attempt;
2. the task contains unusually difficult cross-cutting reasoning, concurrency, security, migration or data-integrity risk;
3. contradictory evidence cannot be reconciled reliably at the normal tier;
4. a material Independent Critic / root-cause task demonstrably benefits from stronger reasoning;
5. failure cost materially exceeds the additional model cost.

When escalating to Sol, persist a short rationale in the task/evidence record when practical.

Do not keep subsequent routine work on Sol merely because one difficult step required escalation. De-escalate after the difficult boundary is resolved.

### Tier 4 — Astra / maximum-compute modes
GPT-6 Astra, `xhigh`, `max`, Ultra-like orchestration, or equivalent maximum-cost execution MUST NOT be selected routinely.

Use requires an explicit Human decision unless an existing approved Task Contract specifically authorizes that level for a bounded task.

Lack of convenience, desire for a second opinion, or ordinary test failure is not sufficient justification.

## Reasoning-effort policy

Use adaptive reasoning instead of permanently high reasoning:

- `low`: simple, deterministic, easily verified work;
- `medium`: default balanced setting;
- `high`: complex engineering/review work with demonstrated need;
- `xhigh` / `max`: exceptional, explicitly justified work only.

Never escalate reasoning merely because a task is large. First decompose it into bounded tasks and route each task appropriately.

## Multi-agent cost policy

Multi-agent execution remains authorized and desirable when independence or parallel specialization improves evidence quality, but:

- do not spawn redundant agents that answer the same question without a review purpose;
- use Luna for routine supporting agents where verification is cheap;
- use Terra for agents carrying substantive engineering/review responsibility;
- do not multiply Sol/Astra agents by default;
- independence of review does not require every reviewer to use the most expensive model;
- a cheap agent's PASS never overrides missing evidence or an applicable invariant.

## Quality floor

Cost optimization MUST NOT weaken Project Method.

The following remain mandatory regardless of model tier:

- exact Task Contract compliance;
- invariant mapping;
- executable evidence where required;
- Pre-Critic gate;
- independent substantive review boundaries;
- Human Gates for material decisions;
- no self-manufactured PASS.

If the selected tier cannot establish sufficient confidence, escalate one tier for the unresolved portion rather than lowering the acceptance standard.

## Anti-patterns

Forbidden by this decision:

- selecting the strongest available model for every agent "to be safe";
- keeping reasoning at `high`/`xhigh`/`max` for routine work;
- spawning several expensive agents when one bounded specialist plus independent verification is sufficient;
- treating model cost as irrelevant because the work is automated;
- using a cheaper model as justification for weaker testing/evidence;
- escalating after a normal red test before performing ordinary diagnosis.

## Resume rule

On every fresh or resumed Codex execution, apply this decision together with `AGENTS.md` and `.codex/config.toml` before spawning subagents or selecting a stronger model.

If model names change or become unavailable, preserve the semantic policy:

`cost-sensitive tier -> balanced tier -> flagship tier -> exceptional maximum tier`

and map to the closest currently supported OpenAI Codex models rather than silently defaulting to the most expensive option.
