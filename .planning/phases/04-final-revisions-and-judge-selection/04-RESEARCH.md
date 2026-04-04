# Phase 4: Final Revisions And Judge Selection - Research

**Researched:** 2026-04-05
**Domain:** Final revision prompts, structured judge validation, and winner-first result presentation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Revision behavior
- Each debater's final answer should be a balanced rewrite, not a tiny patch and not a total from-scratch replacement
- The revision step should address critique directly as its main purpose
- Revised answers should include some acknowledgment of the critique, but stay readable and self-contained
- Both revised answers should remain distinct in voice and structure rather than converging into near-duplicates

#### Judge criteria
- The judge should prioritize usefulness plus correctness above all other factors
- Clarity and readability should be a major factor in the verdict, not a minor afterthought
- The judge should penalize a revised answer strongly if it ignores a strong critique
- The judge should stay balanced between safer and more decisive answers rather than biasing toward one style by default

#### Verdict format
- The final output should lead with the winner and the winning final revised answer
- Default judge rationale should be short rather than long-form
- The losing revised answer should not be shown in the default final output
- The final result should identify the winner as both role and exact model name

#### Judge strictness
- In v1 the judge should always return a winner
- If both answers are weak, the judge should still choose the better one instead of returning no result
- The verdict contract should feel very deterministic to the user
- If judge output is malformed or unclear, the app should fail clearly rather than guessing or silently masking the problem

### OpenCode's Discretion
- Exact wording of revision prompts, as long as revisions remain balanced rewrites that address critique directly
- Exact rubric field names and schema details for the structured judge output
- Exact short rationale wording in the final verdict presentation
- Exact CLI formatting of the winner-first final result

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORCH-05 | Debater A can generate a final revised answer after the critique round | Revision prompt builder with critique context, fresh session execution, content extraction |
| ORCH-06 | Debater B can generate a final revised answer after the critique round | Symmetric revision prompt builder, balanced rewrite guidance, voice preservation |
| JUDGE-01 | Judge can compare the two final revised answers and select a winner | Structured judge prompt with rubric guidance, winner field extraction from validated schema |
| JUDGE-02 | Judge returns a rationale explaining why the winning answer was selected | Short rationale field in structured output, clarity/correctness framing |
| JUDGE-03 | Judge output is validated in a structured format before the app returns the final result | Zod schema with safeParse, malformed output detection, deterministic failure on invalid structure |
| TRNS-03 | Final result clearly identifies the winning model and includes the winning final answer | Winner-first render with role+model, winning revised answer display, losing answer suppression |

</phase_requirements>

## Summary

Phase 4 completes the debate loop by adding real model execution to the three remaining placeholder stages: `revise_a`, `revise_b`, and `final_decision`. The existing architecture already supports these stages as metadata entries and transcript persistence hooks, so the implementation focus is on prompt design, structured output validation, and result presentation.

The key technical constraint is judge output validation. Unlike the free-form answer and critique stages, the judge must return parseable structured data so the app can extract the winner deterministically. The project already uses Zod 4 for config validation with a clear pattern: define a schema, use `safeParse`, format errors explicitly. That same pattern applies directly to judge output validation.

The other critical design point is revision prompts. Each debater needs to see their original answer, the opponent's critique of it, and guidance to produce a balanced rewrite that addresses the critique without converging into a duplicate. The prompt must preserve the debater's distinct voice while showing clear improvement from the critique feedback.

**Primary recommendation:** Add revision prompt builders that pass actor answer + opponent critique context, implement structured judge output with Zod validation, and render the final result as winner-first with short rationale and winning revised answer only.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.x | Type-safe prompt builders and validation schemas | Already established for all debate orchestration logic |
| `@opencode-ai/sdk` | 1.3.13 | Session creation and prompt execution for revisions and judge | Official SDK, already used for answer and critique stages |
| Zod | 4.3.6 | Structured judge output validation | Already in use for config validation with clear safeParse pattern |
| Vitest | 4.1.2 | Test revision prompts, judge validation, and winner extraction | Existing test framework, proven for stage execution tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `commander` | 14.0.3 | CLI entrypoint (no changes needed) | Keep command surface stable |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod schema validation | Manual JSON parsing with try/catch | Simpler upfront, but loses type safety and clear error messages |
| Fresh session per revision | Reusing critique sessions | Less overhead, but breaks symmetry with opening answer pattern |
| Winner-first result format | Show both revised answers equally | More transparency, but conflicts with user decision for losing answer suppression |

