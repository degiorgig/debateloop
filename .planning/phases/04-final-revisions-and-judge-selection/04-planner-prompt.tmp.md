<planning_context>
**Phase:** 4
**Mode:** standard

<files_to_read>
- .planning/STATE.md (Project State)
- .planning/ROADMAP.md (Roadmap)
- .planning/REQUIREMENTS.md (Requirements)
- .planning/phases/04-final-revisions-and-judge-selection/04-CONTEXT.md (USER DECISIONS from /gsd-discuss-phase)
- .planning/phases/04-final-revisions-and-judge-selection/04-RESEARCH.md (Technical Research)
- .planning/phases/02-independent-answers-and-critiques/02-01-SUMMARY.md
- .planning/phases/02-independent-answers-and-critiques/02-02-SUMMARY.md
- .planning/phases/03-transcript-persistence-and-inspection/03-01-SUMMARY.md
- .planning/phases/03-transcript-persistence-and-inspection/03-02-SUMMARY.md
- .planning/phases/03-transcript-persistence-and-inspection/03-03-SUMMARY.md
</files_to_read>

**Phase requirement IDs (every ID MUST appear in a plan's requirements field):** ORCH-05, ORCH-06, JUDGE-01, JUDGE-02, JUDGE-03, TRNS-03

**Project instructions:** read ./AGENTS.md if exists — follow project-specific guidelines
**Project skills:** Check .agents/skills/ directory (if exists) — read SKILL.md files, plans should account for project skill rules
</planning_context>

<downstream_consumer>
Output consumed by /gsd-execute-phase. Plans need:
- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>

<additional_constraints>
Project has no ./AGENTS.md and no .agents/skills/ directory. Use the already-written research and summaries as the prior context.
Return either ## PLANNING COMPLETE or ## PLANNING INCONCLUSIVE in the standard planner format.
</additional_constraints>
