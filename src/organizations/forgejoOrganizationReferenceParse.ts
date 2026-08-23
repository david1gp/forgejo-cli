import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"

const forgejoOrganizationReferenceSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

export function forgejoOrganizationReferenceParse(input: unknown): ForgejoResult<string> {
  const op = "forgejoOrganizationReferenceParse"
  const parsed = a.safeParse(forgejoOrganizationReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
