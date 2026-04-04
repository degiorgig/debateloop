---
phase: 01-foundation-and-debate-skeleton
plan: 01
subsystem: cli
tags: [typescript, node, commander, vitest, cli]
requires: []
provides:
  - Runnable Node 20 TypeScript CLI foundation
  - Direct `debate ask <question>` command surface
  - Parsing tests for the Phase 1 CLI contract
affects: [config, debate-runner, testing]
tech-stack:
  added: [typescript, tsx, vitest, commander, zod, @inquirer/prompts, @opencode-ai/sdk]
  patterns: [thin CLI bootstrap, direct command entrypoint, focused command parsing tests]
key-files:
  created: [package.json, tsconfig.json, vitest.config.ts, src/index.ts, src/cli/program.ts, tests/cli/program.test.ts]
  modified: [package-lock.json]
key-decisions:
  - "Use `debate ask <question>` as the primary direct command instead of an app-first shell."
  - "Keep the initial ask handler minimal until later plans wire real config and execution logic."
patterns-established:
  - "Commander owns command parsing and help text."
  - "The built CLI entrypoint resolves from dist/index.js."
requirements-completed: [INPUT-01]
duration: 6 min
completed: 2026-04-04
---

# Phase 01 Plan 01: CLI Foundation Summary

**Node 20 ESM CLI bootstrap with a direct `ask` command, readable role flags, and parsing tests for Debate's terminal entrypoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-04T01:59:50Z
- **Completed:** 2026-04-04T02:01:05Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Bootstrapped the package, TypeScript compiler, and Vitest runner for a Node 20 CLI app.
- Added the first real `debate ask <question>` command with long-form role override flags.
- Locked the command parsing and help-text contract with focused tests.

## task Commits

Each task was committed atomically:

1. **task 1: bootstrap the Node ESM TypeScript toolchain** - `c4e2e31` (chore)
2. **task 2: create the direct ask command entrypoint** - `4a07105` (feat)
3. **task 3: lock in CLI parsing behavior with tests** - `7d4021b` (test)

**Plan metadata:** pending

## Files Created/Modified
- `package.json` - Defines the Debate CLI package, scripts, and runtime dependencies.
- `tsconfig.json` - Configures strict NodeNext TypeScript output for the distributable CLI.
- `vitest.config.ts` - Sets the project test runner to Node.
- `src/index.ts` - Boots the Commander program from the CLI entrypoint.
- `src/cli/program.ts` - Defines the `ask` command and role override flags.
- `tests/cli/program.test.ts` - Verifies direct question parsing and help text.

## Decisions Made
- Use `commander` for the user-facing command surface so help text and option parsing stay readable.
- Emit the built executable at `dist/index.js` to match the package bin contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Align build output with the CLI bin path**
- **Found during:** task 2 (create the direct ask command entrypoint)
- **Issue:** TypeScript initially emitted to `dist/src/index.js`, which broke `node dist/index.js`.
- **Fix:** Narrowed the compiler root to `src/` so the built entrypoint lands at `dist/index.js`.
- **Files modified:** `tsconfig.json`
- **Verification:** `npm run build && node dist/index.js ask "Should tests come first?"`
- **Committed in:** `4a07105`

**2. [Rule 3 - Blocking] Restore Vitest optional native bindings on this machine**
- **Found during:** task 3 (lock in CLI parsing behavior with tests)
- **Issue:** Vitest failed to start because npm skipped an optional rolldown native package during the first install.
- **Fix:** Reinstalled dependencies with optional packages included so the test runner could load normally.
- **Files modified:** `package-lock.json`
- **Verification:** `npm run test -- --run tests/cli/program.test.ts`
- **Committed in:** `7d4021b`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to satisfy the executable CLI contract and keep the chosen test stack usable. No scope creep.

## Issues Encountered
- Commander top-level help does not include subcommand options, so the tests were adjusted to inspect the `ask` command help directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The repository now has a runnable CLI shell for later OpenCode integration.
- The next plan can focus on config resolution and SDK startup instead of command parsing.

---
*Phase: 01-foundation-and-debate-skeleton*
*Completed: 2026-04-04*
