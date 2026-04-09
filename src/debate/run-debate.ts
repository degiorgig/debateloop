import { randomUUID } from "node:crypto"

import type { DebateReliabilityConfig, DebateRoleConfig } from "../app/config.js"
import type { OpencodeClient, Part } from "@opencode-ai/sdk"
import { parseJudgeVerdict, type JudgeVerdict } from "./judge.js"
import { buildCritiquePrompt, buildInitialAnswerPrompt, buildJudgePrompt, buildRevisionPrompt, getSharedDebateFraming } from "./prompts.js"
import { toSdkModelRef } from "../opencode/models.js"
import type { DebateStageDefinition } from "./stages.js"
import { DEBATE_STAGES } from "./stages.js"
import type { DebateRunState, DebateStageResult, DebateStageState } from "./state.js"
import { getTranscriptRunPath } from "../app/paths.js"
import { createDebateTranscriptRecord, saveDebateTranscriptRecord, type DebateTranscriptRecord } from "./transcript.js"

export interface DebateProgressEvent {
  stage: DebateStageDefinition
  actorModel: string
  state: DebateRunState
}

export interface DebateCompletion {
  state: DebateRunState
  decision?: {
    winner: JudgeVerdict["winner"]
    winnerModel: string
    winningAnswer: string
    rationale: string
  }
  transcriptAvailable: boolean
  transcriptId: string
  transcriptPath: string
}

export interface DebateStageRetryEvent {
  stage: DebateStageDefinition
  actorModel: string
  nextAttempt: number
  maxAttempts: number
  reason: string
}

export interface DebateStageCompleteEvent {
  stage: DebateStageDefinition
  actorModel: string
  result: DebateStageResult
  state: DebateRunState
}

export interface DebateSessionClient {
  create: OpencodeClient["session"]["create"]
  prompt: OpencodeClient["session"]["prompt"]
}

type DebaterRole = "debaterA" | "debaterB"

const DEFAULT_RELIABILITY: DebateReliabilityConfig = {
  maxStageAttempts: 3,
  stageTimeoutMs: 30_000,
  retryBackoffMs: 750,
}

class RetryableStageError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "RetryableStageError"
  }
}

export class DebateStageExecutionError extends Error {
  constructor(
    message: string,
    readonly stageKey: DebateStageDefinition["key"] | null,
    readonly stageLabel: string | null,
    readonly actorModel: string | null,
    readonly attemptCount: number,
    readonly maxAttempts: number,
    readonly retryable: boolean,
    readonly transcriptId: string,
    readonly transcriptPath: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "DebateStageExecutionError"
  }
}

