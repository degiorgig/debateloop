import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { describe, expect, it, vi } from "vitest"

import { runDebate } from "../../src/debate/run-debate.js"
import { runAskCommand } from "../../src/cli/run-ask-command.js"
import * as resolveRunConfigModule from "../../src/cli/resolve-run-config.js"
import { loadDebateTranscriptRecord } from "../../src/debate/transcript.js"

const SHARED_DEBATE_FRAMING = [
  "You are participating in a structured two-model debate.",
  "Write a clear, useful response that takes a position without pretending it is the final verdict.",
  "Stay grounded, balanced, and moderately opinionated.",
].join("\n")

function stripAnsi(value: string) {
  return value.replace(/\u001B\[[0-9;]*m/g, "")
}

function createMockClient() {
  return {
    config: {
      providers: vi.fn().mockResolvedValue({
        data: {
          providers: [
            {
              id: "openai",
              name: "OpenAI",
              source: "config",
              env: [],
              options: {},
              models: {
                "gpt-5": {
                  id: "gpt-5",
                  name: "GPT-5",
                  release_date: "2026-01-01",
                  attachment: false,
                  reasoning: true,
                  temperature: true,
                  tool_call: true,
                  cost: { input: 1, output: 2, cache: { read: 0, write: 0 } },
                  limit: { context: 200000, output: 8000 },
                  status: "active",
                  options: {},
                  headers: {},
                },
              },
            },
            {
              id: "anthropic",
              name: "Anthropic",
              source: "config",
              env: [],
              options: {},
              models: {
                "claude-sonnet-4-5": {
                  id: "claude-sonnet-4-5",
                  name: "Claude Sonnet 4.5",
                  release_date: "2026-01-01",
                  attachment: false,
                  reasoning: true,
                  temperature: true,
                  tool_call: true,
                  cost: { input: 1, output: 2, cache: { read: 0, write: 0 } },
                  limit: { context: 200000, output: 8000 },
                  status: "active",
                  options: {},
                  headers: {},
                },
              },
            },
            {
              id: "google",
              name: "Google",
              source: "config",
              env: [],
              options: {},
              models: {
                "gemini-2.5-pro": {
                  id: "gemini-2.5-pro",
                  name: "Gemini 2.5 Pro",
                  release_date: "2026-01-01",
                  attachment: false,
                  reasoning: true,
                  temperature: true,
                  tool_call: true,
                  cost: { input: 1, output: 2, cache: { read: 0, write: 0 } },
                  limit: { context: 200000, output: 8000 },
                  status: "active",
                  options: {},
                  headers: {},
                },
              },
            },
          ],
          default: {},
        },
      }),
    },
  }
}

function createMockSessionClient() {
  let sessionCount = 0
  const responses = [
    "Opening answer from Debater A",
    "Opening answer from Debater B",
    "Critique from Debater A",
    "Critique from Debater B",
    "Final revised answer from Debater A",
    "Final revised answer from Debater B",
    '{"winner":"debaterB","rationale":"Debater B addressed the critique more directly while staying clear and correct."}',
  ]

  return {
    create: vi.fn().mockImplementation(async () => ({
      data: { id: `session-${++sessionCount}` },
    })),
    prompt: vi.fn().mockImplementation(async (options) => {
      const responseText = responses.shift() ?? `mock response ${sessionCount}`

      return {
        data: {
          info: {
            id: `message-${sessionCount}`,
            sessionID: options.path.id,
            role: "assistant",
            time: { created: Date.now() },
            parentID: `parent-${sessionCount}`,
            modelID: options.body?.model?.modelID ?? "unknown",
            providerID: options.body?.model?.providerID ?? "unknown",
            mode: "build",
            path: { cwd: "/tmp", root: "/tmp" },
            cost: 0,
            tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          },
          parts: [
            {
              id: `part-${sessionCount}`,
              sessionID: options.path.id,
              messageID: `message-${sessionCount}`,
              type: "text",
              text: responseText,
            },
          ],
        },
      }
    }),
  }
}

async function createTempTranscriptPath(fileName = "run.json") {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "debateloop-transcript-"))
  return path.join(directory, fileName)
}

