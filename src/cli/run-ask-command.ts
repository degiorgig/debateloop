import type { DebateConfig } from "../app/config.js"
import { saveDebateConfig } from "../app/config.js"
import { DebateStageExecutionError, runDebate } from "../debate/run-debate.js"
import {
  renderCompletion,
  renderFailure,
  renderIndependenceNote,
  renderRoleSummary,
  renderStageDebugOutput,
  renderStagePlan,
  renderStageProgress,
  renderStageRetry,
} from "./render.js"
import { resolveRunConfig, type RunConfigOverrides } from "./resolve-run-config.js"
import { startOpenCode, type StartedOpenCode } from "../opencode/client.js"

export interface AskCommandRuntime {
  startOpenCode?: () => Promise<StartedOpenCode>
  log?: (message: string) => void
  debug?: boolean
  saveConfig?: (config: DebateConfig, configPath?: string) => Promise<DebateConfig>
  configPath?: string
  createRunId?: () => string
  transcriptPath?: string
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
    log(renderIndependenceNote())

    const completion = await runDebate({
      question,
      roles: resolved.activeRoles,
      sessionClient: openCode.client.session,
      createRunId: runtime.createRunId,
      transcriptPath: runtime.transcriptPath,
      reliability: resolved.savedConfig.reliability,
      onStageStart: ({ stage, actorModel }) => {
        log(renderStageProgress(stage, actorModel))
      },
      onStageRetry: ({ stage, actorModel, nextAttempt, maxAttempts, reason }) => {
        log(
          renderStageRetry({
            stage,
            actorModel,
            nextAttempt,
            maxAttempts,
            reason,
          }),
        )
      },
      onStageComplete: ({ stage, actorModel, result }) => {
        if (!runtime.debug) {
          return
        }

        log(
          renderStageDebugOutput({
            stage,
            actorModel,
            result,
          }),
        )
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
        decision: completion.decision,
        usedSetup: resolved.usedSetup,
        transcriptAvailable: completion.transcriptAvailable,
        transcriptId: completion.transcriptId,
        transcriptPath: completion.transcriptPath,
      }),
    )

    return completion
  } catch (error) {
    if (error instanceof DebateStageExecutionError) {
      throw new Error(
        renderFailure({
          error: error.message,
          stage: error.stageLabel && error.actorModel
            ? {
                label: error.stageLabel,
                actorModel: error.actorModel,
              }
            : undefined,
          transcriptAvailable: true,
          transcriptId: error.transcriptId,
          transcriptPath: error.transcriptPath,
        }),
        { cause: error },
      )
    }

    throw error
  } finally {
    openCode.close()
  }
}
