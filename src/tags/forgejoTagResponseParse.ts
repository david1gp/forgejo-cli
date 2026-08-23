import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoTagSchema, type ForgejoTag } from "./forgejoTagSchema.js"

function forgejoTagResponseParse(input: unknown, op = "forgejoTagResponseParse"): ForgejoResult<ForgejoTag> {
  const parsed = a.safeParse(forgejoTagSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

export { forgejoTagResponseParse }
