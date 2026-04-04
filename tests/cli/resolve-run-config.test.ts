import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { resolveRunConfig } from "../../src/cli/resolve-run-config.js"

const tempDirs: string[] = []

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

async function createTempConfigPath() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "debate-run-config-"))
  tempDirs.push(directory)
  return path.join(directory, "config.json")
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })))
})

describe("resolveRunConfig", () => {
  it("runs guided setup when config is missing and persists the result", async () => {
    const configPath = await createTempConfigPath()
    const client = createMockClient()
    const prompts = {
      selectRoleModel: vi
        .fn()
        .mockResolvedValueOnce("openai/gpt-5")
        .mockResolvedValueOnce("anthropic/claude-sonnet-4-5")
        .mockResolvedValueOnce("google/gemini-2.5-pro"),
    }

    const result = await resolveRunConfig({
      client: client as never,
      configPath,
      prompts,
    })

    expect(result.usedSetup).toBe(true)
    expect(result.activeRoles).toEqual({
      debaterA: "openai/gpt-5",
      debaterB: "anthropic/claude-sonnet-4-5",
      judge: "google/gemini-2.5-pro",
    })

    const saved = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(saved.roles.debaterA).toBe("openai/gpt-5")
  })

  it("applies non-persistent per-run overrides", async () => {
    const configPath = await createTempConfigPath()
    const client = createMockClient()

    await fs.writeFile(
      configPath,
      JSON.stringify({
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
      }),
      "utf8",
    )

    const result = await resolveRunConfig({
      client: client as never,
      configPath,
      overrides: {
        judge: "anthropic/claude-sonnet-4-5",
      },
    })

    expect(result.usedSetup).toBe(false)
    expect(result.activeRoles.judge).toBe("anthropic/claude-sonnet-4-5")

    const saved = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(saved.roles.judge).toBe("google/gemini-2.5-pro")
  })

  it("repairs stale saved config when a model is unavailable", async () => {
    const configPath = await createTempConfigPath()
    const client = createMockClient()
    const prompts = {
      selectRoleModel: vi
        .fn()
        .mockResolvedValueOnce("anthropic/claude-sonnet-4-5")
        .mockResolvedValueOnce("openai/gpt-5")
        .mockResolvedValueOnce("google/gemini-2.5-pro"),
    }

    await fs.writeFile(
      configPath,
      JSON.stringify({
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "missing/provider-model",
          judge: "google/gemini-2.5-pro",
        },
        firstRunHintShown: true,
      }),
      "utf8",
    )

    const result = await resolveRunConfig({
      client: client as never,
      configPath,
      prompts,
    })

    expect(result.usedSetup).toBe(true)
    expect(prompts.selectRoleModel).toHaveBeenCalledTimes(3)
    expect(result.savedConfig.roles.debaterA).toBe("anthropic/claude-sonnet-4-5")
  })
})
