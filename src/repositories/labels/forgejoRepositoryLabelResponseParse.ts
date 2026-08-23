import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import { forgejoRepositoryLabelSchema, type ForgejoRepositoryLabel } from "./forgejoRepositoryLabelSchema.js"

export function forgejoRepositoryLabelResponseParse(
  input: unknown,
  op = "forgejoRepositoryLabelResponseParse",
): ForgejoResult<ForgejoRepositoryLabel> {
  const parsed = a.safeParse(forgejoRepositoryLabelSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
