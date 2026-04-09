import { describe, expect, it, vi } from "vitest"

import { runInspectCommand } from "../../src/cli/run-inspect-command.js"

describe("runInspectCommand", () => {
  it("loads a saved transcript and renders ordered stage sections", async () => {
    const log = vi.fn()
    const loadTranscript = vi.fn().mockResolvedValue({
      runId: "run-42",
      status: "completed",
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      startedAt: "2026-04-05T00:00:00.000Z",
      completedAt: "2026-04-05T00:00:06.000Z",
      currentStage: null,
      stages: [
        {
          key: "answer_a",
          label: "Answer A",
          actorRole: "debaterA",
          actorModel: "openai/gpt-5",
          status: "completed",
          durationMs: 1000,
          input: { prompt: "Question: Should tests come first?" },
          output: { content: "Opening answer from Debater A", sessionId: "session-1" },
        },
        {
          key: "revise_a",
          label: "Revise A",
          actorRole: "debaterA",
          actorModel: "openai/gpt-5",
          status: "completed",
          input: { placeholder: "No stage prompt was sent because this step is still a visible placeholder." },
          output: { placeholder: "This stage is part of the fixed debate flow, but model-backed output is not implemented yet." },
        },
      ],
    })

    const record = await runInspectCommand("run-42", { loadTranscript, log })

    expect(loadTranscript).toHaveBeenCalledWith("run-42", undefined)
    expect(record.runId).toBe("run-42")
    expect(log).toHaveBeenCalledTimes(1)

    const output = log.mock.calls[0][0]
    expect(output).toContain("Transcript run-42")
    expect(output).toContain("1. Answer A [completed]")
    expect(output).toContain("Session: session-1")
    expect(output).toContain("Opening answer from Debater A")
    expect(output).toContain("2. Revise A [completed]")
    expect(output).toContain("Placeholder: This stage is part of the fixed debate flow, but model-backed output is not implemented yet.")
  })

  it("shows partial-run markers for failed transcripts", async () => {
    const log = vi.fn()
    const loadTranscript = vi.fn().mockResolvedValue({
      runId: "run-43",
      status: "failed",
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      startedAt: "2026-04-05T00:00:00.000Z",
      completedAt: "2026-04-05T00:00:04.000Z",
      currentStage: "answer_b",
      failedStage: "answer_b",
      error: "Failed to run answer_b with anthropic/claude-sonnet-4-5: temporary timeout.",
      stages: [
        {
          key: "answer_a",
          label: "Answer A",
          actorRole: "debaterA",
          actorModel: "openai/gpt-5",
          status: "completed",
          durationMs: 1000,
          input: { prompt: "Question: Should tests come first?" },
          output: { content: "Opening answer from Debater A", sessionId: "session-1" },
        },
        {
          key: "answer_b",
          label: "Answer B",
          actorRole: "debaterB",
          actorModel: "anthropic/claude-sonnet-4-5",
          status: "failed",
          input: { prompt: "Question: Should tests come first?" },
          output: {
            error: "Failed to run answer_b with anthropic/claude-sonnet-4-5: temporary timeout.",
            attemptCount: 3,
          },
        },
      ],
    })

    await runInspectCommand("run-43", { loadTranscript, log })

    const output = log.mock.calls[0][0]
    expect(output).toContain("Status: failed (partial transcript preserved)")
    expect(output).toContain("Failed stage: Answer B")
    expect(output).toContain("Attempts: 3")
  })
})
