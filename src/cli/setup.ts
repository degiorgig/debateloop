import { select } from "@inquirer/prompts"

import type { DebateRoleConfig } from "../app/config.js"
import type { AvailableModel } from "../opencode/models.js"

export interface SetupPrompts {
  selectRoleModel: (roleLabel: string, choices: AvailableModel[]) => Promise<string>
}

function createDefaultPrompts(): SetupPrompts {
  return {
    async selectRoleModel(roleLabel, choices) {
      return select({
        message: `Choose ${roleLabel}`,
        choices: choices.map((choice) => ({
          name: `${choice.id}`,
          value: choice.id,
          description: choice.label,
        })),
      })
    },
  }
}

function filterChoicesForDebaterB(choices: AvailableModel[], debaterA: string) {
  return choices.filter((choice) => choice.id !== debaterA)
}

export async function promptForRoleConfig(
  choices: AvailableModel[],
  prompts: SetupPrompts = createDefaultPrompts(),
): Promise<DebateRoleConfig> {
  const debaterA = await prompts.selectRoleModel("Debater A", choices)
  const debaterB = await prompts.selectRoleModel(
    "Debater B",
    filterChoicesForDebaterB(choices, debaterA),
  )
  const judge = await prompts.selectRoleModel("Judge", choices)

  return {
    debaterA,
    debaterB,
    judge,
  }
}
