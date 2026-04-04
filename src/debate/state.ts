import type { DebateRoleConfig } from "../app/config.js"
import type { DebateStageKey } from "./stages.js"

export type StageStatus = "pending" | "running" | "completed"

export interface DebateStageResult {
  sessionId?: string
  content?: string
}

export interface DebateStageState {
  key: DebateStageKey
  status: StageStatus
  result?: DebateStageResult
}

export interface DebateRunState {
  question: string
  roles: DebateRoleConfig
  currentStage: DebateStageKey | null
  status: "pending" | "running" | "completed"
  stages: DebateStageState[]
}
