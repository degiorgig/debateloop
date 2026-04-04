import { createOpencode, type OpencodeClient } from "@opencode-ai/sdk"

export interface StartedOpenCode {
  client: OpencodeClient
  close: () => void
}

export class OpenCodeStartupError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "OpenCodeStartupError"
  }
}

export async function startOpenCode(): Promise<StartedOpenCode> {
  try {
    const { client, server } = await createOpencode()

    return {
      client,
      close: () => server.close(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new OpenCodeStartupError(
      `Debate could not start OpenCode. ${message} Check that the OpenCode app is installed and your local configuration is valid before retrying.`,
      { cause: error instanceof Error ? error : undefined },
    )
  }
}
