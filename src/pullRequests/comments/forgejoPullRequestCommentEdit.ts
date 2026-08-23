import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentResponseParse } from "../../issues/comments/forgejoIssueCommentResponseParse.js"
import { forgejoIssueCommentsGet } from "../../issues/comments/forgejoIssueCommentsGet.js"
import type { ForgejoIssueComment } from "../../issues/comments/forgejoIssueCommentSchema.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoPullRequestIssueReferenceResolve } from "../forgejoPullRequestIssueReferenceResolve.js"

export async function forgejoPullRequestCommentEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  commentIndexInput: unknown,
  bodyInput: unknown,
): Promise<ForgejoResult<ForgejoIssueComment>> {
  const op = "forgejoPullRequestCommentEdit"
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const index = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(0), a.safeInteger()), commentIndexInput)
  if (!index.success) return createResultError(op, a.summarize(index.issues), commentIndexInput as string)
  const body = a.safeParse(a.string(), bodyInput)
  if (!body.success) return createResultError(op, a.summarize(body.issues), bodyInput as string)
  const comments = await forgejoIssueCommentsGet(transport, reference.data)
  if (!comments.success) return createResultError(op, comments.errorMessage)
  const comment = comments.data[index.output]
  if (!comment || typeof comment.id !== "number") return createResultError(op, "Pull request comment was not found")
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(reference.data.repo)}/issues/comments/${comment.id}`,
    method: "PATCH",
    body: { body: body.output },
  })
  if (!response.success) return response
  return forgejoIssueCommentResponseParse(response.data.data, op)
}
