# Roadmap: Debate

## Overview

This roadmap takes Debate from an empty greenfield repo to a usable v1 debate engine. The phases are ordered around the real product dependency chain: first make the OpenCode-backed skeleton runnable, then implement the symmetric debate loop, then persist and inspect the transcript, then add the final judge decision, and finally harden the system for practical use.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation And Debate Skeleton** - Set up the project, SDK integration, config, and fixed stage model
- [x] **Phase 2: Independent Answers And Critiques** - Implement the core symmetric debate flow before judging
- [x] **Phase 3: Transcript Persistence And Inspection** - Save each stage and make debates inspectable (completed 2026-04-04)
- [ ] **Phase 4: Final Revisions And Judge Selection** - Complete the workflow with revised answers and winner selection
- [ ] **Phase 5: Reliability And v1 Polish** - Add retries, failure handling, tests, and output polish

## Phase Details

### Phase 1: Foundation And Debate Skeleton
**Goal**: Create a runnable TypeScript app that can start OpenCode, accept a question, load model-role config, and represent the full fixed debate stage sequence
**Depends on**: Nothing (first phase)
**Requirements**: [INPUT-01, INPUT-02, INPUT-03, ORCH-07]
**Success Criteria** (what must be TRUE):
  1. User can run the app locally and submit a question into a new debate run
  2. The app can load Debater A, Debater B, and Judge model configuration
  3. The debate pipeline is represented as an explicit fixed stage sequence before stage-specific outputs are added
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Initialize the TypeScript project, runtime tooling, and CLI entrypoint
- [x] 01-02-PLAN.md — Wire OpenCode SDK client creation and app configuration loading
- [x] 01-03-PLAN.md — Define debate state, stage types, and the orchestration skeleton

### Phase 2: Independent Answers And Critiques
**Goal**: Implement the core debate behavior where both debaters answer independently and then critique each other without breaking symmetry
**Depends on**: Phase 1
**Requirements**: [ORCH-01, ORCH-02, ORCH-03, ORCH-04]
**Success Criteria** (what must be TRUE):
  1. Debater A can produce an initial answer to the user question
  2. Debater B can produce an independent initial answer before seeing Debater A's answer
  3. Each debater can critique the other model's initial answer in the correct stage order
  4. Tests or fixtures confirm the initial-answer stage preserves independence
**Plans**: 3 plans

Plans:
- [x] 02-01: Implement initial answer stages for Debater A and Debater B
- [x] 02-02: Implement cross-critique stage prompts and output handling
- [x] 02-03: Add tests around stage order and independence boundaries

### Phase 3: Transcript Persistence And Inspection
**Goal**: Persist every debate stage and make the transcript inspectable after or during a run
**Depends on**: Phase 2
**Requirements**: [TRNS-01, TRNS-02]
**Success Criteria** (what must be TRUE):
  1. Every completed stage is stored with role, prompt context, and output metadata
  2. User can inspect the transcript of a completed debate run
  3. Intermediate debate state remains available for debugging instead of only the final answer
**Plans**: 3 plans

Plans:
- [x] 03-01: Design and implement the debate record and transcript storage format
- [x] 03-02: Persist stage artifacts as the debate progresses
- [x] 03-03: Add transcript inspection output for completed debates

### Phase 4: Final Revisions And Judge Selection
**Goal**: Complete the debate loop by producing revised answers from both debaters and choosing a winner through a validated judge response
**Depends on**: Phase 3
**Requirements**: [ORCH-05, ORCH-06, JUDGE-01, JUDGE-02, JUDGE-03, TRNS-03]
**Success Criteria** (what must be TRUE):
  1. Both debaters can generate final revised answers after reading the critique round
  2. Judge can compare the two final revised answers and select a winner
  3. Judge output is validated structurally before the app accepts it
  4. Final app output shows the winning model, rationale, and winning answer clearly
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Implement final revision stages for Debater A and Debater B
- [ ] 04-02-PLAN.md — Add structured judge prompt, schema validation, and winner extraction
- [ ] 04-03-PLAN.md — Render the final verdict and winning answer from the validated judge result

### Phase 5: Reliability And v1 Polish
**Goal**: Make the debate engine resilient and practical with retries, stage-aware errors, and end-to-end test confidence
**Depends on**: Phase 4
**Requirements**: [RELY-01, RELY-02, RELY-03]
**Success Criteria** (what must be TRUE):
  1. Users can tell which debate stage failed and why
  2. Recoverable failures can be retried without corrupting debate state
  3. Partial failures preserve usable transcript data for debugging
  4. End-to-end tests cover the happy path and representative failure cases
**Plans**: 3 plans

Plans:
- [ ] 05-01: Add retries, timeout configuration, and stage-specific error surfaces
- [ ] 05-02: Protect transcript integrity during partial failures and aborts
- [ ] 05-03: Add end-to-end and edge-case test coverage for v1 completion

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation And Debate Skeleton | 3/3 | Complete | 2026-04-04 |
| 2. Independent Answers And Critiques | 3/3 | Complete | 2026-04-04 |
| 3. Transcript Persistence And Inspection | 3/3 | Complete | 2026-04-05 |
| 4. Final Revisions And Judge Selection | 0/3 | Not started | - |
| 5. Reliability And v1 Polish | 0/3 | Not started | - |
