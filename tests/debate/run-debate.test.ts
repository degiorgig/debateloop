import { describe, expect, it, vi } from "vitest"

import { runDebate } from "../../src/debate/run-debate.js"
import { runAskCommand } from "../../src/cli/run-ask-command.js"
import * as resolveRunConfigModule from "../../src/cli/resolve-run-config.js"

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

  return {
    create: vi.fn().mockImplementation(async () => ({
      data: { id: `session-${++sessionCount}` },
    })),
    prompt: vi.fn().mockImplementation(async (options) => {
      const text = options.body?.parts?.[0]?.type === "text" ? options.body.parts[0].text : ""
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
              text: `mock response for ${text}`,
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
      "Independence: Debater A and Debater B generate their opening answers separately before either sees the other's answer.",
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

    expect(completion.state.stages.find((stage) => stage.key === "answer_a")?.result?.content).toContain(
      "Question: Should tests come first?",
    )
    expect(completion.state.stages.find((stage) => stage.key === "answer_b")?.result?.content).toContain(
      "Question: Should tests come first?",
    )

    const promptCalls = sessionClient.prompt.mock.calls.map(([call]) => call)
    const answerAPrompt = promptCalls[0].body.parts[0].text as string
    const answerBPrompt = promptCalls[1].body.parts[0].text as string
    const critiqueAPrompt = promptCalls[2].body.parts[0].text as string
    const critiqueBPrompt = promptCalls[3].body.parts[0].text as string

    expect(answerAPrompt).toContain("Question: Should tests come first?")
    expect(answerBPrompt).toContain("Question: Should tests come first?")
    expect(answerBPrompt).not.toContain("Opponent opening answer")
    expect(answerBPrompt).not.toContain("Your opening answer")

    const answerAResult = completion.state.stages.find((stage) => stage.key === "answer_a")?.result?.content
    const answerBResult = completion.state.stages.find((stage) => stage.key === "answer_b")?.result?.content

    expect(answerAResult).toBeTruthy()
    expect(answerBResult).toBeTruthy()
    expect(critiqueAPrompt).toContain(`Your opening answer:\n${answerAResult}`)
    expect(critiqueAPrompt).toContain(`Opponent opening answer:\n${answerBResult}`)
    expect(critiqueBPrompt).toContain(`Your opening answer:\n${answerBResult}`)
    expect(critiqueBPrompt).toContain(`Opponent opening answer:\n${answerAResult}`)
  })
})
