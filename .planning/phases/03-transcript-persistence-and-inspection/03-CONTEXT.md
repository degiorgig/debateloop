# Phase 3: Transcript Persistence And Inspection - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist each debate run as a durable transcript record and make completed runs inspectable in a clear user-facing format. This phase is about what gets saved, how transcript data is shaped, and how users inspect completed debate stages. It does not add new debate capabilities like revisions, judging, or broader product surfaces.

</domain>

<decisions>
## Implementation Decisions

### Record shape
- Each saved transcript record should represent one complete debate run
- Minimum run metadata must include the original question plus the exact Debater A, Debater B, and Judge model identities
- Each saved stage entry should include both input and output, not output only
- Stage order should be stored explicitly rather than inferred later

### Inspection view
- Transcript inspection should default to ordered stage sections, not a compact summary or raw record dump
- Each stage should show full saved stage text by default
- Stage metadata should appear inline with each stage rather than being hidden or moved to a top-only block
- Missing later-stage content in v1 should still appear as visible placeholders so the stage structure remains clear

### Persistence scope
- For each stage, persist the stage input plus the role/model that produced the response
- Save basic stage timing in v1
- Persist failed stages and their errors in the same transcript record flow, not only successful stages
- Save OpenCode session IDs as debug metadata even if they are not the first thing users see

### Transcript format
- The transcript format should serve both human inspection and machine use
- The structured record should be the source of truth, with the human-readable inspection view derived from it
- The transcript schema should aim to be stable early so later phases build on it rather than replacing it
- The inspection output should feel like a structured report rather than a raw event log

### OpenCode's Discretion
- Exact field names and schema layout, as long as the structured record remains the source of truth and stays stable
- Exact formatting of inline metadata in the inspection output
- Exact placeholder wording for later stages that do not yet produce real content
- Exact presentation details of the stage-section inspection view

</decisions>

<specifics>
## Specific Ideas

- Transcript records should help both human inspection and future tooling instead of forcing a choice between the two
- Inspection should feel readable and intentionally structured, not like dumping raw internal events to the terminal
- Failures should live in the same persistence model as successful stages so debugging does not require a separate mental model

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-transcript-persistence-and-inspection*
*Context gathered: 2026-04-04*
