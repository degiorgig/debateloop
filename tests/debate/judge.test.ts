import { describe, expect, it } from "vitest"

import { JudgeVerdictSchema, parseJudgeVerdict } from "../../src/debate/judge.js"

describe("judge", () => {
  it("parses a valid structured verdict", () => {
    const verdict = parseJudgeVerdict('{"winner":"debaterA","rationale":"Debater A is more correct and clearer overall."}')

    expect(verdict).toEqual({
      winner: "debaterA",
      rationale: "Debater A is more correct and clearer overall.",
    })
    expect(JudgeVerdictSchema.parse(verdict)).toEqual(verdict)
  })

  it("fails on invalid json", () => {
    expect(() => parseJudgeVerdict("winner: debaterA")).toThrow("Judge output is not valid JSON.")
  })

  it("parses verdicts wrapped in a json code fence", () => {
    const verdict = parseJudgeVerdict('```json\n{"winner":"debaterB","rationale":"Debater B is clearer and better addresses the critique."}\n```')

    expect(verdict).toEqual({
      winner: "debaterB",
      rationale: "Debater B is clearer and better addresses the critique.",
    })
  })

  it("parses verdicts when json is surrounded by extra text", () => {
    const verdict = parseJudgeVerdict('Here is my decision:\n{"winner":"debaterA","rationale":"Debater A is more precise and complete overall."}\nThanks.')

    expect(verdict).toEqual({
      winner: "debaterA",
      rationale: "Debater A is more precise and complete overall.",
    })
  })

  it("accepts longer rationales from real judge outputs", () => {
    const rationale = "Debater B is clearer and more actionable. ".repeat(20).trim()
    const verdict = parseJudgeVerdict(`{"winner":"debaterB","rationale":"${rationale}"}`)

    expect(verdict).toEqual({
      winner: "debaterB",
      rationale,
    })
  })

  it("fails on invalid winner values", () => {
    expect(() =>
      parseJudgeVerdict('{"winner":"judge","rationale":"This answer is stronger overall."}'),
    ).toThrow("Judge output is malformed.")
  })

  it("fails on malformed rationale", () => {
    expect(() => parseJudgeVerdict('{"winner":"debaterB","rationale":"too short"}')).toThrow(
      "Judge output is malformed.",
    )
  })
})
