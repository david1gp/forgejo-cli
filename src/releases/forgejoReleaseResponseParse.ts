import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoReleaseSchema, type ForgejoRelease } from "./forgejoReleaseSchema.js"

function forgejoReleaseResponseParse(
  input: unknown,
  op = "forgejoReleaseResponseParse",
): ForgejoResult<ForgejoRelease> {
  const parsed = a.safeParse(forgejoReleaseSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

export { forgejoReleaseResponseParse }
