import { describe, expect, it } from "vitest"

import {
  assertModelAvailable,
  listAvailableModelsFromProviders,
  toSdkModelRef,
} from "../../src/opencode/models.js"

describe("OpenCode model helpers", () => {
  const availableModels = listAvailableModelsFromProviders({
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
    ],
    default: {},
  })

  it("flattens provider models into provider/model ids", () => {
    expect(availableModels.map((model) => model.id)).toEqual([
      "openai/gpt-5",
      "anthropic/claude-sonnet-4-5",
    ])
  })

  it("throws a role-specific error when a model is missing", () => {
    expect(() => assertModelAvailable(availableModels, "Judge", "google/gemini-2.5-pro")).toThrow(
      /Judge model "google\/gemini-2.5-pro"/,
    )
  })

  it("converts provider/model ids into SDK references", () => {
    expect(toSdkModelRef("openai/gpt-5")).toEqual({
      providerID: "openai",
      modelID: "gpt-5",
    })
  })
})
