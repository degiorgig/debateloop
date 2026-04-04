import type { DebateRoleConfig } from "../app/config.js"
import type { DebateStageKey } from "./stages.js"

export type StageStatus = "pending" | "running" | "completed"

export interface DebateStageState {
  key: DebateStageKey
  status: StageStatus
}

export interface DebateRunState {
  question: string
  roles: DebateRoleConfig
  currentStage: DebateStageKey | null
  status: "pending" | "running" | "completed"
  stages: DebateStageState[]
}
