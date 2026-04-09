---
phase: 04-final-revisions-and-judge-selection
status: passed
updated: 2026-04-05T02:16:00Z
requirements_verified: [ORCH-05, ORCH-06, JUDGE-01, JUDGE-02, JUDGE-03, TRNS-03]
---

# Phase 04 Verification

## Goal

Complete the debate loop by producing revised answers from both debaters and choosing a winner through a validated judge response.

## Must-Have Checks

1. **ORCH-05 / ORCH-06** - Verified by `src/debate/prompts.ts`, `src/debate/run-debate.ts`, and `tests/debate/run-debate.test.ts`.
2. **JUDGE-01 / JUDGE-02 / JUDGE-03** - Verified by `src/debate/judge.ts`, `src/debate/prompts.ts`, `src/debate/run-debate.ts`, `tests/debate/judge.test.ts`, and `tests/debate/run-debate.test.ts`.
3. **TRNS-03** - Verified by `src/cli/render.ts`, `src/cli/run-ask-command.ts`, `tests/cli/render.test.ts`, and `tests/debate/run-debate.test.ts`.

## Automated Verification

```bash
npm run build
npm run test
```

Result: passed.

## Human Verification

1. Run a real local debate with OpenCode configured.
2. Confirm the final output leads with the winning debater and exact model id, shows only the winning revised answer, and includes a short rationale.
3. Run the emitted `debate inspect <run-id>` command.

Expected: the default completion view is decisive and winner-first, while transcript inspection still shows the full debate including both revised answers and the raw judge output.

Why human: automated tests verify contract, rendering, and failure behavior, but not a live end-to-end external model run on this machine.

## Gaps

None.
