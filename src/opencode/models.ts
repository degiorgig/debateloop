import type { ConfigProvidersResponse, OpencodeClient, Provider } from "@opencode-ai/sdk"

export interface AvailableModel {
  id: string
  providerId: string
  modelId: string
  label: string
}

export class DebateModelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DebateModelError"
  }
}

function splitModelId(id: string) {
  const separatorIndex = id.indexOf("/")

  if (separatorIndex <= 0 || separatorIndex === id.length - 1) {
    throw new DebateModelError(`Model IDs must use the format provider/model. Received: ${id}`)
  }

  return {
    providerId: id.slice(0, separatorIndex),
    modelId: id.slice(separatorIndex + 1),
  }
}

function createAvailableModel(provider: Provider, modelId: string, modelName?: string): AvailableModel {
  return {
    id: `${provider.id}/${modelId}`,
    providerId: provider.id,
    modelId,
    label: `${provider.name}: ${modelName ?? modelId}`,
  }
}

export function listAvailableModelsFromProviders(response: ConfigProvidersResponse) {
  return response.providers.flatMap((provider) =>
    Object.entries(provider.models).map(([modelId, model]) =>
      createAvailableModel(provider, modelId, model.name),
    ),
  )
}

export async function listAvailableModels(client: OpencodeClient) {
  const response = await client.config.providers()

  if (!response.data) {
    throw new DebateModelError("OpenCode returned no provider configuration. Check your local OpenCode setup and try again.")
  }

  return listAvailableModelsFromProviders(response.data)
}

export function assertModelAvailable(models: AvailableModel[], roleLabel: string, modelId: string) {
  const match = models.find((model) => model.id === modelId)

  if (!match) {
    throw new DebateModelError(
      `OpenCode cannot find the ${roleLabel} model \"${modelId}\". Re-run setup or pass a different --${roleLabel.toLowerCase().replaceAll(" ", "-")} override.`,
    )
  }

  return match
}

export function toSdkModelRef(id: string) {
  const result = splitModelId(id)

  return {
    providerID: result.providerId,
    modelID: result.modelId,
  }
}
