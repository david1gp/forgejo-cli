import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoRepositorySchema, type ForgejoRepository } from "./forgejoRepositorySchema.js"

export function forgejoRepositoryResponseParse(
  input: unknown,
  op = "forgejoRepositoryResponseParse",
): ForgejoResult<ForgejoRepository> {
  const parsed = a.safeParse(forgejoRepositorySchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
