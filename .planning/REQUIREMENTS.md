# Requirements: Debate

**Defined:** 2026-04-04
**Core Value:** For every user question, the system should produce a stronger final answer by forcing models to reason independently, critique each other, and pass through a final judge.

## v1 Requirements

### Debate Input

- [x] **INPUT-01**: User can submit a question to start a new debate run
- [x] **INPUT-02**: User can configure which model is used as Debater A, Debater B, and Judge
- [x] **INPUT-03**: User can run the debate through the OpenCode SDK using the local OpenCode server configuration

### Debate Orchestration

- [x] **ORCH-01**: Debater A can generate an initial answer to the user question
- [x] **ORCH-02**: Debater B can generate an independent initial answer to the same question before seeing Debater A's answer
- [x] **ORCH-03**: Debater A can critique Debater B's initial answer
- [x] **ORCH-04**: Debater B can critique Debater A's initial answer
- [x] **ORCH-05**: Debater A can generate a final revised answer after the critique round
- [x] **ORCH-06**: Debater B can generate a final revised answer after the critique round
- [x] **ORCH-07**: The debate executes in a fixed stage order that preserves the symmetric workflow

### Judge Decision

- [x] **JUDGE-01**: Judge can compare the two final revised answers and select a winner
- [x] **JUDGE-02**: Judge returns a rationale explaining why the winning answer was selected
- [x] **JUDGE-03**: Judge output is validated in a structured format before the app returns the final result

### Transcript And Inspection

- [x] **TRNS-01**: System persists each debate stage with role, prompt context, and output content
- [x] **TRNS-02**: User can inspect the full debate transcript after a run completes
- [x] **TRNS-03**: Final result clearly identifies the winning model and includes the winning final answer

### Reliability

- [ ] **RELY-01**: System surfaces which stage failed when a model call or validation step fails
- [ ] **RELY-02**: System can retry recoverable failures such as transient API or timeout issues
- [ ] **RELY-03**: System can stop without corrupting stored transcript state when a debate run fails partway through

## v2 Requirements

### Evaluation

- **EVAL-01**: User can score final answers across multiple criteria instead of winner-only selection
- **EVAL-02**: User can replay a saved debate using different debater or judge models

### Experience

- **EXPR-01**: User can view debates in a richer browser-based interface
- **EXPR-02**: User can stream stage progress live while the debate is running

### Advanced Debate

- **ADVT-01**: User can run more than two debaters in one debate
- **ADVT-02**: User can run more than one judge and compare verdicts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user accounts and shared workspaces | Not needed to validate the core debate engine |
| Billing or subscription management | Product value is in orchestration, not monetization yet |
| Fine-tuning or custom model training | The goal is to orchestrate existing models through OpenCode |
| Unlimited recursive debate rounds | Adds cost and complexity before proving the fixed pipeline |
| Automatic synthesis of both final answers before judging | Conflicts with the symmetric winner-selection design |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 1 | Complete |
| INPUT-02 | Phase 1 | Complete |
| INPUT-03 | Phase 1 | Complete |
| ORCH-01 | Phase 2 | Complete |
| ORCH-02 | Phase 2 | Complete |
| ORCH-03 | Phase 2 | Complete |
| ORCH-04 | Phase 2 | Complete |
| ORCH-05 | Phase 4 | Complete |
| ORCH-06 | Phase 4 | Complete |
| ORCH-07 | Phase 1 | Complete |
| JUDGE-01 | Phase 4 | Complete |
| JUDGE-02 | Phase 4 | Complete |
| JUDGE-03 | Phase 4 | Complete |
| TRNS-01 | Phase 3 | Complete |
| TRNS-02 | Phase 3 | Complete |
| TRNS-03 | Phase 4 | Complete |
| RELY-01 | Phase 5 | Pending |
| RELY-02 | Phase 5 | Pending |
| RELY-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-05 after Phase 4 completion*
