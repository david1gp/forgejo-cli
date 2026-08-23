import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueAssigneesGet } from "./forgejoIssueAssigneesGet.js"
import type { ForgejoIssueUser } from "../forgejoIssueUserSchema.js"

export function forgejoIssueAssigneesList(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssueUser[]>> {
  return forgejoIssueAssigneesGet(transport, issueInput)
}
