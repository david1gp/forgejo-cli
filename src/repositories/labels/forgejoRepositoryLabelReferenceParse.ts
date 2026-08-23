import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"

const forgejoRepositoryLabelReferenceSchema = a.union([
  a.pipe(a.number(), a.integer(), a.minValue(1)),
  a.pipe(a.string(), a.trim(), a.minLength(1)),
])

export function forgejoRepositoryLabelReferenceParse(input: unknown): ForgejoResult<number | string> {
  const op = "forgejoRepositoryLabelReferenceParse"
  const parsed = a.safeParse(forgejoRepositoryLabelReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  if (typeof parsed.output === "string" && /^\d+$/.test(parsed.output)) return createResult(Number(parsed.output))
  return createResult(parsed.output)
}
