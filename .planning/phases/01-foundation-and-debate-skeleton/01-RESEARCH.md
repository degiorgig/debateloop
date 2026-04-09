# Phase 1: Foundation And Debate Skeleton - Research

**Researched:** 2026-04-04
**Domain:** TypeScript CLI foundation for an OpenCode-backed debate runner
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Command flow
- v1 should usually start from one direct command, not an app-first interactive shell
- The primary input style should be a quoted question passed directly in the command
- Startup should show the full debate structure up front, not hide the staged nature of the tool
- When a run finishes, the default result view should lead with the winner first

### Model setup
- Model roles should use saved defaults with per-run override support
- Debater A and Debater B must always be different models in v1
- If no saved role configuration exists yet, the app should guide the user through interactive setup
- During a run, show both role and exact model name together

### Run visibility
- During execution, show stage-by-stage progress rather than only a spinner or raw live transcript
- Progress display should show both the current stage and which role/model is acting
- The full transcript should be shown or offered only after completion, not streamed by default during the run
- Final output should be result-first, with transcript details available on demand

### Missing setup
- If OpenCode cannot start or is unavailable, fail immediately with clear fix steps
- If role configuration is missing or incomplete, prompt the user to configure the missing roles
- If a selected model is unavailable at runtime, fail fast with a clear message naming the affected role/model
- Setup and error guidance should be friendly and guided, not terse or overly technical

### Command naming
- The command style should be plain, direct, and tool-first
- The product brand `Debate` should appear in help/output, but does not need to dominate the command itself
- Subcommands and flags should lean toward full readable words over short clever aliases

### Saved defaults
- On normal runs, reuse saved defaults but show a short reminder of the active roles/models
- Per-run overrides should affect only that run unless explicitly saved later
- Active defaults should be shown in one compact summary line before execution starts
- If saved defaults are invalid or stale, force a reconfiguration flow rather than guessing

### Stage labels
- Stage labels should be simple and plain rather than technical or theatrical
- The first two visible stage labels should be `Answer A` and `Answer B`
- The critique stages should be labeled `Critique A` and `Critique B`
- The final stage should be labeled `Final decision`

### First-run help
- After the first successful setup, show only a quick hint, not a walkthrough
- That first-run hint should emphasize how to run the tool again
- Include one concise example command in the first-run help
- First-run help should appear only on the first successful run, then disappear unless help is requested

### OpenCode's Discretion
- Exact command names and flag spellings, as long as they stay plain, readable, and tool-first
- Exact formatting of the stage progress display
- Exact layout of the winner-first final result screen and transcript access affordance
- Exact wording of the friendly setup/error guidance and first-run hint copy

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-01 | User can submit a question to start a new debate run | CLI entrypoint recommendation, Commander command structure, direct quoted-question flow |
| INPUT-02 | User can configure which model is used as Debater A, Debater B, and Judge | App-owned role config schema, interactive setup flow, model availability checks against OpenCode |
| INPUT-03 | User can run the debate through the OpenCode SDK using the local OpenCode server configuration | `createOpencode()` recommendation, config precedence notes, SDK client/session APIs |
| ORCH-07 | The debate executes in a fixed stage order that preserves the symmetric workflow | Explicit fixed stage enum/list, orchestration skeleton, visible stage labels and stage metadata |
</phase_requirements>

## Summary

Phase 1 should stay small and structural. The goal is not to implement real debate intelligence yet; it is to create a runnable CLI that proves the app can accept a question, load saved role-to-model defaults, start OpenCode programmatically, and expose the full fixed debate sequence in a visible, typed form.

The most important planning decision is to separate two kinds of configuration. OpenCode already owns provider credentials, provider/model configuration, and config-file precedence. Debate should own only app-specific defaults: which exact model ID is assigned to Debater A, Debater B, and Judge, plus a small first-run marker. That keeps Phase 1 aligned with OpenCode instead of competing with it.

The other major planning constraint is that the stage pipeline must be explicit now, even before stage-specific prompts and outputs exist. Phase 1 should define the full ordered sequence and surface it in the CLI progress view so later phases can fill in behavior without redesigning the core state model.

