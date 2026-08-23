import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import {
  forgejoReleaseAssetReferenceSchema,
  type ForgejoReleaseAssetReference,
} from "./forgejoReleaseAssetReferenceSchema.js"

function forgejoReleaseAssetReferenceParse(input: unknown): ForgejoResult<ForgejoReleaseAssetReference> {
  const op = "forgejoReleaseAssetReferenceParse"
  const parsed = a.safeParse(forgejoReleaseAssetReferenceSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

export { forgejoReleaseAssetReferenceParse }