**Installation:**
```bash
npm install
# All dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── debate/stages.ts           # existing stage metadata (no changes)
├── debate/state.ts            # existing state types (no changes)
├── debate/run-debate.ts       # extend maybeRunStage for revise/judge
├── debate/prompts.ts          # add buildRevisionPrompt, buildJudgePrompt
├── debate/judge.ts            # NEW: JudgeVerdictSchema, parseJudgeVerdict
└── cli/render.ts              # add renderFinalResult (winner-first)
```

### Pattern 1: Revision Prompt With Critique Context
**What:** Each debater's revision prompt includes their original answer and the opponent's critique so they can address feedback directly.
**When to use:** For `revise_a` and `revise_b` stages.
**Example:**
```typescript
// src/debate/prompts.ts
export function buildRevisionPrompt(options: {
  question: string
  actorRole: "debaterA" | "debaterB"
  actorAnswer: string
  opponentCritique: string
}) {
  return [
    getRoleBrief(options.actorRole),
    "You are now in the final revision round.",
    "Produce a balanced rewrite of your opening answer that addresses the opponent's critique directly.",
    "Acknowledge the critique where it strengthens your position, but stay true to your distinct voice and structure.",
    "Make clear improvements without converging into a near-duplicate of the opponent's style.",
    `Question: ${options.question}`,
    `Your opening answer:\n${options.actorAnswer}`,
    `Opponent's critique of your answer:\n${options.opponentCritique}`,
  ].join("\n\n")
}
```

### Pattern 2: Structured Judge Output With Zod Validation
**What:** Judge prompt requests JSON output with `winner` and `rationale` fields, validated with Zod before app accepts it.
**When to use:** For `final_decision` stage.
**Example:**
```typescript
// src/debate/judge.ts
import { z } from "zod"

export const JudgeVerdictSchema = z.object({
  winner: z.enum(["debaterA", "debaterB"]),
  rationale: z.string().min(10).max(500),
})

export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>

export function parseJudgeVerdict(rawOutput: string): JudgeVerdict {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error("Judge output is not valid JSON.")
  }

  const result = JudgeVerdictSchema.safeParse(parsed)

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
        return `${path}${issue.message}`
      })
      .join(" ")

    throw new Error(`Judge output is malformed. ${message}`)
  }

  return result.data
}

