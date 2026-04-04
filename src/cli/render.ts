import type { DebateConfig, DebateRoleConfig } from "../app/config.js"
import { DEBATE_STAGES, type DebateStageDefinition } from "../debate/stages.js"

function formatRoleSummary(roles: DebateRoleConfig) {
  return [
    `Debater A: ${roles.debaterA}`,
    `Debater B: ${roles.debaterB}`,
    `Judge: ${roles.judge}`,
  ].join(" | ")
}

export function renderRoleSummary(roles: DebateRoleConfig) {
  return `Active models: ${formatRoleSummary(roles)}`
}

export function renderStagePlan() {
  return [
    "Debate stages:",
    ...DEBATE_STAGES.map((stage, index) => `  ${index + 1}. ${stage.label}`),
  ].join("\n")
}

export function renderStageProgress(stage: DebateStageDefinition, actorModel: string) {
  return `Running ${stage.label} with ${actorModel}`
}

export function renderCompletion(options: {
  config: DebateConfig
  usedSetup: boolean
}) {
  const lines = [
    "Result",
    "Decision: pending",
    "Transcript: hidden during the run. Use a later phase to inspect details.",
  ]

  if (options.usedSetup && !options.config.firstRunHintShown) {
    lines.push("Hint: run `debate ask \"Should tests come first?\"` to start another debate quickly.")
  }

  return lines.join("\n")
}
