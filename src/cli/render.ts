import type { DebateConfig, DebateRoleConfig } from "../app/config.js"
import type { DebateStageResult } from "../debate/state.js"
import { DEBATE_STAGES, type DebateStageDefinition } from "../debate/stages.js"
import type { DebateTranscriptRecord } from "../debate/transcript.js"

const ANSI_RESET = "\u001B[0m"
const ANSI_BOLD = "\u001B[1m"
const ANSI_DIM = "\u001B[2m"
const ANSI_RED = "\u001B[31m"
const ANSI_GREEN = "\u001B[32m"
const ANSI_YELLOW = "\u001B[33m"
const ANSI_BLUE = "\u001B[34m"
const ANSI_MAGENTA = "\u001B[35m"
const ANSI_CYAN = "\u001B[36m"

function supportsColor() {
  return Boolean(process.stdout?.isTTY) && !process.env.NO_COLOR && process.env.TERM !== "dumb"
}

function color(text: string, ...codes: string[]) {
  if (!supportsColor()) {
    return text
  }

  return `${codes.join("")}${text}${ANSI_RESET}`
}

function bold(text: string) {
  return color(text, ANSI_BOLD)
}

function dim(text: string) {
  return color(text, ANSI_DIM)
}

function success(text: string) {
  return color(text, ANSI_GREEN, ANSI_BOLD)
}

function warning(text: string) {
  return color(text, ANSI_YELLOW, ANSI_BOLD)
}

function danger(text: string) {
  return color(text, ANSI_RED, ANSI_BOLD)
}

function accent(text: string) {
  return color(text, ANSI_CYAN, ANSI_BOLD)
}

function debug(text: string) {
  return color(text, ANSI_MAGENTA, ANSI_BOLD)
}

function info(text: string) {
  return color(text, ANSI_BLUE)
}

function getRoleLabel(role: "debaterA" | "debaterB") {
  return role === "debaterA" ? "Debater A" : "Debater B"
}

function formatRoleSummary(roles: DebateRoleConfig) {
  return [
    `Debater A: ${roles.debaterA}`,
    `Debater B: ${roles.debaterB}`,
    `Judge: ${roles.judge}`,
  ].join(" | ")
}

export function renderRoleSummary(roles: DebateRoleConfig) {
  return `${accent("Active models:")} ${formatRoleSummary(roles)}`
}

export function renderStagePlan() {
  return [
    bold("Debate stages:"),
    ...DEBATE_STAGES.map((stage, index) => `  ${index + 1}. ${stage.label}`),
  ].join("\n")
}

export function renderIndependenceNote() {
  return `${info("Independent opening answers:")} Debater A and Debater B each answer in isolation before the cross-critique exchange begins.`
}

export function renderStageProgress(stage: DebateStageDefinition, actorModel: string) {
  return `${accent("Running")} ${stage.label} ${dim(`with ${actorModel}`)}`
}

export function renderStageRetry(options: {
  stage: DebateStageDefinition
  actorModel: string
  nextAttempt: number
  maxAttempts: number
  reason: string
}) {
  return `${warning("Retrying")} ${options.stage.label} ${dim(`with ${options.actorModel}`)} ${dim(`(${options.nextAttempt}/${options.maxAttempts})`)}: ${options.reason}`
}

export function renderStageDebugOutput(options: {
  stage: DebateStageDefinition
  actorModel: string
  result: DebateStageResult
}) {
  const content = options.result.content?.trim() || "[no text content]"

  return [
    `${debug("Debug output:")} ${options.stage.label} ${dim(`(${options.actorModel})`)}`,
    content,
  ].join("\n")
}

