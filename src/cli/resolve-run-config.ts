import {
  type DebateConfig,
  type DebateRoleConfig,
  DebateConfigError,
  loadDebateConfig,
  parseDebateConfig,
  saveDebateConfig,
} from "../app/config.js"
import { z } from "zod"
import { promptForRoleConfig, type SetupPrompts } from "./setup.js"
import {
  assertModelAvailable,
  listAvailableModels,
  type AvailableModel,
  type DebateModelError,
} from "../opencode/models.js"
import type { OpencodeClient } from "@opencode-ai/sdk"

export interface RunConfigOverrides {
  debaterA?: string
  debaterB?: string
  judge?: string
  stageTimeoutMs?: number
}

export interface ResolvedRunConfig {
  activeRoles: DebateRoleConfig
  activeReliability: DebateConfig["reliability"]
  availableModels: AvailableModel[]
  savedConfig: DebateConfig
  usedSetup: boolean
}

export interface ResolveRunConfigOptions {
  client: OpencodeClient
  overrides?: RunConfigOverrides
  configPath?: string
  prompts?: SetupPrompts
}

function applyOverrides(baseRoles: DebateRoleConfig, overrides: RunConfigOverrides): DebateRoleConfig {
  return {
    debaterA: overrides.debaterA ?? baseRoles.debaterA,
    debaterB: overrides.debaterB ?? baseRoles.debaterB,
    judge: overrides.judge ?? baseRoles.judge,
  }
}

const ReliabilityOverrideSchema = z.object({
  maxStageAttempts: z.number().int().min(1).max(5),
  stageTimeoutMs: z.number().int().min(1_000).max(120_000),
  retryBackoffMs: z.number().int().min(0).max(10_000),
})

function applyReliabilityOverrides(baseReliability: DebateConfig["reliability"], overrides: RunConfigOverrides) {
  return ReliabilityOverrideSchema.parse({
    ...baseReliability,
    stageTimeoutMs: overrides.stageTimeoutMs ?? baseReliability.stageTimeoutMs,
  })
}

function validateRolesAgainstAvailableModels(roles: DebateRoleConfig, availableModels: AvailableModel[]) {
  assertModelAvailable(availableModels, "Debater A", roles.debaterA)
  assertModelAvailable(availableModels, "Debater B", roles.debaterB)
  assertModelAvailable(availableModels, "Judge", roles.judge)
}

async function repairConfig(
  availableModels: AvailableModel[],
  configPath: string | undefined,
  prompts?: SetupPrompts,
) {
  const repairedRoles = await promptForRoleConfig(availableModels, prompts)
  return saveDebateConfig(
    parseDebateConfig({
      roles: repairedRoles,
      firstRunHintShown: false,
    }),
    configPath,
  )
}

function shouldRepairConfig(error: unknown) {
  return error instanceof DebateConfigError || error instanceof Error
}

export async function resolveRunConfig(options: ResolveRunConfigOptions): Promise<ResolvedRunConfig> {
  const availableModels = await listAvailableModels(options.client)

  let savedConfig = await loadDebateConfig(options.configPath)
  let usedSetup = false

  if (!savedConfig) {
    savedConfig = await repairConfig(availableModels, options.configPath, options.prompts)
    usedSetup = true
  } else {
    try {
      validateRolesAgainstAvailableModels(savedConfig.roles, availableModels)
    } catch (error) {
      if (!shouldRepairConfig(error)) {
        throw error
      }

      savedConfig = await repairConfig(availableModels, options.configPath, options.prompts)
      usedSetup = true
    }
  }

  const activeRoles = parseDebateConfig({
    ...savedConfig,
    roles: applyOverrides(savedConfig.roles, options.overrides ?? {}),
  }).roles
  const activeReliability = applyReliabilityOverrides(savedConfig.reliability, options.overrides ?? {})

  validateRolesAgainstAvailableModels(activeRoles, availableModels)

  return {
    activeRoles,
    activeReliability,
    availableModels,
    savedConfig,
    usedSetup,
  }
}
