import type { DebateRoleConfig } from "../app/config.js"
import type { DebateStageKey } from "./stages.js"

export type StageStatus = "pending" | "running" | "completed" | "failed"

export interface DebateStageResult {
  stageKey?: DebateStageKey
  sessionId?: string
  providerId?: string
  modelId?: string
  messageId?: string
  system?: string
  prompt?: string
  content?: string
  placeholder?: string
  error?: string
  attemptCount?: number
  startedAt?: string
  completedAt?: string
  durationMs?: number
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
  status: "pending" | "running" | "completed" | "failed"
  stages: DebateStageState[]
  error?: string
}
