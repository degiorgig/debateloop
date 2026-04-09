# Phase 2: Independent Answers And Critiques - Research

**Researched:** 2026-04-05
**Domain:** OpenCode session-based debate stage execution in a TypeScript CLI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Answer style
- Debater A and Debater B should have clearly distinct roles rather than sounding like two copies of the same assistant
- Initial answers should be balanced in depth: substantial enough to make a case, but not so long that they feel final
- The contrast between the two first answers should come from both reasoning and structure
- Initial answers should feel moderately opinionated: clear positions, but still grounded and useful

### Independence rules
- Before critique begins, each debater should see the user's question plus a shared system framing block
- Debater A and Debater B should still receive clearly different role briefs so their first answers do not converge too easily
- During the critique step, each debater should receive both their own initial answer and the opponent's initial answer
- The product should make the independence of the opening answers very explicit to the user

### OpenCode's Discretion
- Exact wording of the shared system framing block, as long as it stays shared between both debaters
- Exact wording of the distinct role briefs, as long as they remain clearly different
- Exact presentation format of the explicit independence messaging shown to the user
- Exact formatting of balanced initial answers and critique prompts

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORCH-01 | Debater A can generate an initial answer to the user question | Per-stage prompt builder, fresh session execution, answer extraction from text parts |
| ORCH-02 | Debater B can generate an independent initial answer to the same question before seeing Debater A's answer | Separate session per debater, no cross-answer prompt injection before critique, explicit independence messaging |
| ORCH-03 | Debater A can critique Debater B's initial answer | Critique prompt shape that includes both answers in a controlled order |
| ORCH-04 | Debater B can critique Debater A's initial answer | Symmetric critique prompt builder with role-specific framing and answer exchange |
</phase_requirements>

## Summary

Phase 2 should extend the existing fixed stage loop rather than replacing it. The current repo already has the full ordered stage metadata and a runnable `runDebate` skeleton, so the right move is to add stage-specific execution for `answer_a`, `answer_b`, `critique_a`, and `critique_b` while leaving revise/judge behavior intentionally placeholder until later phases.

The key technical finding is that OpenCode's SDK session API cleanly supports the independence boundary. `client.session.create()` creates a fresh conversation, and `client.session.prompt()` sends a prompt with a model ref, optional `system`, and text parts. That means Debater A and Debater B can use separate sessions for their opening answers, which is the simplest trustworthy way to guarantee Debater B never sees Debater A's answer before critique begins.

The other important planning constraint is transcript shape. Phase 3 will persist inspectable transcripts, but Phase 2 still needs typed in-memory stage outputs so critique prompts can read prior answers. The smallest correct design is to extend debate state with optional per-stage content plus session IDs/metadata for the completed answer and critique stages, then render a short user-facing independence note before the opening answers start.

**Primary recommendation:** Use one fresh OpenCode session per debater answer/critique path, store typed stage outputs in memory, and build prompts from a shared framing block plus distinct role briefs so independence stays explicit and testable.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.x | Typed orchestration and state updates | Already established in the repo and ideal for stage metadata plus prompt builders |
| `@opencode-ai/sdk` | 1.3.13 | OpenCode session lifecycle and prompt execution | Official SDK already in use for server startup and model config inspection |
| Vitest | 4.1.2 | Stage-boundary and prompt-shape tests | Existing test runner with simple mocking for OpenCode client sessions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.3.6 | Existing config validation only | No new schema work needed in Phase 2 |
| `commander` | 14.0.3 | Existing CLI entrypoint | Keep command surface stable while execution gets richer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fresh SDK session per opening answer | reusing one shared session with careful prompt isolation | Lower setup overhead, but much easier to accidentally leak Debater A context into Debater B |
| typed in-memory stage outputs | untyped string maps or ad hoc locals inside `runDebate` | Slightly less code up front, but weaker symmetry guarantees and harder follow-on work for transcript persistence |
| focused stage prompt builder module | inline string concatenation inside `runDebate` | Fewer files today, but harder to test and easier to drift between A/B prompt variants |

**Installation:**
```bash
npm install
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── debate/stages.ts           # fixed ordered stage metadata
├── debate/state.ts            # run state plus stage outputs
├── debate/run-debate.ts       # ordered execution loop and stage dispatch
├── debate/prompts.ts          # shared framing, role briefs, answer/critique prompt builders
└── cli/render.ts              # user-facing progress and independence messaging
```

### Pattern 1: Separate Session Per Independent Answer
**What:** Create a fresh session for each debater's opening answer so no hidden prompt history can leak between them.
**When to use:** For `answer_a` and `answer_b` in this phase.
**Example:**
```typescript
// Source: OpenCode SDK docs (`client.session.create`, `client.session.prompt`)
const session = await client.session.create({
  body: { title: "Debate answer_a" },
})

const result = await client.session.prompt({
  path: { id: session.data.id },
  body: {
    model: { providerID: "openai", modelID: "gpt-5" },
    system: sharedFraming,
    parts: [{ type: "text", text: promptText }],
  },
})
```

### Pattern 2: Shared Framing + Distinct Role Briefs
**What:** Keep one common system framing block for both debaters, but vary the role brief text so the answers diverge on reasoning and structure.
**When to use:** Every answer and critique prompt in Phase 2.
**Example:**
```typescript
const sharedFraming = [
  "You are participating in a structured two-model debate.",
  "Write a balanced but clear answer.",
].join("\n")

const roleBriefA = "Debater A: lead with direct recommendation and practical tradeoffs."
const roleBriefB = "Debater B: pressure-test assumptions and organize around risks and alternatives."
```

