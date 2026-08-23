import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentResponseParse } from "./forgejoIssueCommentResponseParse.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import type { ForgejoIssueComment } from "./forgejoIssueCommentSchema.js"

export async function forgejoIssueCommentEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  commentIdInput: unknown,
  bodyInput: unknown,
): Promise<ForgejoResult<ForgejoIssueComment>> {
  const op = "forgejoIssueCommentEdit"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const commentId = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1), a.safeInteger()), commentIdInput)
  if (!commentId.success) return createResultError(op, a.summarize(commentId.issues), commentIdInput as string)
  const body = a.safeParse(a.pipe(a.string(), a.minLength(1)), bodyInput)
  if (!body.success) return createResultError(op, a.summarize(body.issues), bodyInput as string)
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(issue.data.repository)}/comments/${commentId.output}`,
    method: "PATCH",
    body: { body: body.output },
  })
  if (!response.success) return response
  return forgejoIssueCommentResponseParse(response.data.data, op)
}