describe("runAskCommand", () => {
  it("runs the fixed stage order, logs progress, and closes OpenCode once", async () => {
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const resolveSpy = vi.spyOn(resolveRunConfigModule, "resolveRunConfig").mockResolvedValue({
      activeRoles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      activeReliability: {
        maxStageAttempts: 3,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: false,
        reliability: {
          maxStageAttempts: 3,
          stageTimeoutMs: 60000,
          retryBackoffMs: 0,
        },
      },
      usedSetup: true,
    })

    const sessionClient = createMockSessionClient()

    await runAskCommand(
      "Should tests come first?",
      {},
      {
        configPath: "/tmp/debateloop-config.json",
        createRunId: () => "run-ask-1",
        transcriptPath: await createTempTranscriptPath("run-ask-1.json"),
        startOpenCode: async () => ({
          client: {
            ...createMockClient(),
            session: sessionClient,
          } as never,
          close,
        }),
        saveConfig,
        log,
      },
    )

    const lines = log.mock.calls.map(([message]) => stripAnsi(message))

    expect(lines).toContain(
      "Active models: Debater A: openai/gpt-5 | Debater B: anthropic/claude-sonnet-4-5 | Judge: google/gemini-2.5-pro",
    )
    expect(lines).toContain("Debate stages:\n  1. Answer A\n  2. Answer B\n  3. Critique A\n  4. Critique B\n  5. Revise A\n  6. Revise B\n  7. Final decision")
    expect(lines).toContain(
      "Independent opening answers: Debater A and Debater B each answer in isolation before the cross-critique exchange begins.",
    )
    expect(lines.filter((line) => line.startsWith("Running "))).toEqual([
      "Running Answer A with openai/gpt-5",
      "Running Answer B with anthropic/claude-sonnet-4-5",
      "Running Critique A with openai/gpt-5",
      "Running Critique B with anthropic/claude-sonnet-4-5",
      "Running Revise A with openai/gpt-5",
      "Running Revise B with anthropic/claude-sonnet-4-5",
      "Running Final decision with google/gemini-2.5-pro",
    ])
    expect(lines[lines.length - 1]).toContain("Winner: Debater B (anthropic/claude-sonnet-4-5)")
    expect(lines[lines.length - 1]).toContain("Winning Answer:")
    expect(lines[lines.length - 1]).toContain("Final revised answer from Debater B")
    expect(lines[lines.length - 1]).toContain("Rationale: Debater B addressed the critique more directly while staying clear and correct.")
    expect(lines[lines.length - 1]).toContain("Transcript: saved as run-ask-1")
    expect(lines[lines.length - 1]).toContain("Inspect: debateloop inspect run-ask-1")
    expect(lines[lines.length - 1]).not.toContain("Final revised answer from Debater A")
    expect(lines[lines.length - 1]).toContain("Hint: run `debateloop ask \"Should tests come first?\"`")
    expect(saveConfig).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(sessionClient.create).toHaveBeenCalledTimes(7)
    expect(sessionClient.prompt).toHaveBeenCalledTimes(7)

    resolveSpy.mockRestore()
  })

  it("suppresses the first-run hint once it has already been shown", async () => {
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const sessionClient = createMockSessionClient()
    const startOpenCode = async () => ({
      client: {
        ...createMockClient(),
        session: sessionClient,
      } as never,
      close,
    })

    const module = await import("../../src/cli/resolve-run-config.js")
    const spy = vi.spyOn(module, "resolveRunConfig").mockResolvedValue({
      activeRoles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      activeReliability: {
        maxStageAttempts: 3,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
        reliability: {
          maxStageAttempts: 3,
          stageTimeoutMs: 60000,
          retryBackoffMs: 0,
        },
      },
      usedSetup: false,
    })

    await runAskCommand("Question", {}, {
      startOpenCode,
      saveConfig,
      log,
      createRunId: () => "run-ask-2",
      transcriptPath: await createTempTranscriptPath("run-ask-2.json"),
    })

    const completionLine = stripAnsi(log.mock.calls[log.mock.calls.length - 1]?.[0] as string)
    expect(completionLine).not.toContain("Hint: run `debateloop ask")
    expect(saveConfig).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)

    spy.mockRestore()
  })

  it("logs every stage output when debug is enabled", async () => {
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const resolveSpy = vi.spyOn(resolveRunConfigModule, "resolveRunConfig").mockResolvedValue({
      activeRoles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      activeReliability: {
        maxStageAttempts: 3,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
        reliability: {
          maxStageAttempts: 3,
          stageTimeoutMs: 60000,
          retryBackoffMs: 0,
        },
      },
      usedSetup: false,
    })

    await runAskCommand(
      "Should tests come first?",
      {},
      {
        debug: true,
        createRunId: () => "run-ask-debug",
        transcriptPath: await createTempTranscriptPath("run-ask-debug.json"),
        startOpenCode: async () => ({
          client: {
            ...createMockClient(),
            session: createMockSessionClient(),
          } as never,
          close,
        }),
        saveConfig,
        log,
      },
    )

    const lines = log.mock.calls.map(([message]) => stripAnsi(message))

    expect(lines).toContain("Debug output: Answer A (openai/gpt-5)\nOpening answer from Debater A")
    expect(lines).toContain("Debug output: Answer B (anthropic/claude-sonnet-4-5)\nOpening answer from Debater B")
    expect(lines).toContain("Debug output: Critique A (openai/gpt-5)\nCritique from Debater A")
    expect(lines).toContain("Debug output: Critique B (anthropic/claude-sonnet-4-5)\nCritique from Debater B")
    expect(lines).toContain("Debug output: Revise A (openai/gpt-5)\nFinal revised answer from Debater A")
    expect(lines).toContain("Debug output: Revise B (anthropic/claude-sonnet-4-5)\nFinal revised answer from Debater B")
    expect(lines).toContain(
      'Debug output: Final decision (google/gemini-2.5-pro)\n{"winner":"debaterB","rationale":"Debater B addressed the critique more directly while staying clear and correct."}',
    )

    resolveSpy.mockRestore()
  })

  it("keeps opening answers independent and shares both answers during critique", async () => {
    const sessionClient = createMockSessionClient()
    const transcriptPath = await createTempTranscriptPath("run-debate-success.json")

    const completion = await runDebate({
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      sessionClient,
      createRunId: () => "run-success-1",
      transcriptPath,
      now: (() => {
        let index = 0
        const values = [
          "2026-04-05T00:00:00.000Z",
          "2026-04-05T00:00:01.000Z",
          "2026-04-05T00:00:02.000Z",
          "2026-04-05T00:00:03.000Z",
          "2026-04-05T00:00:04.000Z",
          "2026-04-05T00:00:05.000Z",
          "2026-04-05T00:00:06.000Z",
          "2026-04-05T00:00:07.000Z",
          "2026-04-05T00:00:08.000Z",
          "2026-04-05T00:00:09.000Z",
          "2026-04-05T00:00:10.000Z",
          "2026-04-05T00:00:11.000Z",
          "2026-04-05T00:00:12.000Z",
          "2026-04-05T00:00:13.000Z",
          "2026-04-05T00:00:14.000Z",
          "2026-04-05T00:00:15.000Z",
        ]

        return () => new Date(values[index++] ?? values[values.length - 1] ?? "2026-04-05T00:00:15.000Z")
      })(),
    })

    expect(sessionClient.create).toHaveBeenCalledTimes(7)
    expect(sessionClient.prompt).toHaveBeenCalledTimes(7)
    expect(completion.transcriptAvailable).toBe(true)
    expect(completion.transcriptId).toBe("run-success-1")
    expect(completion.transcriptPath).toBe(transcriptPath)
    expect(sessionClient.create.mock.calls).toEqual([
      [{ body: { title: "Debate answer_a" } }],
      [{ body: { title: "Debate answer_b" } }],
      [{ body: { title: "Debate critique_a" } }],
      [{ body: { title: "Debate critique_b" } }],
      [{ body: { title: "Debate revise_a" } }],
      [{ body: { title: "Debate revise_b" } }],
      [{ body: { title: "Debate final_decision" } }],
    ])

    const promptCalls = sessionClient.prompt.mock.calls.map(([call]) => call)
    const answerACall = promptCalls[0]
    const answerBCall = promptCalls[1]
    const critiqueACall = promptCalls[2]
    const critiqueBCall = promptCalls[3]
    const reviseACall = promptCalls[4]
    const reviseBCall = promptCalls[5]
    const judgeCall = promptCalls[6]

    expect(answerACall.path).toEqual({ id: "session-1" })
    expect(answerBCall.path).toEqual({ id: "session-2" })
    expect(critiqueACall.path).toEqual({ id: "session-3" })
    expect(critiqueBCall.path).toEqual({ id: "session-4" })
    expect(answerACall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(answerBCall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(critiqueACall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(critiqueBCall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(reviseACall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(reviseBCall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(judgeCall.body.system).toBe(SHARED_DEBATE_FRAMING)

    const answerAPrompt = promptCalls[0].body.parts[0].text as string
    const answerBPrompt = promptCalls[1].body.parts[0].text as string
    const critiqueAPrompt = promptCalls[2].body.parts[0].text as string
    const critiqueBPrompt = promptCalls[3].body.parts[0].text as string
    const reviseAPrompt = promptCalls[4].body.parts[0].text as string
    const reviseBPrompt = promptCalls[5].body.parts[0].text as string
    const judgePrompt = promptCalls[6].body.parts[0].text as string

    expect(answerAPrompt).toContain("Question: Should tests come first?")
    expect(answerBPrompt).toContain("Question: Should tests come first?")
    expect(answerAPrompt).toContain("Debater A: lead with a direct recommendation")
    expect(answerBPrompt).toContain("Debater B: stress-test assumptions")
    expect(answerAPrompt).toContain("Write an initial answer to the user's question.")
    expect(answerBPrompt).toContain("Write an initial answer to the user's question.")
    expect(answerBPrompt).not.toContain("Opponent opening answer")
    expect(answerBPrompt).not.toContain("Your opening answer")
    expect(answerBPrompt).not.toContain("Opening answer from Debater A")
    expect(answerAPrompt).not.toContain("Opponent opening answer")
    expect(answerAPrompt).not.toContain("Your opening answer")
    expect(answerAPrompt).not.toContain("Opening answer from Debater B")

    const answerAResult = completion.state.stages.find((stage) => stage.key === "answer_a")?.result?.content
    const answerBResult = completion.state.stages.find((stage) => stage.key === "answer_b")?.result?.content
    const critiqueAStage = completion.state.stages.find((stage) => stage.key === "critique_a")
    const critiqueBStage = completion.state.stages.find((stage) => stage.key === "critique_b")
    const reviseAStage = completion.state.stages.find((stage) => stage.key === "revise_a")
    const reviseBStage = completion.state.stages.find((stage) => stage.key === "revise_b")
    const decisionStage = completion.state.stages.find((stage) => stage.key === "final_decision")

    expect(answerAResult).toBe("Opening answer from Debater A")
    expect(answerBResult).toBe("Opening answer from Debater B")
    expect(critiqueAStage?.status).toBe("completed")
    expect(critiqueBStage?.status).toBe("completed")
    expect(critiqueAStage?.result).toMatchObject({
      sessionId: "session-3",
      stageKey: "critique_a",
      content: "Critique from Debater A",
    })
    expect(critiqueBStage?.result).toMatchObject({
      sessionId: "session-4",
      stageKey: "critique_b",
      content: "Critique from Debater B",
    })
    expect(reviseAStage?.result).toMatchObject({
      sessionId: "session-5",
      stageKey: "revise_a",
      content: "Final revised answer from Debater A",
    })
    expect(reviseBStage?.result).toMatchObject({
      sessionId: "session-6",
      stageKey: "revise_b",
      content: "Final revised answer from Debater B",
    })
    expect(decisionStage?.result).toMatchObject({
      sessionId: "session-7",
      stageKey: "final_decision",
      content:
        '{"winner":"debaterB","rationale":"Debater B addressed the critique more directly while staying clear and correct."}',
    })
    expect(completion.decision).toEqual({
      winner: "debaterB",
      winnerModel: "anthropic/claude-sonnet-4-5",
      winningAnswer: "Final revised answer from Debater B",
      rationale: "Debater B addressed the critique more directly while staying clear and correct.",
    })

    expect(completion.state.stages.filter((stage) => stage.key.startsWith("answer_") || stage.key.startsWith("critique_"))).toMatchObject([
      {
        key: "answer_a",
        status: "completed",
        result: {
          stageKey: "answer_a",
          sessionId: "session-1",
          content: "Opening answer from Debater A",
        },
      },
      {
        key: "answer_b",
        status: "completed",
        result: {
          stageKey: "answer_b",
          sessionId: "session-2",
          content: "Opening answer from Debater B",
        },
      },
      {
        key: "critique_a",
        status: "completed",
        result: {
          stageKey: "critique_a",
          sessionId: "session-3",
          content: "Critique from Debater A",
        },
      },
      {
        key: "critique_b",
        status: "completed",
        result: {
          stageKey: "critique_b",
          sessionId: "session-4",
          content: "Critique from Debater B",
        },
      },
    ])

    expect(critiqueAPrompt).toContain("You are now in the critique round.")
    expect(critiqueAPrompt).toContain("You are Debater A and you are critiquing Debater B.")
    expect(critiqueAPrompt).toContain(`Your opening answer:\n${answerAResult}`)
    expect(critiqueAPrompt).toContain(`Opponent opening answer:\n${answerBResult}`)
    expect(critiqueAPrompt).toContain("Critique the opposing debater's opening answer against your own answer instead of writing a generic follow-up or a revised final answer.")
    expect(critiqueBPrompt).toContain("You are Debater B and you are critiquing Debater A.")
    expect(critiqueBPrompt).toContain(`Your opening answer:\n${answerBResult}`)
    expect(critiqueBPrompt).toContain(`Opponent opening answer:\n${answerAResult}`)
    expect(critiqueBPrompt).toContain("Critique the opposing debater's opening answer against your own answer instead of writing a generic follow-up or a revised final answer.")
    expect(reviseAPrompt).toContain("You are now in the final revision round.")
    expect(reviseAPrompt).toContain(`Your opening answer:\n${answerAResult}`)
    expect(reviseAPrompt).toContain("Opponent critique of your answer:\nCritique from Debater B")
    expect(reviseAPrompt).toContain("balanced revision, not a tiny patch and not a full from-scratch replacement")
    expect(reviseAPrompt).toContain("preserve your distinct voice and structure")
    expect(reviseBPrompt).toContain(`Your opening answer:\n${answerBResult}`)
    expect(reviseBPrompt).toContain("Opponent critique of your answer:\nCritique from Debater A")
    expect(judgePrompt).toContain("Return ONLY valid JSON with this exact shape:")
    expect(judgePrompt).toContain(`Debater A revised answer:\nFinal revised answer from Debater A`)
    expect(judgePrompt).toContain(`Debater B revised answer:\nFinal revised answer from Debater B`)

    const transcript = await loadDebateTranscriptRecord("run-success-1", transcriptPath)
    expect(transcript.status).toBe("completed")
    expect(transcript.question).toBe("Should tests come first?")
    expect(transcript.stages.map((stage) => [stage.key, stage.status])).toEqual([
      ["answer_a", "completed"],
      ["answer_b", "completed"],
      ["critique_a", "completed"],
      ["critique_b", "completed"],
      ["revise_a", "completed"],
      ["revise_b", "completed"],
      ["final_decision", "completed"],
    ])
    expect(transcript.stages.find((stage) => stage.key === "answer_a")).toMatchObject({
      actorRole: "debaterA",
      actorModel: "openai/gpt-5",
      input: {
        system: SHARED_DEBATE_FRAMING,
      },
      output: {
        content: "Opening answer from Debater A",
        sessionId: "session-1",
        providerId: "openai",
        modelId: "gpt-5",
      },
    })
    expect(transcript.stages.find((stage) => stage.key === "revise_a")).toMatchObject({
      status: "completed",
      input: {
        prompt: expect.stringContaining("You are now in the final revision round."),
      },
      output: {
        content: "Final revised answer from Debater A",
        sessionId: "session-5",
      },
    })
    expect(transcript.stages.find((stage) => stage.key === "final_decision")).toMatchObject({
      status: "completed",
      input: {
        prompt: expect.stringContaining("Return ONLY valid JSON with this exact shape:"),
      },
      output: {
        content:
          '{"winner":"debaterB","rationale":"Debater B addressed the critique more directly while staying clear and correct."}',
        sessionId: "session-7",
        attemptCount: 1,
      },
    })
  })

  it("retries recoverable stage failures and preserves the final attempt count", async () => {
    let sessionCount = 0
    const retryableError = {
      name: "APIError",
      data: {
        message: "Temporary provider timeout.",
        isRetryable: true,
      },
    }

    const sessionClient = {
      create: vi.fn().mockImplementation(async () => ({
        data: { id: `session-${++sessionCount}` },
      })),
      prompt: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-1",
              sessionID: "session-1",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-1",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
              error: retryableError,
            },
            parts: [],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-2",
              sessionID: "session-2",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-2",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: "part-2",
                sessionID: "session-2",
                messageID: "message-2",
                type: "text",
                text: "Opening answer from Debater A after retry",
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-3",
              sessionID: "session-3",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-3",
              modelID: "claude-sonnet-4-5",
              providerID: "anthropic",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: "part-3",
                sessionID: "session-3",
                messageID: "message-3",
                type: "text",
                text: "Opening answer from Debater B",
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-4",
              sessionID: "session-4",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-4",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [{ id: "part-4", sessionID: "session-4", messageID: "message-4", type: "text", text: "Critique from Debater A" }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-5",
              sessionID: "session-5",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-5",
              modelID: "claude-sonnet-4-5",
              providerID: "anthropic",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [{ id: "part-5", sessionID: "session-5", messageID: "message-5", type: "text", text: "Critique from Debater B" }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-6",
              sessionID: "session-6",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-6",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [{ id: "part-6", sessionID: "session-6", messageID: "message-6", type: "text", text: "Final revised answer from Debater A" }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-7",
              sessionID: "session-7",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-7",
              modelID: "claude-sonnet-4-5",
              providerID: "anthropic",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [{ id: "part-7", sessionID: "session-7", messageID: "message-7", type: "text", text: "Final revised answer from Debater B" }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-8",
              sessionID: "session-8",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-8",
              modelID: "gemini-2.5-pro",
              providerID: "google",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: "part-8",
                sessionID: "session-8",
                messageID: "message-8",
                type: "text",
                text: '{"winner":"debaterB","rationale":"Debater B addressed the critique more directly while staying clear and correct."}',
              },
            ],
          },
        }),
    }

    const onStageRetry = vi.fn()
    const transcriptPath = await createTempTranscriptPath("run-debate-retry.json")
    const completion = await runDebate({
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      sessionClient: sessionClient as never,
      createRunId: () => "run-retry-1",
      transcriptPath,
      reliability: {
        maxStageAttempts: 3,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      onStageRetry,
    })

    expect(onStageRetry).toHaveBeenCalledWith({
      stage: expect.objectContaining({ key: "answer_a", label: "Answer A" }),
      actorModel: "openai/gpt-5",
      nextAttempt: 2,
      maxAttempts: 3,
      reason: "Failed to run answer_a with openai/gpt-5: Temporary provider timeout.",
    })
    expect(completion.state.stages.find((stage) => stage.key === "answer_a")?.result?.attemptCount).toBe(2)

    const transcript = await loadDebateTranscriptRecord("run-retry-1", transcriptPath)
    expect(transcript.stages.find((stage) => stage.key === "answer_a")?.output.attemptCount).toBe(2)
  })

  it("fails clearly when judge output is malformed", async () => {
    let sessionCount = 0
    const responses = [
      "Opening answer from Debater A",
      "Opening answer from Debater B",
      "Critique from Debater A",
      "Critique from Debater B",
      "Final revised answer from Debater A",
      "Final revised answer from Debater B",
      "not json",
    ]

    const sessionClient = {
      create: vi.fn().mockImplementation(async () => ({
        data: { id: `session-${++sessionCount}` },
      })),
      prompt: vi.fn().mockImplementation(async (options) => {
        const responseText = responses.shift() ?? `mock response ${sessionCount}`

        return {
          data: {
            info: {
              id: `message-${sessionCount}`,
              sessionID: options.path.id,
              role: "assistant",
              time: { created: Date.now() },
              parentID: `parent-${sessionCount}`,
              modelID: options.body?.model?.modelID ?? "unknown",
              providerID: options.body?.model?.providerID ?? "unknown",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: `part-${sessionCount}`,
                sessionID: options.path.id,
                messageID: `message-${sessionCount}`,
                type: "text",
                text: responseText,
              },
            ],
          },
        }
      }),
    }

    const transcriptPath = await createTempTranscriptPath("run-debate-bad-judge.json")

    await expect(
      runDebate({
        question: "Should tests come first?",
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        sessionClient,
        createRunId: () => "run-bad-judge-1",
        transcriptPath,
      }),
    ).rejects.toThrow("Judge output is not valid JSON.")

    const transcript = await loadDebateTranscriptRecord("run-bad-judge-1", transcriptPath)
    expect(transcript.status).toBe("failed")
    expect(transcript.failedStage).toBe("final_decision")
    expect(transcript.error).toContain("Judge output is not valid JSON.")
    expect(transcript.stages.find((stage) => stage.key === "final_decision")).toMatchObject({
      status: "failed",
      input: {
        prompt: expect.stringContaining("Return ONLY valid JSON with this exact shape:"),
      },
      output: {
        content: "not json",
        error: "Judge output is not valid JSON.",
      },
    })
  })

  it("fails fast on model execution errors before dependent stages start", async () => {
    const sessionClient = {
      create: vi
        .fn()
        .mockResolvedValueOnce({ data: { id: "session-1" } })
        .mockResolvedValueOnce({ data: { id: "session-2" } }),
      prompt: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-1",
              sessionID: "session-1",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-1",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: "part-1",
                sessionID: "session-1",
                messageID: "message-1",
                type: "text",
                text: "Opening answer from Debater A",
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-2",
              sessionID: "session-2",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-2",
              modelID: "claude-sonnet-4-5",
              providerID: "anthropic",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
              error: {
                name: "APIError",
                data: {
                  message: "The requested model is not supported.",
                  isRetryable: false,
                },
              },
            },
            parts: [],
          },
        }),
    }

    const onStageStart = vi.fn()
    const transcriptPath = await createTempTranscriptPath("run-debate-failed.json")

    await expect(
      runDebate({
        question: "Should tests come first?",
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        sessionClient: sessionClient as never,
        onStageStart,
        createRunId: () => "run-failed-1",
        transcriptPath,
      }),
    ).rejects.toThrow("Failed to run answer_b with anthropic/claude-sonnet-4-5: The requested model is not supported.")

    expect(onStageStart.mock.calls.map(([event]) => event.stage.key)).toEqual(["answer_a", "answer_b"])

    const transcript = await loadDebateTranscriptRecord("run-failed-1", transcriptPath)
    expect(transcript.status).toBe("failed")
    expect(transcript.failedStage).toBe("answer_b")
    expect(transcript.error).toContain("Failed to run answer_b")
    expect(transcript.stages.find((stage) => stage.key === "answer_a")?.status).toBe("completed")
    expect(transcript.stages.find((stage) => stage.key === "answer_b")).toMatchObject({
      status: "failed",
      output: {
        error: "Failed to run answer_b with anthropic/claude-sonnet-4-5: The requested model is not supported.",
      },
    })
  })

  it("keeps the visible independence note and completed answer critique stages aligned", async () => {
    const sessionClient = createMockSessionClient()
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const resolveSpy = vi.spyOn(resolveRunConfigModule, "resolveRunConfig").mockResolvedValue({
      activeRoles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      activeReliability: {
        maxStageAttempts: 3,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
        reliability: {
          maxStageAttempts: 3,
          stageTimeoutMs: 60000,
          retryBackoffMs: 0,
        },
      },
      usedSetup: false,
    })

    const completion = await runAskCommand(
      "Should tests come first?",
      {},
      {
        createRunId: () => "run-ask-3",
        transcriptPath: await createTempTranscriptPath("run-ask-3.json"),
        startOpenCode: async () => ({
          client: {
            ...createMockClient(),
            session: sessionClient,
          } as never,
          close,
        }),
        saveConfig,
        log,
      },
    )

    const lines = log.mock.calls.map(([message]) => stripAnsi(message))

    expect(lines).toContain(
      "Independent opening answers: Debater A and Debater B each answer in isolation before the cross-critique exchange begins.",
    )
    expect(completion.state.status).toBe("completed")
    expect(completion.state.stages.map((stage) => [stage.key, stage.status])).toEqual([
      ["answer_a", "completed"],
      ["answer_b", "completed"],
      ["critique_a", "completed"],
      ["critique_b", "completed"],
      ["revise_a", "completed"],
      ["revise_b", "completed"],
      ["final_decision", "completed"],
    ])
    expect(completion.state.stages.find((stage) => stage.key === "answer_a")?.result?.content).toBe("Opening answer from Debater A")
    expect(completion.state.stages.find((stage) => stage.key === "answer_b")?.result?.content).toBe("Opening answer from Debater B")
    expect(completion.state.stages.find((stage) => stage.key === "critique_a")?.result?.content).toBe("Critique from Debater A")
    expect(completion.state.stages.find((stage) => stage.key === "critique_b")?.result?.content).toBe("Critique from Debater B")
    expect(completion.state.stages.find((stage) => stage.key === "revise_a")?.result?.content).toBe(
      "Final revised answer from Debater A",
    )
    expect(completion.state.stages.find((stage) => stage.key === "final_decision")?.result?.content).toContain(
      '"winner":"debaterB"',
    )
    expect(lines[lines.length - 1]).toContain("Winner: Debater B (anthropic/claude-sonnet-4-5)")
    expect(lines[lines.length - 1]).toContain("Final revised answer from Debater B")
    expect(lines[lines.length - 1]).not.toContain("Final revised answer from Debater A")
    expect(lines[lines.length - 1]).toContain("Transcript: saved as run-ask-3")
    expect(lines[lines.length - 1]).toContain("Inspect: debateloop inspect run-ask-3")
    expect(saveConfig).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)

    resolveSpy.mockRestore()
  })

  it("surfaces stage-aware failure output with a partial transcript pointer", async () => {
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const transcriptPath = await createTempTranscriptPath("run-ask-failed.json")
    const resolveSpy = vi.spyOn(resolveRunConfigModule, "resolveRunConfig").mockResolvedValue({
      activeRoles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      activeReliability: {
        maxStageAttempts: 2,
        stageTimeoutMs: 60000,
        retryBackoffMs: 0,
      },
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
        reliability: {
          maxStageAttempts: 2,
          stageTimeoutMs: 60000,
          retryBackoffMs: 0,
        },
      },
      usedSetup: false,
    })

    const sessionClient = {
      create: vi
        .fn()
        .mockResolvedValueOnce({ data: { id: "session-1" } })
        .mockResolvedValueOnce({ data: { id: "session-2" } }),
      prompt: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-1",
              sessionID: "session-1",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-1",
              modelID: "gpt-5",
              providerID: "openai",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            },
            parts: [
              {
                id: "part-1",
                sessionID: "session-1",
                messageID: "message-1",
                type: "text",
                text: "Opening answer from Debater A",
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            info: {
              id: "message-2",
              sessionID: "session-2",
              role: "assistant",
              time: { created: Date.now() },
              parentID: "parent-2",
              modelID: "claude-sonnet-4-5",
              providerID: "anthropic",
              mode: "build",
              path: { cwd: "/tmp", root: "/tmp" },
              cost: 0,
              tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
              error: {
                name: "APIError",
                data: {
                  message: "Temporary provider timeout.",
                  isRetryable: true,
                },
              },
            },
            parts: [],
          },
        }),
    }

    let thrown: unknown

    try {
      await runAskCommand("Should tests come first?", {}, {
        createRunId: () => "run-ask-failed",
        transcriptPath,
        startOpenCode: async () => ({
          client: {
            ...createMockClient(),
            session: sessionClient as never,
          } as never,
          close,
        }),
        saveConfig,
        log,
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)

    expect(log.mock.calls.map(([message]) => stripAnsi(message))).toContain(
      "Retrying Answer B with anthropic/claude-sonnet-4-5 (2/2): Failed to run answer_b with anthropic/claude-sonnet-4-5: Temporary provider timeout.",
    )

    const message = thrown instanceof Error ? thrown.message : String(thrown)
    expect(message).toContain("Debate failed")
    expect(message).toContain("Stage: Answer B (anthropic/claude-sonnet-4-5)")
    expect(message).toContain("Transcript: partial run saved as run-ask-failed")
    expect(message).toContain("Inspect: debateloop inspect run-ask-failed")

    resolveSpy.mockRestore()
  })
})
