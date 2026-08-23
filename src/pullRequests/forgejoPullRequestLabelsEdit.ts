import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueLabelsEdit } from "../issues/labels/forgejoIssueLabelsEdit.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestLabelsEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<null>> {
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return reference
  return forgejoIssueLabelsEdit(transport, reference.data, optionsInput)
}
