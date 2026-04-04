import { describe, expect, it } from "vitest"

import { DEBATE_STAGES } from "../../src/debate/stages.js"

describe("DEBATE_STAGES", () => {
  it("defines the fixed symmetric stage order", () => {
    expect(DEBATE_STAGES.map((stage) => stage.key)).toEqual([
      "answer_a",
      "answer_b",
      "critique_a",
      "critique_b",
      "revise_a",
      "revise_b",
      "final_decision",
    ])
  })

  it("keeps the required visible labels", () => {
    expect(DEBATE_STAGES.map((stage) => stage.label)).toEqual([
      "Answer A",
      "Answer B",
      "Critique A",
      "Critique B",
      "Revise A",
      "Revise B",
      "Final decision",
    ])
  })

  it("keeps the actor mapping aligned with the visible stage sequence", () => {
    expect(DEBATE_STAGES.map((stage) => [stage.key, stage.actorRole])).toEqual([
      ["answer_a", "debaterA"],
      ["answer_b", "debaterB"],
      ["critique_a", "debaterA"],
      ["critique_b", "debaterB"],
      ["revise_a", "debaterA"],
      ["revise_b", "debaterB"],
      ["final_decision", "judge"],
    ])
  })
})
