import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoReleaseAssetSchema, type ForgejoReleaseAsset } from "./forgejoReleaseAssetSchema.js"

function forgejoReleaseAssetResponseParse(
  input: unknown,
  op = "forgejoReleaseAssetResponseParse",
): ForgejoResult<ForgejoReleaseAsset> {
  const parsed = a.safeParse(forgejoReleaseAssetSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

export { forgejoReleaseAssetResponseParse }
