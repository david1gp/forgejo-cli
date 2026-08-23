import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import type { ForgejoIssue } from "../issues/forgejoIssueSchema.js"
import { forgejoPullRequestBlockedByGet } from "./forgejoPullRequestBlockedByGet.js"

export function forgejoPullRequestBlockedByList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  return forgejoPullRequestBlockedByGet(transport, pullRequestInput)
}
