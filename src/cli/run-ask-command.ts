import type { DebateConfig } from "../app/config.js"
import { saveDebateConfig } from "../app/config.js"
import { runDebate } from "../debate/run-debate.js"
import { renderCompletion, renderRoleSummary, renderStagePlan, renderStageProgress } from "./render.js"
import { resolveRunConfig, type RunConfigOverrides } from "./resolve-run-config.js"
import { startOpenCode, type StartedOpenCode } from "../opencode/client.js"

export interface AskCommandRuntime {
  startOpenCode?: () => Promise<StartedOpenCode>
  log?: (message: string) => void
  saveConfig?: (config: DebateConfig, configPath?: string) => Promise<DebateConfig>
  configPath?: string
}

export async function runAskCommand(
  question: string,
  overrides: RunConfigOverrides,
  runtime: AskCommandRuntime = {},
) {
  const log = runtime.log ?? console.log
  const openCodeFactory = runtime.startOpenCode ?? startOpenCode
  const persistConfig = runtime.saveConfig ?? saveDebateConfig

  const openCode = await openCodeFactory()

  try {
    const resolved = await resolveRunConfig({
      client: openCode.client,
      overrides,
      configPath: runtime.configPath,
    })

    log(renderRoleSummary(resolved.activeRoles))
    log(renderStagePlan())

    const completion = await runDebate({
      question,
      roles: resolved.activeRoles,
      onStageStart: ({ stage, actorModel }) => {
        log(renderStageProgress(stage, actorModel))
      },
    })

    const configToSave: DebateConfig = {
      ...resolved.savedConfig,
      firstRunHintShown: true,
    }

    if (resolved.usedSetup && !resolved.savedConfig.firstRunHintShown) {
      await persistConfig(configToSave, runtime.configPath)
    }

    log(
      renderCompletion({
        config: resolved.savedConfig,
        usedSetup: resolved.usedSetup,
      }),
    )

    return completion
  } finally {
    openCode.close()
  }
}