function extractText(parts: Part[]) {
  return parts
    .filter((part): part is Extract<Part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim()
}

function getStageDefinition(stageKey: DebateStageDefinition["key"]) {
  const stage = DEBATE_STAGES.find((candidate) => candidate.key === stageKey)

  if (!stage) {
    throw new Error(`Unknown stage ${stageKey}.`)
  }

  return stage
}

function createStageState(): DebateStageState[] {
  return DEBATE_STAGES.map((stage) => ({
    key: stage.key,
    status: "pending",
  }))
}

function cloneState(state: DebateRunState): DebateRunState {
  return {
    ...state,
    stages: state.stages.map((stage) => ({ ...stage })),
  }
}

function updateStageStatus(state: DebateRunState, stageKey: DebateStageDefinition["key"], status: DebateStageState["status"]) {
  const target = state.stages.find((stage) => stage.key === stageKey)

  if (target) {
    target.status = status
  }
}

function updateStageResult(state: DebateRunState, stageKey: DebateStageDefinition["key"], result: DebateStageState["result"]) {
  const target = state.stages.find((stage) => stage.key === stageKey)

  if (target) {
    target.result = result
  }
}

function getTranscriptStage(record: DebateTranscriptRecord, stageKey: DebateStageDefinition["key"]) {
  const target = record.stages.find((stage) => stage.key === stageKey)

  if (!target) {
    throw new Error(`Missing transcript stage entry for ${stageKey}.`)
  }

  return target
}

function getStageResult(state: DebateRunState, stageKey: DebateStageDefinition["key"]) {
  return state.stages.find((stage) => stage.key === stageKey)?.result
}

function getRequiredStageContent(state: DebateRunState, stageKey: DebateStageDefinition["key"]) {
  const content = getStageResult(state, stageKey)?.content?.trim()

  if (!content) {
    throw new Error(`Cannot run dependent stage before ${stageKey} has completed content.`)
  }

  return content
}

function assertStagePrerequisites(state: DebateRunState, stage: DebateStageDefinition) {
  if (stage.key === "critique_a") {
    getRequiredStageContent(state, "answer_a")
    getRequiredStageContent(state, "answer_b")
  }

  if (stage.key === "critique_b") {
    getRequiredStageContent(state, "answer_b")
    getRequiredStageContent(state, "answer_a")
  }

  if (stage.key === "revise_a") {
    getRequiredStageContent(state, "answer_a")
    getRequiredStageContent(state, "critique_b")
  }

  if (stage.key === "revise_b") {
    getRequiredStageContent(state, "answer_b")
    getRequiredStageContent(state, "critique_a")
  }

  if (stage.key === "final_decision") {
    getRequiredStageContent(state, "revise_a")
    getRequiredStageContent(state, "revise_b")
  }
}

function isDebaterRole(role: DebateStageDefinition["actorRole"]): role is DebaterRole {
  return role === "debaterA" || role === "debaterB"
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new RetryableStageError(message, true))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

function isRetryableStageFailure(error: unknown) {
  if (error instanceof RetryableStageError) {
    return error.retryable
  }

  const message = error instanceof Error ? error.message : String(error)
  return /(timed out|timeout|temporar|temporary|rate limit|429|408|425|502|503|504|network|econnreset|econnrefused|socket hang up)/i.test(message)
}

async function runModelStageAttempt(options: {
  sessionClient: DebateSessionClient
  stageKey: DebateStageDefinition["key"]
  title: string
  modelId: string
  prompt: string
  reliability: DebateReliabilityConfig
}) {
  const created = await options.sessionClient.create({
    body: { title: options.title },
  })
  const sessionId = created.data?.id

  if (!sessionId) {
    throw new Error(`OpenCode did not return a session id for ${options.stageKey}.`)
  }

  const response = await withTimeout(
    options.sessionClient.prompt({
      path: { id: sessionId },
      body: {
        model: toSdkModelRef(options.modelId),
        system: getSharedDebateFraming(),
        parts: [{ type: "text", text: options.prompt }],
      },
    }),
    options.reliability.stageTimeoutMs,
    `Timed out waiting for ${options.stageKey} with ${options.modelId} after ${options.reliability.stageTimeoutMs}ms.`,
  )

  if (!response.data) {
    throw new Error(`OpenCode did not return a response payload for ${options.stageKey}.`)
  }

  if (response.data.info.error) {
    const message = response.data.info.error.data.message ?? "Unknown model execution error."
    const isRetryable =
      "isRetryable" in response.data.info.error.data && response.data.info.error.data.isRetryable === true

    throw new RetryableStageError(
      `Failed to run ${options.stageKey} with ${options.modelId}: ${message}`,
      isRetryable,
    )
  }

  const content = extractText(response.data.parts)

  if (!content) {
    throw new Error(`OpenCode returned no text content for ${options.stageKey} with ${options.modelId}.`)
  }

  return {
    stageKey: options.stageKey,
    providerId: response.data.info.providerID,
    modelId: response.data.info.modelID,
    messageId: response.data.info.id,
    sessionId,
    system: getSharedDebateFraming(),
    prompt: options.prompt,
    content,
    attemptCount: 1,
  }
}

async function runModelStage(options: {
  sessionClient: DebateSessionClient
  stage: DebateStageDefinition
  title: string
  modelId: string
  prompt: string
  reliability: DebateReliabilityConfig
  onRetry?: (event: DebateStageRetryEvent) => Promise<void> | void
}) {
  for (let attempt = 1; attempt <= options.reliability.maxStageAttempts; attempt += 1) {
    try {
      const result = await runModelStageAttempt({
        sessionClient: options.sessionClient,
        stageKey: options.stage.key,
        title: options.title,
        modelId: options.modelId,
        prompt: options.prompt,
        reliability: options.reliability,
      })

      return {
        ...result,
        attemptCount: attempt,
      }
    } catch (error) {
      const retryable = isRetryableStageFailure(error)

      if (!retryable || attempt >= options.reliability.maxStageAttempts) {
        const message = error instanceof Error ? error.message : String(error)

        throw new DebateStageExecutionError(
          message,
          options.stage.key,
          options.stage.label,
          options.modelId,
          attempt,
          options.reliability.maxStageAttempts,
          retryable,
          "",
          "",
          { cause: error instanceof Error ? error : undefined },
        )
      }

      const reason = error instanceof Error ? error.message : String(error)
      await options.onRetry?.({
        stage: options.stage,
        actorModel: options.modelId,
        nextAttempt: attempt + 1,
        maxAttempts: options.reliability.maxStageAttempts,
        reason,
      })

      const backoffMs = options.reliability.retryBackoffMs * attempt

      if (backoffMs > 0) {
        await delay(backoffMs)
      }
    }
  }

  throw new Error(`Unreachable retry state for ${options.stage.key}.`)
}

function createPlaceholderStageResult(stageKey: DebateStageDefinition["key"]) {
  const placeholder = "This stage is part of the fixed debate flow, but model-backed output is not implemented yet."

  return {
    stageKey,
    system: getSharedDebateFraming(),
    prompt: "No stage prompt was sent because this step is still a visible placeholder.",
    placeholder,
    content: placeholder,
  }
}

function finalizeStageResult(result: DebateStageResult, startedAt: Date, completedAt: Date): DebateStageResult {
  return {
    ...result,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
  }
}

async function maybeRunStage(options: {
  sessionClient?: DebateSessionClient
  state: DebateRunState
  stage: DebateStageDefinition
  reliability: DebateReliabilityConfig
  onRetry?: (event: DebateStageRetryEvent) => Promise<void> | void
}) {
  if (!options.sessionClient) {
    return createPlaceholderStageResult(options.stage.key)
  }

  const actorModel = options.state.roles[options.stage.actorRole]

  if (options.stage.key === "answer_a" || options.stage.key === "answer_b") {
    if (!isDebaterRole(options.stage.actorRole)) {
      throw new Error(`Unexpected actor role for ${options.stage.key}.`)
    }

    const result = await runModelStage({
      sessionClient: options.sessionClient,
      stage: options.stage,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildInitialAnswerPrompt({
        question: options.state.question,
        actorRole: options.stage.actorRole,
      }),
      reliability: options.reliability,
      onRetry: options.onRetry,
    })

    return result
  }

  if (options.stage.key === "critique_a" || options.stage.key === "critique_b") {
    if (!isDebaterRole(options.stage.actorRole)) {
      throw new Error(`Unexpected actor role for ${options.stage.key}.`)
    }

    const actorAnswerKey = options.stage.key === "critique_a" ? "answer_a" : "answer_b"
    const opponentAnswerKey = options.stage.key === "critique_a" ? "answer_b" : "answer_a"
    const actorAnswer = getRequiredStageContent(options.state, actorAnswerKey)
    const opponentAnswer = getRequiredStageContent(options.state, opponentAnswerKey)

    const result = await runModelStage({
      sessionClient: options.sessionClient,
      stage: options.stage,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildCritiquePrompt({
        question: options.state.question,
        actorRole: options.stage.actorRole,
        actorAnswer,
        opponentAnswer,
      }),
      reliability: options.reliability,
      onRetry: options.onRetry,
    })

    return result
  }

  if (options.stage.key === "revise_a" || options.stage.key === "revise_b") {
    if (!isDebaterRole(options.stage.actorRole)) {
      throw new Error(`Unexpected actor role for ${options.stage.key}.`)
    }

    const actorAnswerKey = options.stage.key === "revise_a" ? "answer_a" : "answer_b"
    const opponentCritiqueKey = options.stage.key === "revise_a" ? "critique_b" : "critique_a"
    const actorAnswer = getRequiredStageContent(options.state, actorAnswerKey)
    const opponentCritique = getRequiredStageContent(options.state, opponentCritiqueKey)

    return runModelStage({
      sessionClient: options.sessionClient,
      stage: options.stage,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildRevisionPrompt({
        question: options.state.question,
        actorRole: options.stage.actorRole,
        actorAnswer,
        opponentCritique,
      }),
      reliability: options.reliability,
      onRetry: options.onRetry,
    })
  }

  if (options.stage.key === "final_decision") {
    const revisedAnswerA = getRequiredStageContent(options.state, "revise_a")
    const revisedAnswerB = getRequiredStageContent(options.state, "revise_b")

    return runModelStage({
      sessionClient: options.sessionClient,
      stage: options.stage,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildJudgePrompt({
        question: options.state.question,
        revisedAnswerA,
        revisedAnswerB,
      }),
      reliability: options.reliability,
      onRetry: options.onRetry,
    })
  }

  return createPlaceholderStageResult(options.stage.key)
}

async function persistTranscript(record: DebateTranscriptRecord, transcriptPath: string) {
  await saveDebateTranscriptRecord(record, transcriptPath)
}

export async function runDebate(options: {
  question: string
  roles: DebateRoleConfig
  sessionClient?: DebateSessionClient
  onStageStart?: (event: DebateProgressEvent) => Promise<void> | void
  onStageRetry?: (event: DebateStageRetryEvent) => Promise<void> | void
  onStageComplete?: (event: DebateStageCompleteEvent) => Promise<void> | void
  createRunId?: () => string
  transcriptPath?: string
  now?: () => Date
  reliability?: DebateReliabilityConfig
}) {
  const now = options.now ?? (() => new Date())
  const reliability = options.reliability ?? DEFAULT_RELIABILITY
  const runId = options.createRunId?.() ?? randomUUID()
  const transcriptPath = options.transcriptPath ?? getTranscriptRunPath(runId)
  const state: DebateRunState = {
    question: options.question,
    roles: options.roles,
    currentStage: null,
    status: "running",
    stages: createStageState(),
  }
  const transcript: DebateTranscriptRecord = createDebateTranscriptRecord({
    runId,
    question: options.question,
    roles: options.roles,
    startedAt: now().toISOString(),
  })
  let decision: DebateCompletion["decision"]

  await persistTranscript(transcript, transcriptPath)

  try {
    for (const stage of DEBATE_STAGES) {
      assertStagePrerequisites(state, stage)

      const startedAt = now()
      const transcriptStage = getTranscriptStage(transcript, stage.key)

      state.currentStage = stage.key
      updateStageStatus(state, stage.key, "running")
      transcript.currentStage = stage.key
      transcriptStage.status = "running"
      transcriptStage.startedAt = startedAt.toISOString()
      await persistTranscript(transcript, transcriptPath)

      await options.onStageStart?.({
        stage,
        actorModel: options.roles[stage.actorRole],
        state: cloneState(state),
      })

      const result = await maybeRunStage({
        sessionClient: options.sessionClient,
        state,
        stage,
        reliability,
        onRetry: options.onStageRetry,
      })

      const completedAt = now()
      const finalizedResult = finalizeStageResult(result, startedAt, completedAt)

      updateStageResult(state, stage.key, finalizedResult)
      transcriptStage.completedAt = finalizedResult.completedAt
      transcriptStage.durationMs = finalizedResult.durationMs
      transcriptStage.input.system = finalizedResult.system
      transcriptStage.input.prompt = finalizedResult.prompt
      transcriptStage.input.placeholder = finalizedResult.placeholder
      transcriptStage.output.content = finalizedResult.content
      transcriptStage.output.placeholder = finalizedResult.placeholder
      transcriptStage.output.sessionId = finalizedResult.sessionId
      transcriptStage.output.providerId = finalizedResult.providerId
      transcriptStage.output.modelId = finalizedResult.modelId
      transcriptStage.output.messageId = finalizedResult.messageId
      transcriptStage.output.attemptCount = finalizedResult.attemptCount

      if (stage.key === "final_decision") {
        const verdict = parseJudgeVerdict(finalizedResult.content ?? "")
        const winningAnswer = getRequiredStageContent(state, verdict.winner === "debaterA" ? "revise_a" : "revise_b")

        decision = {
          winner: verdict.winner,
          winnerModel: options.roles[verdict.winner],
          winningAnswer,
          rationale: verdict.rationale,
        }
      }

      updateStageStatus(state, stage.key, "completed")
      transcriptStage.status = "completed"
      await persistTranscript(transcript, transcriptPath)

      await options.onStageComplete?.({
        stage,
        actorModel: options.roles[stage.actorRole],
        result: finalizedResult,
        state: cloneState(state),
      })
    }

    state.currentStage = null
    state.status = "completed"
    transcript.currentStage = null
    transcript.status = "completed"
    transcript.completedAt = now().toISOString()
    await persistTranscript(transcript, transcriptPath)

    return {
      state: cloneState(state),
      decision,
      transcriptAvailable: true,
      transcriptId: runId,
      transcriptPath,
    } satisfies DebateCompletion
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failedStageKey = state.currentStage
    const stageDefinition = failedStageKey ? getStageDefinition(failedStageKey) : null
    const actorModel = stageDefinition ? state.roles[stageDefinition.actorRole] : null
    const attemptCount = error instanceof DebateStageExecutionError ? error.attemptCount : 1
    const maxAttempts = error instanceof DebateStageExecutionError ? error.maxAttempts : reliability.maxStageAttempts
    const retryable = error instanceof DebateStageExecutionError ? error.retryable : false

    state.status = "failed"
    state.error = message
    transcript.status = "failed"
    transcript.error = message
    transcript.completedAt = now().toISOString()
    transcript.failedStage = failedStageKey ?? undefined

    if (failedStageKey) {
      updateStageStatus(state, failedStageKey, "failed")
      const failedStage = getTranscriptStage(transcript, failedStageKey)
      failedStage.status = "failed"
      failedStage.output.error = message
      failedStage.output.attemptCount = attemptCount
    }

    await persistTranscript(transcript, transcriptPath)
    throw new DebateStageExecutionError(
      message,
      failedStageKey,
      stageDefinition?.label ?? null,
      actorModel,
      attemptCount,
      maxAttempts,
      retryable,
      runId,
      transcriptPath,
      { cause: error instanceof Error ? error : undefined },
    )
  }
}
