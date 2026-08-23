import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueDependenciesGet } from "../../issues/dependencies/forgejoIssueDependenciesGet.js"
import type { ForgejoIssue } from "../../issues/forgejoIssueSchema.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestDependenciesGet(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueDependenciesGet(transport, reference.data)
}
