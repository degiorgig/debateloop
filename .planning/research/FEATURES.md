# Feature Research

**Domain:** Multi-model debate application built on OpenCode SDK
**Researched:** 2026-04-04
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Submit a single question into a defined debate flow | Without a clean entrypoint the product is not usable | LOW | CLI or simple command surface is enough for v1. |
| Independent answers from two models | Core trust premise of debate systems is independent reasoning | MEDIUM | Both models must see the same user question before critique begins. |
| Cross-critique between the two models | Debate without rebuttal is just side-by-side comparison | MEDIUM | Prompts must force critique of reasoning, not style only. |
| Final revised answers after critique | Users expect each side to improve after hearing the other | MEDIUM | Revisions should reference critique without collapsing both voices into one. |
| Separate judge decision | A debate product needs a clear final resolution step | MEDIUM | Best implemented with structured output naming winner and rationale. |
| Inspectable transcript of each stage | Trust drops if the system only returns the final winner | LOW | Keep all stages for debugging and future UI work. |
| Configurable model selection | Users need to compare different providers/models | MEDIUM | Start with two debaters plus one judge. |
| Failure handling and retries | Multi-model workflows fail often in practice | MEDIUM | Timeouts, API errors, invalid judge output, and partial failures must surface clearly. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Structured judge rubric | Makes winner selection more consistent and auditable | MEDIUM | Good next step after basic judge selection works. |
| Side-by-side transcript visualization | Makes quality comparison faster for humans | MEDIUM | Strong UX win, but not required to validate core orchestration. |
| Replay with different judge or debater models | Lets users compare debate outcomes across model combinations | HIGH | Valuable once base transcript persistence exists. |
| Score breakdown by criterion | Helps users understand why one answer won | MEDIUM | Pairs well with structured output and judge schemas. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Unlimited recursive debate rounds | Sounds like "more reasoning = better" | Cost and latency grow quickly while output quality becomes noisy | Fixed stage pipeline for v1: answer, critique, revise, judge |
| More than two debaters in v1 | Feels more objective | State management and transcript readability get much harder immediately | Keep 2 debaters + 1 judge first |
| Auto-merging both final answers into one synthesized answer before judging | Feels collaborative | Destroys the symmetric competition model and hides disagreements | Let the judge pick a winner, with synthesis later if needed |
| Real-time streaming every sub-step from day one | Feels polished | Adds event/state complexity before the core engine is proven | Persist the transcript first, then stream later |

## Feature Dependencies

```text
Question submission
    └──requires──> Debate session creation
                       └──requires──> Model configuration

Cross-critique
    └──requires──> Independent answers

Final revisions
    └──requires──> Cross-critique

Judge decision
    └──requires──> Final revisions

Transcript inspection
    └──enhances──> Every debate stage
```

### Dependency Notes

- **Question submission requires debate session creation:** a debate needs a tracked unit of execution and storage.
- **Cross-critique requires independent answers:** critique is invalid if one model already saw the other's answer before drafting its own.
- **Judge decision requires final revisions:** otherwise the judge is evaluating incomplete positions.
- **Transcript inspection enhances every debate stage:** once stored consistently, it improves debugging, testing, and later UX.

## MVP Definition

### Launch With (v1)

- [ ] Submit one question and run the full debate pipeline end-to-end — proves the product's core value
- [ ] Configure debater A, debater B, and judge models — required for real comparisons
- [ ] Preserve a full transcript for every stage — required for trust and debugging
- [ ] Return the judge winner plus rationale — required for a complete output
- [ ] Handle common failures cleanly — required to make the tool usable in practice

### Add After Validation (v1.x)

- [ ] Judge rubric and scorecard — add once basic winner selection works reliably
- [ ] Better transcript presentation — add once users want repeated inspection
- [ ] Replay previous debates with different models — add once transcript persistence is stable

### Future Consideration (v2+)

- [ ] Web UI for debate browsing — defer until the orchestration core is validated
- [ ] More than two debaters — defer until the two-model pattern is proven valuable
- [ ] Human-in-the-loop intermediate approvals — defer until there is a clear workflow need

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Full debate orchestration | HIGH | MEDIUM | P1 |
| Configurable model roles | HIGH | MEDIUM | P1 |
| Transcript persistence | HIGH | MEDIUM | P1 |
| Judge structured output | HIGH | MEDIUM | P1 |
| Retry and error reporting | HIGH | MEDIUM | P1 |
| Transcript visualization polish | MEDIUM | MEDIUM | P2 |
| Judge scoring rubric | MEDIUM | MEDIUM | P2 |
| Replay with alternate models | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Multi-model comparison | Often just side-by-side outputs | Often benchmark-oriented, not interactive | Make it an explicit staged debate |
| Winner selection | Human eyeballing | Raw score comparison | Dedicated judge model with rationale |
| Transcript visibility | Partial or hidden | Often evaluation logs only | Keep every stage inspectable from the start |

## Sources

- OpenCode SDK and docs for session-driven model orchestration capabilities
- Common multi-model comparison patterns from agent/evaluation tooling in the ecosystem
- User-provided product idea defining the desired debate structure

---
*Feature research for: multi-model debate application*
*Researched: 2026-04-04*
