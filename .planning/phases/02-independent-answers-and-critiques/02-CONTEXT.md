# Phase 2: Independent Answers And Critiques - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the first real debate behavior where Debater A and Debater B each produce an initial answer, then critique each other in the correct order without breaking the product's symmetry promise. This phase is about the shape and boundaries of initial answers and critiques, not about final revisions, judging, transcript persistence, or broader product features.

</domain>

<decisions>
## Implementation Decisions

### Answer style
- Debater A and Debater B should have clearly distinct roles rather than sounding like two copies of the same assistant
- Initial answers should be balanced in depth: substantial enough to make a case, but not so long that they feel final
- The contrast between the two first answers should come from both reasoning and structure
- Initial answers should feel moderately opinionated: clear positions, but still grounded and useful

### Independence rules
- Before critique begins, each debater should see the user's question plus a shared system framing block
- Debater A and Debater B should still receive clearly different role briefs so their first answers do not converge too easily
- During the critique step, each debater should receive both their own initial answer and the opponent's initial answer
- The product should make the independence of the opening answers very explicit to the user

### OpenCode's Discretion
- Exact wording of the shared system framing block, as long as it stays shared between both debaters
- Exact wording of the distinct role briefs, as long as they remain clearly different
- Exact presentation format of the explicit independence messaging shown to the user
- Exact formatting of balanced initial answers and critique prompts

</decisions>

<specifics>
## Specific Ideas

- The debate should feel meaningfully contrasted, not like two near-identical answers with different labels
- The product promise of independence matters enough that it should be visible, not hidden as an internal implementation detail
- Critique should happen with enough context to compare positions directly, which is why each debater should see both answers during that step

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-independent-answers-and-critiques*
*Context gathered: 2026-04-04*
