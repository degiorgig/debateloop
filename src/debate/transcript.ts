import fs from "node:fs/promises"
import path from "node:path"

import type { DebateRoleConfig } from "../app/config.js"
import { getTranscriptRunPath } from "../app/paths.js"
import { DEBATE_STAGES, type DebateRole, type DebateStageKey } from "./stages.js"

export interface DebateTranscriptStageRecord {
  key: DebateStageKey
  label: string
  actorRole: DebateRole
  actorModel: string
  status: "pending" | "running" | "completed" | "failed"
  startedAt?: string
  completedAt?: string
  durationMs?: number
  input: {
    system?: string
    prompt?: string
    placeholder?: string
  }
  output: {
    content?: string
    placeholder?: string
    sessionId?: string
    providerId?: string
    modelId?: string
    messageId?: string
    error?: string
    attemptCount?: number
  }
}

export interface DebateTranscriptRecord {
  runId: string
  status: "running" | "completed" | "failed"
  question: string
  roles: DebateRoleConfig
  startedAt: string
  completedAt?: string
  currentStage: DebateStageKey | null
  failedStage?: DebateStageKey
  stages: DebateTranscriptStageRecord[]
  error?: string
}

export class DebateTranscriptError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "DebateTranscriptError"
  }
}

export function createDebateTranscriptRecord(options: {
  runId: string
  question: string
  roles: DebateRoleConfig
  startedAt: string
}) {
  return {
    runId: options.runId,
    status: "running",
    question: options.question,
    roles: options.roles,
    startedAt: options.startedAt,
    currentStage: null,
    stages: DEBATE_STAGES.map((stage) => ({
      key: stage.key,
      label: stage.label,
      actorRole: stage.actorRole,
      actorModel: options.roles[stage.actorRole],
      status: "pending",
      input: {},
      output: {},
    })),
  } satisfies DebateTranscriptRecord
}

export async function saveDebateTranscriptRecord(record: DebateTranscriptRecord, transcriptPath = getTranscriptRunPath(record.runId)) {
  const directory = path.dirname(transcriptPath)
  const tempPath = path.join(directory, `${path.basename(transcriptPath)}.tmp`)

  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8")
  await fs.rename(tempPath, transcriptPath)
  return transcriptPath
}

export async function loadDebateTranscriptRecord(runId: string, transcriptPath = getTranscriptRunPath(runId)) {
  try {
    const raw = await fs.readFile(transcriptPath, "utf8")
    return JSON.parse(raw) as DebateTranscriptRecord
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new DebateTranscriptError(`No saved transcript found for run "${runId}".`)
    }

    throw new DebateTranscriptError(`Could not load transcript "${runId}".`, {
      cause: error instanceof Error ? error : undefined,
    })
  }
}
