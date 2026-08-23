import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueCommentCreate } from "../issues/comments/forgejoIssueCommentCreate.js"
import { forgejoIssueStateEdit } from "../issues/forgejoIssueStateEdit.js"
import { forgejoPullRequestIssueReferenceResolve } from "./forgejoPullRequestIssueReferenceResolve.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"

export async function forgejoPullRequestClose(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  messageInput?: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const op = "forgejoPullRequestClose"
  const reference = await forgejoPullRequestIssueReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const message = messageInput === undefined ? undefined : a.safeParse(a.string(), messageInput)
  if (message && !message.success) return createResultError(op, a.summarize(message.issues), messageInput as string)
  if (message?.success) {
    const comment = await forgejoIssueCommentCreate(transport, reference.data, { body: message.output })
    if (!comment.success) return createResultError(op, comment.errorMessage)
  }
  const closed = await forgejoIssueStateEdit(transport, reference.data, "closed")
  if (!closed.success) return createResultError(op, closed.errorMessage)
  return forgejoPullRequestResponseParse(closed.data, op, reference.data.repo)
}
