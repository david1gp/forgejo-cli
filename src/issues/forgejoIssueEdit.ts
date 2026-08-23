import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueEditOptionsSchema, type ForgejoIssueEditOptions } from "./forgejoIssueEditOptionsSchema.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import { forgejoIssueResponseParse } from "./forgejoIssueResponseParse.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const op = "forgejoIssueEdit"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const parsed = a.safeParse(forgejoIssueEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueEditOptions = parsed.output
  const response = await transport.request({
    path: forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number),
    method: "PATCH",
    body: options,
  })
  if (!response.success) return response
  return forgejoIssueResponseParse(response.data.data, op, issue.data.repository)
}
