import { Command } from "commander"

import { runAskCommand } from "./run-ask-command.js"
import { runInspectCommand } from "./run-inspect-command.js"

export interface AskCommandInput {
  question: string
  debaterA?: string
  debaterB?: string
  judge?: string
  stageTimeoutMs?: number
  debug: boolean
}

export interface BuildProgramOptions {
  onAsk?: (input: AskCommandInput) => Promise<void> | void
  onInspect?: (runId: string) => Promise<void> | void
}

async function defaultAskHandler(input: AskCommandInput) {
  await runAskCommand(input.question, {
    debaterA: input.debaterA,
    debaterB: input.debaterB,
    judge: input.judge,
    stageTimeoutMs: input.stageTimeoutMs,
  }, {
    debug: input.debug,
  })
}

export function buildProgram(options: BuildProgramOptions = {}) {
  const askHandler = options.onAsk ?? defaultAskHandler
  const inspectHandler = options.onInspect ?? runInspectCommand

  const program = new Command()

  program
    .name("debateloop")
    .description("Debateloop is a terminal utility for running structured model-vs-model answers.")
    .showHelpAfterError()

  program
    .command("ask")
    .description("Start a debate loop for one quoted question.")
    .argument("<question>", "question to debate")
    .option("--debater-a <model>", "override the Debater A model for this run")
    .option("--debater-b <model>", "override the Debater B model for this run")
    .option("--judge <model>", "override the Judge model for this run")
    .option("--stage-timeout-ms <ms>", "override the per-stage timeout for this run", parsePositiveInt)
    .option("--debug", "print every model output as each debate stage completes")
    .action(async (question: string, commandOptions: Record<string, string | boolean | undefined>) => {
      await askHandler({
        question,
        debaterA: typeof commandOptions.debaterA === "string" ? commandOptions.debaterA : undefined,
        debaterB: typeof commandOptions.debaterB === "string" ? commandOptions.debaterB : undefined,
        judge: typeof commandOptions.judge === "string" ? commandOptions.judge : undefined,
        stageTimeoutMs: typeof commandOptions.stageTimeoutMs === "number" ? commandOptions.stageTimeoutMs : undefined,
        debug: commandOptions.debug === true,
      })
    })

  program
    .command("inspect")
    .description("Inspect a saved transcript by run id.")
    .argument("<runId>", "saved debateloop run id")
    .action(async (runId: string) => {
      await inspectHandler(runId)
    })

  return program
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received: ${value}`)
  }

  return parsed
}
