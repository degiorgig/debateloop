import { describe, expect, it, vi } from "vitest"

import { buildProgram } from "../../src/cli/program.js"

describe("buildProgram", () => {
  it("parses a direct ask question with role overrides", async () => {
    const onAsk = vi.fn()
    const program = buildProgram({ onAsk })

    await program.parseAsync([
      "node",
      "debateloop",
      "ask",
      "Should tests come first?",
      "--debater-a",
      "anthropic/claude-sonnet-4-5",
      "--debater-b",
      "openai/gpt-5",
      "--judge",
      "google/gemini-2.5-pro",
      "--stage-timeout-ms",
      "45000",
      "--debug",
    ])

    expect(onAsk).toHaveBeenCalledWith({
      question: "Should tests come first?",
      debaterA: "anthropic/claude-sonnet-4-5",
      debaterB: "openai/gpt-5",
      judge: "google/gemini-2.5-pro",
      stageTimeoutMs: 45000,
      debug: true,
    })
  })

  it("parses transcript inspection by run id", async () => {
    const onInspect = vi.fn()
    const program = buildProgram({ onInspect })

    await program.parseAsync(["node", "debateloop", "inspect", "run-42"])

    expect(onInspect).toHaveBeenCalledWith("run-42")
  })

  it("shows Debate help with readable command names and flags", () => {
    const program = buildProgram()
    const help = program.helpInformation()
    const askHelp = program.commands.find((command) => command.name() === "ask")?.helpInformation()

    expect(help).toContain("Debateloop is a terminal utility")
    expect(help).toContain("ask")
    expect(help).toContain("inspect")
    expect(askHelp).toContain("--debater-a <model>")
    expect(askHelp).toContain("--debater-b <model>")
    expect(askHelp).toContain("--judge <model>")
    expect(askHelp).toContain("--stage-timeout-ms <ms>")
    expect(askHelp).toContain("--debug")
  })

  it("describes the ask command as a direct quoted-question flow", () => {
    const ask = buildProgram().commands.find((command) => command.name() === "ask")

    expect(ask).toBeDefined()
    expect(ask?.description()).toContain("quoted question")
  })
})
