import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueBlockedByGet } from "./forgejoIssueBlockedByGet.js"
import type { ForgejoIssue } from "../forgejoIssueSchema.js"

export function forgejoIssueBlockedByList(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  return forgejoIssueBlockedByGet(transport, issueInput)
}
