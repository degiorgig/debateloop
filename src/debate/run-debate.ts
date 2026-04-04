import type { DebateRoleConfig } from "../app/config.js"
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

export async function runDebate(options: {
  question: string
  roles: DebateRoleConfig
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
    state.currentStage = stage.key
    updateStageStatus(state, stage.key, "running")

    await options.onStageStart?.({
      stage,
      actorModel: options.roles[stage.actorRole],
      state: cloneState(state),
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
