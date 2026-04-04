import { describe, expect, it, vi } from "vitest"

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

    await runAskCommand(
      "Should tests come first?",
      {},
      {
        configPath: "/tmp/debate-config.json",
        startOpenCode: async () => ({ client: createMockClient() as never, close }),
        saveConfig,
        log,
      },
    )

    const lines = log.mock.calls.map(([message]) => message)

    expect(lines).toContain(
      "Active models: Debater A: openai/gpt-5 | Debater B: anthropic/claude-sonnet-4-5 | Judge: google/gemini-2.5-pro",
    )
    expect(lines).toContain("Debate stages:\n  1. Answer A\n  2. Answer B\n  3. Critique A\n  4. Critique B\n  5. Revise A\n  6. Revise B\n  7. Final decision")
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

    resolveSpy.mockRestore()
  })

  it("suppresses the first-run hint once it has already been shown", async () => {
    const log = vi.fn()
    const close = vi.fn()
    const saveConfig = vi.fn().mockImplementation(async (config) => config)
    const startOpenCode = async () => ({
      client: createMockClient() as never,
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
})
