import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import {
  type ForgejoRepositoryIdentifier,
  forgejoRepositoryIdentifierSchema,
} from "./forgejoRepositoryIdentifierSchema.js"

export function forgejoRepositoryIdentifierParse(input: unknown): ForgejoResult<ForgejoRepositoryIdentifier> {
  const op = "forgejoRepositoryIdentifierParse"
  if (typeof input !== "string") {
    return createResultError(op, "Repository identifier must be a string")
  }

  const value = input.trim()
  const nameSeparator = value.lastIndexOf("/")
  if (nameSeparator < 1 || nameSeparator === value.length - 1) {
    return createResultError(op, "Repository identifier must contain owner and name", input)
  }

  const ownerSeparator = value.lastIndexOf("/", nameSeparator - 1)
  const owner = value.slice(ownerSeparator + 1, nameSeparator)
  const name = value.slice(nameSeparator + 1).replace(/\.git$/, "")
  const host = ownerSeparator === -1 ? undefined : value.slice(0, ownerSeparator)
  const parsed = a.safeParse(forgejoRepositoryIdentifierSchema, { host, owner, name })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), input)
  return createResult(parsed.output)
}
