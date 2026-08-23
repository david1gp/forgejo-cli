import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueDependencyRemove } from "../issues/forgejoIssueDependencyRemove.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestDependencyRemove(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  targetInput: unknown,
): Promise<ForgejoResult<null>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueDependencyRemove(transport, reference.data, targetInput)
}
