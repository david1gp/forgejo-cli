import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import {
  type ForgejoRepositoryIdentifier,
  forgejoRepositoryIdentifierSchema,
} from "./forgejoRepositoryIdentifierSchema.js"
import { forgejoRepositoryIdentifierParse } from "./forgejoRepositoryIdentifierParse.js"

export function forgejoRepositoryReferenceParse(input: unknown): ForgejoResult<ForgejoRepositoryIdentifier> {
  const op = "forgejoRepositoryReferenceParse"
  if (typeof input === "string") return forgejoRepositoryIdentifierParse(input)
  const parsed = a.safeParse(forgejoRepositoryIdentifierSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
