import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentGet } from "../../issues/comments/forgejoIssueCommentGet.js"
import type { ForgejoIssueComment } from "../../issues/comments/forgejoIssueCommentSchema.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestCommentGet(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  commentIdInput: unknown,
): Promise<ForgejoResult<ForgejoIssueComment>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueCommentGet(transport, reference.data, commentIdInput)
}
