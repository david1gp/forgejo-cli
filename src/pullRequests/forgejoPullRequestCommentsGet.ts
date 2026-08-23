import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentsGet } from "../issues/forgejoIssueCommentsGet.js"
import type { ForgejoIssueComment } from "../issues/forgejoIssueCommentSchema.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestCommentsGet(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoIssueComment[]>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueCommentsGet(transport, reference.data, optionsInput)
}
