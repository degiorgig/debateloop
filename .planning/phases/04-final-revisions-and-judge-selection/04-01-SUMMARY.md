---
phase: 04-final-revisions-and-judge-selection
plan: 01
subsystem: debate-runner
tags: [revision, prompts, orchestration, transcript]
requires:
  - phase: 03-03
    provides: transcript persistence, inspectability, and completion rendering entrypoints
provides:
  - Real revise_a and revise_b model execution
  - Revision prompts grounded in opening answer plus opponent critique
  - Transcript/state coverage for completed revision stages
affects: [phase-4-judge, transcript-ux, debate-quality]
tech-stack:
  added: []
  patterns: [fresh-session-per-stage, critique-aware-revision-prompts, stored-stage-reuse]
key-files:
  created: []
  modified: [src/debate/prompts.ts, src/debate/run-debate.ts, tests/debate/run-debate.test.ts]
key-decisions:
  - "Revision prompts should force balanced rewrites that address critique directly without collapsing both debaters into the same voice."
  - "Revision stages should use fresh OpenCode sessions just like earlier debate stages so symmetry stays explicit."
patterns-established:
  - "Revision stages consume prior stage content through required stage lookups before prompting models."
  - "Transcript records now store real revision prompts and outputs instead of placeholder entries."
requirements-completed: [ORCH-05, ORCH-06]
duration: 6 min
completed: 2026-04-05
---

# Phase 04 Plan 01: Final Revision Stages Summary

**Real final revision execution for both debaters, with prompts that use each opening answer plus the opposing critique**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-05T02:00:00Z
- **Completed:** 2026-04-05T02:06:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `buildRevisionPrompt()` so each debater gets a critique-aware final-revision prompt with explicit voice-preservation and balanced-rewrite guidance.
- Replaced `revise_a` and `revise_b` placeholders with real model-backed stage execution in `runDebate()`.
- Expanded debate runner tests so revision prompts and persisted outputs are verified from the actual stage loop.

## task Commits

Executed inline in this orchestration run; no git commit was created.

## Files Created/Modified
- `src/debate/prompts.ts` - Adds the balanced revision prompt builder.
- `src/debate/run-debate.ts` - Executes `revise_a` and `revise_b` as real dependent stages.
- `tests/debate/run-debate.test.ts` - Verifies revision prompts, sessions, and saved outputs.

## Decisions Made
- Keep revision prompt logic in `prompts.ts` beside answer and critique builders so debate-stage prompting stays centralized.
- Require revision stages to read both the actor's opening answer and the opponent critique before execution to preserve the point of the critique round.

## Deviations from Plan

None - plan executed as intended.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness
- The judge stage can now compare real revised answers instead of placeholders.

---
*Phase: 04-final-revisions-and-judge-selection*
*Completed: 2026-04-05*

## Self-Check: PASSED
