---
phase: 02-independent-answers-and-critiques
plan: 03
subsystem: testing
tags: [debate, vitest, independence, prompts, stage-order]
requires:
  - phase: 02-02
    provides: executed answer and critique stages plus visible independence messaging
provides:
  - Regression tests that fail if Debater B's opening prompt receives Debater A's answer
  - Regression tests that fail if critique prompts stop receiving both opening answers
  - Stage metadata coverage for the fixed visible order and actor mapping
affects: [phase-3-transcripts, phase-4-revisions, phase-5-reliability]
tech-stack:
  added: []
  patterns: [mocked session call capture for prompt-boundary assertions, stage-metadata regression checks, end-to-end run-state verification through runAskCommand]
key-files:
  created: []
  modified: [tests/debate/run-debate.test.ts, tests/debate/stages.test.ts]
key-decisions:
  - "Capture every mocked session.create and session.prompt call so prompt-boundary regressions fail at the call payload level, not only in final state assertions."
  - "Keep phase coverage focused on tests by verifying visible independence messaging and completed stage state through the existing CLI runner instead of adding new production code."
patterns-established:
  - "Opening-answer tests assert question-only independence boundaries before any shared critique context appears."
  - "Phase behavior tests validate both visible user messaging and stored stage results to keep orchestration guarantees durable."
requirements-completed: [ORCH-01, ORCH-02, ORCH-03, ORCH-04]
duration: 1 min
completed: 2026-04-04
---

# Phase 02 Plan 03: Stage Order And Independence Coverage Summary

**Regression coverage for answer-stage isolation, critique-stage shared context, and the fixed visible debate stage contract**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-04T22:42:47Z
- **Completed:** 2026-04-04T22:44:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Locked opening-answer prompt boundaries down by capturing every mocked session call and asserting Debater B never receives Debater A's answer.
- Added critique-context assertions that require both opening answers to be present with the correct actor/opponent arrangement.
- Preserved the visible stage contract with tests for stage order, actor mapping, the CLI independence note, and completed Phase 2 run state.

## task Commits

Each task was committed atomically:

1. **task 1: add boundary tests for opening answers versus critiques** - `7bed511` (test)
2. **task 2: keep the visible stage contract and phase behavior green end-to-end** - `f46951d` (test)

**Plan metadata:** pending

## Files Created/Modified
- `tests/debate/run-debate.test.ts` - Captures session payloads, checks answer isolation, verifies critique context, and covers visible Phase 2 run behavior.
- `tests/debate/stages.test.ts` - Guards the fixed stage order, labels, and actor-role mapping.

## Decisions Made
- Capture mocked OpenCode session payloads directly so independence regressions fail on prompt inputs, not just downstream outputs.
- Reuse the CLI entrypoint test path to verify the visible independence note and completed stage state without expanding production surface area.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `python` was unavailable in the shell while checking for checkpoints, so execution proceeded from the already-loaded plan file content instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 now has direct regression coverage for its independence and critique-context contract.
- Phase 3 can build transcript persistence on top of a test-locked answer/critique boundary.

---
*Phase: 02-independent-answers-and-critiques*
*Completed: 2026-04-04*

## Self-Check: PASSED
