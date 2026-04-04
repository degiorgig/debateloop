---
phase: 02-independent-answers-and-critiques
plan: 01
subsystem: orchestration
tags: [debate, opencode, prompts, sessions, state]
requires:
  - phase: 01-03
    provides: fixed debate stage order, runnable ask flow, and typed run state shell
provides:
  - Shared debate framing and distinct opening-answer role briefs
  - Typed stage result storage for answer content and session metadata
  - Isolated SDK-backed opening-answer execution that preserves Debater B independence
affects: [phase-2-critiques, phase-3-transcripts, phase-4-judge]
tech-stack:
  added: []
  patterns: [fresh SDK session per opening answer, typed stage result records, SDK model ref normalization]
key-files:
  created: [src/debate/prompts.ts]
  modified: [src/debate/state.ts, src/debate/run-debate.ts, src/opencode/models.ts, src/cli/render.ts, src/cli/run-ask-command.ts, tests/debate/run-debate.test.ts, tests/opencode/models.test.ts]
key-decisions:
  - "Use a fresh OpenCode session for each opening-answer stage so independence is enforced by session boundaries, not prompt discipline alone."
  - "Persist stage outputs as typed result records so later critique and transcript phases can reuse answer content without redesigning run state."
patterns-established:
  - "Opening-answer stages create isolated SDK sessions and store text-only assistant output in stage results."
  - "Provider/model strings are converted once at the SDK boundary into providerID/modelID refs."
requirements-completed: [ORCH-01, ORCH-02]
duration: 1 min
completed: 2026-04-04
---

# Phase 02 Plan 01: Independent Opening Answers Summary

**Isolated SDK-backed opening answers with shared debate framing, distinct debater briefs, and typed stage results for later critique stages**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-04T22:27:57Z
- **Completed:** 2026-04-04T22:29:02Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added a dedicated debate prompt module with one shared framing block and distinct Debater A and Debater B opening-answer briefs.
- Extended debate state to keep typed per-stage results, including answer content and session IDs needed by later phases.
- Ran the opening-answer flow through real OpenCode session calls while preserving Debater B's blindness to Debater A before critique begins.

## task Commits

Each task was committed atomically:

1. **task 1: add prompt builders and typed stage results for opening answers** - `6feb7f7` (feat)
2. **task 2: execute answer_a and answer_b through isolated OpenCode sessions** - `d5c7496` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `src/debate/prompts.ts` - Defines shared framing plus role-specific opening-answer and critique prompt builders.
- `src/debate/state.ts` - Adds typed stage result storage for session metadata and generated content.
- `src/debate/run-debate.ts` - Executes answer stages through OpenCode sessions, extracts assistant text, and stores results in run state.
- `src/opencode/models.ts` - Normalizes provider/model IDs into the SDK ref shape used by session prompts.
- `src/cli/render.ts` - Adds explicit independence messaging for the opening-answer portion of the run.
- `src/cli/run-ask-command.ts` - Passes the OpenCode session client into the debate runner and renders the independence note.
- `tests/debate/run-debate.test.ts` - Verifies isolated opening prompts and stored answer outputs.
- `tests/opencode/models.test.ts` - Verifies the SDK model ref conversion shape.

## Decisions Made
- Use fresh SDK sessions for opening answers instead of a shared conversation so independence is guaranteed structurally.
- Store generated stage content on each stage record now so critique and transcript work can build on typed state instead of ad hoc locals.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Normalize model refs to the SDK session prompt shape**
- **Found during:** task 2 (execute answer_a and answer_b through isolated OpenCode sessions)
- **Issue:** `session.prompt()` expects `{ providerID, modelID }`, but the existing helper returned lower-case keys that would break real prompt execution.
- **Fix:** Updated `toSdkModelRef()` to return the SDK's expected key names and aligned its test coverage.
- **Files modified:** `src/opencode/models.ts`, `tests/opencode/models.test.ts`
- **Verification:** `npm run test -- --run tests/debate/run-debate.test.ts && npm run build`
- **Committed in:** `d5c7496` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to make real session-backed answer generation work and did not change the plan's intended behavior.

## Issues Encountered
- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Opening answers now exist as typed stage outputs, so critique prompts can consume them directly in 02-02.
- The CLI already surfaces the opening-answer independence promise, reducing ambiguity before critique behavior expands.

---
*Phase: 02-independent-answers-and-critiques*
*Completed: 2026-04-04*

## Self-Check: PASSED