### Pattern 3: Typed Stage Outputs In Debate State
**What:** Store each completed answer/critique in state alongside the stage status so later stages can read earlier outputs without transcript persistence yet.
**When to use:** Immediately in Phase 2.
**Example:**
```typescript
interface DebateStageResult {
  sessionId?: string
  content?: string
}

interface DebateStageState {
  key: DebateStageKey
  status: StageStatus
  result?: DebateStageResult
}
```

### Anti-Patterns to Avoid
- **Do not let `answer_b` reuse Debater A's session:** that silently breaks independence.
- **Do not push critique context into the answer stages:** answer prompts should contain only the question, shared framing, and the actor's role brief.
- **Do not implement revise/judge logic early:** keep those later stages placeholder-only in Phase 2.
- **Do not hide independence as an internal detail:** user-visible messaging is part of the product promise for this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI conversation isolation | custom prompt-history objects pretending to be sessions | `client.session.create()` per debater | Official session boundary is clearer and easier to verify |
| Model ID splitting | duplicate parser logic in debate modules | existing `toSdkModelRef()` helper | Keeps provider/model conversion consistent |
| Response extraction heuristics across tool parts | ad hoc regex over serialized message dumps | read returned `parts` and join `text` parts only | Uses the SDK's typed response shape directly |

**Key insight:** Phase 2 is mostly disciplined orchestration, not new infrastructure. The safest implementation is to compose the existing runner with the SDK's typed session primitives and keep prompt-building logic explicit.

## Common Pitfalls

### Pitfall 1: Accidental Answer Leakage Before Critique
**What goes wrong:** Debater B's answer prompt contains Debater A's answer or shared session history.
**Why it happens:** It feels convenient to reuse one conversation or one prompt template.
**How to avoid:** Create separate opening-answer sessions and test the exact prompt inputs used for both stages.
**Warning signs:** `answer_b` tests only assert stage order, not prompt contents or session boundaries.

### Pitfall 2: Critique Prompts Without Enough Comparison Context
**What goes wrong:** Critiques become generic because the model only sees the opponent answer or only its own answer.
**Why it happens:** Prompt builder omits one side to stay minimal.
**How to avoid:** Include question, actor answer, and opponent answer in critique prompts, with explicit comparison instructions.
**Warning signs:** Critique prompt builder accepts only one prior answer.

### Pitfall 3: Overcommitting To Transcript Design Early
**What goes wrong:** Phase 2 starts storing full prompt context or persistence artifacts that belong in Phase 3.
**Why it happens:** Critique stages need prior outputs, which tempts deeper transcript work.
**How to avoid:** Keep only typed in-memory `result` fields in stage state for now.
**Warning signs:** New persistence/storage modules appear in this phase.

### Pitfall 4: Brittle Output Extraction
**What goes wrong:** The stage result parser grabs reasoning/tool text or fails when the assistant returns multiple text parts.
**Why it happens:** The implementation assumes one raw string field.
**How to avoid:** Join only `type === "text"` parts from the assistant response.
**Warning signs:** Tests mock a fake `content` field that the SDK does not expose.

## Code Examples

Verified patterns from official sources:

### Create a session and send a prompt
```typescript
// Source: OpenCode SDK docs / Context7
const session = await client.session.create({
  body: { title: "Debate answer_a" },
})

const message = await client.session.prompt({
  path: { id: session.data.id },
  body: {
    model: { providerID: "openai", modelID: "gpt-5" },
    system: "You are participating in a structured debate.",
    parts: [{ type: "text", text: "Question: Should tests come first?" }],
  },
})

const text = message.data.parts
  .filter((part) => part.type === "text")
  .map((part) => part.text)
  .join("\n")
  .trim()
```

### Inject context without requesting a reply
```typescript
// Source: OpenCode SDK docs / Context7
await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "Shared context block" }],
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single long prompt chains that rely on manual isolation discipline | Fresh session-per-conversation boundaries with typed prompt/message APIs | Current OpenCode SDK generation | Makes independence and testability much stronger |
| Untyped assistant payload assumptions | Typed `parts` arrays with `text`, `tool`, `reasoning`, and file parts | Current SDK API shape | Extraction logic must intentionally select text parts |

**Deprecated/outdated:**
- Reading OpenCode config files directly for runtime execution details: use the SDK client's config/session APIs instead.

## Open Questions

1. **Should critiques reuse the opening-answer session or run in a new session?**
   - What we know: the opening-answer independence boundary must be strict; critiques need both answers in prompt context.
   - What's unclear: whether a reused actor session has any practical benefit before transcript persistence lands.
   - Recommendation: reuse the actor's own session for critique only if the critique prompt still includes both answers explicitly; otherwise create a new critique session. Either choice is acceptable if tests lock the context shape down.

## Sources

### Primary (HIGH confidence)
- `/anomalyco/opencode` via Context7 - session creation and prompt API examples, structured output options
- Local installed package `@opencode-ai/sdk@1.3.13` type declarations - exact `session.create()` and `session.prompt()` payload/response shapes

### Secondary (MEDIUM confidence)
- https://github.com/anomalyco/opencode - project README and release context for current SDK lineage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing repo dependencies plus installed SDK declarations match the docs
- Architecture: HIGH - separate opening sessions directly satisfy the independence requirement with minimal complexity
- Pitfalls: HIGH - based on current phase constraints and the SDK's typed message/session model

**Research date:** 2026-04-05
**Valid until:** 2026-05-05
