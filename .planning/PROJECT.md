# Debate

## What This Is

Debate is a project built with the OpenCode SDK to answer a user's question through a structured debate between multiple AI models. Instead of letting one model produce the whole final answer alone, the system collects independent answers, cross-critiques them, asks both models for final revisions, and then uses a judge model to choose the best result.

## Core Value

For every user question, the system should produce a stronger final answer by forcing models to reason independently, critique each other, and pass through a final judge.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can submit a question into a debate flow powered by the OpenCode SDK.
- [ ] Model A and Model B each generate an independent initial answer to the same question.
- [ ] Model A can critique Model B and Model B can critique Model A.
- [ ] Both models can produce a final revised answer after reading the critique round.
- [ ] A judge model can compare the revised answers and choose the final answer returned to the user.
- [ ] The system can preserve the full debate structure so each stage remains inspectable during development and future UI work.

### Out of Scope

- Multi-user collaboration or shared debate rooms — the current goal is the core single-question debate engine.
- Fine-tuning or training custom models — the goal is orchestration of existing models through the SDK.
- Complex product surfaces like billing, accounts, or analytics dashboards — these are not required to prove the debate workflow.

## Context

The project starts greenfield in a new git repository. The main product idea is a debate engine for models: first model A answers, then model B answers independently, then A critiques B, B critiques A, both produce final revisions, and a judge selects the winner.

The main motivation is to avoid a weak pattern where one model owns the final answer from the start, which can bias the result. The user explicitly wants a more balanced process where both models contribute independently before a separate judge chooses the output.

The implementation is expected to use the OpenCode SDK as the foundation for orchestrating multiple models and managing the debate loop.

## Constraints

- **Tech stack**: Must use OpenCode SDK — it is the required foundation for model orchestration.
- **Scope**: Greenfield v1 focused on the debate engine — this keeps the first release centered on validating the core loop.
- **Product**: The final answer must be chosen by a separate judge step — this is the core design principle behind the project.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use OpenCode SDK as the orchestration layer | The project is explicitly intended to be built on top of OpenCode SDK | — Pending |
| Use symmetric independent-answer and critique rounds | This avoids over-weighting one model's initial framing of the answer | — Pending |
| Use a dedicated judge model to choose the output | Final selection should be separate from the two debating models for a cleaner arbitration step | — Pending |

---
*Last updated: 2026-04-04 after initialization*
