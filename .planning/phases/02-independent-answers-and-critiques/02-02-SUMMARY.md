---
phase: 02-independent-answers-and-critiques
plan: 02
subsystem: orchestration
tags: [debate, critiques, prompts, cli, tests]
requires:
  - phase: 02-01
    provides: isolated opening answers, typed stage results, and session-backed stage execution
provides:
  - Symmetric critique prompts that include both opening answers with actor-specific framing
  - Executed critique_a and critique_b stages that persist critique results in debate state
  - CLI messaging that explicitly says opening answers were generated independently before critique
affects: [phase-2-tests, phase-3-transcripts, phase-4-revisions]
tech-stack:
  added: []
  patterns: [comparative critique prompts with both answers, critique-stage reuse of stored stage content, visible CLI independence messaging]
key-files:
  created: []
  modified: [src/debate/prompts.ts, src/debate/run-debate.ts, src/cli/render.ts, tests/debate/run-debate.test.ts]
key-decisions:
  - "Critique prompts include both opening answers plus actor/opponent framing so each debater compares positions directly instead of writing a generic follow-up."
  - "Revise and judge stages remain placeholders while critique stages become the first shared-context boundary in the loop."
patterns-established:
  - "Answer stages stay isolated from prior debate content, while critique stages explicitly consume both stored opening answers."
  - "CLI output states product guarantees like answer independence at the transition where shared context begins."
requirements-completed: [ORCH-03, ORCH-04]
duration: 3 min
completed: 2026-04-04
---

# Phase 02 Plan 02: Cross-Critique Execution Summary

**Symmetric cross-critiques with both opening answers in prompt context and explicit CLI messaging about independent opening generation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-04T22:36:25Z
- **Completed:** 2026-04-04T22:40:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added a stronger critique prompt builder that preserves debater-specific voice while making each critique directly compare the two opening answers.
- Executed `critique_a` and `critique_b` inside `runDebate` using stored opening answers and persisted the critique outputs on stage state.
- Updated CLI and tests so the user sees the independence promise before critique begins and the answer-to-critique boundary stays locked down.

## task Commits

Each task was committed atomically:

1. **task 1: add symmetric critique prompt builders with both opening answers** - `8943942` (feat)
2. **task 2: execute critique_a and critique_b and expose independence messaging** - `673f61e` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `src/debate/prompts.ts` - Builds actor-aware critique prompts that include the question plus both opening answers.
- `src/debate/run-debate.ts` - Runs critique stages after both answers exist and stores critique content back onto stage results.
- `src/cli/render.ts` - Renders explicit messaging that the opening answers were generated independently before critique starts.
- `tests/debate/run-debate.test.ts` - Verifies opening-answer isolation and critique-stage shared context for both debaters.

## Decisions Made
- Use actor/opponent labels inside critique prompts so both debaters receive the same comparative structure without losing role-specific voice.
- Keep revise and judge stages placeholder-only in this plan so Phase 2 completes the answer-to-critique loop without pulling Phase 4 work forward.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The core symmetric answer-then-critique loop is now implemented and test-covered.
- Phase 02-03 can focus on broader stage-order and independence-boundary testing without needing more critique execution work.

---
*Phase: 02-independent-answers-and-critiques*
*Completed: 2026-04-04*

## Self-Check: PASSED
