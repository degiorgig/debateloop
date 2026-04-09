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

const ROLE_LABELS: Record<Extract<DebateRole, "debaterA" | "debaterB">, string> = {
  debaterA: "Debater A",
  debaterB: "Debater B",
}

function getRoleBrief(role: Extract<DebateRole, "debaterA" | "debaterB">) {
  return ROLE_BRIEFS[role]
}

function getRoleLabel(role: Extract<DebateRole, "debaterA" | "debaterB">) {
  return ROLE_LABELS[role]
}

function getOpponentRole(role: Extract<DebateRole, "debaterA" | "debaterB">): Extract<DebateRole, "debaterA" | "debaterB"> {
  return role === "debaterA" ? "debaterB" : "debaterA"
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
  const actorLabel = getRoleLabel(options.actorRole)
  const opponentLabel = getRoleLabel(getOpponentRole(options.actorRole))

  return [
    getRoleBrief(options.actorRole),
    "You are now in the critique round.",
    `You are ${actorLabel} and you are critiquing ${opponentLabel}.`,
    "Critique the opposing debater's opening answer against your own answer instead of writing a generic follow-up or a revised final answer.",
    "Point out weaknesses, missing tradeoffs, stronger evidence, or flawed assumptions. Stay specific, comparative, and actor-appropriate in voice.",
    `Question: ${options.question}`,
    `Your opening answer:\n${options.actorAnswer}`,
    `Opponent opening answer:\n${options.opponentAnswer}`,
  ].join("\n\n")
}

export function buildRevisionPrompt(options: {
  question: string
  actorRole: Extract<DebateRole, "debaterA" | "debaterB">
  actorAnswer: string
  opponentCritique: string
}) {
  return [
    getRoleBrief(options.actorRole),
    "You are now in the final revision round.",
    "Rewrite your opening answer as a balanced revision, not a tiny patch and not a full from-scratch replacement.",
    "Your main job is to address the opponent's critique directly while keeping the answer readable, self-contained, and improved.",
    "Acknowledge strong critique where it improves your answer, but preserve your distinct voice and structure instead of converging into a near-duplicate.",
    `Question: ${options.question}`,
    `Your opening answer:\n${options.actorAnswer}`,
    `Opponent critique of your answer:\n${options.opponentCritique}`,
  ].join("\n\n")
}

export function buildJudgePrompt(options: {
  question: string
  revisedAnswerA: string
  revisedAnswerB: string
}) {
  return [
    "You are the judge in a structured two-model debate.",
    "Compare the two final revised answers and select exactly one winner.",
    "Prioritize usefulness and correctness above all other factors.",
    "Treat clarity and readability as major decision factors.",
    "Penalize an answer strongly if it ignores an important critique from the earlier round.",
    "Stay balanced between safer and more decisive answers instead of favoring one style by default.",
    "Return ONLY valid JSON with this exact shape:",
    '{"winner":"debaterA"|"debaterB","rationale":"short explanation"}',
    `Question: ${options.question}`,
    `Debater A revised answer:\n${options.revisedAnswerA}`,
    `Debater B revised answer:\n${options.revisedAnswerB}`,
  ].join("\n\n")
}
