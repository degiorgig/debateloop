#!/usr/bin/env node

import { buildProgram } from "./cli/program.js"

export async function main(argv = process.argv) {
  const program = buildProgram()
  await program.parseAsync(argv)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