**Primary recommendation:** Build a Node 20+ ESM TypeScript CLI with `commander`, `@inquirer/prompts`, `zod`, and `@opencode-ai/sdk`, and keep Debate's own persisted config limited to role defaults plus first-run metadata.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Main implementation language | Best fit for typed debate state, SDK usage, and CLI code organization |
| Node.js | 20.12+ | Runtime | Matches modern ESM packages and current prompt package engine support |
| `@opencode-ai/sdk` | 1.3.13 | Start/connect OpenCode and call its APIs | Official programmatic integration for server startup, config inspection, sessions, prompts, and events |
| `zod` | 4.3.6 | Runtime schema validation | Cleanest way to validate saved Debate config and normalize parse errors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `commander` | 14.0.3 | CLI parsing and help output | Use for the main command and readable long-form flags |
| `@inquirer/prompts` | 8.3.2 | First-run interactive setup | Use only when config is missing, incomplete, or explicitly reconfigured |
| `tsx` | 4.21.0 | Dev runtime for TS entrypoint | Use for local dev and simple package scripts before build packaging exists |
| `vitest` | 4.1.2 | Unit tests for config and stage skeleton | Use immediately for cheap validation of the fixed pipeline and config rules |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `commander` | hand-rolled `process.argv` parsing | Smaller dependency, but weaker help/usage ergonomics and more custom validation code |
| `@inquirer/prompts` | raw `readline` | Fewer dependencies, but worse setup UX and more hand-rolled interactive state |
| app-owned role config file | trying to encode Debate roles directly into OpenCode config | Avoids a second file, but couples product roles to OpenCode config structure too early |

**Installation:**
```bash
npm install @opencode-ai/sdk commander zod @inquirer/prompts
npm install -D typescript tsx vitest @types/node
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── cli/                # command entrypoint, help text, setup flow
├── app/                # app config load/save and paths
├── opencode/           # SDK startup, health/config checks, model discovery
├── debate/             # stage types, run state, orchestration skeleton
└── lib/                # shared formatting/errors utilities
```

### Pattern 1: Thin CLI, Typed Core
**What:** Keep argument parsing and terminal presentation in `cli/`, with the fixed debate sequence and app config rules in plain typed modules.
**When to use:** From the start.
**Example:**
```typescript
// Source: Commander docs + project recommendation
import { Command } from "commander"

export function buildProgram() {
  const program = new Command()

  program
    .name("debate")
    .description("Run a structured model-vs-model debate")
    .command("ask")
    .argument("<question>", "question to debate")
    .option("--debater-a <model>")
    .option("--debater-b <model>")
    .option("--judge <model>")
    .action(runAskCommand)

  return program
}
```

### Pattern 2: Debate Owns Role Defaults, OpenCode Owns Provider Config
**What:** Read provider/model availability from OpenCode, but persist Debate's role mapping in a separate Debate config file.
**When to use:** Always in Phase 1.
**Example:**
```typescript
// Source: OpenCode SDK docs for createOpencode/config APIs
import { createOpencode } from "@opencode-ai/sdk"

const opencode = await createOpencode()
const available = await opencode.client.config.providers()

// Debate config stays app-specific.
const debateConfig = {
  roles: {
    debaterA: "anthropic/claude-sonnet-4-5",
    debaterB: "openai/gpt-5",
    judge: "anthropic/claude-sonnet-4-5",
  },
}
```

### Pattern 3: Explicit Fixed Stage Sequence
**What:** Store the full stage order as code, not as implied control flow.
**When to use:** Immediately, before stage implementations exist.
**Example:**
```typescript
// Source: project requirement ORCH-07
export const DEBATE_STAGES = [
  "answer_a",
  "answer_b",
  "critique_a",
  "critique_b",
  "revise_a",
  "revise_b",
  "final_decision",
] as const

export type DebateStage = (typeof DEBATE_STAGES)[number]
```

