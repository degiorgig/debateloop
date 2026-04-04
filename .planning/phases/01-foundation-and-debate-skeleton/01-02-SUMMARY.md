---
phase: 01-foundation-and-debate-skeleton
plan: 02
subsystem: config
tags: [opencode, zod, config, cli, setup]
requires:
  - phase: 01-01
    provides: direct CLI entrypoint and test harness
provides:
  - Debate-owned persisted role defaults
  - OpenCode startup and model availability helpers
  - Saved-default plus override runtime config resolution
affects: [debate-runner, rendering, first-run ux]
tech-stack:
  added: []
  patterns: [app-owned config boundary, provider-model validation before runs, guided repair flow for stale config]
key-files:
  created: [src/app/paths.ts, src/app/config.ts, src/opencode/client.ts, src/opencode/models.ts, src/cli/setup.ts, src/cli/resolve-run-config.ts, tests/app/config.test.ts, tests/opencode/models.test.ts, tests/cli/resolve-run-config.test.ts]
  modified: []
key-decisions:
  - "Persist Debate role assignments separately from OpenCode configuration."
  - "Repair missing or stale role config through prompts instead of silently falling back to another model."
patterns-established:
  - "Runtime model resolution happens before any debate stage execution."
  - "Debater A and Debater B uniqueness is enforced at the config boundary."
requirements-completed: [INPUT-02, INPUT-03]
duration: 4 min
completed: 2026-04-04
---

# Phase 01 Plan 02: Config And OpenCode Summary

**App-owned role config, OpenCode startup wrappers, and guided runtime model resolution for Debater A, Debater B, and Judge**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-04T02:03:23Z
- **Completed:** 2026-04-04T02:03:48Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added Debate's own config schema and persistence layer for role defaults plus the first-run marker.
- Wrapped OpenCode startup and model discovery behind focused helpers that validate provider/model availability.
- Implemented the first-run and stale-config setup flow, including one-run role overrides.

## task Commits

Each task was committed atomically:

1. **task 1: implement Debate-owned config persistence and validation** - `6160a99` (feat)
2. **task 2: add OpenCode startup and model availability helpers** - `8bbadf7` (feat)
3. **task 3: resolve saved defaults, per-run overrides, and guided setup** - `872add2` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `src/app/paths.ts` - Resolves the Debate config directory and config file path.
- `src/app/config.ts` - Loads, validates, and saves Debate-owned role defaults.
- `src/opencode/client.ts` - Starts OpenCode with friendly startup errors and a close boundary.
- `src/opencode/models.ts` - Flattens available provider models and validates requested role assignments.
- `src/cli/setup.ts` - Prompts for role selections when setup is missing or stale.
- `src/cli/resolve-run-config.ts` - Combines saved defaults, overrides, and availability checks into an active run config.
- `tests/app/config.test.ts` - Covers config validation and persistence.
- `tests/opencode/models.test.ts` - Covers provider/model flattening and missing-model errors.
- `tests/cli/resolve-run-config.test.ts` - Covers guided setup, overrides, and stale-config repair.

## Decisions Made
- Keep Debate configuration limited to role defaults and first-run UI state rather than mutating OpenCode config files.
- Treat missing and stale role assignments as guided setup events so the run never starts with an ambiguous fallback model.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The ask command can now resolve a valid active model set before execution begins.
- The final Phase 1 plan can wire these helpers into the visible debate skeleton run.

---
*Phase: 01-foundation-and-debate-skeleton*
*Completed: 2026-04-04*
