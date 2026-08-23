import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import type { ForgejoIssueIdentifier } from "../issues/forgejoIssueIdentifierSchema.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"

export async function forgejoPullRequestIssueReferenceResolve(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoIssueIdentifier & { repo: ForgejoRepositoryIdentifier }>> {
  const reference = await forgejoPullRequestReferenceResolve(transport, input)
  if (!reference.success) return createResultError("forgejoPullRequestIssueReferenceResolve", reference.errorMessage)
  return createResult({ repo: reference.data.repository, number: reference.data.pullRequest.number })
}