export function renderFailure(options: {
  error: string
  stage?: {
    label: string
    actorModel: string
  }
  transcriptAvailable: boolean
  transcriptId: string
  transcriptPath: string
}) {
  const lines = [
    danger("Debate failed"),
    options.stage ? `Stage: ${options.stage.label} (${options.stage.actorModel})` : undefined,
    `Reason: ${options.error}`,
    options.transcriptAvailable ? `Transcript: partial run saved as ${options.transcriptId}` : "Transcript: unavailable",
    options.transcriptAvailable ? `Transcript file: ${options.transcriptPath}` : undefined,
    options.transcriptAvailable ? `Inspect: debateloop inspect ${options.transcriptId}` : undefined,
    options.transcriptAvailable
      ? "Next: inspect the partial transcript before retrying so you can see exactly what completed and what failed."
      : "Next: retry after fixing the reported stage failure.",
  ].filter((line): line is string => Boolean(line))

  return lines.join("\n")
}

export function renderCompletion(options: {
  config: DebateConfig
  decision?: {
    winner: "debaterA" | "debaterB"
    winnerModel: string
    winningAnswer: string
    rationale: string
  }
  usedSetup: boolean
  transcriptAvailable: boolean
  transcriptId: string
  transcriptPath: string
}) {
  const winnerLabel = options.decision ? getRoleLabel(options.decision.winner) : null
  const lines = [
    success("Result"),
    options.decision ? `Winner: ${winnerLabel} (${options.decision.winnerModel})` : "Decision: pending",
    options.decision ? "" : undefined,
    options.decision ? bold("Winning Answer:") : undefined,
    options.decision?.winningAnswer,
    options.decision ? "" : undefined,
    options.decision ? `Rationale: ${options.decision.rationale}` : undefined,
    options.transcriptAvailable ? `Transcript: saved as ${options.transcriptId}` : "Transcript: unavailable",
    options.transcriptAvailable ? `Transcript file: ${options.transcriptPath}` : undefined,
    options.transcriptAvailable ? `Inspect: debateloop inspect ${options.transcriptId}` : undefined,
  ].filter((line): line is string => Boolean(line))

  if (options.usedSetup && !options.config.firstRunHintShown) {
    lines.push("Hint: run `debateloop ask \"Should tests come first?\"` to start another debate quickly.")
  }

  return lines.join("\n")
}

export function renderTranscriptInspection(record: DebateTranscriptRecord) {
  const completedStages = record.stages.filter((stage) => stage.status === "completed").length
  const failedStage = record.failedStage
    ? DEBATE_STAGES.find((stage) => stage.key === record.failedStage)
    : undefined
  const lines = [
    `${bold("Transcript")} ${record.runId}`,
    record.status === "failed" ? "Status: failed (partial transcript preserved)" : `Status: ${record.status}`,
    `Question: ${record.question}`,
    `Models: ${formatRoleSummary(record.roles)}`,
    record.status === "failed" ? `Completed stages: ${completedStages}/${record.stages.length}` : undefined,
    failedStage ? `Failed stage: ${failedStage.label}` : undefined,
    record.error ? `Failure: ${record.error}` : undefined,
    "",
    bold("Stages:"),
  ].filter((line): line is string => Boolean(line))

  for (const [index, stage] of record.stages.entries()) {
    lines.push(`${index + 1}. ${stage.label} [${stage.status}]`)
    lines.push(`   Actor: ${stage.actorRole} (${stage.actorModel})`)

    if (stage.output.sessionId) {
      lines.push(`   Session: ${stage.output.sessionId}`)
    }

    if (typeof stage.durationMs === "number") {
      lines.push(`   Duration: ${stage.durationMs}ms`)
    }

    if (typeof stage.output.attemptCount === "number" && stage.output.attemptCount > 1) {
      lines.push(`   Attempts: ${stage.output.attemptCount}`)
    }

    if (stage.input.prompt) {
      lines.push("   Prompt:")
      lines.push(...stage.input.prompt.split("\n").map((line) => `     ${line}`))
    }

    if (stage.output.content) {
      lines.push("   Output:")
      lines.push(...stage.output.content.split("\n").map((line) => `     ${line}`))
    }

    if (stage.output.error) {
      lines.push(`   Error: ${stage.output.error}`)
    }

    if (stage.output.placeholder) {
      lines.push(`   Placeholder: ${stage.output.placeholder}`)
    }
  }

  return lines.join("\n")
}
