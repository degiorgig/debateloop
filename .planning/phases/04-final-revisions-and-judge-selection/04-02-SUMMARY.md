---
phase: 04-final-revisions-and-judge-selection
plan: 02
subsystem: judge-validation
tags: [judge, zod, validation, orchestration]
requires:
  - phase: 04-01
    provides: real revised answers persisted in state and transcript
provides:
  - Structured judge verdict schema and parser
  - Real final_decision execution against revised answers
  - Clear malformed-judge failure path
affects: [cli-completion, reliability, transcript-ux]
tech-stack:
  added: []
  patterns: [json-only-judge-contract, zod-safe-parse, validated-completion-payload]
key-files:
  created: [src/debate/judge.ts, tests/debate/judge.test.ts]
  modified: [src/debate/prompts.ts, src/debate/run-debate.ts, tests/debate/run-debate.test.ts]
key-decisions:
  - "Judge output must be validated immediately after the model response instead of being reparsed later in the CLI."
  - "The accepted verdict contract should always include exactly one winner and a short rationale."
patterns-established:
  - "Structured model output validation follows the same Zod safeParse pattern already used by app config parsing."
  - "Completion payloads can now carry validated judge data directly to the CLI layer."
requirements-completed: [JUDGE-01, JUDGE-02, JUDGE-03]
duration: 5 min
completed: 2026-04-05
---

# Phase 04 Plan 02: Judge Validation Summary

**Validated judge contract and real final decision execution, with explicit failure on malformed model output**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-05T02:06:00Z
- **Completed:** 2026-04-05T02:11:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `JudgeVerdictSchema` and `parseJudgeVerdict()` in a dedicated `src/debate/judge.ts` module.
- Added a JSON-only judge prompt that compares revised answers using the locked rubric priorities.
- Updated `runDebate()` so `final_decision` runs in a fresh session, validates output immediately, and returns winner/rationale in the completion payload.
- Added tests for valid verdicts, malformed JSON, invalid enum values, and judge-stage failure reporting.

## task Commits

Executed inline in this orchestration run; no git commit was created.

## Files Created/Modified
- `src/debate/judge.ts` - Zod-backed judge verdict schema and parser.
- `src/debate/prompts.ts` - Judge prompt builder for revised-answer comparison.
- `src/debate/run-debate.ts` - Validates the judge response and exposes winner data to the caller.
- `tests/debate/judge.test.ts` - Parser validation coverage.
- `tests/debate/run-debate.test.ts` - Judge execution and malformed-output failure coverage.

## Decisions Made
- Keep the raw judge response in transcript output while surfacing the parsed verdict separately for deterministic CLI rendering.
- Fail the run with a clear error if the judge output is malformed instead of guessing a winner.

## Deviations from Plan

None - plan executed as intended.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness
- The CLI now has validated winner data and no longer needs to infer a decision from free-form transcript text.

---
*Phase: 04-final-revisions-and-judge-selection*
*Completed: 2026-04-05*

## Self-Check: PASSED
