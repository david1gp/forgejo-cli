import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueBlockedByAdd } from "../issues/forgejoIssueBlockedByAdd.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestBlockedByAdd(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  targetInput: unknown,
): Promise<ForgejoResult<null>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueBlockedByAdd(transport, reference.data, targetInput)
}
