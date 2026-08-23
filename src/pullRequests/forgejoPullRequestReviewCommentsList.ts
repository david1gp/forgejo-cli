import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import {
  forgejoPullRequestReviewCommentSchema,
  type ForgejoPullRequestReviewComment,
} from "./forgejoPullRequestReviewCommentSchema.js"

export async function forgejoPullRequestReviewCommentsList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  reviewIdInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequestReviewComment[]>> {
  const op = "forgejoPullRequestReviewCommentsList"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const reviewId = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1), a.safeInteger()), reviewIdInput)
  if (!reviewId.success) return createResultError(op, a.summarize(reviewId.issues), reviewIdInput as string)
  const response = await transport.request({
    path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/reviews/${reviewId.output}/comments`,
  })
  if (!response.success) return response
  const comments = a.safeParse(a.array(forgejoPullRequestReviewCommentSchema), response.data.data)
  if (!comments.success) return createResultError(op, a.summarize(comments.issues))
  return createResult(comments.output)
}
