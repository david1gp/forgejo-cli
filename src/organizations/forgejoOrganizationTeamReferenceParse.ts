import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"

const forgejoOrganizationTeamReferenceSchema = a.pipe(a.number(), a.integer(), a.minValue(1))

export function forgejoOrganizationTeamReferenceParse(input: unknown): ForgejoResult<number> {
  const op = "forgejoOrganizationTeamReferenceParse"
  const parsed = a.safeParse(forgejoOrganizationTeamReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
