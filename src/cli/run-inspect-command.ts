import { loadDebateTranscriptRecord } from "../debate/transcript.js"
import { renderTranscriptInspection } from "./render.js"

export interface InspectCommandRuntime {
  loadTranscript?: typeof loadDebateTranscriptRecord
  log?: (message: string) => void
  transcriptPath?: string
}

export async function runInspectCommand(runId: string, runtime: InspectCommandRuntime = {}) {
  const loadTranscript = runtime.loadTranscript ?? loadDebateTranscriptRecord
  const log = runtime.log ?? console.log

  const record = await loadTranscript(runId, runtime.transcriptPath)
  log(renderTranscriptInspection(record))

  return record
}
