# Architecture Research

**Domain:** Multi-model debate application built on OpenCode SDK
**Researched:** 2026-04-04
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                  │
├─────────────────────────────────────────────────────────────┤
│  CLI command  │  transcript renderer  │  result presenter  │
├─────────────────────────────────────────────────────────────┤
│                    Debate Orchestration Layer              │
├─────────────────────────────────────────────────────────────┤
│ session setup │ stage runner │ prompt builder │ judge flow │
├─────────────────────────────────────────────────────────────┤
│                      Persistence Layer                     │
├─────────────────────────────────────────────────────────────┤
│ debate record │ stage outputs │ config store │ transcript  │
├─────────────────────────────────────────────────────────────┤
│                   OpenCode Runtime Boundary                │
├─────────────────────────────────────────────────────────────┤
│ createOpencode │ session APIs │ prompt APIs │ event stream │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI/Input Layer | Collect question and runtime options | Thin command handler that delegates immediately |
| Debate Orchestrator | Enforce stage order and data handoff | Stateful service that runs answer, critique, revise, judge |
| Prompt Builder | Create role-specific prompts for each stage | Pure functions/templates returning prompt parts |
| Transcript Store | Persist outputs and metadata per stage | JSON files or small local storage for v1 |
| Judge Evaluator | Validate and interpret judge response | Structured JSON schema plus winner parser |

## Recommended Project Structure

```text
src/
├── cli/                # command entrypoints and argument parsing
│   └── ask.ts          # run a debate from the terminal
├── core/               # domain logic for debate workflow
│   ├── debate/         # orchestration and state machine
│   ├── prompts/        # stage prompt templates
│   └── judge/          # winner selection and validation
├── opencode/           # SDK client and session helpers
│   └── client.ts       # create/connect OpenCode client
├── storage/            # transcript persistence
│   └── debates.ts      # save/load debate records
├── types/              # shared app types
└── test/               # orchestration and prompt flow tests
```

### Structure Rationale

- **`core/`** keeps the debate workflow independent from transport details.
- **`opencode/`** isolates SDK wiring so the orchestration layer stays testable.
- **`storage/`** prevents transcript concerns from leaking into prompt logic.

## Architectural Patterns

### Pattern 1: Explicit Stage Pipeline

**What:** Represent the debate as named stages with strict ordering.
**When to use:** Always for v1.
**Trade-offs:** Slightly more boilerplate, but far easier to debug and test than free-form loops.

**Example:**
```typescript
const stages = [
  "answer_a",
  "answer_b",
  "critique_a_on_b",
  "critique_b_on_a",
  "revise_a",
  "revise_b",
  "judge",
] as const
```

### Pattern 2: Role-Specific Prompt Functions

**What:** Build each stage prompt from typed inputs instead of concatenating ad hoc strings inline.
**When to use:** For all debate stages.
**Trade-offs:** More files/functions, but cleaner prompt evolution and safer context passing.

**Example:**
```typescript
function buildCritiquePrompt(input: {
  question: string
  ownAnswer: string
  opponentAnswer: string
}) {
  return [
    { type: "text", text: `Question: ${input.question}` },
    { type: "text", text: `Your answer: ${input.ownAnswer}` },
    { type: "text", text: `Critique this answer: ${input.opponentAnswer}` },
  ]
}
```

### Pattern 3: Structured Judge Output

**What:** Judge returns machine-readable winner metadata instead of free text only.
**When to use:** As soon as the judge phase exists.
**Trade-offs:** Requires schema design, but makes downstream winner selection reliable.

## Data Flow

### Request Flow

```text
User question
    ↓
CLI handler
    ↓
Debate orchestrator
    ↓
OpenCode session creation
    ↓
Stage prompts sent in order
    ↓
Stage outputs captured and stored
    ↓
Judge output validated
    ↓
Winner and transcript returned
```

### State Management

```text
DebateConfig + DebateState
    ↓
Stage runner updates current stage
    ↓
Transcript store appends artifacts
    ↓
Judge result finalizes debate outcome
```

### Key Data Flows

1. **Debate execution flow:** question -> independent answers -> critiques -> revisions -> judge.
2. **Transcript persistence flow:** every stage output -> normalized record -> stored debate artifact.
3. **Result rendering flow:** judge decision + winning answer + transcript summary -> terminal output.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k debates | Local file persistence and single-process orchestration are fine |
| 1k-100k debates | Move transcripts to a database/object store and add queue-backed execution |
| 100k+ debates | Separate orchestration workers, event-driven execution, and observability around cost/latency |

### Scaling Priorities

1. **First bottleneck:** repeated model latency and retry handling — fix with timeouts, backoff, and observable stage logging.
2. **Second bottleneck:** transcript storage growth — fix with compact artifacts and storage abstraction.

## Anti-Patterns

### Anti-Pattern 1: Shared Context Too Early

**What people do:** Let model B see model A's first answer before writing its own.
**Why it's wrong:** It destroys independence and biases the whole debate.
**Do this instead:** Keep the first answers fully independent and only share outputs during critique.

### Anti-Pattern 2: One Giant Prompt For The Entire Debate

**What people do:** Ask one model to simulate all roles in one call or one giant chain.
**Why it's wrong:** Hard to inspect, impossible to replay stage-by-stage, and brittle.
**Do this instead:** Store each stage as a separate explicit step.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenCode local server | `createOpencode()` or client connection | Primary execution boundary for model access |
| Model providers configured in OpenCode | Indirect through OpenCode model selection | Avoid custom provider code in v1 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `cli` <-> `core` | direct function calls | CLI should stay thin |
| `core` <-> `opencode` | typed service interface | Makes orchestration testable |
| `core` <-> `storage` | record save/load functions | Keeps transcript persistence replaceable |

## Sources

- `https://opencode.ai/docs/sdk/` — session APIs, prompt APIs, and structured output guidance
- `anomalyco/opencode-sdk-js` `api.md` — confirmed session, app, file, and event surfaces
- Product idea captured in `.planning/PROJECT.md`

---
*Architecture research for: multi-model debate application*
*Researched: 2026-04-04*