### Pattern 4: Validate Config At Load Boundary
**What:** Parse disk config once with Zod and only expose typed data after validation.
**When to use:** For saved defaults and CLI override normalization.
**Example:**
```typescript
// Source: Zod docs
import { z } from "zod"

const DebateConfigSchema = z.object({
  roles: z.object({
    debaterA: z.string().min(1),
    debaterB: z.string().min(1),
    judge: z.string().min(1),
  }).refine((roles) => roles.debaterA !== roles.debaterB, {
    message: "Debater A and Debater B must be different models",
    path: ["debaterB"],
  }),
  firstRunHintShown: z.boolean().default(false),
})
```

### Anti-Patterns to Avoid
- **Do not store Debate role defaults inside `opencode.json`:** OpenCode config is for provider/runtime behavior; Debate roles are product state.
- **Do not infer stage order from scattered function calls:** the full ordered pipeline must be a single source of truth.
- **Do not implement first-run setup with ad hoc `stdin` handling:** use a prompt library for selection and validation.
- **Do not start Phase 1 by designing transcripts or judge schemas deeply:** those are later phases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenCode server lifecycle | custom child-process management around `opencode serve` | `createOpencode()` from `@opencode-ai/sdk` | Official API starts server and returns a typed client together |
| Model/provider discovery | custom parsing of OpenCode config files | `client.config.providers()` and `client.config.get()` | Uses the merged effective config, including global/project/inline precedence |
| CLI parsing/help | manual `process.argv` parsing | `commander` | Reduces boilerplate and gives clear help output |
| First-run setup prompts | raw `readline` wizard | `@inquirer/prompts` | Better selection UX and less fragile terminal code |
| Config validation | manual `JSON.parse` plus `if` chains | `zod` | Cleaner errors, defaults, and invariant checks |

**Key insight:** Phase 1 is mostly composition work. Nearly every tempting custom solution here already exists as a well-supported package or official OpenCode API.

## Common Pitfalls

### Pitfall 1: Mixing OpenCode Config With Debate App Config
**What goes wrong:** Role defaults get tangled with provider settings and become hard to validate or override.
**Why it happens:** Both are “config,” so they get merged conceptually.
**How to avoid:** Treat OpenCode config as external runtime input and Debate config as app-owned state.
**Warning signs:** The app starts reading or rewriting `opencode.json` just to store role assignments.

### Pitfall 2: Planning For Behavior Instead Of Skeleton
**What goes wrong:** Phase 1 balloons into prompt design, transcript persistence, and judge output parsing.
**Why it happens:** The stage names invite premature implementation.
**How to avoid:** Keep the Phase 1 orchestrator focused on typed stage sequencing and visible progress only.
**Warning signs:** New modules appear for critique prompts, transcript serialization, or winner parsing.

### Pitfall 3: Stale Saved Defaults Silently Falling Back
**What goes wrong:** The app appears to run, but a missing or renamed model is silently replaced.
**Why it happens:** It is convenient to “just use something.”
**How to avoid:** Resolve saved role models against `client.config.providers()` and fail fast into guided reconfiguration.
**Warning signs:** Missing models produce generic SDK errors later in the run.

### Pitfall 4: Hidden Stage Pipeline
**What goes wrong:** The user cannot tell what the tool is about to do, and later implementation changes break symmetry accidentally.
**Why it happens:** The stage sequence is only implied in code.
**How to avoid:** Define stage metadata once, including internal key, display label, and acting role.
**Warning signs:** UI labels and execution order are maintained in different places.

### Pitfall 5: Overbuilding First-Run UX
**What goes wrong:** The setup flow becomes a mini shell instead of a quick guided configuration.
**Why it happens:** CLI apps often accumulate interactive menus early.
**How to avoid:** Keep normal usage command-first and reserve prompts for missing/incomplete config.
**Warning signs:** Users must enter an interactive hub even when they already supplied a question.

## Code Examples

Verified patterns from official sources:

### Start OpenCode And Get A Typed Client
```typescript
// Source: https://opencode.ai/docs/sdk/
import { createOpencode } from "@opencode-ai/sdk"

const { client, server } = await createOpencode()

const health = await client.global.health()
console.log(health.data.version)

server.close()
```

### Connect To An Existing OpenCode Server
```typescript
// Source: https://opencode.ai/docs/sdk/
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
})
```

