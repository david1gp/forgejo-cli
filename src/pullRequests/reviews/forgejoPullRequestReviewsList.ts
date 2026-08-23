import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "../forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "../forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestReviewSchema, type ForgejoPullRequestReview } from "./forgejoPullRequestReviewSchema.js"
import {
  forgejoPullRequestReviewsListOptionsSchema,
  type ForgejoPullRequestReviewsListOptions,
} from "./forgejoPullRequestReviewsListOptionsSchema.js"

export async function forgejoPullRequestReviewsList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoPullRequestReview[]>> {
  const op = "forgejoPullRequestReviewsList"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestReviewsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoPullRequestReviewsListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/reviews`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const reviews = a.safeParse(a.array(forgejoPullRequestReviewSchema), response.data.data)
  if (!reviews.success) return createResultError(op, a.summarize(reviews.issues))
  return createResult(
    reviews.output.filter(
      (review) =>
        review.state !== "REQUEST_REVIEW" &&
        (options.includeStale === true || options.all === true || (review.stale !== true && review.dismissed !== true)),
    ),
  )
}
