import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentCreate } from "../../issues/comments/forgejoIssueCommentCreate.js"
import type { ForgejoIssueComment } from "../../issues/comments/forgejoIssueCommentSchema.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestCommentCreate(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssueComment>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueCommentCreate(transport, reference.data, optionsInput)
}
