import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoReleaseReferenceSchema, type ForgejoReleaseReference } from "./forgejoReleaseReferenceSchema.js"

function forgejoReleaseReferenceParse(input: unknown): ForgejoResult<ForgejoReleaseReference> {
  const op = "forgejoReleaseReferenceParse"
  const parsed = a.safeParse(forgejoReleaseReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

export { forgejoReleaseReferenceParse }
