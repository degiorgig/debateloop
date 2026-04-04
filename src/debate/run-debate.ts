import type { DebateRoleConfig } from "../app/config.js"
import type { OpencodeClient, Part } from "@opencode-ai/sdk"
import { buildCritiquePrompt, buildInitialAnswerPrompt, getSharedDebateFraming } from "./prompts.js"
import { toSdkModelRef } from "../opencode/models.js"
import type { DebateStageDefinition } from "./stages.js"
import { DEBATE_STAGES } from "./stages.js"
import type { DebateRunState, DebateStageState } from "./state.js"

export interface DebateProgressEvent {
  stage: DebateStageDefinition
  actorModel: string
  state: DebateRunState
}

export interface DebateCompletion {
  state: DebateRunState
  transcriptAvailable: boolean
}

export interface DebateSessionClient {
  create: OpencodeClient["session"]["create"]
  prompt: OpencodeClient["session"]["prompt"]
}

type DebaterRole = "debaterA" | "debaterB"

function extractText(parts: Part[]) {
  return parts
    .filter((part): part is Extract<Part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim()
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
}

function isDebaterRole(role: DebateStageDefinition["actorRole"]): role is DebaterRole {
  return role === "debaterA" || role === "debaterB"
}

async function runModelStage(options: {
  sessionClient: DebateSessionClient
  stageKey: DebateStageDefinition["key"]
  title: string
  modelId: string
  prompt: string
}) {
  const created = await options.sessionClient.create({
    body: { title: options.title },
  })
  const sessionId = created.data?.id

  if (!sessionId) {
    throw new Error(`OpenCode did not return a session id for ${options.stageKey}.`)
  }

  const response = await options.sessionClient.prompt({
    path: { id: sessionId },
    body: {
      model: toSdkModelRef(options.modelId),
      system: getSharedDebateFraming(),
      parts: [{ type: "text", text: options.prompt }],
    },
  })

  if (!response.data) {
    throw new Error(`OpenCode did not return a response payload for ${options.stageKey}.`)
  }

  if (response.data.info.error) {
    const message = response.data.info.error.data.message ?? "Unknown model execution error."

    throw new Error(`Failed to run ${options.stageKey} with ${options.modelId}: ${message}`)
  }

  const content = extractText(response.data.parts)

  if (!content) {
    throw new Error(`OpenCode returned no text content for ${options.stageKey} with ${options.modelId}.`)
  }

  return {
    stageKey: options.stageKey,
    sessionId,
    content,
  }
}

async function maybeRunStage(options: {
  sessionClient?: DebateSessionClient
  state: DebateRunState
  stage: DebateStageDefinition
}) {
  if (!options.sessionClient) {
    return
  }

  const actorModel = options.state.roles[options.stage.actorRole]

  if (options.stage.key === "answer_a" || options.stage.key === "answer_b") {
    if (!isDebaterRole(options.stage.actorRole)) {
      throw new Error(`Unexpected actor role for ${options.stage.key}.`)
    }

    const result = await runModelStage({
      sessionClient: options.sessionClient,
      stageKey: options.stage.key,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildInitialAnswerPrompt({
        question: options.state.question,
        actorRole: options.stage.actorRole,
      }),
    })

    updateStageResult(options.state, options.stage.key, result)
    return
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
      stageKey: options.stage.key,
      title: `Debate ${options.stage.key}`,
      modelId: actorModel,
      prompt: buildCritiquePrompt({
        question: options.state.question,
        actorRole: options.stage.actorRole,
        actorAnswer,
        opponentAnswer,
      }),
    })

    updateStageResult(options.state, options.stage.key, result)
    return
  }

  // Revise and judge stages stay as placeholders until later phases.
}

export async function runDebate(options: {
  question: string
  roles: DebateRoleConfig
  sessionClient?: DebateSessionClient
  onStageStart?: (event: DebateProgressEvent) => Promise<void> | void
}) {
  const state: DebateRunState = {
    question: options.question,
    roles: options.roles,
    currentStage: null,
    status: "running",
    stages: createStageState(),
  }

  for (const stage of DEBATE_STAGES) {
    assertStagePrerequisites(state, stage)

    state.currentStage = stage.key
    updateStageStatus(state, stage.key, "running")

    await options.onStageStart?.({
      stage,
      actorModel: options.roles[stage.actorRole],
      state: cloneState(state),
    })

    await maybeRunStage({
      sessionClient: options.sessionClient,
      state,
      stage,
    })

    updateStageStatus(state, stage.key, "completed")
  }

  state.currentStage = null
  state.status = "completed"

  return {
    state: cloneState(state),
    transcriptAvailable: false,
  } satisfies DebateCompletion
}
