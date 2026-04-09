---
phase: 04-final-revisions-and-judge-selection
plan: 03
subsystem: cli
tags: [cli, rendering, verdict, ux]
requires:
  - phase: 04-02
    provides: validated judge verdict and winning revised answer mapping
provides:
  - Winner-first completion rendering
  - Ask-command wiring from validated verdict to terminal output
  - Focused output tests for losing-answer suppression
affects: [user-experience, transcript-ux, phase-5-polish]
tech-stack:
  added: []
  patterns: [winner-first-output, validated-render-input, inspect-command-followthrough]
key-files:
  created: [tests/cli/render.test.ts]
  modified: [src/cli/render.ts, src/cli/run-ask-command.ts, tests/debate/run-debate.test.ts]
key-decisions:
  - "Default completion output should show only the winning revised answer while keeping full transcript inspection as the path to the rest of the debate."
  - "The CLI should consume validated judge data from the runner instead of re-deriving the winner from transcript text."
patterns-established:
  - "Completion rendering is now driven by an optional structured decision object."
  - "Inspectability stays available in the final output even when the default view hides the losing answer."
requirements-completed: [TRNS-03]
duration: 4 min
completed: 2026-04-05
---

# Phase 04 Plan 03: Winner-First Rendering Summary

**Final terminal output now leads with the winner, short rationale, and winning revised answer while keeping transcript inspection one command away**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T02:11:00Z
- **Completed:** 2026-04-05T02:15:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Updated `renderCompletion()` to show the winning debater, exact model id, winning revised answer, and short rationale by default.
- Updated `runAskCommand()` to pass the validated decision through to the renderer.
- Added focused render tests and end-to-end ask-flow assertions that ensure the losing revised answer is hidden from default output.

## task Commits

Executed inline in this orchestration run; no git commit was created.

## Files Created/Modified
- `src/cli/render.ts` - Winner-first completion rendering.
- `src/cli/run-ask-command.ts` - Passes validated verdict data into the renderer.
- `tests/cli/render.test.ts` - Verifies winner-first output and losing-answer suppression.
- `tests/debate/run-debate.test.ts` - Verifies ask-flow rendering and transcript pointers.

## Decisions Made
- Preserve the existing transcript id, path, and `debate inspect` command in the final output so the winning-answer view stays concise without harming inspectability.
- Keep the rationale short by default in the renderer instead of adding a separate verbose verdict section.

## Deviations from Plan

None - plan executed as intended.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness
- Phase 5 can now focus on reliability and failure handling on top of a complete end-to-end debate result flow.

---
*Phase: 04-final-revisions-and-judge-selection*
*Completed: 2026-04-05*

## Self-Check: PASSED
