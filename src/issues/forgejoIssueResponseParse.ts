import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoIssueSchema, type ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueResponseParse(
  input: unknown,
  op = "forgejoIssueResponseParse",
  repository?: ForgejoRepositoryIdentifier,
): ForgejoResult<ForgejoIssue> {
  const parsed = a.safeParse(forgejoIssueSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  if (parsed.output.repo !== undefined || repository === undefined) return createResult(parsed.output)
  return createResult({ ...parsed.output, repo: repository })
}
