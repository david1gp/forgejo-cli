import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoIssueReferenceParse } from "./forgejoIssueReferenceParse.js"
import type { ForgejoIssueIdentifier } from "./forgejoIssueIdentifierSchema.js"

type ForgejoIssueReference = {
  issue: ForgejoIssueIdentifier
  repository: ForgejoRepositoryIdentifier
}

export function forgejoIssueReferenceResolve(input: unknown): ForgejoResult<ForgejoIssueReference> {
  const op = "forgejoIssueReferenceResolve"
  const issue = forgejoIssueReferenceParse(input)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  if (issue.data.repo === undefined) return createResultError(op, "Issue reference must include a repository")
  return createResult({ issue: issue.data, repository: issue.data.repo })
}

export type { ForgejoIssueReference }
