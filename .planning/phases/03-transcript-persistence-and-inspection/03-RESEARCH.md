# Phase 3: Transcript Persistence And Inspection - Research

**Researched:** 2026-04-05
**Domain:** Debate transcript persistence and CLI inspection in a TypeScript OpenCode app
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Each saved transcript record should represent one complete debate run.
- Run metadata must include the original question and the exact Debater A, Debater B, and Judge model IDs.
- Each saved stage entry should include both input and output, not output only.
- Stage order should be stored explicitly rather than inferred later.
- Transcript inspection should default to ordered stage sections, not a raw JSON dump.
- Each stage should show full saved stage text by default with inline metadata.
- Missing later-stage content in v1 should still appear as visible placeholders.
- Persist failed stages and their errors in the same transcript record flow as successful stages.
- Save basic stage timing and OpenCode session IDs as debug metadata.
- The structured transcript record should be the source of truth; inspection output should be derived from it.

### OpenCode's Discretion
- Exact field names and on-disk JSON schema layout.
- Exact formatting of the inspection report.
- Exact placeholder wording for unimplemented later stages.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRNS-01 | System persists each debate stage with role, prompt context, and output content | Stable per-run JSON record, explicit stage entries, incremental writes after each stage transition, persisted prompt/system strings, output metadata, and failure/error capture |
| TRNS-02 | User can inspect the full debate transcript after a run completes | Add a CLI inspection command that reads the structured record and renders ordered stage sections with metadata and placeholders |
</phase_requirements>

## Summary

The current codebase already has the right execution choke point for transcript persistence: `runDebate()` owns the ordered stage loop, stage status transitions, and the exact prompt payloads sent to OpenCode. That means Phase 3 should not add a second event system. The minimal correct move is to define one durable transcript record per run, update it from the existing stage loop, and expose a separate CLI inspection command that reads the saved record.

The repo also already has a stable app-specific config directory helper. Reusing that app directory for transcript storage keeps the feature self-contained and avoids introducing deployment or database work before it is needed. A simple `runs/` directory with one JSON file per run is enough for v1 because the transcript is both human-debuggable and machine-readable.

The key implementation detail is to capture prompt context at the same place the model prompt is built, not by reconstructing it later from stage results. For answer and critique stages, the persisted record should store the shared system framing, the exact prompt text, the actor model, and the assistant output plus metadata such as session ID, provider/model IDs, and timestamps. For revise/judge stages that are still placeholders, the record should still contain visible stage entries with an explicit placeholder note so the saved transcript preserves the fixed stage structure.

The user-facing inspection command should stay intentionally narrow: load one run by ID and render a structured report in stage order. That satisfies the requirement to inspect a completed transcript without prematurely building transcript search, listing, or alternate surfaces.

**Primary recommendation:** Add a file-backed transcript module, persist the record directly inside `runDebate()` on every stage transition and error, and expose `debate inspect <run-id>` as the first human-facing inspection path.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.x | Typed transcript schema and runner updates | Already used throughout the repo |
| Node `fs/promises` | built-in | Durable transcript writes and reads | No new dependency needed for local JSON persistence |
| Commander | 14.0.3 | Add a dedicated `inspect` CLI command | Existing command surface already uses Commander |
| Vitest | 4.1.2 | Persistence and inspection tests | Existing test runner and mocking setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON file per run in app directory | SQLite or embedded DB | More query power, but unnecessary schema and migration cost for Phase 3 |
| Rendering from in-memory run state only | Saving no transcript record and showing richer end-of-run output | Fails the durability/debugging requirement and blocks later phases |
| A generic event log | A normalized transcript record with explicit stage array | Event log is flexible but harder for users to inspect and harder for later phases to consume directly |

## Architecture Patterns

### Pattern 1: One Structured Record Per Debate Run
**What:** Save a single JSON file that contains run metadata plus an explicit ordered array of stage records.
**Why:** Matches the user decision that the transcript should serve both humans and future tooling.

### Pattern 2: Incremental Persistence From The Existing Stage Loop
**What:** Write the transcript record before execution, when each stage starts, after each stage completes, and again on failure.
**Why:** Keeps intermediate state available for debugging instead of only the final answer.

### Pattern 3: Derived Inspection View
**What:** Keep the JSON record as source of truth and derive the terminal report from it.
**Why:** Preserves schema stability while allowing the CLI presentation to evolve.

### Anti-Patterns To Avoid
- Reconstructing stage prompts later instead of persisting the exact prompt/system values used during execution.
- Saving only final answer text with no per-stage metadata.
- Treating failed runs as a separate storage path or shape.
- Building transcript listing/filtering features before the single-run inspection path exists.

## Common Pitfalls

### Pitfall 1: Marking stages complete before the transcript is flushed
Persist after each state transition so the on-disk record stays useful if a later stage fails.

### Pitfall 2: Losing the exact prompt context
Store the final `system` and `prompt` strings that were actually sent to OpenCode, not only a higher-level description.

### Pitfall 3: Hiding unimplemented stages entirely
The inspection view should still show revise/judge placeholders so the stage structure stays explicit in v1.

### Pitfall 4: Coupling inspection to execution internals
The inspect command should read the saved record and render it; it should not need access to live runner objects.

## Recommended Project Structure

```text
src/
├── app/paths.ts                  # app storage paths, now including transcript runs
├── debate/transcript.ts          # transcript record schema + file IO helpers
├── debate/run-debate.ts          # stage-loop persistence updates
├── cli/run-inspect-command.ts    # inspect command handler
├── cli/render.ts                 # transcript completion + inspection rendering
└── cli/program.ts                # inspect command wiring
```

## Metadata

**Confidence breakdown:**
- Storage approach: HIGH
- Runner integration point: HIGH
- CLI inspection scope: HIGH

**Research date:** 2026-04-05
**Valid until:** 2026-05-05
