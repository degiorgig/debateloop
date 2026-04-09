---
phase: 03-transcript-persistence-and-inspection
plan: 01
subsystem: transcript-storage
tags: [transcript, persistence, schema, paths]
requires:
  - phase: 02-03
    provides: typed stage results, fixed stage order, and tested debate runner boundaries
provides:
  - Stable transcript record schema for one saved debate run
  - App-local transcript run path helpers
  - File IO helpers for saving and loading transcript records
affects: [phase-3-persistence, phase-3-inspection, phase-5-reliability]
tech-stack:
  added: []
  patterns: [one-json-record-per-run, explicit stage-array schema, app-local run storage]
key-files:
  created: [src/debate/transcript.ts]
  modified: [src/app/paths.ts, src/debate/state.ts]
key-decisions:
  - "Persist one structured JSON record per debate run instead of introducing a database or event-log abstraction in v1."
  - "Keep the transcript record as the source of truth and make later CLI inspection derive from it."
patterns-established:
  - "Transcript storage lives under the app config directory in a dedicated runs directory."
  - "The transcript schema stores run metadata and an explicit ordered stage array."
requirements-completed: [TRNS-01]
duration: 3 min
completed: 2026-04-05
---

# Phase 03 Plan 01: Transcript Storage Summary

**Stable file-backed transcript schema and run-path helpers for one inspectable JSON record per debate execution**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T01:25:00Z
- **Completed:** 2026-04-05T01:28:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Added a dedicated transcript module that defines one durable transcript record per debate run.
- Extended app path helpers with a transcript runs directory and deterministic per-run file paths.
- Expanded debate stage result typing to support persisted prompt context, timing, placeholder, and error metadata.

## task Commits

Executed inline in this orchestration run; no git commit was created.

## Files Created/Modified
- `src/debate/transcript.ts` - Defines transcript record types and read/write helpers.
- `src/app/paths.ts` - Adds transcript run directory and run-path resolution helpers.
- `src/debate/state.ts` - Expands per-stage result metadata to match persisted transcript needs.

## Decisions Made
- Use app-local JSON files as the v1 persistence layer because they satisfy durability and inspection requirements without schema/migration overhead.
- Store stage order explicitly in the transcript record rather than reconstructing it from logs or stage keys later.

## Deviations from Plan

None - plan executed as intended.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness
- The runner can now persist to a stable transcript shape without redesigning storage later in the phase.

---
*Phase: 03-transcript-persistence-and-inspection*
*Completed: 2026-04-05*

## Self-Check: PASSED
