import { describe, expect, it, vi } from "vitest"

import { runDebate } from "../../src/debate/run-debate.js"
import { runAskCommand } from "../../src/cli/run-ask-command.js"
import * as resolveRunConfigModule from "../../src/cli/resolve-run-config.js"

const SHARED_DEBATE_FRAMING = [
  "You are participating in a structured two-model debate.",
  "Write a clear, useful response that takes a position without pretending it is the final verdict.",
  "Stay grounded, balanced, and moderately opinionated.",
].join("\n")

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
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: false,
      },
      usedSetup: true,
    })

    const sessionClient = createMockSessionClient()

    await runAskCommand(
      "Should tests come first?",
      {},
      {
        configPath: "/tmp/debate-config.json",
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

    const lines = log.mock.calls.map(([message]) => message)

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
    expect(lines.at(-1)).toContain("Decision: pending")
    expect(lines.at(-1)).toContain("Transcript: hidden during the run")
    expect(lines.at(-1)).toContain("Hint: run `debate ask \"Should tests come first?\"`")
    expect(saveConfig).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(sessionClient.create).toHaveBeenCalledTimes(4)
    expect(sessionClient.prompt).toHaveBeenCalledTimes(4)

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
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
      },
      usedSetup: false,
    })

    await runAskCommand("Question", {}, { startOpenCode, saveConfig, log })

    const completionLine = log.mock.calls.at(-1)?.[0] as string
    expect(completionLine).not.toContain("Hint: run `debate ask")
    expect(saveConfig).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)

    spy.mockRestore()
  })

  it("keeps opening answers independent and shares both answers during critique", async () => {
    const sessionClient = createMockSessionClient()

    const completion = await runDebate({
      question: "Should tests come first?",
      roles: {
        debaterA: "openai/gpt-5",
        debaterB: "anthropic/claude-sonnet-4-5",
        judge: "google/gemini-2.5-pro",
      },
      sessionClient,
    })

    expect(sessionClient.create).toHaveBeenCalledTimes(4)
    expect(sessionClient.prompt).toHaveBeenCalledTimes(4)
    expect(sessionClient.create.mock.calls).toEqual([
      [{ body: { title: "Debate answer_a" } }],
      [{ body: { title: "Debate answer_b" } }],
      [{ body: { title: "Debate critique_a" } }],
      [{ body: { title: "Debate critique_b" } }],
    ])

    const promptCalls = sessionClient.prompt.mock.calls.map(([call]) => call)
    const answerACall = promptCalls[0]
    const answerBCall = promptCalls[1]
    const critiqueACall = promptCalls[2]
    const critiqueBCall = promptCalls[3]

    expect(answerACall.path).toEqual({ id: "session-1" })
    expect(answerBCall.path).toEqual({ id: "session-2" })
    expect(critiqueACall.path).toEqual({ id: "session-3" })
    expect(critiqueBCall.path).toEqual({ id: "session-4" })
    expect(answerACall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(answerBCall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(critiqueACall.body.system).toBe(SHARED_DEBATE_FRAMING)
    expect(critiqueBCall.body.system).toBe(SHARED_DEBATE_FRAMING)

    const answerAPrompt = promptCalls[0].body.parts[0].text as string
    const answerBPrompt = promptCalls[1].body.parts[0].text as string
    const critiqueAPrompt = promptCalls[2].body.parts[0].text as string
    const critiqueBPrompt = promptCalls[3].body.parts[0].text as string

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

    expect(answerAResult).toBe("Opening answer from Debater A")
    expect(answerBResult).toBe("Opening answer from Debater B")
    expect(critiqueAStage?.status).toBe("completed")
    expect(critiqueBStage?.status).toBe("completed")
    expect(critiqueAStage?.result).toEqual({
      sessionId: "session-3",
      stageKey: "critique_a",
      content: "Critique from Debater A",
    })
    expect(critiqueBStage?.result).toEqual({
      sessionId: "session-4",
      stageKey: "critique_b",
      content: "Critique from Debater B",
    })

    expect(completion.state.stages.filter((stage) => stage.key.startsWith("answer_") || stage.key.startsWith("critique_"))).toEqual([
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
      availableModels: [],
      savedConfig: {
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
      },
      usedSetup: false,
    })

    const completion = await runAskCommand(
      "Should tests come first?",
      {},
      {
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

    const lines = log.mock.calls.map(([message]) => message)

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
    expect(completion.state.stages.find((stage) => stage.key === "revise_a")?.result).toBeUndefined()
    expect(completion.state.stages.find((stage) => stage.key === "final_decision")?.result).toBeUndefined()
    expect(saveConfig).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)

    resolveSpy.mockRestore()
  })
})
