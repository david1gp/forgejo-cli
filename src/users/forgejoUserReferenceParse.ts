import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"

const forgejoUserReferenceSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

export function forgejoUserReferenceParse(input: unknown): ForgejoResult<string> {
  const op = "forgejoUserReferenceParse"
  const parsed = a.safeParse(forgejoUserReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
