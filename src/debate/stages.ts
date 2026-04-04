export type DebateRole = "debaterA" | "debaterB" | "judge"

export interface DebateStageDefinition {
  key:
    | "answer_a"
    | "answer_b"
    | "critique_a"
    | "critique_b"
    | "revise_a"
    | "revise_b"
    | "final_decision"
  label: string
  actorRole: DebateRole
}

export const DEBATE_STAGES: DebateStageDefinition[] = [
  { key: "answer_a", label: "Answer A", actorRole: "debaterA" },
  { key: "answer_b", label: "Answer B", actorRole: "debaterB" },
  { key: "critique_a", label: "Critique A", actorRole: "debaterA" },
  { key: "critique_b", label: "Critique B", actorRole: "debaterB" },
  { key: "revise_a", label: "Revise A", actorRole: "debaterA" },
  { key: "revise_b", label: "Revise B", actorRole: "debaterB" },
  { key: "final_decision", label: "Final decision", actorRole: "judge" },
]

export type DebateStageKey = (typeof DEBATE_STAGES)[number]["key"]
