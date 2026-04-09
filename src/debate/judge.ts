import { z } from "zod"

export const JudgeVerdictSchema = z.object({
  winner: z.enum(["debaterA", "debaterB"]),
  rationale: z
    .string()
    .min(10, "rationale must be at least 10 characters.")
    .max(2_000, "rationale must be at most 2000 characters."),
})

export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>

function tryParseJson(rawOutput: string) {
  try {
    return JSON.parse(rawOutput)
  } catch {
    return null
  }
}

function extractJsonObject(rawOutput: string) {
  const direct = tryParseJson(rawOutput)

  if (direct !== null) {
    return direct
  }

  const fencedBlock = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]

  if (fencedBlock) {
    const parsedFence = tryParseJson(fencedBlock)

    if (parsedFence !== null) {
      return parsedFence
    }
  }

  const firstBrace = rawOutput.indexOf("{")
  const lastBrace = rawOutput.lastIndexOf("}")

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = rawOutput.slice(firstBrace, lastBrace + 1)
    const parsedCandidate = tryParseJson(candidate)

    if (parsedCandidate !== null) {
      return parsedCandidate
    }
  }

  return null
}

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
      return `${path}${issue.message}`
    })
    .join(" ")
}

export function parseJudgeVerdict(rawOutput: string) {
  const parsed = extractJsonObject(rawOutput)

  if (parsed === null) {
    throw new Error("Judge output is not valid JSON.")
  }

  const result = JudgeVerdictSchema.safeParse(parsed)

  if (!result.success) {
    throw new Error(`Judge output is malformed. ${formatZodError(result.error)}`)
  }

  return result.data
}
