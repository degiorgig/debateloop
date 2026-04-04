# Phase 4: Final Revisions And Judge Selection - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the debate loop by producing final revised answers for both debaters after critique, then selecting a winner through a structured judge response and showing that final result clearly to the user. This phase is about how revisions should behave, what the judge should optimize for, and how the final verdict should be presented. It does not add new debate capabilities beyond the final revision and winner-selection flow.

</domain>

<decisions>
## Implementation Decisions

### Revision behavior
- Each debater's final answer should be a balanced rewrite, not a tiny patch and not a total from-scratch replacement
- The revision step should address critique directly as its main purpose
- Revised answers should include some acknowledgment of the critique, but stay readable and self-contained
- Both revised answers should remain distinct in voice and structure rather than converging into near-duplicates

### Judge criteria
- The judge should prioritize usefulness plus correctness above all other factors
- Clarity and readability should be a major factor in the verdict, not a minor afterthought
- The judge should penalize a revised answer strongly if it ignores a strong critique
- The judge should stay balanced between safer and more decisive answers rather than biasing toward one style by default

### Verdict format
- The final output should lead with the winner and the winning final revised answer
- Default judge rationale should be short rather than long-form
- The losing revised answer should not be shown in the default final output
- The final result should identify the winner as both role and exact model name

### Judge strictness
- In v1 the judge should always return a winner
- If both answers are weak, the judge should still choose the better one instead of returning no result
- The verdict contract should feel very deterministic to the user
- If judge output is malformed or unclear, the app should fail clearly rather than guessing or silently masking the problem

### OpenCode's Discretion
- Exact wording of revision prompts, as long as revisions remain balanced rewrites that address critique directly
- Exact rubric field names and schema details for the structured judge output
- Exact short rationale wording in the final verdict presentation
- Exact CLI formatting of the winner-first final result

</decisions>

<specifics>
## Specific Ideas

- The revised answers should feel improved by critique, but still clearly belong to two different debaters
- The final result should feel decisive and easy to consume: who won, what the winning answer is, and a short reason why
- Judge behavior should be strict enough to keep the product contract simple: always produce one winner unless the verdict is invalid

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-final-revisions-and-judge-selection*
*Context gathered: 2026-04-05*
