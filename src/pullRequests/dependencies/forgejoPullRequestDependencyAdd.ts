import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueDependencyAdd } from "../../issues/dependencies/forgejoIssueDependencyAdd.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestDependencyAdd(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  targetInput: unknown,
): Promise<ForgejoResult<null>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueDependencyAdd(transport, reference.data, targetInput)
}
