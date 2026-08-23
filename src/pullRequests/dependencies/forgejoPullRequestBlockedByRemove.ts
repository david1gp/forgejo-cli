import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueBlockedByRemove } from "../../issues/dependencies/forgejoIssueBlockedByRemove.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestBlockedByRemove(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  targetInput: unknown,
): Promise<ForgejoResult<null>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueBlockedByRemove(transport, reference.data, targetInput)
}
