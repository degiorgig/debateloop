import { describe, expect, it } from "vitest"

import { renderCompletion, renderFailure, renderTranscriptInspection } from "../../src/cli/render.js"

function stripAnsi(value: string) {
  return value.replace(/\u001B\[[0-9;]*m/g, "")
}

describe("renderCompletion", () => {
  it("renders a winner-first final result and hides the losing answer", () => {
    const output = stripAnsi(renderCompletion({
      config: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
        reliability: {
          maxStageAttempts: 3,
          stageTimeoutMs: 30000,
          retryBackoffMs: 750,
        },
      },
      usedSetup: false,
      decision: {
        winner: "debaterB",
        winnerModel: "anthropic/claude-sonnet-4-5",
        winningAnswer: "Debater B final revised answer.",
        rationale: "Debater B stayed correct while addressing the critique more directly.",
      },
      transcriptAvailable: true,
      transcriptId: "run-42",
      transcriptPath: "/tmp/run-42.json",
    }))

    expect(output).toContain("Winner: Debater B (anthropic/claude-sonnet-4-5)")
    expect(output).toContain("Winning Answer:\nDebater B final revised answer.")
    expect(output).toContain("Rationale: Debater B stayed correct while addressing the critique more directly.")
    expect(output).toContain("Inspect: debateloop inspect run-42")
    expect(output).not.toContain("Decision: pending")
    expect(output).not.toContain("Debater A final revised answer")
  })

  it("renders a stage-aware failure with transcript guidance", () => {
    const output = stripAnsi(renderFailure({
      error: "Failed to run Answer B because the provider timed out.",
      stage: {
        label: "Answer B",
        actorModel: "anthropic/claude-sonnet-4-5",
      },
      transcriptAvailable: true,
      transcriptId: "run-42",
      transcriptPath: "/tmp/run-42.json",
    }))

    expect(output).toContain("Debate failed")
    expect(output).toContain("Stage: Answer B (anthropic/claude-sonnet-4-5)")
    expect(output).toContain("Reason: Failed to run Answer B because the provider timed out.")
    expect(output).toContain("Transcript: partial run saved as run-42")
    expect(output).toContain("Inspect: debateloop inspect run-42")
    expect(output).toContain("inspect the partial transcript before retrying")
  })

  it("marks failed transcript inspection output as partial and preserves attempts", () => {
    const output = stripAnsi(renderTranscriptInspection({
      runId: "run-42",
      status: "failed",
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      startedAt: "2026-04-05T00:00:00.000Z",
      completedAt: "2026-04-05T00:00:06.000Z",
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
          output: { content: "Opening answer from Debater A", sessionId: "session-1", attemptCount: 1 },
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
        {
          key: "critique_a",
          label: "Critique A",
          actorRole: "debaterA",
          actorModel: "openai/gpt-5",
          status: "pending",
          input: {},
          output: {},
        },
        {
          key: "critique_b",
          label: "Critique B",
          actorRole: "debaterB",
          actorModel: "anthropic/claude-sonnet-4-5",
          status: "pending",
          input: {},
          output: {},
        },
        {
          key: "revise_a",
          label: "Revise A",
          actorRole: "debaterA",
          actorModel: "openai/gpt-5",
          status: "pending",
          input: {},
          output: {},
        },
        {
          key: "revise_b",
          label: "Revise B",
          actorRole: "debaterB",
          actorModel: "anthropic/claude-sonnet-4-5",
          status: "pending",
          input: {},
          output: {},
        },
        {
          key: "final_decision",
          label: "Final decision",
          actorRole: "judge",
          actorModel: "google/gemini-2.5-pro",
          status: "pending",
          input: {},
          output: {},
        },
      ],
    }))

    expect(output).toContain("Status: failed (partial transcript preserved)")
    expect(output).toContain("Completed stages: 1/7")
    expect(output).toContain("Failed stage: Answer B")
    expect(output).toContain("Failure: Failed to run answer_b with anthropic/claude-sonnet-4-5: temporary timeout.")
    expect(output).toContain("Attempts: 3")
  })
})
