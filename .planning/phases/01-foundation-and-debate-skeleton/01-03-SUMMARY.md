---
phase: 01-foundation-and-debate-skeleton
plan: 03
subsystem: orchestration
tags: [debate, orchestration, cli, opencode, progress]
requires:
  - phase: 01-02
    provides: runtime role config resolution and OpenCode startup helpers
provides:
  - Explicit fixed debate stage metadata and typed run state
  - Runnable ask flow that starts OpenCode and walks the skeleton stages
  - Progress and result rendering shaped for later winner-first output
affects: [phase-2-debaters, phase-3-transcripts, phase-4-judge]
tech-stack:
  added: []
  patterns: [explicit stage source of truth, result-first completion shell, close OpenCode in finally]
key-files:
  created: [src/debate/stages.ts, src/debate/state.ts, src/debate/run-debate.ts, src/cli/render.ts, src/cli/run-ask-command.ts, tests/debate/stages.test.ts, tests/debate/run-debate.test.ts]
  modified: [src/cli/program.ts, src/opencode/models.ts]
key-decisions:
  - "Expose the entire stage sequence before execution starts so the debate shape stays visible."
  - "Render a result-first completion shell now, but keep the decision explicitly pending until judge behavior exists."
patterns-established:
  - "Debate stage order lives in one metadata array shared by execution and rendering."
  - "OpenCode sessions always close in a finally block around the ask flow."
requirements-completed: [INPUT-01, ORCH-07]
duration: 5 min
completed: 2026-04-04
---

# Phase 01 Plan 03: Debate Skeleton Summary

**Fixed debate stage metadata, runnable skeleton orchestration, and progress-first CLI rendering with a pending decision result shell**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-04T02:04:37Z
- **Completed:** 2026-04-04T02:05:28Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Defined the full Phase 1 debate order in one shared stage metadata list.
- Replaced the placeholder `ask` action with the real role-resolution, OpenCode-startup, and stage-loop handler.
- Added deterministic tests for stage order, progress rendering, session cleanup, and one-time rerun hints.

## task Commits

Each task was committed atomically:

1. **task 1: define the explicit fixed debate stage metadata and state types** - `f998e17` (feat)
2. **task 2: wire the runnable skeleton ask flow and progress rendering** - `55bb18c` (feat)
3. **task 3: cover stage order and first-run completion behavior with tests** - included in `55bb18c` (feat)
4. **verification fix:** `080533c` (fix)

**Plan metadata:** pending

## Files Created/Modified
- `src/debate/stages.ts` - Declares the explicit stage order and stage labels.
- `src/debate/state.ts` - Defines the typed debate run state and stage status records.
- `src/debate/run-debate.ts` - Walks the fixed stage order and emits progress callbacks.
- `src/cli/render.ts` - Renders role summaries, the stage plan, progress lines, and the pending-decision completion shell.
- `src/cli/run-ask-command.ts` - Resolves config, starts OpenCode, runs the skeleton, persists the first-run marker, and closes the session.
- `src/cli/program.ts` - Wires the `ask` command to the real run handler.
- `tests/debate/stages.test.ts` - Guards stage order and required labels.
- `tests/debate/run-debate.test.ts` - Guards the ask-flow output shape, stage progress, cleanup, and first-run hint behavior.

## Decisions Made
- Keep transcript output hidden during the run and only mention transcript availability in the completion view.
- Mark the first-run hint as shown only after a successful configured run, so later runs stay lightweight.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Guard against missing provider data in the SDK response**
- **Found during:** plan verification
- **Issue:** The SDK response type allows `response.data` to be absent, which broke the TypeScript build.
- **Fix:** Added an explicit guard and a friendly OpenCode setup error in `listAvailableModels`.
- **Files modified:** `src/opencode/models.ts`
- **Verification:** `npm run build && npm run test -- --run tests/cli/program.test.ts tests/app/config.test.ts tests/opencode/models.test.ts tests/cli/resolve-run-config.test.ts tests/debate/stages.test.ts tests/debate/run-debate.test.ts`
- **Committed in:** `080533c`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix tightened the SDK boundary without changing the visible Phase 1 behavior.

## Issues Encountered
- The initial integration test accidentally opened the real prompt flow; the test was corrected to seed resolved config data instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 can now plug real prompt and response logic into each debate stage without redesigning the CLI shell.
- The app already exposes the symmetric stage order and role/model visibility needed for later debate behavior.

---
*Phase: 01-foundation-and-debate-skeleton*
*Completed: 2026-04-04*
