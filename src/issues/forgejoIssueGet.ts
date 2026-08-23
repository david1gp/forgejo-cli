import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import { forgejoIssueResponseParse } from "./forgejoIssueResponseParse.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueGet(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const op = "forgejoIssueGet"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}`,
  })
  if (!response.success) return response
  return forgejoIssueResponseParse(response.data.data, op, issue.data.repository)
}
