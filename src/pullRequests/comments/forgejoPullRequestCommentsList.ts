import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestCommentsGet } from "./forgejoPullRequestCommentsGet.js"
import type { ForgejoIssueComment } from "../../issues/comments/forgejoIssueCommentSchema.js"

export function forgejoPullRequestCommentsList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoIssueComment[]>> {
  return forgejoPullRequestCommentsGet(transport, pullRequestInput, optionsInput)
}
