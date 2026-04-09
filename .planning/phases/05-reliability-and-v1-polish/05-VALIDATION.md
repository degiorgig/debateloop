---
phase: 5
phase_slug: reliability-and-v1-polish
created: 2026-04-05
status: active
---

# Validation Strategy

## Dimensions

1. Retryable failures retry conservatively and visibly.
2. Non-retryable failures stop at the correct stage.
3. Failed runs preserve partial transcript data.
4. Transcript inspection makes partial failures understandable.
5. The happy path still completes with the existing winner-first output.

## Automated Checks

- `npm test -- --run tests/app/config.test.ts tests/cli/render.test.ts tests/cli/run-inspect-command.test.ts tests/cli/resolve-run-config.test.ts tests/debate/run-debate.test.ts`
- `npm run build`

## Required Evidence

- Retry coverage proves a stage can recover after a transient provider error.
- Failure coverage proves the final CLI error names the failed stage and points to transcript inspection.
- Inspection coverage proves failed transcripts are shown as partial preserved artifacts.
