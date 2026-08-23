import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueAssigneeRemove } from "../issues/assignees/forgejoIssueAssigneeRemove.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export async function forgejoPullRequestAssigneeRemove(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  const result = await forgejoIssueAssigneeRemove(transport, reference.data, optionsInput)
  if (!result.success) return result
  return forgejoPullRequestResponseParse(result.data, "forgejoPullRequestAssigneeRemove", reference.data.repo)
}
