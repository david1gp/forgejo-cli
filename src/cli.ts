#!/usr/bin/env bun

import { forgejoCliRun } from "./cli/forgejoCliRun.js"

const result = await forgejoCliRun(process.argv.slice(2))
if (!result.success) {
  try {
    process.stderr.write(`fj: ${result.errorMessage}\n`)
  } catch {
    // There is no useful recovery path when stderr itself is unavailable.
  }
  process.exitCode = result.op === "forgejoCliParse" ? 2 : 1
}
