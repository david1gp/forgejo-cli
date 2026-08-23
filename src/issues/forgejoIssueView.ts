import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueGet } from "./forgejoIssueGet.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueView(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  return forgejoIssueGet(transport, issueInput)
}
