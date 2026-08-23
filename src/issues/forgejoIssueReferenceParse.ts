import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoRepositoryIdentifierParse } from "../repositories/forgejoRepositoryIdentifierParse.js"
import { type ForgejoIssueIdentifier, forgejoIssueIdentifierSchema } from "./forgejoIssueIdentifierSchema.js"
import { forgejoIssueIdentifierParse } from "./forgejoIssueIdentifierParse.js"

export function forgejoIssueReferenceParse(input: unknown): ForgejoResult<ForgejoIssueIdentifier> {
  const op = "forgejoIssueReferenceParse"
  if (typeof input === "string") return forgejoIssueIdentifierParse(input)
  if (typeof input !== "object" || input === null)
    return createResultError(op, "Issue reference must be a string or object")
  const value = input as Record<string, unknown>
  let repo = value.repo
  if (typeof repo === "string") {
    const parsedRepo = forgejoRepositoryIdentifierParse(repo)
    if (!parsedRepo.success) return createResultError(op, parsedRepo.errorMessage, String(input))
    repo = parsedRepo.data
  }
  const parsed = a.safeParse(forgejoIssueIdentifierSchema, { ...value, repo })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), String(input))
  return createResult(parsed.output)
}
