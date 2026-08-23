import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import { forgejoIssueResponseParse } from "./forgejoIssueResponseParse.js"
import { forgejoIssueSchema, type ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueBlockedByGet(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  const op = "forgejoIssueBlockedByGet"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}/blocking`,
  })
  if (!response.success) return response
  const list = a.safeParse(a.array(forgejoIssueSchema), response.data.data)
  if (!list.success) return createResultError(op, a.summarize(list.issues))
  const result: ForgejoIssue[] = []
  for (const item of list.output) {
    const parsed = forgejoIssueResponseParse(item, op, issue.data.repository)
    if (!parsed.success) return parsed
    result.push(parsed.data)
  }
  return createResult(result)
}
