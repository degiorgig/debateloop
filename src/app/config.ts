import fs from "node:fs/promises"

import { z } from "zod"

import { getAppConfigDir, getAppConfigPath } from "./paths.js"

const DebateRolesSchema = z
  .object({
    debaterA: z.string().min(1, "Debater A model is required."),
    debaterB: z.string().min(1, "Debater B model is required."),
    judge: z.string().min(1, "Judge model is required."),
  })
  .refine((roles) => roles.debaterA !== roles.debaterB, {
    message: "Debater A and Debater B must use different models.",
    path: ["debaterB"],
  })

const DEFAULT_RELIABILITY = {
  maxStageAttempts: 3,
  stageTimeoutMs: 30_000,
  retryBackoffMs: 750,
} as const

const DebateReliabilitySchema = z.object({
  maxStageAttempts: z.number().int().min(1).max(5).default(DEFAULT_RELIABILITY.maxStageAttempts),
  stageTimeoutMs: z.number().int().min(1_000).max(120_000).default(DEFAULT_RELIABILITY.stageTimeoutMs),
  retryBackoffMs: z.number().int().min(0).max(10_000).default(DEFAULT_RELIABILITY.retryBackoffMs),
})

export const DebateConfigSchema = z.object({
  roles: DebateRolesSchema,
  firstRunHintShown: z.boolean().default(false),
  reliability: DebateReliabilitySchema.default(DEFAULT_RELIABILITY),
})

export type DebateConfig = z.infer<typeof DebateConfigSchema>
export type DebateRoleConfig = DebateConfig["roles"]
export type DebateReliabilityConfig = DebateConfig["reliability"]

export class DebateConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DebateConfigError"
  }
}

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
      return `${path}${issue.message}`
    })
    .join(" ")
}

export function parseDebateConfig(rawConfig: unknown) {
  const parsed = DebateConfigSchema.safeParse(rawConfig)

  if (!parsed.success) {
    throw new DebateConfigError(`Invalid Debate config. ${formatZodError(parsed.error)}`)
  }

  return parsed.data
}

export async function loadDebateConfig(configPath = getAppConfigPath()) {
  try {
    const raw = await fs.readFile(configPath, "utf8")
    return parseDebateConfig(JSON.parse(raw))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }

    if (error instanceof SyntaxError) {
      throw new DebateConfigError("Invalid Debate config. The config file is not valid JSON.")
    }

    throw error
  }
}

export async function saveDebateConfig(config: DebateConfig, configPath = getAppConfigPath()) {
  const normalizedConfig = parseDebateConfig(config)

  await fs.mkdir(getAppConfigDir(), { recursive: true })
  await fs.writeFile(configPath, `${JSON.stringify(normalizedConfig, null, 2)}\n`, "utf8")

  return normalizedConfig
}