### Query Effective Provider/Model Config
```typescript
// Source: https://opencode.ai/docs/sdk/
const config = await client.config.get()
const providers = await client.config.providers()
```

### Interactive Role Setup
```typescript
// Source: Inquirer docs
import { select } from "@inquirer/prompts"

const debaterA = await select({
  message: "Choose Debater A",
  choices: modelChoices,
})
```

### Parse Config Safely
```typescript
// Source: Zod docs
const result = DebateConfigSchema.safeParse(rawConfig)

if (!result.success) {
  throw new Error(result.error.issues.map((issue) => issue.message).join("; "))
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| direct provider SDK integration per model vendor | OpenCode as the orchestration/runtime boundary | Current project decision | Phase 1 should not build provider abstractions |
| hand-rolled prompt/input loops | dedicated prompt package for setup flows | modern Node CLI practice | Faster implementation and better first-run UX |
| implicit workflow encoded in call order | explicit stage arrays/types and metadata | current project requirement | Easier testing and lower regression risk for ORCH-07 |

**Deprecated/outdated:**
- Older stack notes in `.planning/research/STACK.md` reference `@opencode-ai/sdk@0.1.0-alpha.21`; current npm version is `1.3.13`.
- Planning around a custom OpenCode child-process wrapper is outdated for this phase because `createOpencode()` already starts server and client together.

## Open Questions

1. **Where should Debate save its own role defaults?**
   - What we know: Debate needs saved defaults separate from OpenCode config.
   - What's unclear: Exact on-disk location has not been chosen.
   - Recommendation: Use a single app config file under a user config directory and keep the path helper tiny; do not introduce a broader storage system in Phase 1.

2. **Should the primary UX be `debate ask "..."` or bare `debate "..."`?**
   - What we know: The command should stay direct, readable, and tool-first.
   - What's unclear: Whether a subcommand is worth the extra word.
   - Recommendation: Plan around `debate ask "..."` because it keeps help text and future expansion clearer while still honoring the direct-command requirement.

3. **How much of the visible stage progress should be real execution versus placeholder in Phase 1?**
   - What we know: The stage sequence must be visible before stage-specific outputs are implemented.
   - What's unclear: Whether every stage should perform a no-op placeholder action or only be represented in state.
   - Recommendation: Represent every stage in typed state and progress rendering, but only wire the minimal run lifecycle needed to prove the skeleton exists.

## Sources

### Primary (HIGH confidence)
- `https://opencode.ai/docs/sdk/` - verified `createOpencode()`, `createOpencodeClient()`, config APIs, session APIs, and structured output guidance
- `https://opencode.ai/docs/config/` - verified config locations, precedence order, project-vs-global scope, and merged config behavior
- `https://opencode.ai/docs/models/` - verified model ID format and model-loading behavior
- `https://opencode.ai/docs/server/` - verified local server behavior and HTTP architecture
- `/anomalyco/opencode` via Context7 - verified code examples against current docs
- `/tj/commander.js` via Context7 - verified command/action/options patterns
- `/colinhacks/zod` via Context7 - verified `object`, `default`, `safeParse`, and validation patterns
- `/sboudrias/inquirer.js` via Context7 - verified modern `@inquirer/prompts` setup flow patterns

### Secondary (MEDIUM confidence)
- `npm view @opencode-ai/sdk version` - verified current published package version `1.3.13`
- `npm view commander version` - verified current published package version `14.0.3`
- `npm view zod version` - verified current published package version `4.3.6`
- `npm view tsx version` - verified current published package version `4.21.0`
- `npm view vitest version` - verified current published package version `4.1.2`
- `npm view @inquirer/prompts version engines` - verified current prompt package version `8.3.2` and modern Node engine support

### Tertiary (LOW confidence)
- Recommendation to keep the Debate config path helper dependency-free in Phase 1 - practical design judgment, not an official library rule

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official docs plus current npm package metadata
- Architecture: HIGH - directly driven by locked phase scope and SDK/config capabilities
- Pitfalls: MEDIUM - partly verified by docs, partly derived from predictable integration failure modes

**Research date:** 2026-04-04
**Valid until:** 2026-05-04
