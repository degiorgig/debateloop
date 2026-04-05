# Phase 5: Reliability And v1 Polish - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the debate tool resilient and practical for real use by clarifying how retries should work, how failures should be explained, how partial runs should be preserved, and what confidence bar v1 tests must meet. This phase is about reliability behavior and polish, not about adding new debate capabilities.

</domain>

<decisions>
## Implementation Decisions

### Retry policy
- Recoverable failures should auto-retry by default a few times rather than failing immediately
- Retry behavior in v1 should be conservative, not aggressive
- Only transient/provider-type issues should be retried automatically
- Retry activity should be clearly visible to the user

### Failure output
- Default failure output should emphasize the exact stage and the reason it failed
- Failure messages should include a short actionable next step
- Failure output should explicitly mention saved transcript/debug artifacts when available
- Failure message tone should be direct and calm

### Partial runs
- Partial runs should be saved as inspectable artifacts rather than discarded
- Partial runs should be clearly marked as partial when users inspect them later
- Completed earlier stages in a failed run should remain fully inspectable
- Post-failure UX should encourage inspection before a blind rerun

### Test coverage
- v1 reliability confidence should cover the happy path plus key failures, not only the success path
- Provider/model failures are the highest-priority end-to-end failure scenarios to cover
- Retry behavior should be directly verified in tests
- Tests should protect key user-facing failure and recovery messages, not every exact string

### OpenCode's Discretion
- Exact retry counts and backoff timing, as long as retries remain conservative and limited to transient/provider failures
- Exact formatting of retry visibility in CLI output
- Exact wording of partial-run markers and artifact references
- Exact balance between unit, integration, and end-to-end tests as long as the locked confidence bar is met

</decisions>

<specifics>
## Specific Ideas

- Reliability should feel practical and understandable, not magical or silent
- Users should know what failed, where it failed, and what they can inspect next
- Partial runs should be treated as useful debugging artifacts, not as noise to hide
- v1 polish means confidence in the main flow plus the most important real-world failure modes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-reliability-and-v1-polish*
*Context gathered: 2026-04-05*
