import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  DebateConfigError,
  parseDebateConfig,
  loadDebateConfig,
  saveDebateConfig,
} from "../../src/app/config.js"

const tempDirs: string[] = []

async function createTempConfigPath() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "debateloop-config-"))
  tempDirs.push(directory)
  return path.join(directory, "config.json")
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })))
})

describe("DebateConfigSchema", () => {
  it("rejects duplicate debater models", () => {
    expect(() =>
      parseDebateConfig({
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "openai/gpt-5",
          judge: "anthropic/claude-sonnet-4-5",
        },
      }),
    ).toThrowError(DebateConfigError)
  })

  it("saves and loads valid Debate config", async () => {
    const configPath = await createTempConfigPath()

    await saveDebateConfig(
      {
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
      configPath,
    )

    await expect(loadDebateConfig(configPath)).resolves.toEqual({
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
    })
  })

  it("fills in default reliability settings during parsing", () => {
    expect(
      parseDebateConfig({
        roles: {
          debaterA: "openai/gpt-5",
          debaterB: "anthropic/claude-sonnet-4-5",
          judge: "google/gemini-2.5-pro",
        },
      }).reliability,
    ).toEqual({
      maxStageAttempts: 3,
      stageTimeoutMs: 30000,
      retryBackoffMs: 750,
    })
  })

  it("returns null when the config file is missing", async () => {
    const configPath = await createTempConfigPath()

    await expect(loadDebateConfig(configPath)).resolves.toBeNull()
  })
})
