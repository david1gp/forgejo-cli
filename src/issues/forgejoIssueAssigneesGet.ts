import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueGet } from "./forgejoIssueGet.js"
import type { ForgejoIssueUser } from "./forgejoIssueUserSchema.js"

export async function forgejoIssueAssigneesGet(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssueUser[]>> {
  const op = "forgejoIssueAssigneesGet"
  const issue = await forgejoIssueGet(transport, issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  return createResult(issue.data.assignees ?? [])
}
