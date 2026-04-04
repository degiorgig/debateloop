import { Command } from "commander"

export interface AskCommandInput {
  question: string
  debaterA?: string
  debaterB?: string
  judge?: string
}

export interface BuildProgramOptions {
  onAsk?: (input: AskCommandInput) => Promise<void> | void
}

async function defaultAskHandler(input: AskCommandInput) {
  console.log(`Debate queued: ${input.question}`)

  const overrides = [
    ["Debater A", input.debaterA],
    ["Debater B", input.debaterB],
    ["Judge", input.judge],
  ].filter(([, value]) => Boolean(value))

  if (overrides.length > 0) {
    console.log("Role overrides:")

    for (const [label, value] of overrides) {
      console.log(`- ${label}: ${value}`)
    }
  }

  console.log("Debate skeleton not wired yet. Phase 1 will add runtime execution next.")
}

export function buildProgram(options: BuildProgramOptions = {}) {
  const askHandler = options.onAsk ?? defaultAskHandler

  const program = new Command()

  program
    .name("debate")
    .description("Debate is a terminal utility for running structured model-vs-model answers.")
    .showHelpAfterError()

  program
    .command("ask")
    .description("Start a debate for one quoted question.")
    .argument("<question>", "question to debate")
    .option("--debater-a <model>", "override the Debater A model for this run")
    .option("--debater-b <model>", "override the Debater B model for this run")
    .option("--judge <model>", "override the Judge model for this run")
    .action(async (question: string, commandOptions: Record<string, string | undefined>) => {
      await askHandler({
        question,
        debaterA: commandOptions.debaterA,
        debaterB: commandOptions.debaterB,
        judge: commandOptions.judge,
      })
    })

  return program
}