// src/debate/prompts.ts
export function buildJudgePrompt(options: {
  question: string
  revisedAnswerA: string
  revisedAnswerB: string
}) {
  return [
    "You are the judge in a structured two-model debate.",
    "Compare the two final revised answers and select a winner.",
    "Prioritize usefulness and correctness above all other factors.",
    "Clarity and readability should be a major factor, not a minor afterthought.",
    "Penalize answers that ignore strong critiques from the opponent.",
    "Stay balanced between safer and more decisive answers.",
    "You must return ONLY valid JSON with this exact structure:",
    '{ "winner": "debaterA" or "debaterB", "rationale": "short explanation (10-500 chars)" }',
    `Question: ${options.question}`,
    `Debater A revised answer:\n${options.revisedAnswerA}`,
    `Debater B revised answer:\n${options.revisedAnswerB}`,
  ].join("\n\n")
}
```

### Pattern 3: Winner-First Result Rendering
**What:** Final CLI output leads with the winner (role + model), shows the winning revised answer, and includes a short rationale. Losing answer is suppressed.
**When to use:** After judge verdict is validated.
**Example:**
```typescript
// src/cli/render.ts
export function renderFinalResult(options: {
  winner: "debaterA" | "debaterB"
  winnerModel: string
  winningAnswer: string
  rationale: string
  transcriptId: string
}) {
  const winnerLabel = options.winner === "debaterA" ? "Debater A" : "Debater B"
  
  return [
    "=== DEBATE RESULT ===",
    "",
    `Winner: ${winnerLabel} (${options.winnerModel})`,
    "",
    "Winning Answer:",
    options.winningAnswer,
    "",
    "Rationale:",
    options.rationale,
    "",
    `Full transcript: debate inspect ${options.transcriptId}`,
  ].join("\n")
}
```

### Pattern 4: Fresh Session Per Revision Stage
**What:** Like opening answers, each revision gets a fresh OpenCode session to keep execution symmetric and avoid hidden context leaks.
**When to use:** For both `revise_a` and `revise_b`.
**Example:**
```typescript
// src/debate/run-debate.ts (inside maybeRunStage)
if (options.stage.key === "revise_a" || options.stage.key === "revise_b") {
  const actorAnswerKey = options.stage.key === "revise_a" ? "answer_a" : "answer_b"
  const opponentCritiqueKey = options.stage.key === "revise_a" ? "critique_b" : "critique_a"
  const actorAnswer = getRequiredStageContent(options.state, actorAnswerKey)
  const opponentCritique = getRequiredStageContent(options.state, opponentCritiqueKey)

  const result = await runModelStage({
    sessionClient: options.sessionClient,
    stageKey: options.stage.key,
    title: `Debate ${options.stage.key}`,
    modelId: actorModel,
    prompt: buildRevisionPrompt({
      question: options.state.question,
      actorRole: options.stage.actorRole,
      actorAnswer,
      opponentCritique,
    }),
  })

  return result
}
```

### Anti-Patterns to Avoid
- **Do not let judge return free-form text:** defeats the deterministic winner extraction requirement.
- **Do not show both revised answers in the default result:** conflicts with user decision to suppress the losing answer.
- **Do not skip validation on judge output:** must fail clearly on malformed responses, not guess or silently mask problems.
- **Do not make revision prompts generic:** must include both actor answer and opponent critique for context.
- **Do not let revisions ignore critique:** prompt must explicitly guide debaters to address the opponent's feedback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Manual try/catch with property checks | Zod with safeParse | Zod already in project, provides type inference, clear error messages, and consistent validation pattern |
| Judge output parsing | Regex or string splitting | JSON.parse + Zod validation | Judge prompt requests JSON explicitly, parsing should fail deterministically on malformed output |
| Revision context assembly | Ad hoc string concatenation in runDebate | Dedicated prompt builder function | Easier to test, maintains symmetry with answer/critique prompt patterns |

**Key insight:** Validation logic is deceptively complex. Zod handles missing fields, wrong types, enum constraints, and formatting in one unified pattern already proven in this codebase.

## Common Pitfalls

### Pitfall 1: Judge Returns Explanation Instead Of JSON
**What goes wrong:** Model ignores JSON instruction and returns natural language verdict.
**Why it happens:** Prompt isn't explicit enough, or model interprets "rationale" as essay request.
**How to avoid:** 
- Use strong JSON instruction: "You must return ONLY valid JSON"
- Show exact schema format in prompt
- Validate with Zod and fail clearly on malformed output
**Warning signs:** Judge stage succeeds but winner extraction throws parsing errors.

### Pitfall 2: Revisions Converge Into Near-Duplicates
**What goes wrong:** Both debaters rewrite answers in similar structure and tone after seeing opponent critique.
**Why it happens:** Revision prompt doesn't reinforce distinct voice preservation.
**How to avoid:** 
- Include role brief in revision prompt (like answer/critique stages)
- Explicitly instruct: "stay true to your distinct voice and structure"
- Test that revised answers maintain recognizable A/B contrast
**Warning signs:** Revised answers feel generic or interchangeable.

### Pitfall 3: Revision Prompt Missing Critical Context
**What goes wrong:** Debater revises answer without seeing what the opponent criticized.
**Why it happens:** Forgot to include opponent critique in revision prompt.
**How to avoid:** 
- Revision prompt must include both actor's opening answer AND opponent's critique
- Assert dependencies before stage runs (like critique stages do)
- Test that revision prompts contain all expected context fields
**Warning signs:** Revisions don't address critique points at all.

### Pitfall 4: Winner Extraction Fails Silently
**What goes wrong:** App treats missing winner field as "no winner" instead of validation error.
**Why it happens:** Using loose JSON parsing without schema enforcement.
**How to avoid:** 
- Use Zod safeParse, not manual property access
- Throw explicit error if validation fails
- Never default or guess winner value
**Warning signs:** Debate completes but final result says "pending" or shows no winner.

### Pitfall 5: Losing Answer Leaks Into Final Output
**What goes wrong:** User sees both revised answers in final result despite decision to suppress loser.
**Why it happens:** Render function doesn't filter, or transcript inspection gets confused with final result.
**How to avoid:** 
- Winner-first render function takes only winning answer as parameter
- Transcript inspection remains separate command
- Test that final output contains exactly one revised answer
**Warning signs:** Final result feels cluttered or indecisive.

## Code Examples

Verified patterns from codebase and Zod docs:

### Zod Schema With SafeParse
```typescript
// Source: src/app/config.ts (existing pattern)
import { z } from "zod"

