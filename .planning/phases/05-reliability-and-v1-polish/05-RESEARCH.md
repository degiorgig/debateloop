# Phase 5 Research: Reliability And v1 Polish

## What exists already

- `src/debate/run-debate.ts` already persists a transcript before the first stage and after each stage transition.
- Failed runs already keep prior completed stage outputs on disk and mark the active stage as failed.
- `debate inspect` already renders stage-by-stage transcript detail, including stored prompts, outputs, and stage errors.
- The current test suite covers the happy path, malformed judge output, and a non-retryable model failure during `answer_b`.

## Gaps that matter for planning

### 1. Retry and timeout behavior is missing

- `runModelStage` performs one `session.create` and one `session.prompt` call with no retry policy.
- There is no timeout boundary around a stage prompt.
- The CLI does not expose when a retry is happening.

### 2. Failure UX is still too raw

- Stage failures are thrown as plain errors from the engine.
- `runAskCommand` closes OpenCode correctly, but it does not convert engine failures into a stage-aware user-facing summary.
- Users can inspect partial transcripts today, but the failure path does not point them there explicitly.

### 3. Partial transcripts are preserved but not clearly labeled as partial artifacts

- Transcript JSON stores `status: failed` and top-level `error`, but does not explicitly record `failedStage`.
- Inspection output shows stage-level errors, but it does not summarize that the transcript is a preserved partial run or how many stages completed.
- Transcript writes use direct overwrite instead of temp-file + rename.

### 4. Reliability configuration is not user-configurable

- `DebateConfigSchema` only stores role defaults and the first-run hint flag.
- There is no place to keep conservative retry/timeout defaults for future runs.

### 5. End-to-end reliability coverage is short of the phase bar

- Existing tests do not verify retry behavior.
- Existing CLI tests do not verify a failed `debate ask` message that names the failed stage and points users to `debate inspect`.
- Existing inspect tests do not verify partial-run labeling.

## Recommended implementation shape

### Reliability model

- Add a small `reliability` config block with conservative defaults.
- Keep defaults low-risk for v1:
  - `maxStageAttempts: 3`
  - `stageTimeoutMs: 30000`
  - `retryBackoffMs: 750`
- Restrict auto-retry to clearly transient/provider-style failures and timeouts.

### Runtime behavior

- Wrap stage prompt execution in a bounded retry loop.
- Emit a retry callback from `runDebate` so the CLI can log visible retry messages without mixing rendering into engine code.
- Convert final unrecovered failures into a stage-aware execution error object that carries:
  - stage key
  - stage label
  - actor model
  - attempt count
  - transcript id/path

### Transcript integrity

- Keep persisting before stage execution and after each stage outcome.
- Add `failedStage` to transcript metadata.
- Store final `attemptCount` per stage result/output when useful.
- Write transcript files atomically via temp-file + rename.

### CLI polish

- Add a dedicated failure renderer that leads with:
  - which stage failed
  - which model was running
  - the failure reason
  - partial transcript id/path
  - `debate inspect <run-id>` next step
- Update inspect rendering to explicitly call failed transcripts partial/preserved artifacts.

## Validation Architecture

### Automated checks

- Targeted Vitest coverage for config defaults, retry behavior, failed transcript metadata, and failure rendering.
- TypeScript build check.

### Must-have scenarios

1. Happy path still succeeds unchanged.
2. Retryable provider failure retries and succeeds without corrupting stage order.
3. Non-retryable provider failure stops immediately and preserves earlier completed stages.
4. CLI failure output names the failed stage and points to transcript inspection.
5. `debate inspect` marks failed runs as preserved partial transcripts.

## Planning implications

- Plan 05-01 should own engine retry/timeout behavior plus CLI-visible retry/failure surfaces.
- Plan 05-02 should own transcript durability and partial-run inspection clarity.
- Plan 05-03 should own end-to-end and edge-case test coverage for the full reliability slice.
