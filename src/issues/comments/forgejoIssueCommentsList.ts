import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentsGet } from "./forgejoIssueCommentsGet.js"
import type { ForgejoIssueComment } from "./forgejoIssueCommentSchema.js"

export function forgejoIssueCommentsList(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoIssueComment[]>> {
  return forgejoIssueCommentsGet(transport, issueInput, optionsInput)
}
