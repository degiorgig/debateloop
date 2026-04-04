# Phase 1: Foundation And Debate Skeleton - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the first runnable version of Debate: a tool-first TypeScript application that can start a debate from the command line, load Debater A / Debater B / Judge configuration through OpenCode, and expose the fixed debate stage sequence to the user. This phase is about the first-run and repeat-run experience for starting debates, not about implementing the full answer/critique/judge behavior itself.

</domain>

<decisions>
## Implementation Decisions

### Command flow
- v1 should usually start from one direct command, not an app-first interactive shell
- The primary input style should be a quoted question passed directly in the command
- Startup should show the full debate structure up front, not hide the staged nature of the tool
- When a run finishes, the default result view should lead with the winner first

### Model setup
- Model roles should use saved defaults with per-run override support
- Debater A and Debater B must always be different models in v1
- If no saved role configuration exists yet, the app should guide the user through interactive setup
- During a run, show both role and exact model name together

### Run visibility
- During execution, show stage-by-stage progress rather than only a spinner or raw live transcript
- Progress display should show both the current stage and which role/model is acting
- The full transcript should be shown or offered only after completion, not streamed by default during the run
- Final output should be result-first, with transcript details available on demand

### Missing setup
- If OpenCode cannot start or is unavailable, fail immediately with clear fix steps
- If role configuration is missing or incomplete, prompt the user to configure the missing roles
- If a selected model is unavailable at runtime, fail fast with a clear message naming the affected role/model
- Setup and error guidance should be friendly and guided, not terse or overly technical

### Command naming
- The command style should be plain, direct, and tool-first
- The product brand `Debate` should appear in help/output, but does not need to dominate the command itself
- Subcommands and flags should lean toward full readable words over short clever aliases

### Saved defaults
- On normal runs, reuse saved defaults but show a short reminder of the active roles/models
- Per-run overrides should affect only that run unless explicitly saved later
- Active defaults should be shown in one compact summary line before execution starts
- If saved defaults are invalid or stale, force a reconfiguration flow rather than guessing

### Stage labels
- Stage labels should be simple and plain rather than technical or theatrical
- The first two visible stage labels should be `Answer A` and `Answer B`
- The critique stages should be labeled `Critique A` and `Critique B`
- The final stage should be labeled `Final decision`

### First-run help
- After the first successful setup, show only a quick hint, not a walkthrough
- That first-run hint should emphasize how to run the tool again
- Include one concise example command in the first-run help
- First-run help should appear only on the first successful run, then disappear unless help is requested

### OpenCode's Discretion
- Exact command names and flag spellings, as long as they stay plain, readable, and tool-first
- Exact formatting of the stage progress display
- Exact layout of the winner-first final result screen and transcript access affordance
- Exact wording of the friendly setup/error guidance and first-run hint copy

</decisions>

<specifics>
## Specific Ideas

- The tool should feel like a practical terminal utility, not a heavily branded product shell
- Users should see the debate shape clearly from the start: answer, critique, revise, final decision
- Repeat usage should feel lightweight: reuse defaults, briefly remind the user what is active, then run
- Transcript visibility matters, but it should not crowd the default live run experience

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-debate-skeleton*
*Context gathered: 2026-04-04*
