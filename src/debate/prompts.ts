import type { DebateRole } from "./stages.js"

const SHARED_DEBATE_FRAMING = [
  "You are participating in a structured two-model debate.",
  "Write a clear, useful response that takes a position without pretending it is the final verdict.",
  "Stay grounded, balanced, and moderately opinionated.",
].join("\n")

const ROLE_BRIEFS: Record<Extract<DebateRole, "debaterA" | "debaterB">, string> = {
  debaterA:
    "Debater A: lead with a direct recommendation, organize around practical tradeoffs, and make your case in a confident but measured tone.",
  debaterB:
    "Debater B: stress-test assumptions, emphasize risks and alternatives, and structure your case to feel meaningfully distinct from Debater A.",
}

function getRoleBrief(role: Extract<DebateRole, "debaterA" | "debaterB">) {
  return ROLE_BRIEFS[role]
}

export function getSharedDebateFraming() {
  return SHARED_DEBATE_FRAMING
}

export function buildInitialAnswerPrompt(options: {
  question: string
  actorRole: Extract<DebateRole, "debaterA" | "debaterB">
}) {
  return [
    getRoleBrief(options.actorRole),
    "Write an initial answer to the user's question.",
    "Keep the answer substantial but not final, and make your reasoning and structure distinct.",
    `Question: ${options.question}`,
  ].join("\n\n")
}

export function buildCritiquePrompt(options: {
  question: string
  actorRole: Extract<DebateRole, "debaterA" | "debaterB">
  actorAnswer: string
  opponentAnswer: string
}) {
  return [
    getRoleBrief(options.actorRole),
    "Critique the opposing debater's opening answer in light of your own.",
    "Point out weaknesses, missing tradeoffs, or flawed assumptions. Stay specific and comparative.",
    `Question: ${options.question}`,
    `Your opening answer:\n${options.actorAnswer}`,
    `Opponent opening answer:\n${options.opponentAnswer}`,
  ].join("\n\n")
}
