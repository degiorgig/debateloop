# Pitfalls Research

**Domain:** Multi-model debate application built on OpenCode SDK
**Researched:** 2026-04-04
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Fake Independence Between Debaters

**What goes wrong:**
The second model is accidentally influenced by the first model before its initial answer.

**Why it happens:**
Developers reuse one session or one accumulated transcript too early because it is simpler.

**How to avoid:**
Treat initial answers as isolated stage inputs. Only expose the opponent answer during the critique phase.

**Warning signs:**
The two first answers look unnaturally similar or reference each other's framing.

**Phase to address:**
Phase 2

---

### Pitfall 2: Judge Output Is Too Loose To Parse Reliably

**What goes wrong:**
The app cannot deterministically extract winner, rationale, or selected answer.

**Why it happens:**
Judge prompts return plain prose instead of structured output.

**How to avoid:**
Use JSON schema output for judge results and validate them before finalizing the debate.

**Warning signs:**
Judge responses say things like "both are good" without naming a winner in a stable shape.

**Phase to address:**
Phase 4

---

### Pitfall 3: Debate State Becomes Hard To Debug

**What goes wrong:**
When a debate fails mid-run, it is unclear which stage failed or what each model saw.

**Why it happens:**
Outputs are only printed to stdout or overwritten in memory.

**How to avoid:**
Persist each stage artifact with stage name, model role, prompt inputs, and output metadata.

**Warning signs:**
Retries require rerunning the full debate because intermediate state was lost.

**Phase to address:**
Phase 3

---

### Pitfall 4: Cost And Latency Explode With Extra Rounds

**What goes wrong:**
The product becomes slow and expensive before the quality gain is proven.

**Why it happens:**
Teams add more rounds, more judges, and more synthesis too early.

**How to avoid:**
Lock v1 to a fixed 7-stage pipeline and measure before adding complexity.

**Warning signs:**
Most of the runtime is spent on optional extra reasoning instead of the core loop.

**Phase to address:**
Phase 1

---

### Pitfall 5: Failure Handling Is An Afterthought

**What goes wrong:**
One provider timeout or malformed response breaks the full debate with no actionable message.

**Why it happens:**
The happy path is implemented first and retry/error semantics are ignored.

**How to avoid:**
Add stage-level retries, timeout configuration, and partial failure reporting before calling v1 complete.

**Warning signs:**
Users see a generic failure after waiting through several model calls.

**Phase to address:**
Phase 5

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only final answer | Fastest prototype | No transcript trust, no replay, poor debugging | Never for this product |
| Inline prompt strings in orchestration code | Fewer files | Hard prompt evolution and brittle tests | Only in the very first spike |
| Use one session for every role without clear boundaries | Less setup code | Hidden prompt leakage between stages | Never if independence matters |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenCode session API | Reuse session context carelessly between independent stages | Be explicit about what context is injected at each stage |
| Structured output | Ask for complex JSON without validation | Keep schema focused and validate before trusting the judge |
| Provider configuration | Assume all configured models behave similarly | Keep model role config explicit and test model combinations |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full transcript copied into every prompt | Token usage rises sharply each stage | Only pass the minimum context needed for the stage | Breaks quickly on long questions and verbose models |
| Unlimited retries | Debates hang or become expensive | Cap retries per stage and surface failure | Breaks under provider instability |
| Synchronous transcript rendering only at the end | Long silent waits | Emit stage progress and save as you go | Breaks when debates exceed a few model calls |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging raw secrets or provider config | Credential leakage | Redact environment/config values in logs and transcripts |
| Persisting sensitive prompts without boundaries | Local data exposure | Make transcript storage location explicit and document it |
| Trusting judge JSON blindly | Incorrect or manipulated final result | Validate against schema and reject malformed output |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Only showing the winner | Users cannot trust the decision | Show the transcript or at least a concise stage summary |
| Hiding which model played which role | Comparisons feel opaque | Print debater and judge models clearly |
| Returning massive raw transcripts by default | Output becomes unreadable | Show a summary first and provide transcript inspection commands |

## "Looks Done But Isn't" Checklist

- [ ] **Independent answers:** Often missing isolation — verify the second model never sees the first answer before critique.
- [ ] **Judge flow:** Often missing structured validation — verify winner selection survives malformed model output.
- [ ] **Transcript persistence:** Often missing intermediate prompts and metadata — verify each stage is reconstructable.
- [ ] **Error handling:** Often missing stage-specific messaging — verify users know which stage failed and why.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fake independence | HIGH | Refactor stage boundaries, invalidate previous benchmark results, rerun tests |
| Loose judge output | MEDIUM | Add schema, rewrite judge prompt, update parser tests |
| Missing transcript state | MEDIUM | Add persistence layer and backfill only for future runs |
| Weak failure handling | LOW | Add retries, timeouts, and richer error surfaces |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fake independence between debaters | Phase 2 | Confirm isolated initial-answer inputs in tests |
| Judge output too loose | Phase 4 | Confirm judge returns valid structured winner output |
| Debate state hard to debug | Phase 3 | Confirm every stage is persisted and inspectable |
| Cost and latency explode | Phase 1 | Confirm stage count is fixed and configuration is bounded |
| Failure handling is an afterthought | Phase 5 | Confirm stage retries/timeouts surface actionable errors |

## Sources

- OpenCode SDK docs for structured output and session behavior
- Common multi-step agent orchestration failure patterns
- Product-specific risks inferred from the required symmetric debate design

---
*Pitfalls research for: multi-model debate application*
*Researched: 2026-04-04*
