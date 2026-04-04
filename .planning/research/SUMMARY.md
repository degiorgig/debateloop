# Project Research Summary

**Project:** Debate
**Domain:** Multi-model debate application
**Researched:** 2026-04-04
**Confidence:** MEDIUM

## Executive Summary

Debate is best approached as a small, explicit orchestration system rather than a broad agent platform. The strongest implementation path is a TypeScript application on Node.js 20+ that uses the official OpenCode SDK to create sessions, run stage-specific prompts, and collect structured outputs from a judge model.

The key product insight is that the architecture must preserve symmetry. The first two answers need to be independent, critiques must happen only after both positions exist, and the judge must operate as a separate final step. The main risks are hidden context leakage between stages, unstructured judge output, and weak transcript persistence. Those risks drive the roadmap order.

## Key Findings

### Recommended Stack

Use TypeScript with Node.js 20 LTS+ and `@opencode-ai/sdk@0.1.0-alpha.21` as the core integration layer. Add lightweight support tooling only where it directly helps the debate engine: `zod` for runtime validation, a minimal CLI parser, and `vitest` for orchestration tests.

**Core technologies:**
- TypeScript: typed orchestration and transcript structures — best fit for SDK usage
- Node.js 20 LTS+: supported runtime — aligns with SDK requirements
- `@opencode-ai/sdk`: OpenCode session and prompt control — core execution surface

### Expected Features

The domain's table stakes for this project are not generic chat features but debate-specific workflow guarantees.

**Must have (table stakes):**
- Submit a question and run the full staged debate
- Two independent initial answers
- Cross-critique and final revision rounds
- Judge winner selection with rationale
- Inspectable transcript and usable failure handling

**Should have (competitive):**
- Structured judge rubric
- Better transcript visualization
- Replay with different models

**Defer (v2+):**
- Web UI
- More than two debaters
- Human approval gates inside the loop

### Architecture Approach

The system should be split into a thin CLI/input layer, a debate orchestration core, an OpenCode integration layer, and a persistence layer for transcripts. The orchestration core should own the stage machine and never inline transport concerns or storage details.

**Major components:**
1. Debate orchestrator — runs the fixed stage pipeline
2. Prompt builder — creates role- and stage-specific prompts
3. Transcript store — persists every stage artifact
4. Judge evaluator — validates and interprets winner output

### Critical Pitfalls

1. **Fake independence between debaters** — isolate the first answer stage completely
2. **Judge output too loose to parse** — require structured output and validation
3. **Debate state hard to debug** — persist every stage artifact
4. **Cost and latency explode** — keep v1 on a fixed pipeline
5. **Failure handling missing** — add retries and stage-aware errors before calling v1 complete

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation And Debate Skeleton
**Rationale:** The project needs a runnable OpenCode-backed shell before feature work can be trusted.
**Delivers:** Project setup, SDK client wiring, config schema, and the fixed debate stage model.
**Addresses:** Core stack setup and bounded workflow design.
**Avoids:** Cost/latency sprawl from uncontrolled loops.

### Phase 2: Independent Answer And Critique Flow
**Rationale:** This is the heart of the product and the main product differentiator.
**Delivers:** Independent answers and cross-critique stages.
**Uses:** Session APIs and prompt builders.
**Implements:** Debate orchestration boundaries.

### Phase 3: Transcript Persistence And Inspection
**Rationale:** Once the core loop exists, every stage must become inspectable and recoverable.
**Delivers:** Debate records, stage artifacts, and transcript display.

### Phase 4: Final Revisions And Judge Selection
**Rationale:** The debate is incomplete until both sides revise and a judge chooses.
**Delivers:** Final revision prompts, structured judge schema, and final result selection.

### Phase 5: Reliability And v1 Polish
**Rationale:** Multi-model systems fail in messy ways; v1 needs practical reliability.
**Delivers:** Retries, timeouts, clearer output, and test coverage around edge cases.

### Phase Ordering Rationale

- The debate skeleton must exist before stage-specific behavior can be added.
- Independence and critique must precede transcript and judge work because they define the core state graph.
- Transcript persistence comes before judge polish so failures and outputs remain inspectable.
- Reliability comes last because it hardens real flows instead of hypothetical ones.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** debate prompt design and context isolation rules
- **Phase 4:** judge schema design and structured output edge cases

Phases with standard patterns:
- **Phase 1:** project setup and SDK integration
- **Phase 5:** retries, timeout handling, and test hardening

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs and package metadata confirm the main path |
| Features | MEDIUM | Strongly grounded in the product concept, but still pre-validation |
| Architecture | MEDIUM | Clear pattern, but actual session behavior will need practical confirmation |
| Pitfalls | MEDIUM | Good fit for this type of orchestration, but still partly inferred |

**Overall confidence:** MEDIUM

### Gaps to Address

- Exact session strategy for strict independence: validate during Phase 2 planning and implementation.
- Best transcript storage format: validate during Phase 3 based on real output sizes.

## Sources

### Primary (HIGH confidence)
- `https://opencode.ai/docs/sdk/` — SDK creation, session APIs, structured output, runtime support
- `anomalyco/opencode-sdk-js` — package metadata and generated API surface

### Secondary (MEDIUM confidence)
- `https://opencode.ai/docs/` — product capabilities and provider model support
- ecosystem examples found through public repository search — confirms common integration patterns

### Tertiary (LOW confidence)
- inferred multi-model debate best practices from the project concept itself

---
*Research completed: 2026-04-04*
*Ready for roadmap: yes*
