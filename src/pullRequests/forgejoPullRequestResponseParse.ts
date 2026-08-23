import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoPullRequestSchema, type ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export function forgejoPullRequestResponseParse(
  input: unknown,
  op = "forgejoPullRequestResponseParse",
  repository?: ForgejoRepositoryIdentifier,
): ForgejoResult<ForgejoPullRequest> {
  const parsed = a.safeParse(forgejoPullRequestSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  if (parsed.output.repo !== undefined || repository === undefined) return createResult(parsed.output)
  return createResult({ ...parsed.output, repo: repository })
}