const JudgeVerdictSchema = z.object({
  winner: z.enum(["debaterA", "debaterB"]),
  rationale: z.string().min(10).max(500),
})

function parseJudgeVerdict(rawOutput: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error("Judge output is not valid JSON.")
  }

  const result = JudgeVerdictSchema.safeParse(parsed)

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
        return `${path}${issue.message}`
      })
      .join(" ")
    throw new Error(`Judge output is malformed. ${message}`)
  }

  return result.data
}
```

### Stage Content Extraction
```typescript
// Source: src/debate/run-debate.ts (existing pattern)
function getRequiredStageContent(state: DebateRunState, stageKey: DebateStageKey) {
  const content = getStageResult(state, stageKey)?.content?.trim()

  if (!content) {
    throw new Error(`Cannot run dependent stage before ${stageKey} has completed content.`)
  }

  return content
}
```

### Fresh Session Execution
```typescript
// Source: src/debate/run-debate.ts (existing pattern)
async function runModelStage(options: {
  sessionClient: DebateSessionClient
  stageKey: DebateStageKey
  title: string
  modelId: string
  prompt: string
}) {
  const created = await options.sessionClient.create({
    body: { title: options.title },
  })
  const sessionId = created.data?.id

  if (!sessionId) {
    throw new Error(`OpenCode did not return a session id for ${options.stageKey}.`)
  }

  const response = await options.sessionClient.prompt({
    path: { id: sessionId },
    body: {
      model: toSdkModelRef(options.modelId),
      system: getSharedDebateFraming(),
      parts: [{ type: "text", text: options.prompt }],
    },
  })

  // ... error handling and content extraction
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-form judge output | Structured JSON with schema validation | Established pattern in ML tooling since ~2023 | Enables deterministic winner extraction and clear error messages |
| Show all debate outputs equally | Winner-first result presentation | Product design decision Phase 4 | Clearer user experience, decisive verdict feel |
| Generic revision prompts | Context-rich prompts with critique feedback | Phase 4 implementation | Better critique integration, clearer improvement signal |

**Deprecated/outdated:**
- Generic "write a better answer" revision prompts without critique context: defeats the purpose of the critique round

## Open Questions

1. **Should judge output include confidence score?**
   - What we know: User wants short rationale, not extended analysis
   - What's unclear: Whether a 0-100 confidence helps users or adds noise
   - Recommendation: Start without confidence, add in v2 if user feedback requests it

2. **Should revision prompts show opponent's revised answer?**
   - What we know: Revisions happen in parallel (revise_a, revise_b), so neither sees opponent's revision
   - What's unclear: Could sequential revisions improve quality?
   - Recommendation: Keep parallel revisions in v1 for symmetry, consider sequential in v2

## Validation Architecture

> Nyquist validation is disabled in .planning/config.json (workflow.nyquist_validation not set to true), so this section is omitted.

## Sources

### Primary (HIGH confidence)
- `/colinhacks/zod` (Context7) - Schema validation with safeParse, error formatting, type inference
- `src/app/config.ts` - Existing Zod pattern with safeParse and formatZodError
- `src/debate/run-debate.ts` - Existing stage execution, session creation, content extraction patterns
- `src/debate/prompts.ts` - Existing prompt builders for answer and critique stages
- `src/debate/stages.ts` - Fixed stage metadata including revise_a, revise_b, final_decision
- `tests/debate/run-debate.test.ts` - Existing test patterns for stage execution and critique context

### Secondary (MEDIUM confidence)
- Phase 2 RESEARCH.md - Established patterns for session independence and prompt builders
- Phase 3 completion - Transcript persistence and inspection patterns

### Tertiary (LOW confidence)
None - all findings verified with codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in package.json and proven in use
- Architecture: HIGH - Extends existing stage execution and prompt builder patterns
- Pitfalls: HIGH - Based on codebase patterns and structured output validation principles

**Research date:** 2026-04-05
**Valid until:** 30 days (stable domain, no fast-moving dependencies)
